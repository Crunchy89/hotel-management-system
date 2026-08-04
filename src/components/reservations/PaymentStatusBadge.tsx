"use client";

import Badge, { type BadgeColor } from "@/components/ui/badge/Badge";
import type { PaymentStatusView } from "@/lib/paymentStatus";

export function PaymentStatusBadge({
  status,
  size = "sm",
}: {
  status: PaymentStatusView;
  size?: "sm" | "md";
}) {
  const colorMap: Record<PaymentStatusView["tone"], BadgeColor> = {
    success: "success",
    warning: "warning",
    error: "error",
    brand: "primary",
    light: "light",
  };

  return (
    <div className="flex flex-col gap-0.5">
      <Badge size={size} color={colorMap[status.tone]}>
        {status.label}
      </Badge>
      {status.methodLabel && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {status.methodLabel}
        </span>
      )}
    </div>
  );
}
