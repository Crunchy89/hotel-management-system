"use client";

import {
  ACTIVITY_KIND_OPTION_VALUES,
  activityKindTone,
  defaultActivityFilters,
  exportActivitiesCsv,
  filterActivities,
  formatActivityWhen,
  type ActivityFilters,
} from "@/components/booking-activity/bookingActivityUtils";
import { BOOKING_SOURCES } from "@/components/reservations/reservationFormUtils";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { inputClass, selectClass } from "@/components/form";
import {
  EmptyState,
  FilterField,
  PageSectionNav,
  PageShell,
  SurfaceCard,
  TwoColumnLayout,
  tableBodyCell,
  tableHeaderCell,
} from "@/components/ui/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/context/LocaleContext";
import { todayISO } from "@/lib/metrics";
import { useHotelData } from "@/lib/useHotelData";
import { formatCurrency } from "@/lib/metrics";
import PageHeader from "@/components/common/PageHeader";
import { FormEvent, useMemo, useState } from "react";

const reportDateClass =
  "h-10 w-full min-w-[168px] rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function kindBadgeColor(tone: ReturnType<typeof activityKindTone>) {
  switch (tone) {
    case "brand":
      return "primary" as const;
    case "success":
      return "success" as const;
    case "error":
      return "error" as const;
    default:
      return "light" as const;
  }
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

export default function BookingActivityPage() {
  const t = useT();
  const { booking_activities, loading } = useHotelData();
  const [draft, setDraft] = useState<ActivityFilters>(() =>
    defaultActivityFilters(todayISO()),
  );
  const [applied, setApplied] = useState<ActivityFilters>(() =>
    defaultActivityFilters(todayISO()),
  );

  const rows = useMemo(
    () => filterActivities(booking_activities, applied),
    [booking_activities, applied],
  );

  const summary = useMemo(() => {
    const counts = {
      booking_created: 0,
      payment_received: 0,
      booking_cancelled: 0,
    };
    for (const row of rows) {
      if (row.kind in counts) {
        counts[row.kind as keyof typeof counts] += 1;
      }
    }
    return counts;
  }, [rows]);

  function onRunReport(e: FormEvent) {
    e.preventDefault();
    setApplied({ ...draft });
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-sm text-gray-500">Loading booking activity…</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title={t("bookingActivity.title")}
        description={t("bookingActivity.description")}
      />

      <TwoColumnLayout sidebar={<PageSectionNav />}>
        <div className="space-y-5">
          <form
            onSubmit={onRunReport}
            className="rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Start date *">
                <input
                  className={reportDateClass}
                  type="date"
                  required
                  value={draft.dateFrom}
                  onChange={(e) =>
                    setDraft((f) => ({ ...f, dateFrom: e.target.value }))
                  }
                />
              </FilterField>
              <FilterField label="End date *">
                <input
                  className={reportDateClass}
                  type="date"
                  required
                  value={draft.dateTo}
                  onChange={(e) =>
                    setDraft((f) => ({ ...f, dateTo: e.target.value }))
                  }
                />
              </FilterField>
              <FilterField label="Event type">
                <select
                  className={selectClass}
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft((f) => ({
                      ...f,
                      kind: e.target.value as ActivityFilters["kind"],
                    }))
                  }
                >
                  {ACTIVITY_KIND_OPTION_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {t(`activity.${value}`)}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Booking source">
                <select
                  className={selectClass}
                  value={draft.source}
                  onChange={(e) =>
                    setDraft((f) => ({ ...f, source: e.target.value }))
                  }
                >
                  <option value="all">All sources</option>
                  {BOOKING_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </FilterField>
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full lg:max-w-sm">
                <FilterField label="Search">
                  <input
                    className={inputClass}
                    placeholder="Guest, reference, description…"
                    value={draft.search}
                    onChange={(e) =>
                      setDraft((f) => ({ ...f, search: e.target.value }))
                    }
                  />
                </FilterField>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" type="submit">
                  Run report
                </Button>
                <Button
                  size="sm"
                  type="button"
                  className="!bg-success-600 text-white hover:!bg-success-700"
                  startIcon={<ExportIcon />}
                  onClick={() =>
                    exportActivitiesCsv(rows, applied.dateFrom, applied.dateTo)
                  }
                >
                  Export
                </Button>
              </div>
            </div>
          </form>

          <div className="grid gap-3 sm:grid-cols-3">
            <SurfaceCard className="px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {t("bookingActivity.newBookings")}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                {summary.booking_created}
              </p>
            </SurfaceCard>
            <SurfaceCard className="px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {t("bookingActivity.payments")}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-success-600 dark:text-success-400">
                {summary.payment_received}
              </p>
            </SurfaceCard>
            <SurfaceCard className="px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {t("bookingActivity.cancellations")}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-error-600 dark:text-error-400">
                {summary.booking_cancelled}
              </p>
            </SurfaceCard>
          </div>

          <SurfaceCard className="overflow-hidden">
            {rows.length === 0 ? (
              <EmptyState
                title="No activity found"
                description="Try widening the date range or changing filters."
              />
            ) : (
              <div className="custom-scrollbar overflow-x-auto">
                <Table className="min-w-[960px]">
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader className={tableHeaderCell}>
                        {t("bookingActivity.when")}
                      </TableCell>
                      <TableCell isHeader className={tableHeaderCell}>
                        {t("bookingActivity.event")}
                      </TableCell>
                      <TableCell isHeader className={tableHeaderCell}>
                        {t("bookingActivity.reference")}
                      </TableCell>
                      <TableCell isHeader className={tableHeaderCell}>
                        {t("bookingActivity.guest")}
                      </TableCell>
                      <TableCell isHeader className={tableHeaderCell}>
                        {t("bookingActivity.source")}
                      </TableCell>
                      <TableCell isHeader className={tableHeaderCell}>
                        {t("bookingActivity.amount")}
                      </TableCell>
                      <TableCell isHeader className={tableHeaderCell}>
                        {t("bookingActivity.descriptionCol")}
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className={tableBodyCell}>
                          {formatActivityWhen(row.created_at)}
                        </TableCell>
                        <TableCell className={tableBodyCell}>
                          <Badge
                            size="sm"
                            color={kindBadgeColor(activityKindTone(row.kind))}
                          >
                            {t(`activity.${row.kind}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className={tableBodyCell}>
                          {row.reference ?? "—"}
                        </TableCell>
                        <TableCell className={tableBodyCell}>
                          {row.guest_name ?? "—"}
                        </TableCell>
                        <TableCell className={tableBodyCell}>
                          {row.booking_source ?? "Direct"}
                        </TableCell>
                        <TableCell className={`${tableBodyCell} tabular-nums`}>
                          {row.amount != null
                            ? formatCurrency(row.amount)
                            : "—"}
                        </TableCell>
                        <TableCell
                          className={`${tableBodyCell} max-w-[240px] truncate`}
                        >
                          {row.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SurfaceCard>
        </div>
      </TwoColumnLayout>
    </PageShell>
  );
}
