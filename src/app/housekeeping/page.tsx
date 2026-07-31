"use client";

import { useMemo, useState } from "react";
import {
  buildHousekeepingRows,
  CLEANING_FILTER_OPTIONS,
  cleaningLabel,
  filterHousekeepingRows,
  OCCUPANCY_OPTIONS,
  occupancyLabel,
  printHousekeepingReport,
  summarizeRows,
  type HousekeepingRow,
} from "@/components/housekeeping/housekeepingUtils";
import PageHeader from "@/components/common/PageHeader";
import { Alert, inputClass, selectClass, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  FilterField,
  PageShell,
  SidePanel,
  SidePanelItem,
  StatGrid,
  StatTile,
  SurfaceCard,
  TwoColumnLayout,
} from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, formatDate, todayISO } from "@/lib/metrics";
import type { CleaningStatus } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

function Occupants({ adults, children, infants }: HousekeepingRow) {
  return (
    <div className="flex items-center gap-2 text-theme-xs text-gray-600 dark:text-gray-400">
      <span title="Adults">👤 {adults}</span>
      <span title="Children">🧒 {children}</span>
      <span title="Infants">👶 {infants}</span>
    </div>
  );
}

function OccupancyBadge({ status }: { status: HousekeepingRow["occupancy"] }) {
  const styles = {
    occupied:
      "bg-success-50 text-success-700 ring-success-600/20 dark:bg-success-500/15 dark:text-success-400",
    check_in_only:
      "bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/15 dark:text-brand-400",
    empty:
      "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {occupancyLabel(status)}
      {status === "occupied" && " · 1"}
    </span>
  );
}

function CleaningSelect({
  value,
  onChange,
}: {
  value: CleaningStatus;
  onChange: (value: CleaningStatus) => void;
}) {
  return (
    <select
      className="h-9 min-w-[130px] rounded-lg border border-gray-200 bg-white px-2.5 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      value={value}
      onChange={(e) => onChange(e.target.value as CleaningStatus)}
    >
      {(["pending", "in_progress", "clean", "inspected"] as const).map((s) => (
        <option key={s} value={s}>
          {cleaningLabel(s)}
        </option>
      ))}
    </select>
  );
}

export default function HousekeepingPage() {
  const { rooms, room_types, reservations, housekeeping, error, mutate } =
    useHotelData();

  const today = todayISO();
  const [dateMode, setDateMode] = useState<"today" | "tomorrow" | "custom">(
    "today",
  );
  const [customDate, setCustomDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [cleaningFilter, setCleaningFilter] = useState("all");
  const [noteTarget, setNoteTarget] = useState<HousekeepingRow | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const noteModal = useModal();

  const reportDate =
    dateMode === "today"
      ? today
      : dateMode === "tomorrow"
        ? addDays(today, 1)
        : customDate;

  const allRows = useMemo(
    () =>
      buildHousekeepingRows(
        rooms,
        room_types,
        reservations,
        housekeeping,
        reportDate,
      ),
    [rooms, room_types, reservations, housekeeping, reportDate],
  );

  const filteredRows = useMemo(
    () =>
      filterHousekeepingRows(
        allRows,
        typeFilter,
        occupancyFilter,
        cleaningFilter,
      ),
    [allRows, typeFilter, occupancyFilter, cleaningFilter],
  );

  const summary = useMemo(() => summarizeRows(allRows), [allRows]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of allRows) {
      counts.set(row.room.type, (counts.get(row.room.type) ?? 0) + 1);
    }
    return counts;
  }, [allRows]);

  const lastUpdated = useMemo(() => {
    const relevant = housekeeping.filter((h) => h.date === reportDate);
    if (relevant.length === 0) return null;
    return relevant.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
      ?.updated_at;
  }, [housekeeping, reportDate]);

  function openNote(row: HousekeepingRow) {
    setNoteTarget(row);
    setNoteDraft(row.note);
    noteModal.openModal();
  }

  async function saveNote() {
    if (!noteTarget) return;
    const ok = await mutate(() =>
      api.upsertHousekeeping({
        room_id: noteTarget.room.id,
        date: reportDate,
        note: noteDraft,
        cleaning_status: noteTarget.cleaningStatus,
      }),
    );
    if (ok) noteModal.closeModal();
  }

  async function updateCleaning(row: HousekeepingRow, status: CleaningStatus) {
    await mutate(() =>
      api.upsertHousekeeping({
        room_id: row.room.id,
        date: reportDate,
        cleaning_status: status,
        note: row.note,
      }),
    );
  }

  const dateLabel = formatDate(reportDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageShell>
      <PageHeader
        title="Housekeeping"
        description="Track room status, guest occupancy, and cleaning progress."
      />

      {error && <Alert>{error}</Alert>}

      <TwoColumnLayout
        sidebar={
          <>
            <SidePanel title="Room types">
              <ul className="space-y-1">
                <li>
                  <SidePanelItem
                    active={typeFilter === "all"}
                    onClick={() => setTypeFilter("all")}
                    label="All rooms"
                    count={summary.total}
                  />
                </li>
                {room_types.map((type) => (
                  <li key={type.id}>
                    <SidePanelItem
                      active={typeFilter === type.slug}
                      onClick={() => setTypeFilter(type.slug)}
                      label={type.label}
                      count={typeCounts.get(type.slug) ?? 0}
                    />
                  </li>
                ))}
              </ul>
            </SidePanel>

            <StatGrid cols={2}>
              <StatTile label="Occupied" value={summary.occupied} tone="success" />
              <StatTile label="Arrivals" value={summary.arrivals} tone="brand" />
              <StatTile label="Vacant" value={summary.vacant} />
              <StatTile label="To clean" value={summary.needsCleaning} tone="warning" />
            </StatGrid>
          </>
        }
      >
          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    View report for
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["today", "Today"],
                        ["tomorrow", "Tomorrow"],
                        ["custom", "Pick date"],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDateMode(mode)}
                        className={`rounded-lg px-4 py-2 text-theme-sm font-medium transition ${
                          dateMode === mode
                            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {dateMode === "custom" && (
                    <input
                      type="date"
                      className={`${inputClass} mt-3 max-w-xs`}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printHousekeepingReport(filteredRows, dateLabel)}
                >
                  Print report
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <FilterField label="Room status">
                  <select
                    className={selectClass}
                    value={occupancyFilter}
                    onChange={(e) => setOccupancyFilter(e.target.value)}
                  >
                    {OCCUPANCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FilterField>
                <FilterField label="Cleaning status">
                  <select
                    className={selectClass}
                    value={cleaningFilter}
                    onChange={(e) => setCleaningFilter(e.target.value)}
                  >
                    {CLEANING_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FilterField>
              </div>

              {lastUpdated && (
                <p className="mt-4 text-theme-xs text-gray-400">
                  Last updated{" "}
                  {new Date(lastUpdated).toLocaleString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-gray-800 dark:bg-gray-900/40">
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                {dateLabel}
              </p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {filteredRows.length} room{filteredRows.length === 1 ? "" : "s"}{" "}
                in this view
              </p>
            </div>

            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full min-w-[880px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-white dark:border-gray-800">
                    {[
                      "Room",
                      "Type",
                      "Room status",
                      "Guests",
                      "Room notes",
                      "Cleaning",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        No rooms match the current filters.
                      </td>
                    </tr>
                  )}
                  {filteredRows.map((row) => (
                    <tr
                      key={row.room.id}
                      className="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                        Room {row.room.number}
                      </td>
                      <td className="px-4 py-3.5 text-theme-xs text-gray-600 dark:text-gray-400">
                        {row.typeLabel}
                      </td>
                      <td className="px-4 py-3.5">
                        <OccupancyBadge status={row.occupancy} />
                      </td>
                      <td className="px-4 py-3.5">
                        {row.occupancy === "empty" ? (
                          <span className="text-theme-xs text-gray-400">—</span>
                        ) : (
                          <Occupants {...row} />
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {row.note ? (
                          <button
                            type="button"
                            onClick={() => openNote(row)}
                            className="max-w-[180px] truncate text-left text-theme-xs text-gray-600 hover:text-brand-600 dark:text-gray-400"
                          >
                            {row.note}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openNote(row)}
                            className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Add note
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <CleaningSelect
                          value={row.cleaningStatus}
                          onChange={(status) => void updateCleaning(row, status)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
      </TwoColumnLayout>

      <Modal isOpen={noteModal.isOpen} onClose={noteModal.closeModal} className="max-w-md p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Room note
        </h4>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Room {noteTarget?.room.number} · {dateLabel}
        </p>
        <textarea
          className={textareaClass}
          rows={4}
          placeholder="Housekeeping instructions, special requests…"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={noteModal.closeModal}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void saveNote()}>
            Save note
          </Button>
        </div>
      </Modal>
    </PageShell>
  );
}
