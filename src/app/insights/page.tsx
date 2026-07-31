"use client";

import { useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageHeader from "@/components/common/PageHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import OccupancyTrendChart from "@/components/insights/OccupancyTrendChart";
import RevenueByTypeChart from "@/components/insights/RevenueByTypeChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addDays,
  dailyMetrics,
  dateRange,
  formatCurrency,
  revenueByRoomType,
  summarize,
  todayISO,
} from "@/lib/metrics";
import { useHotelData } from "@/lib/useHotelData";

const LENGTHS = [7, 30, 90];

const headerCell =
  "px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400";
const bodyCell = "px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300";

export default function InsightsPage() {
  const { rooms, reservations } = useHotelData();
  const [direction, setDirection] = useState<"past" | "upcoming">("upcoming");
  const [length, setLength] = useState(30);

  const today = todayISO();
  const start = direction === "past" ? addDays(today, -length) : today;

  const dates = useMemo(() => dateRange(start, length), [start, length]);

  const days = useMemo(
    () => dailyMetrics(dates, reservations, rooms),
    [dates, reservations, rooms],
  );

  const summary = useMemo(
    () => summarize(days, rooms.length),
    [days, rooms.length],
  );

  const byType = useMemo(
    () => revenueByRoomType(dates, reservations, rooms),
    [dates, reservations, rooms],
  );

  const bestDay = useMemo(
    () =>
      days.reduce<(typeof days)[number] | null>(
        (best, d) => (!best || d.revenue > best.revenue ? d : best),
        null,
      ),
    [days],
  );

  return (
    <div>
      <PageHeader
        title="Insights"
        description="Occupancy and revenue performance across your property."
        action={
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
              {(["past", "upcoming"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`rounded-md px-4 py-2 text-theme-sm font-medium capitalize transition ${
                    direction === d
                      ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
              {LENGTHS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLength(l)}
                  className={`rounded-md px-3 py-2 text-theme-sm font-medium transition ${
                    length === l
                      ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {l}d
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <MetricCard
          label="Occupancy"
          value={`${Math.round(summary.occupancyRate * 100)}%`}
          hint={`${summary.roomNights} of ${summary.availableRoomNights} room nights`}
          tone="brand"
        />
        <MetricCard
          label="Room revenue"
          value={formatCurrency(summary.revenue)}
          hint={`Over ${length} days`}
          tone="success"
        />
        <MetricCard
          label="ADR"
          value={formatCurrency(summary.adr)}
          hint="Average daily rate per sold room"
          tone="info"
        />
        <MetricCard
          label="RevPAR"
          value={formatCurrency(summary.revpar)}
          hint="Revenue per available room"
          tone="warning"
        />
      </div>

      <div className="mt-4 md:mt-6">
        <ComponentCard
          title="Occupancy trend"
          desc={
            bestDay
              ? `Peak revenue day: ${bestDay.date} (${formatCurrency(bestDay.revenue)})`
              : "No data in this period"
          }
        >
          <OccupancyTrendChart days={days} />
        </ComponentCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <ComponentCard title="Revenue by room type" desc="Room nights sold × rate">
          <RevenueByTypeChart data={byType} />
        </ComponentCard>

        <ComponentCard
          title="Room type performance"
          desc="Contribution to total room revenue"
        >
          <div className="custom-scrollbar overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className={headerCell}>
                    Type
                  </TableCell>
                  <TableCell isHeader className={headerCell}>
                    Room nights
                  </TableCell>
                  <TableCell isHeader className={headerCell}>
                    Revenue
                  </TableCell>
                  <TableCell isHeader className={headerCell}>
                    Share
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {byType.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                    >
                      No rooms configured.
                    </TableCell>
                  </TableRow>
                )}
                {byType.map((row) => {
                  const share = summary.revenue
                    ? Math.round((row.revenue / summary.revenue) * 100)
                    : 0;
                  return (
                    <TableRow key={row.type}>
                      <TableCell
                        className={`${bodyCell} font-medium capitalize text-gray-800 dark:text-white/90`}
                      >
                        {row.type}
                      </TableCell>
                      <TableCell className={`${bodyCell} tabular-nums`}>
                        {row.roomNights}
                      </TableCell>
                      <TableCell className={`${bodyCell} tabular-nums`}>
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className={bodyCell}>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-theme-xs text-gray-500 dark:text-gray-400">
                            {share}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
