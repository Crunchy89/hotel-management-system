"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookingSourceBadge,
  ReservationStatusBadge,
} from "@/components/StatusBadge";
import FolioTab from "@/components/reservations/FolioTab";
import KeyCardPanel from "@/components/reservations/KeyCardPanel";
import { PaymentStatusBadge } from "@/components/reservations/PaymentStatusBadge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { selectClass } from "@/components/form";
import { useT } from "@/context/LocaleContext";
import { api } from "@/lib/api";
import { folioBalance } from "@/lib/folio";
import { dayDiff, formatDate } from "@/lib/metrics";
import {
  PAYMENT_COLLECT_OPTIONS,
  resolvePaymentStatus,
} from "@/lib/paymentStatus";
import type { Guest, PaymentCollect, Reservation, Room, RoomTypeRecord } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";
import {
  type ReservationTab,
  bookingTotals,
  formatCurrency,
  formatStayLength,
  reservationToForm,
} from "./reservationFormUtils";

export type ReservationAction = "checkin" | "checkout" | "cancel";

const TAB_KEYS: { id: ReservationTab; labelKey: string }[] = [
  { id: "details", labelKey: "resDetail.tabDetails" },
  { id: "guest", labelKey: "resDetail.tabGuest" },
  { id: "folio", labelKey: "resDetail.tabFolio" },
  { id: "keycard", labelKey: "resDetail.tabKeycard" },
  { id: "notes", labelKey: "resDetail.tabNotes" },
];

interface ReservationDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  guest?: Guest | null;
  rooms: Room[];
  roomTypes: RoomTypeRecord[];
  onAction: (action: ReservationAction, id: string) => Promise<boolean>;
  onMoveRoom?: (reservation: Reservation) => void;
  /** Fired once a check-in succeeds, so the key encoder can be offered. */
  onCheckedIn?: (reservation: Reservation) => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </dd>
    </div>
  );
}

const ReservationDetailDialog: React.FC<ReservationDetailDialogProps> = ({
  isOpen,
  onClose,
  reservation,
  guest,
  rooms,
  roomTypes,
  onAction,
  onMoveRoom,
  onCheckedIn,
}) => {
  const t = useT();
  const [tab, setTab] = useState<ReservationTab>("details");
  const [paymentCollect, setPaymentCollect] = useState<PaymentCollect>("property");
  const [savingPayment, setSavingPayment] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { folio_lines, mutate } = useHotelData();

  useEffect(() => {
    if (reservation) {
      setPaymentCollect(reservation.payment_collect ?? "property");
    }
    setConfirmCancel(false);
  }, [reservation]);

  function close() {
    setConfirmCancel(false);
    onClose();
  }

  const form = useMemo(
    () => (reservation ? reservationToForm(reservation, guest ?? undefined) : null),
    [reservation, guest],
  );

  const lines = useMemo(
    () =>
      reservation
        ? folio_lines.filter((l) => l.reservation_id === reservation.id)
        : [],
    [folio_lines, reservation],
  );

  if (!reservation || !form) return null;

  const room = rooms.find((r) => r.id === reservation.room_id);
  const isUnallocated = !reservation.room_id && Boolean(reservation.room_type);
  const isActiveStay =
    reservation.status === "booked" || reservation.status === "checked_in";
  const nights = Math.max(0, dayDiff(reservation.check_in, reservation.check_out));
  const totals = bookingTotals(form, room, nights);
  const balance = folioBalance(reservation, room, lines);
  const paymentStatus = resolvePaymentStatus(reservation, room, lines);
  const typeLabel =
    roomTypes.find((t) => t.slug === (reservation.room_type ?? room?.type))
      ?.label ?? reservation.room_type;

  async function savePaymentCollect() {
    setSavingPayment(true);
    await mutate(() =>
      api.updateReservationPayment({
        id: reservation!.id,
        payment_collect: paymentCollect,
      }),
    );
    setSavingPayment(false);
  }

  async function run(action: ReservationAction) {
    const ok = await onAction(action, reservation!.id);
    if (!ok) return;
    if (action === "checkin") onCheckedIn?.(reservation!);
    close();
  }

  async function sendPreArrival() {
    await mutate(() =>
      api.sendGuestMessage({
        reservation_id: reservation!.id,
        kind: "pre_arrival",
      }),
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      className="max-h-[95vh] max-w-[1120px] overflow-hidden p-0"
    >
      <div className="flex max-h-[95vh] flex-col">
        <div className="flex shrink-0 gap-1 overflow-x-auto bg-brand-500 px-4 py-2">
          {TAB_KEYS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                tab === item.id
                  ? "bg-white text-brand-600"
                  : "text-white/90 hover:bg-white/15"
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row lg:p-8">
          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-theme-xl font-semibold text-gray-800 dark:text-white/90">
                  {reservation.guest_name}
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isUnallocated
                    ? reservation.room_number
                    : `${t("resDetail.roomLabel", { number: reservation.room_number ?? "" })}${room ? ` · ${typeLabel}` : ""}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <ReservationStatusBadge status={reservation.status} />
                <BookingSourceBadge source={reservation.booking_source} />
              </div>
            </div>

            {tab === "details" && (
              <>
                <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                    <DetailRow
                      label={t("resDetail.checkIn")}
                      value={formatDate(reservation.check_in, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    />
                    <DetailRow
                      label={t("resDetail.checkOut")}
                      value={formatDate(reservation.check_out, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    />
                    <DetailRow
                      label={t("resDetail.lengthOfStay")}
                      value={formatStayLength(nights)}
                    />
                    <DetailRow label={t("resDetail.roomType")} value={typeLabel} />
                    <DetailRow
                      label={t("resDetail.room")}
                      value={
                        isUnallocated
                          ? t("resDetail.unallocated")
                          : t("resDetail.roomLabel", {
                              number: reservation.room_number ?? "",
                            })
                      }
                    />
                    <DetailRow
                      label={t("resDetail.adults")}
                      value={reservation.adults ?? 1}
                    />
                    <DetailRow
                      label={t("resDetail.children")}
                      value={reservation.children ?? 0}
                    />
                    <DetailRow
                      label={t("resDetail.infants")}
                      value={reservation.infants ?? 0}
                    />
                    <DetailRow
                      label={t("resDetail.bookingSource")}
                      value={reservation.booking_source}
                    />
                    <DetailRow
                      label={t("resDetail.paymentStatus")}
                      value={
                        <PaymentStatusBadge status={paymentStatus} size="sm" />
                      }
                    />
                    <DetailRow
                      label={t("resDetail.arrivalTime")}
                      value={reservation.arrival_time}
                    />
                    <DetailRow
                      label={t("resDetail.reference")}
                      value={reservation.reference}
                    />
                  </dl>
                </section>
                {reservation.status === "booked" && guest?.email && (
                  <Button size="sm" variant="outline" onClick={() => void sendPreArrival()}>
                    {t("resDetail.sendPreArrival")}
                  </Button>
                )}
                {reservation.status !== "cancelled" && (
                  <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                    <h6 className="mb-3 text-xs font-semibold uppercase text-gray-500">
                      {t("resDetail.paymentCollection")}
                    </h6>
                    <select
                      className={selectClass}
                      value={paymentCollect}
                      onChange={(e) =>
                        setPaymentCollect(e.target.value as PaymentCollect)
                      }
                    >
                      {PAYMENT_COLLECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      {
                        PAYMENT_COLLECT_OPTIONS.find(
                          (o) => o.value === paymentCollect,
                        )?.hint
                      }
                    </p>
                    {paymentCollect !== (reservation.payment_collect ?? "property") && (
                      <Button
                        size="sm"
                        className="mt-3"
                        disabled={savingPayment}
                        onClick={() => void savePaymentCollect()}
                      >
                        {savingPayment
                          ? t("common.saving")
                          : t("resDetail.savePayment")}
                      </Button>
                    )}
                  </section>
                )}
              </>
            )}

            {tab === "guest" && guest && (
              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                  <DetailRow label={t("common.email")} value={guest.email} />
                  <DetailRow label={t("resDetail.mobile")} value={guest.phone} />
                  <DetailRow
                    label={t("resDetail.organization")}
                    value={guest.organization}
                  />
                  <DetailRow
                    label={t("resDetail.address")}
                    value={guest.address_line1}
                  />
                  <DetailRow label="" value={guest.address_line2} />
                  <DetailRow
                    label={t("resDetail.cityCountry")}
                    value={[guest.city, guest.country].filter(Boolean).join(", ")}
                  />
                  <DetailRow
                    label={t("resDetail.postalCode")}
                    value={guest.postal_code}
                  />
                  <DetailRow
                    label={t("resDetail.idDocument")}
                    value={
                      guest.id_document_type
                        ? `${guest.id_document_type}: ${guest.id_document}`
                        : guest.id_document
                    }
                  />
                </dl>
              </section>
            )}

            {tab === "folio" && (
              <FolioTab reservation={reservation} room={room} />
            )}

            {tab === "keycard" && (
              <KeyCardPanel reservation={reservation} room={room} />
            )}

            {tab === "notes" && (
              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                {reservation.notes && (
                  <div className="mb-4">
                    <h6 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {t("resDetail.internalNotes")}
                    </h6>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {reservation.notes}
                    </p>
                  </div>
                )}
                {reservation.guest_comments && (
                  <div>
                    <h6 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {t("resDetail.guestComments")}
                    </h6>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {reservation.guest_comments}
                    </p>
                  </div>
                )}
                {!reservation.notes && !reservation.guest_comments && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("resDetail.noNotes")}
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="w-full shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:w-72">
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              {t("resDetail.bookingSummary")}
            </h5>

            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {t("resDetail.paymentStatus")}
              </p>
              <div className="mt-2">
                <PaymentStatusBadge status={paymentStatus} />
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">{t("resDetail.roomTotal")}</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(totals.roomTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">{t("resDetail.extraPersons")}</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(form.extra_person || 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">{t("resDetail.discount")}</dt>
                <dd className="font-medium tabular-nums">
                  −{formatCurrency(form.discount || 0)}
                </dd>
              </div>
              {balance.charges > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">{t("resDetail.folioCharges")}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatCurrency(balance.charges)}
                  </dd>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold">{t("resDetail.total")}</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCurrency(balance.total)}
                  </dd>
                </div>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">{t("resDetail.received")}</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(balance.paid)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-error-600">
                  {t("resDetail.amountDue")}
                </dt>
                <dd className="font-bold tabular-nums text-error-600">
                  {formatCurrency(balance.due)}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 text-xs font-semibold text-brand-600 hover:underline"
              onClick={() => setTab("folio")}
            >
              {t("resDetail.manageFolio")}
            </button>
          </aside>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          {reservation.status === "booked" &&
            (confirmCancel ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t("resDetail.confirmCancel")}
                </span>
                <Button
                  size="xs"
                  variant="danger"
                  onClick={() => void run("cancel")}
                >
                  {t("resDetail.yesCancel")}
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  {t("resDetail.keepBooking")}
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmCancel(true)}
              >
                {t("resDetail.cancelBooking")}
              </Button>
            ))}
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={close}>
              {t("common.close")}
            </Button>
            {reservation.status === "checked_in" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTab("keycard")}
              >
                {t("resDetail.generateKey")}
              </Button>
            )}
            {onMoveRoom && isActiveStay && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMoveRoom(reservation)}
              >
                {t("resDetail.moveRoom")}
              </Button>
            )}
            {reservation.status === "booked" && !isUnallocated && (
              <Button size="sm" onClick={() => void run("checkin")}>
                {t("resDetail.checkIn")}
              </Button>
            )}
            {reservation.status === "checked_in" && (
              <Button size="sm" onClick={() => void run("checkout")}>
                {t("resDetail.checkOut")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReservationDetailDialog;
