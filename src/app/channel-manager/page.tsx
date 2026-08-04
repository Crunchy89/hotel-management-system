"use client";

import { Fragment, useMemo, useState } from "react";
import ChannelBulkModal from "@/components/channel-manager/ChannelBulkModal";
import {
  buildChannelRateGroups,
  CHANNEL_MARKUP_HINT,
  countPendingSync,
  formatRateDate,
  formatSyncTime,
  otaChannels,
  planMatchesChannel,
} from "@/components/channel-manager/channelManagerUtils";
import PageHeader from "@/components/common/PageHeader";
import { Alert, inputClass, selectClass } from "@/components/form";
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
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, formatCurrency, todayISO } from "@/lib/metrics";
import type { BulkChannelRateUpdateInput } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

function SyncBadge({ status }: { status: "pending" | "synced" | "error" }) {
  const styles = {
    pending:
      "bg-warning-50 text-warning-700 ring-warning-600/20 dark:bg-warning-500/15 dark:text-warning-400",
    synced:
      "bg-success-50 text-success-700 ring-success-600/20 dark:bg-success-500/15 dark:text-success-400",
    error:
      "bg-error-50 text-error-700 ring-error-600/20 dark:bg-error-500/15 dark:text-error-400",
  };
  const labels = { pending: "Pending", synced: "Synced", error: "Error" };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function ChannelManagerPage() {
  const {
    channels,
    channel_rate_entries,
    room_types,
    rate_plans,
    rate_entries,
    rooms,
    reservations,
    error,
    mutate,
  } = useHotelData();

  const today = todayISO();
  const connectedOtas = useMemo(() => otaChannels(channels), [channels]);

  const [selectedChannelId, setSelectedChannelId] = useState(
    () => connectedOtas[0]?.id ?? "",
  );
  const [startDate, setStartDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewBy, setViewBy] = useState<"rate" | "availability">("rate");
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const bulkModal = useModal();

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) ?? null,
    [channels, selectedChannelId],
  );

  const channelPlans = useMemo(() => {
    if (!selectedChannel) return [];
    return rate_plans.filter((p) => planMatchesChannel(p, selectedChannel.name));
  }, [rate_plans, selectedChannel]);

  const groups = useMemo(
    () =>
      selectedChannel
        ? buildChannelRateGroups(
            selectedChannel,
            room_types,
            rate_plans,
            channel_rate_entries,
            rate_entries,
            rooms,
            reservations,
            startDate,
            typeFilter,
          )
        : [],
    [
      selectedChannel,
      room_types,
      rate_plans,
      channel_rate_entries,
      rate_entries,
      rooms,
      reservations,
      startDate,
      typeFilter,
    ],
  );

  const flatRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);
  const pendingCount = useMemo(
    () =>
      selectedChannel
        ? countPendingSync(selectedChannel.id, channel_rate_entries)
        : 0,
    [selectedChannel, channel_rate_entries],
  );

  const mappedCount = channelPlans.length;

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
    if (!selectedChannel) return;
    await mutate(() =>
      api.upsertChannelRateEntry({
        channel_id: selectedChannel.id,
        rate_plan_id: planId,
        date: startDate,
        ...patch,
      }),
    );
  }

  async function onBulkApply(input: BulkChannelRateUpdateInput) {
    return mutate(() => api.bulkUpdateChannelRates(input));
  }

  async function onSync() {
    if (!selectedChannel) return;
    setSyncing(true);
    await mutate(() => api.syncChannelRates(selectedChannel.id));
    setSyncing(false);
  }

  if (connectedOtas.length === 0) {
    return (
      <PageShell>
        <PageHeader
          title="Channel manager"
          description="Update rates and availability for Agoda, Booking.com, and other OTAs."
        />
        {error && <Alert>{error}</Alert>}
        <SurfaceCard className="p-8 text-center">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No active OTA channels connected. Connect channels from the Channels page first.
          </p>
        </SurfaceCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Channel manager"
        description="Update room availability and prices per OTA, then push changes to Agoda, Booking.com, Expedia, and more."
        action={
          <Button
            size="sm"
            onClick={() => void onSync()}
            disabled={syncing || pendingCount === 0}
          >
            {syncing ? "Syncing…" : `Push to ${selectedChannel?.name ?? "channel"}`}
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <TwoColumnLayout
        sidebar={
          <>
            <SidePanel title="OTA channels">
              <ul className="space-y-1">
                {connectedOtas.map((channel) => {
                  const pending = countPendingSync(
                    channel.id,
                    channel_rate_entries,
                  );
                  return (
                    <li key={channel.id}>
                      <SidePanelItem
                        active={channel.id === selectedChannelId}
                        onClick={() => {
                          setSelectedChannelId(channel.id);
                          setSelectedPlans(new Set());
                        }}
                        label={channel.name}
                        count={pending > 0 ? pending : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            </SidePanel>

            <StatGrid cols={2} className="mt-4">
              <StatTile
                label="Mapped plans"
                value={mappedCount}
                tone="brand"
              />
              <StatTile
                label="Pending sync"
                value={pendingCount}
                tone={pendingCount > 0 ? "warning" : "success"}
              />
            </StatGrid>
          </>
        }
      >
        {selectedChannel && (
          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                    {selectedChannel.name}
                  </h2>
                  <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    {CHANNEL_MARKUP_HINT[selectedChannel.name] ??
                      "Manage channel-specific rates and inventory."}
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-400">
                    Last synced: {formatSyncTime(selectedChannel.last_synced_at)}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={bulkModal.openModal}>
                  Bulk update
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
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
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">All types</option>
                      {room_types.map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.label}
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

            <div className="border-b border-gray-100 bg-brand-50/50 px-5 py-3 dark:border-gray-800 dark:bg-brand-500/10 sm:px-6">
              <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
                {formatRateDate(startDate)}
              </p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {flatRows.length} rate plan{flatRows.length === 1 ? "" : "s"} ·{" "}
                {pendingCount} pending push
                {pendingCount === 1 ? "" : "es"}
              </p>
            </div>

            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full min-w-[780px]">
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
                      Sync
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
                        No rate plans mapped to {selectedChannel.name}.
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
                          <td className="px-4 py-3">
                            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                              {row.plan.label}
                            </p>
                            <p className="text-theme-xs text-gray-400">
                              Base {formatCurrency(row.plan.base_rate)}
                            </p>
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
                            <SyncBadge status={row.sync_status} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}
      </TwoColumnLayout>

      {selectedChannel && (
        <ChannelBulkModal
          isOpen={bulkModal.isOpen}
          onClose={bulkModal.closeModal}
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          plans={channelPlans}
          selectedPlanIds={[...selectedPlans]}
          defaultDate={startDate}
          onApply={onBulkApply}
        />
      )}
    </PageShell>
  );
}
