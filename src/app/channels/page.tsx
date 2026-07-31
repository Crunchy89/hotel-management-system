"use client";

import { useMemo, useState } from "react";
import { Alert, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { BoltIcon, MoreDotIcon, PlugInIcon } from "@/icons";
import { api } from "@/lib/api";
import type { Channel, ChannelStatus } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

type Tab = "mine" | "all";
type StatusFilter = "all" | ChannelStatus;

function StatusBadge({
  status,
  hasWarning,
}: {
  status: ChannelStatus;
  hasWarning?: boolean;
}) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-success-50 text-success-700 ring-1 ring-success-600/20 dark:bg-success-500/15 dark:text-success-400"
          : "bg-gray-100 text-gray-600 ring-1 ring-gray-500/15 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {hasWarning && !active && (
        <span className="text-error-500" aria-hidden>
          ⚠
        </span>
      )}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ChannelRow({
  channel,
  reorderMode,
  onMoveUp,
  onMoveDown,
  onToggle,
  onConnect,
  menuOpen,
  onMenuToggle,
}: {
  channel: Channel;
  reorderMode: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onConnect: () => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  return (
    <article className="relative flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 transition hover:border-brand-200 hover:shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30">
      <div className="min-w-0 flex-1">
        <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white/90">
          {channel.name}
        </h3>
        {channel.description && (
          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
            {channel.description}
          </p>
        )}
      </div>

      <StatusBadge status={channel.status} hasWarning={channel.has_warning} />

      <div className="flex items-center gap-4 text-theme-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <BoltIcon className="h-4 w-4 opacity-70" />
          {channel.sync_days} days
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-brand-600 dark:text-brand-400">
          <PlugInIcon className="h-4 w-4" />
          {channel.mapped_count} mapped
        </span>
      </div>

      {reorderMode ? (
        <div className="flex gap-1">
          <Button size="xs" variant="outline" onClick={onMoveUp}>
            ↑
          </Button>
          <Button size="xs" variant="outline" onClick={onMoveDown}>
            ↓
          </Button>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={`Actions for ${channel.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <MoreDotIcon className="h-5 w-5 rotate-90" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Close menu"
                onClick={onMenuToggle}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-theme-md dark:border-gray-700 dark:bg-gray-900">
                {channel.is_connected ? (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-theme-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                    onClick={onToggle}
                  >
                    {channel.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-theme-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                    onClick={onConnect}
                  >
                    Connect channel
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default function ChannelsPage() {
  const { channels, error, mutate } = useHotelData();

  const [tab, setTab] = useState<Tab>("mine");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reorderMode, setReorderMode] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const mine = useMemo(
    () => channels.filter((c) => c.is_connected),
    [channels],
  );
  const allCount = channels.length;

  const filtered = useMemo(() => {
    const base = tab === "mine" ? mine : channels;
    const q = query.trim().toLowerCase();
    return base.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q);
    });
  }, [tab, mine, channels, query, statusFilter]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  async function toggleStatus(channel: Channel) {
    setOpenMenuId(null);
    await mutate(() =>
      api.updateChannel({
        id: channel.id,
        status: channel.status === "active" ? "inactive" : "active",
      }),
    );
  }

  async function connectChannel(channel: Channel) {
    setOpenMenuId(null);
    await mutate(() =>
      api.updateChannel({
        id: channel.id,
        is_connected: true,
        status: "active",
      }),
    );
  }

  async function moveChannel(id: string, direction: -1 | 1) {
    const list = [...mine];
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swap = idx + direction;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap]!, list[idx]!];
    await mutate(() => api.reorderChannels(list.map((c) => c.id)));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">
          Channels
        </h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Manage OTA connections, sync settings, and rate mappings.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-gray-200 dark:border-gray-800">
        {(
          [
            ["mine", `My channels (${mine.length})`],
            ["all", `All channels (${allCount})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-3 text-theme-sm font-semibold transition ${
              tab === key
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-md">
          <input
            className={`${inputClass} pl-10`}
            placeholder="Search by channel name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>

        <select
          className={`${inputClass} w-auto min-w-[140px]`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          type="button"
          onClick={clearFilters}
          className="text-theme-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Clear all
        </button>

        {tab === "mine" && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => setReorderMode((v) => !v)}
          >
            {reorderMode ? "Done reordering" : "Reorder"}
          </Button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center dark:border-gray-800">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              No channels match your search.
            </p>
          </div>
        )}
        {filtered.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            reorderMode={reorderMode && tab === "mine"}
            onMoveUp={() => void moveChannel(channel.id, -1)}
            onMoveDown={() => void moveChannel(channel.id, 1)}
            onToggle={() => void toggleStatus(channel)}
            onConnect={() => void connectChannel(channel)}
            menuOpen={openMenuId === channel.id}
            onMenuToggle={() =>
              setOpenMenuId((id) => (id === channel.id ? null : channel.id))
            }
          />
        ))}
      </div>
    </div>
  );
}
