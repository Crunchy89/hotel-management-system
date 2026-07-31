"use client";

import { Fragment, useMemo, useState } from "react";
import BulkRateModal from "@/components/rates/BulkRateModal";
import {
  buildRateGroups,
  channelLabel,
  formatRateDate,
  packageOptionsForType,
} from "@/components/rates/ratesUtils";
import { Alert, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, todayISO } from "@/lib/metrics";
import type { BulkRateUpdateInput } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const selectClass = inputClass;

export default function RatesPage() {
  const {
    room_types,
    rate_plans,
    rate_entries,
    rooms,
    reservations,
    error,
    mutate,
  } = useHotelData();

  const today = todayISO();
  const [startDate, setStartDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [viewBy, setViewBy] = useState<"rate" | "availability">("rate");
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const bulkModal = useModal();

  const packageOptions = useMemo(
    () => packageOptionsForType(rate_plans, typeFilter),
    [rate_plans, typeFilter],
  );

  const groups = useMemo(
    () =>
      buildRateGroups(
        room_types,
        rate_plans,
        rate_entries,
        rooms,
        reservations,
        startDate,
        typeFilter,
        packageFilter,
      ),
    [
      room_types,
      rate_plans,
      rate_entries,
      rooms,
      reservations,
      startDate,
      typeFilter,
      packageFilter,
    ],
  );

  const flatRows = useMemo(
    () => groups.flatMap((g) => g.rows),
    [groups],
  );

  function togglePlan(id: string) {
    setSelectedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function updateCell(
    planId: string,
    patch: { rate?: number; availability?: number },
  ) {
    await mutate(() =>
      api.upsertRateEntry({
        rate_plan_id: planId,
        date: startDate,
        ...patch,
      }),
    );
  }

  const onBulkApply = (input: BulkRateUpdateInput) =>
    mutate(() => api.bulkUpdateRates(input));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">
            Rooms &amp; Prices
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Control room rates and availability by room type.
          </p>
        </div>
        <Button size="sm" onClick={bulkModal.openModal}>
          Bulk update
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left panel */}
        <aside className="w-full shrink-0 xl:w-64">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Room types
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("all");
                    setPackageFilter("all");
                  }}
                  className={`flex w-full rounded-lg px-3 py-2.5 text-left text-theme-sm transition ${
                    typeFilter === "all"
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  All types
                </button>
              </li>
              {room_types.map((type) => (
                <li key={type.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter(type.slug);
                      setPackageFilter("all");
                    }}
                    className={`flex w-full rounded-lg px-3 py-2.5 text-left text-theme-sm transition ${
                      typeFilter === type.slug
                        ? "bg-brand-500 text-white shadow-theme-xs"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    {type.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Rate plans
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setPackageFilter("all")}
                  className={`w-full rounded-lg px-3 py-2 text-left text-theme-xs transition ${
                    packageFilter === "all"
                      ? "font-semibold text-brand-600 dark:text-brand-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  All rate plans
                </button>
              </li>
              {packageOptions.map((plan) => (
                <li key={plan.id}>
                  <button
                    type="button"
                    onClick={() => setPackageFilter(plan.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-theme-xs transition ${
                      packageFilter === plan.id
                        ? "font-semibold text-brand-600 dark:text-brand-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                    }`}
                  >
                    {plan.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main grid */}
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      View by
                    </label>
                    <select
                      className={selectClass}
                      value={viewBy}
                      onChange={(e) =>
                        setViewBy(e.target.value as "rate" | "availability")
                      }
                    >
                      <option value="rate">Rate</option>
                      <option value="availability">Availability</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Room type
                    </label>
                    <select
                      className={selectClass}
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPackageFilter("all");
                      }}
                    >
                      <option value="all">All types</option>
                      {room_types.map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Rate plan
                    </label>
                    <select
                      className={selectClass}
                      value={packageFilter}
                      onChange={(e) => setPackageFilter(e.target.value)}
                    >
                      <option value="all">All rate plans</option>
                      {packageOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setStartDate(addDays(startDate, -1))}
                  >
                    ‹
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setStartDate(today)}
                  >
                    Today
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setStartDate(addDays(startDate, 1))}
                  >
                    ›
                  </Button>
                  <input
                    type="date"
                    className={`${inputClass} w-auto`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 bg-brand-50/60 px-5 py-3 dark:border-gray-800 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
                {formatRateDate(startDate)}
              </p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {flatRows.length} rate plan{flatRows.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/40">
                    <th className="w-10 px-3 py-3" />
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Rate plan
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Availability
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Channels
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-theme-sm text-gray-500"
                      >
                        No rate plans match the current filters.
                      </td>
                    </tr>
                  )}
                  {groups.map((group) => (
                    <Fragment key={group.typeSlug}>
                      <tr className="bg-gray-100/80 dark:bg-gray-900/60">
                        <td colSpan={5} className="px-4 py-2.5">
                          <span className="text-theme-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                            {group.typeLabel}
                          </span>
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={row.plan.id}
                          className="border-b border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedPlans.has(row.plan.id)}
                              onChange={() => togglePlan(row.plan.id)}
                              className="rounded border-gray-300 text-brand-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {row.plan.label}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              className="h-9 w-20 rounded-lg border border-gray-200 px-2 text-theme-sm tabular-nums dark:border-gray-700 dark:bg-gray-900"
                              value={row.availability}
                              onChange={(e) =>
                                void updateCell(row.plan.id, {
                                  availability: Number(e.target.value),
                                })
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-9 w-28 rounded-lg border border-gray-200 px-2 text-theme-sm tabular-nums dark:border-gray-700 dark:bg-gray-900"
                              value={row.rate}
                              onChange={(e) =>
                                void updateCell(row.plan.id, {
                                  rate: Number(e.target.value),
                                })
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              {channelLabel(row.plan.channels)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <BulkRateModal
        isOpen={bulkModal.isOpen}
        onClose={bulkModal.closeModal}
        plans={rate_plans}
        selectedPlanIds={[...selectedPlans]}
        defaultDate={startDate}
        onApply={onBulkApply}
      />
    </div>
  );
}
