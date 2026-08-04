import { folioBalance } from "@/lib/folio";
import type {
  FolioLine,
  FolioPaymentMethod,
  PaymentCollect,
  Reservation,
  Room,
} from "@/lib/types";

export type PaymentStatusKey =
  | "paid"
  | "partial"
  | "unpaid"
  | "prepaid_channel"
  | "pay_at_hotel"
  | "cancelled";

export type PaymentStatusView = {
  key: PaymentStatusKey;
  label: string;
  methodLabel: string | null;
  tone: "success" | "warning" | "error" | "brand" | "light";
};

export const PAYMENT_COLLECT_OPTIONS: Array<{
  value: PaymentCollect;
  label: string;
  hint: string;
}> = [
  {
    value: "property",
    label: "Pay at hotel",
    hint: "Guest pays at check-in (card, cash, or transfer)",
  },
  {
    value: "channel",
    label: "Prepaid via channel",
    hint: "Guest already paid the OTA — e.g. Booking.com, Agoda",
  },
];

export const OTA_SOURCES = new Set(["Booking.com", "Expedia", "Agoda"]);

const METHOD_LABELS: Record<FolioPaymentMethod, string> = {
  card: "Card",
  cash: "Cash",
  transfer: "Bank transfer",
  channel: "Channel (OTA)",
  other: "Other",
};

export function paymentMethodLabel(
  method?: FolioPaymentMethod,
): string | null {
  if (!method) return null;
  return METHOD_LABELS[method] ?? method;
}

function primaryPaymentMethod(lines: FolioLine[]): FolioPaymentMethod | null {
  const payments = lines.filter((l) => l.type === "payment");
  if (payments.length === 0) return null;
  return payments[payments.length - 1]!.method ?? null;
}

export function defaultPaymentCollect(bookingSource?: string): PaymentCollect {
  return OTA_SOURCES.has(bookingSource ?? "") ? "property" : "property";
}

export function resolvePaymentStatus(
  reservation: Reservation,
  room: Room | undefined,
  folioLines: FolioLine[],
): PaymentStatusView {
  if (reservation.status === "cancelled") {
    return {
      key: "cancelled",
      label: "Cancelled",
      methodLabel: null,
      tone: "light",
    };
  }

  const lines = folioLines.filter((l) => l.reservation_id === reservation.id);
  const balance = folioBalance(reservation, room, lines);
  const collect = reservation.payment_collect ?? "property";
  const source = reservation.booking_source ?? "Direct";
  const method = primaryPaymentMethod(lines);

  if (balance.due <= 0.009 && balance.paid > 0) {
    return {
      key: "paid",
      label: "Paid in full",
      methodLabel: paymentMethodLabel(method ?? undefined),
      tone: "success",
    };
  }

  if (balance.paid > 0 && balance.due > 0) {
    return {
      key: "partial",
      label: "Partially paid",
      methodLabel: paymentMethodLabel(method ?? undefined),
      tone: "warning",
    };
  }

  if (collect === "channel") {
    return {
      key: "prepaid_channel",
      label: `Prepaid via ${source}`,
      methodLabel: "Channel (OTA)",
      tone: "brand",
    };
  }

  if (collect === "property" && balance.paid <= 0) {
    return {
      key: "pay_at_hotel",
      label: "Pay at hotel",
      methodLabel: null,
      tone: "warning",
    };
  }

  return {
    key: "unpaid",
    label: "Unpaid",
    methodLabel: null,
    tone: "error",
  };
}

export function paymentStatusSummary(
  reservation: Reservation,
  room: Room | undefined,
  folioLines: FolioLine[],
): string {
  const status = resolvePaymentStatus(reservation, room, folioLines);
  if (status.methodLabel) {
    return `${status.label} · ${status.methodLabel}`;
  }
  return status.label;
}
