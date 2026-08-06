"use client";

import { Fragment, useMemo, useState } from "react";
import BulkRateModal from "@/components/rates/BulkRateModal";
import {
  buildRateGroups,
  channelLabel,
  formatRateDate,
  packageOptionsForType,
} from "@/components/rates/ratesUtils";
import PageHeader from "@/components/common/PageHeader";
import { Alert, inputClass, selectClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  FilterField,
  PageShell,
  SidePanel,
  SidePanelItem,
  SidePanelLinkItem,
  SurfaceCard,
  TwoColumnLayout,
} from "@/components/ui/layout";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, todayISO } from "@/lib/metrics";
import type { BulkRateUpdateInput } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";
import { useT } from "@/context/LocaleContext";

export default function RatesPage() {
  const t = useT();
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
    <PageShell>
      <PageHeader
        title={t("rates.title")}
        description={t("rates.description")}
        action={
          <Button size="sm" onClick={bulkModal.openModal}>
            Bulk update
          </Button>
        }
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
                    onClick={() => {
                      setTypeFilter("all");
                      setPackageFilter("all");
                    }}
                    label="All types"
                  />
                </li>
                {room_types.map((type) => (
                  <li key={type.id}>
                    <SidePanelItem
                      active={typeFilter === type.slug}
                      onClick={() => {
                        setTypeFilter(type.slug);
                        setPackageFilter("all");
                      }}
                      label={type.label}
                    />
                  </li>
                ))}
              </ul>
            </SidePanel>

            <SidePanel title="Rate plans">
              <ul className="space-y-1">
                <li>
                  <SidePanelLinkItem
                    active={packageFilter === "all"}
                    onClick={() => setPackageFilter("all")}
                    label="All rate plans"
                  />
                </li>
                {packageOptions.map((plan) => (
                  <li key={plan.id}>
                    <SidePanelLinkItem
                      active={packageFilter === plan.id}
                      onClick={() => setPackageFilter(plan.id)}
                      label={plan.label}
                      compact
                    />
                  </li>
                ))}
              </ul>
            </SidePanel>
          </>
        }
      >
          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FilterField label="View by">
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
                  </FilterField>
                  <FilterField label="Room type">
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
                  </FilterField>
                  <FilterField label="Rate plan">
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
                  </FilterField>
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
                    {t("reservations.today")}
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
          </SurfaceCard>
      </TwoColumnLayout>

      <BulkRateModal
        isOpen={bulkModal.isOpen}
        onClose={bulkModal.closeModal}
        plans={rate_plans}
        selectedPlanIds={[...selectedPlans]}
        defaultDate={startDate}
        onApply={onBulkApply}
      />
    </PageShell>
  );
}
