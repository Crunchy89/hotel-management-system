import React from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "brand" | "success" | "warning" | "error" | "info";
  icon?: React.ReactNode;
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}) => (
  <div className="group hms-surface p-5 transition hover:shadow-theme-sm md:p-6">
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105 ${toneClasses[tone]}`}
    >
      {icon ?? <span className="text-base font-semibold">{label.charAt(0)}</span>}
    </div>

    <div className="mt-4">
      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <h4 className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white/90">
        {value}
      </h4>
      {hint && (
        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  </div>
);

export default MetricCard;
