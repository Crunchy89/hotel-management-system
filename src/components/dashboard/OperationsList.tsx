"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import type { Reservation } from "@/lib/types";

interface OperationsListProps {
  title: string;
  emptyLabel: string;
  reservations: Reservation[];
  tone: "brand" | "success" | "warning";
  actionLabel?: string;
  onAction?: (id: string) => void;
  onSelect: (reservation: Reservation) => void;
}

const toneStyles = {
  brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
};

const OperationsList: React.FC<OperationsListProps> = ({
  title,
  emptyLabel,
  reservations,
  tone,
  actionLabel,
  onAction,
  onSelect,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
        {title}
      </h3>
      <span
        className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-theme-xs font-semibold ${toneStyles[tone]}`}
      >
        {reservations.length}
      </span>
    </div>

    <div className="border-t border-gray-100 dark:border-gray-800">
      {reservations.length === 0 ? (
        <p className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
          {emptyLabel}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {reservations.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 px-5 py-3.5"
            >
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {r.guest_name}
                </span>
                <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                  Room {r.room_number} · {r.check_in} → {r.check_out}
                </span>
              </button>

              {actionLabel && onAction && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onAction(r.id)}
                >
                  {actionLabel}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default OperationsList;
