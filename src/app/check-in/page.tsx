"use client";

import { FormEvent, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import {
  CHECK_IN_DUMMY,
  CHECK_OUT_DUMMY,
  exportCheckInCsv,
  exportReportCsv,
  filterByDateRange,
  formatEuro,
  formatReportDate,
  printBothReports,
  printReport,
  type CheckInReportRow,
} from "@/components/check-in/checkInUtils";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { PageShell, SurfaceCard, TwoColumnLayout, PageSectionNav } from "@/components/ui/layout";
import { useModal } from "@/hooks/useModal";

const DEFAULT_FROM = "2025-09-11";
const DEFAULT_TO = "2025-09-11";

const CHECK_IN_NAV = [
  { name: "Check-In", path: "#check-in-report" },
  { name: "Check-Out", path: "#check-out-report" },
  { name: "Booking activity", path: "/booking-activity" },
  { name: "Chat", path: "/chat" },
];

const reportDateClass =
  "h-10 w-full min-w-[168px] rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const headerCell =
  "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400";

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M9 1.5H4.5A1.5 1.5 0 003 3v10a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0013 13V5.5L9 1.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9 1.5V5.5H13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 6V2.5h8V6M4 11.5H2.5a1 1 0 01-1-1V7a1 1 0 011-1h11a1 1 0 011 1v3.5a1 1 0 01-1 1H12M4 11.5V14h8v-2.5H4z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2v8M5 7l3 3 3-3M3 13h10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionChoiceModal({
  isOpen,
  onClose,
  title,
  description,
  options,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  options: { label: string; hint?: string; onClick: () => void }[];
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="pr-8 text-lg font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      <ul className="mt-5 space-y-2">
        {options.map((option) => (
          <li key={option.label}>
            <button
              type="button"
              onClick={() => {
                option.onClick();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
            >
              <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                {option.label}
              </span>
              {option.hint && (
                <span className="text-theme-xs text-gray-400">{option.hint}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function OccupancyCell({ row }: { row: CheckInReportRow }) {
  return (
    <span className="tabular-nums">
      {row.adults} / {row.children} / {row.infants}
    </span>
  );
}

function ReportTable({
  title,
  dateLabel,
  rows,
  showEta,
  selectedId,
  onSelect,
  id,
}: {
  title: string;
  dateLabel: string;
  rows: CheckInReportRow[];
  showEta: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  id?: string;
}) {
  return (
    <SurfaceCard id={id} className="scroll-mt-6 overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
          {title}
        </h2>
      </div>

      <div className="custom-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900/60">
              <th className={headerCell}>Reservation number</th>
              <th className={headerCell}>Invoice number</th>
              <th className={headerCell}>Guest name</th>
              <th className={headerCell}>{dateLabel}</th>
              <th className={headerCell}>LoS</th>
              <th className={headerCell}>Room number</th>
              <th className={headerCell}>Adults / Children / Infants</th>
              <th className={headerCell}>Extra person</th>
              <th className={headerCell}>Outstanding balance</th>
              <th className={headerCell}>Total amount</th>
              {showEta && <th className={headerCell}>ETA</th>}
              <th className={headerCell}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={showEta ? 12 : 11}
                  className="px-4 py-12 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                >
                  No records for the selected date range.
                </td>
              </tr>
            )}
            {rows.map((row, index) => {
              const selected = selectedId === row.id;
              const zebra = index % 2 === 1;

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                  className={`cursor-pointer border-b border-gray-100 transition dark:border-gray-800 ${
                    selected
                      ? "bg-blue-100/80 dark:bg-blue-500/15"
                      : zebra
                        ? "bg-sky-50/50 dark:bg-sky-500/[0.04]"
                        : "bg-white dark:bg-transparent"
                  } hover:bg-blue-50/70 dark:hover:bg-blue-500/10`}
                >
                  <td className="px-4 py-3 text-theme-xs text-gray-700 dark:text-gray-300">
                    {row.reservationNumber}
                  </td>
                  <td className="px-4 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                    {row.invoiceNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-theme-sm font-medium text-gray-900 dark:text-white/90">
                    {row.guestName}
                  </td>
                  <td className="px-4 py-3 text-theme-xs tabular-nums text-gray-700 dark:text-gray-300">
                    {formatReportDate(row.date)}
                  </td>
                  <td className="px-4 py-3 text-theme-xs tabular-nums text-gray-700 dark:text-gray-300">
                    {row.lengthOfStay}
                  </td>
                  <td className="px-4 py-3 text-theme-xs text-gray-700 dark:text-gray-300">
                    {row.roomNumber}
                  </td>
                  <td className="px-4 py-3 text-theme-xs text-gray-700 dark:text-gray-300">
                    <OccupancyCell row={row} />
                  </td>
                  <td className="px-4 py-3 text-theme-xs tabular-nums text-gray-700 dark:text-gray-300">
                    {row.extraPerson}
                  </td>
                  <td className="px-4 py-3 text-theme-xs tabular-nums text-gray-700 dark:text-gray-300">
                    {formatEuro(row.outstandingBalance)}
                  </td>
                  <td className="px-4 py-3 text-theme-xs tabular-nums font-medium text-gray-800 dark:text-white/90">
                    {formatEuro(row.totalAmount)}
                  </td>
                  {showEta && (
                    <td className="px-4 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                      {row.eta || "—"}
                    </td>
                  )}
                  <td className="max-w-[160px] truncate px-4 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                    {row.notes || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}

export default function CheckInPage() {
  const [draftFrom, setDraftFrom] = useState(DEFAULT_FROM);
  const [draftTo, setDraftTo] = useState(DEFAULT_TO);
  const [appliedFrom, setAppliedFrom] = useState(DEFAULT_FROM);
  const [appliedTo, setAppliedTo] = useState(DEFAULT_TO);
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(
    "ci-2",
  );
  const [selectedCheckOutId, setSelectedCheckOutId] = useState<string | null>(
    null,
  );

  const printModal = useModal();
  const exportModal = useModal();

  const checkIns = useMemo(
    () => filterByDateRange(CHECK_IN_DUMMY, appliedFrom, appliedTo),
    [appliedFrom, appliedTo],
  );

  const checkOuts = useMemo(
    () => filterByDateRange(CHECK_OUT_DUMMY, appliedFrom, appliedTo),
    [appliedFrom, appliedTo],
  );

  function onRunReport(e: FormEvent) {
    e.preventDefault();
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setSelectedCheckInId(null);
    setSelectedCheckOutId(null);
  }

  return (
    <PageShell className="space-y-5">
      <PageHeader title="Check-In" />

      <TwoColumnLayout sidebar={<PageSectionNav items={CHECK_IN_NAV} />}>
        <div className="space-y-5">
      <form
        onSubmit={onRunReport}
        className="rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Start date *
              </label>
              <input
                className={reportDateClass}
                type="date"
                required
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                End date *
              </label>
              <input
                className={reportDateClass}
                type="date"
                required
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button size="sm" type="submit" startIcon={<DocIcon />}>
              Run report
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              startIcon={<PrintIcon />}
              onClick={printModal.openModal}
            >
              Print
            </Button>
            <Button
              size="sm"
              type="button"
              className="!bg-success-600 text-white hover:!bg-success-700"
              startIcon={<ExportIcon />}
              onClick={exportModal.openModal}
            >
              Export
            </Button>
          </div>
        </div>
      </form>

      <ActionChoiceModal
        isOpen={printModal.isOpen}
        onClose={printModal.closeModal}
        title="Print report"
        description="Choose which report to print for the current date range."
        options={[
          {
            label: "Print check-in",
            hint: `${checkIns.length} rows`,
            onClick: () =>
              printReport(
                "Check-In",
                checkIns,
                "Check-In",
                true,
                appliedFrom,
                appliedTo,
              ),
          },
          {
            label: "Print check-out",
            hint: `${checkOuts.length} rows`,
            onClick: () =>
              printReport(
                "Check-Out",
                checkOuts,
                "Check-Out",
                false,
                appliedFrom,
                appliedTo,
              ),
          },
          {
            label: "Print both",
            hint: `${checkIns.length + checkOuts.length} rows`,
            onClick: () =>
              printBothReports(checkIns, checkOuts, appliedFrom, appliedTo),
          },
        ]}
      />

      <ActionChoiceModal
        isOpen={exportModal.isOpen}
        onClose={exportModal.closeModal}
        title="Export report"
        description="Download a CSV file for the current date range."
        options={[
          {
            label: "Export check-in",
            hint: `${checkIns.length} rows`,
            onClick: () =>
              exportReportCsv(checkIns, "check-in", appliedFrom, appliedTo),
          },
          {
            label: "Export check-out",
            hint: `${checkOuts.length} rows`,
            onClick: () =>
              exportReportCsv(checkOuts, "check-out", appliedFrom, appliedTo),
          },
          {
            label: "Export both",
            hint: `${checkIns.length + checkOuts.length} rows`,
            onClick: () =>
              exportCheckInCsv(checkIns, checkOuts, appliedFrom, appliedTo),
          },
        ]}
      />

      <ReportTable
        id="check-in-report"
        title="Check-In"
        dateLabel="Check-In"
        rows={checkIns}
        showEta
        selectedId={selectedCheckInId}
        onSelect={setSelectedCheckInId}
      />

      <ReportTable
        id="check-out-report"
        title="Check-Out"
        dateLabel="Check-Out"
        rows={checkOuts}
        showEta={false}
        selectedId={selectedCheckOutId}
        onSelect={setSelectedCheckOutId}
      />
        </div>
      </TwoColumnLayout>
    </PageShell>
  );
}
