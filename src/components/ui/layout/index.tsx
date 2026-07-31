"use client";

import React from "react";

/* Shared layout primitives for consistent HMS pages */

export function PageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
}

export function TwoColumnLayout({
  sidebar,
  children,
  sidebarWidth = "xl:w-72",
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <aside
        className={`flex w-full shrink-0 flex-col gap-4 pb-6 ${sidebarWidth}`}
      >
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function SurfaceCard({
  children,
  className = "",
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`hms-surface overflow-hidden ${padding ? "" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SurfaceCardHeader({
  title,
  description,
  action,
  badge,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
            {title}
          </h3>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function SurfaceCardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 sm:px-6 sm:py-5 ${className}`}>{children}</div>
  );
}

export function SidePanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`hms-surface p-4 ${className}`}>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

export function SidePanelItem({
  active,
  onClick,
  label,
  count,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-theme-sm transition ${
        active
          ? "bg-brand-500 text-white shadow-theme-sm"
          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
      } ${className}`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
            active
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function SidePanelLinkItem({
  active,
  onClick,
  label,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 text-left transition ${
        compact ? "py-2 text-theme-xs" : "py-2.5 text-theme-sm"
      } ${
        active
          ? "font-semibold text-brand-600 dark:text-brand-400"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "brand" | "success" | "warning" | "error";
}) {
  const tones = {
    default: "text-gray-900 dark:text-white/90",
    brand: "text-brand-600 dark:text-brand-400",
    success: "text-success-600 dark:text-success-400",
    warning: "text-warning-600 dark:text-warning-400",
    error: "text-error-600 dark:text-error-400",
  };

  return (
    <div className="hms-stat-tile">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${tones[tone]}`}>
        {value}
      </p>
    </div>
  );
}

export function StatGrid({
  children,
  cols = 2,
  className = "",
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={`grid gap-3 ${gridCols[cols]} ${className}`}>{children}</div>
  );
}

export function SegmentTabs<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-900 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-4 py-2 text-theme-sm font-medium transition ${
            value === tab.id
              ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`-mb-px border-b-2 pb-3 text-theme-sm font-semibold transition ${
            value === tab.id
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function FilterToolbar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

export function FilterPanel({
  children,
  onSubmit,
  action,
}: {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  action?: React.ReactNode;
}) {
  const content = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
      {action && <div className="mt-4 flex justify-end">{action}</div>}
    </>
  );

  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="hms-filter-panel">
        {content}
      </form>
    );
  }

  return <div className="hms-filter-panel">{content}</div>;
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center dark:border-gray-800">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl dark:bg-gray-800">
        📋
      </div>
      <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-theme-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const tableHeaderCell =
  "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

export const tableBodyCell =
  "whitespace-nowrap px-4 py-3.5 text-theme-sm text-gray-700 dark:text-gray-300";
