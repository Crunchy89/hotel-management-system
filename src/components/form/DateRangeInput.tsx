"use client";

import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/components/form";
import { addDays, formatDate, todayISO } from "@/lib/metrics";

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatRangeDisplay(from: string, to: string): string {
  if (!from && !to) return "";
  if (from && to) {
    return `${formatDate(from, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} – ${formatDate(to, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }
  return from
    ? formatDate(from, { day: "2-digit", month: "short", year: "numeric" })
    : "";
}

function CalendarMonth({
  month,
  from,
  to,
  hover,
  minDate,
  onPick,
  onHover,
}: {
  month: Date;
  from: string;
  to: string;
  hover: string;
  minDate?: string;
  onPick: (iso: string) => void;
  onHover: (iso: string) => void;
}) {
  const firstDow = startOfMonth(month).getDay();
  const total = daysInMonth(month);
  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= total; d += 1) {
    cells.push(toISO(new Date(month.getFullYear(), month.getMonth(), d)));
  }

  const rangeEnd = to || hover;

  return (
    <div className="w-full min-w-[240px]">
      <p className="mb-3 text-center text-sm font-semibold text-gray-800 dark:text-white/90">
        {monthLabel(month)}
      </p>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((iso, idx) => {
          if (!iso) return <span key={`e-${idx}`} />;
          const disabled = Boolean(minDate && iso < minDate);
          const isFrom = iso === from;
          const isTo = iso === to;
          const inRange =
            from &&
            rangeEnd &&
            iso > from &&
            iso < rangeEnd &&
            rangeEnd > from;
          const isEdge = isFrom || isTo;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              onMouseEnter={() => onHover(iso)}
              className={`h-9 rounded-lg text-sm tabular-nums transition ${
                disabled
                  ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                  : isEdge
                    ? "bg-brand-500 font-semibold text-white"
                    : inRange
                      ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
              }`}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangeModal({
  isOpen,
  onClose,
  from,
  to,
  onApply,
  minDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  minDate?: string;
}) {
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [hover, setHover] = useState("");
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(parseISO(from || todayISO())),
  );

  useEffect(() => {
    if (!isOpen) return;
    setDraftFrom(from);
    setDraftTo(to);
    setHover("");
    setViewMonth(startOfMonth(parseISO(from || todayISO())));
  }, [isOpen, from, to]);

  function pick(iso: string) {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(iso);
      setDraftTo("");
      setHover("");
      return;
    }
    if (iso <= draftFrom) {
      setDraftFrom(iso);
      setDraftTo("");
      return;
    }
    setDraftTo(iso);
  }

  const canApply = Boolean(draftFrom && draftTo && draftTo > draftFrom);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-2xl overflow-hidden p-0"
    >
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          Select date range
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {draftFrom && draftTo
            ? formatRangeDisplay(draftFrom, draftTo)
            : draftFrom
              ? `${formatRangeDisplay(draftFrom, "")} → pick check-out`
              : "Pick check-in, then check-out"}
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Button
            size="xs"
            variant="outline"
            type="button"
            onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          >
            ‹
          </Button>
          <Button
            size="xs"
            variant="outline"
            type="button"
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          >
            ›
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <CalendarMonth
            month={viewMonth}
            from={draftFrom}
            to={draftTo}
            hover={hover}
            minDate={minDate}
            onPick={pick}
            onHover={setHover}
          />
          <CalendarMonth
            month={addMonths(viewMonth, 1)}
            from={draftFrom}
            to={draftTo}
            hover={hover}
            minDate={minDate}
            onPick={pick}
            onHover={setHover}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => {
            const t = todayISO();
            setDraftFrom(t);
            setDraftTo(addDays(t, 1));
            setViewMonth(startOfMonth(parseISO(t)));
          }}
        >
          Tonight
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            type="button"
            disabled={!canApply}
            onClick={() => {
              if (!canApply) return;
              onApply(draftFrom, draftTo);
              onClose();
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Text-like date field; focus/click opens a date-range modal. */
export default function DateRangeInput({
  from,
  to,
  onChange,
  placeholder = "Select dates",
  minDate,
  className = "",
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  minDate?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = useMemo(() => formatRangeDisplay(from, to), [from, to]);

  return (
    <>
      <div className={`relative ${className}`}>
        <input
          type="text"
          readOnly
          className={`${inputClass} cursor-pointer pr-10`}
          placeholder={placeholder}
          value={display}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          aria-label="Date range"
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 2v3M16 2v3M3.5 9h17M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <DateRangeModal
        isOpen={open}
        onClose={() => setOpen(false)}
        from={from}
        to={to}
        minDate={minDate}
        onApply={onChange}
      />
    </>
  );
}
