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
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClasses[tone]}`}
    >
      {icon ?? <span className="text-lg font-semibold">{label.charAt(0)}</span>}
    </div>

    <div className="mt-5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <h4 className="mt-2 text-title-sm font-bold text-gray-800 tabular-nums dark:text-white/90">
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
