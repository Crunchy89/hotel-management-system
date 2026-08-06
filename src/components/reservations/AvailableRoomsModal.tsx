"use client";

import React, { useMemo } from "react";
import { RoomStatusBadge } from "@/components/StatusBadge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tableBodyCell, tableHeaderCell } from "@/components/ui/layout";
import { inputClass, selectClass } from "@/components/form";
import DateRangeInput from "@/components/form/DateRangeInput";
import { useT } from "@/context/LocaleContext";
import {
  availableRoomsForDates,
  dayDiff,
  formatCurrency,
  formatDate,
  roomTypeFitsParty,
} from "@/lib/metrics";
import type { Reservation, Room, RoomTypeRecord } from "@/lib/types";

interface AvailableRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  reservations: Reservation[];
  roomTypes: RoomTypeRecord[];
  checkIn: string;
  checkOut: string;
  roomType?: string;
  adults: number;
  children: number;
  infants: number;
  onChange: (values: {
    from?: string;
    to?: string;
    roomType?: string;
    adults?: number;
    children?: number;
    infants?: number;
  }) => void;
  onReserve: (
    room: Room,
    checkIn: string,
    checkOut: string,
    party: { adults: number; children: number; infants: number },
  ) => void;
}

export default function AvailableRoomsModal({
  isOpen,
  onClose,
  rooms,
  reservations,
  roomTypes,
  checkIn,
  checkOut,
  roomType,
  adults,
  children,
  infants,
  onChange,
  onReserve,
}: AvailableRoomsModalProps) {
  const t = useT();
  const nights = Math.max(0, dayDiff(checkIn, checkOut));
  const typeBySlug = useMemo(() => {
    const map = new Map<string, RoomTypeRecord>();
    for (const type of roomTypes) map.set(type.slug, type);
    return map;
  }, [roomTypes]);

  const available = useMemo(() => {
    const byDate = availableRoomsForDates(
      rooms,
      reservations,
      checkIn,
      checkOut,
      roomType || undefined,
    );
    return byDate.filter((room) => {
      const type = typeBySlug.get(room.type);
      if (!type) return true;
      return roomTypeFitsParty(type, adults, children, infants);
    });
  }, [
    rooms,
    reservations,
    checkIn,
    checkOut,
    roomType,
    typeBySlug,
    adults,
    children,
    infants,
  ]);

  const typeLabel = (slug: string) =>
    roomTypes.find((entry) => entry.slug === slug)?.label ?? slug;

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn);
  const summaryKey =
    nights === 1 && available.length === 1
      ? "available.summary"
      : "available.summary_other";

  function occupancyHint(slug: string): string {
    const type = typeBySlug.get(slug);
    if (!type) return "";
    return t("available.capacityHint", {
      adults: type.max_adults,
      children: type.max_children,
      infants: type.max_infants,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-4xl overflow-hidden p-0"
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="shrink-0 border-b border-gray-200 px-5 py-4 pr-16 dark:border-gray-800 sm:px-6 sm:pr-20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            {t("available.title")}
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {t("available.description")}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("available.dates")}
              </label>
              <DateRangeInput
                from={checkIn}
                to={checkOut}
                placeholder={t("available.datesPlaceholder")}
                onChange={(from, to) => onChange({ from, to })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("available.roomType")}
              </label>
              <select
                className={selectClass}
                value={roomType ?? ""}
                onChange={(e) => onChange({ roomType: e.target.value })}
              >
                <option value="">{t("available.anyType")}</option>
                {roomTypes.map((type) => (
                  <option key={type.slug} value={type.slug}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("available.adults")}
              </label>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={20}
                value={adults}
                onChange={(e) =>
                  onChange({ adults: Math.max(1, Number(e.target.value) || 1) })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("available.children")}
              </label>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={20}
                value={children}
                onChange={(e) =>
                  onChange({
                    children: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("available.infants")}
              </label>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={20}
                value={infants}
                onChange={(e) =>
                  onChange({
                    infants: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
            </div>
          </div>

          {datesValid && (
            <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">
              {formatDate(checkIn, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              →{" "}
              {formatDate(checkOut, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              · {t(summaryKey, { nights, rooms: available.length })} ·{" "}
              {t("available.partySummary", {
                adults,
                children,
                infants,
              })}
            </p>
          )}
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {!datesValid ? (
            <p className="px-5 py-10 text-center text-theme-sm text-gray-500">
              {t("available.invalidDates")}
            </p>
          ) : available.length === 0 ? (
            <p className="px-5 py-10 text-center text-theme-sm text-gray-500">
              {t("available.noRoomsParty")}
            </p>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
                <TableRow>
                  <TableCell isHeader className={tableHeaderCell}>
                    {t("available.room")}
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    {t("available.type")}
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    {t("available.capacity")}
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    {t("available.floor")}
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    {t("available.nightly")}
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    {t("available.stayTotal")}
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    {t("available.status")}
                  </TableCell>
                  <TableCell isHeader className={`${tableHeaderCell} text-right`}>
                    {t("available.action")}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {available.map((room) => {
                  const stayTotal = room.rate * nights;
                  return (
                    <TableRow
                      key={room.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <TableCell
                        className={`${tableBodyCell} font-medium text-gray-800 dark:text-white/90`}
                      >
                        {t("available.roomLabel", { number: room.number })}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        {typeLabel(room.type)}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {occupancyHint(room.type)}
                        </span>
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        {room.floor}
                      </TableCell>
                      <TableCell className={`${tableBodyCell} tabular-nums`}>
                        {formatCurrency(room.rate)}
                      </TableCell>
                      <TableCell
                        className={`${tableBodyCell} font-semibold tabular-nums`}
                      >
                        {formatCurrency(stayTotal)}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        <RoomStatusBadge status={room.status} />
                      </TableCell>
                      <TableCell className={`${tableBodyCell} text-right`}>
                        <Button
                          size="sm"
                          onClick={() =>
                            onReserve(room, checkIn, checkOut, {
                              adults,
                              children,
                              infants,
                            })
                          }
                        >
                          {t("available.reserve")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <Button size="sm" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
