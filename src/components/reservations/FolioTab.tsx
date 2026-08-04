"use client";

import React, { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Field, inputClass, selectClass } from "@/components/form";
import { api } from "@/lib/api";
import { folioBalance } from "@/lib/folio";
import { formatCurrency, formatDate } from "@/lib/metrics";
import type {
  FolioLineType,
  FolioPaymentMethod,
  Reservation,
  Room,
} from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const METHOD_OPTIONS: FolioPaymentMethod[] = [
  "card",
  "cash",
  "transfer",
  "channel",
  "other",
];

export default function FolioTab({
  reservation,
  room,
}: {
  reservation: Reservation;
  room?: Room;
}) {
  const { folio_lines, mutate } = useHotelData();
  const lines = useMemo(
    () =>
      folio_lines
        .filter((l) => l.reservation_id === reservation.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [folio_lines, reservation.id],
  );
  const balance = folioBalance(reservation, room, lines);

  const [type, setType] = useState<FolioLineType>("payment");
  const [description, setDescription] = useState("Payment received");
  const [amount, setAmount] = useState(
    balance.due > 0 ? String(balance.due) : "",
  );
  const [method, setMethod] = useState<FolioPaymentMethod>("card");
  const [busy, setBusy] = useState(false);

  async function addLine() {
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) return;
    setBusy(true);
    const ok = await mutate(() =>
      api.createFolioLine({
        reservation_id: reservation.id,
        type,
        description: description.trim(),
        amount: value,
        method: type === "charge" ? undefined : method,
      }),
    );
    setBusy(false);
    if (ok) {
      setAmount("");
      if (type === "payment") setDescription("Payment received");
      if (type === "charge") setDescription("Extra charge");
      if (type === "refund") setDescription("Refund");
    }
  }

  async function removeLine(id: string) {
    await mutate(() => api.deleteFolioLine(id));
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BalanceStat label="Stay" value={balance.stay} />
        <BalanceStat label="Extra charges" value={balance.charges} />
        <BalanceStat label="Paid" value={balance.paid} />
        <BalanceStat label="Amount due" value={balance.due} emphasize />
      </div>

      <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h6 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Post to folio
        </h6>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <select
              className={selectClass}
              value={type}
              onChange={(e) => {
                const next = e.target.value as FolioLineType;
                setType(next);
                if (next === "payment") setDescription("Payment received");
                if (next === "charge") setDescription("Extra charge");
                if (next === "refund") setDescription("Refund");
              }}
            >
              <option value="payment">Payment</option>
              <option value="charge">Charge</option>
              <option value="refund">Refund</option>
            </select>
          </Field>
          <Field label="Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <input
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {type !== "charge" && (
            <Field label="Method">
              <select
                className={selectClass}
                value={method}
                onChange={(e) =>
                  setMethod(e.target.value as FolioPaymentMethod)
                }
              >
                {METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" disabled={busy} onClick={() => void addLine()}>
            Add to folio
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No folio lines yet. Post a payment or charge above.
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-2.5 text-gray-500">
                    {formatDate(line.created_at.slice(0, 10), {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2.5 capitalize">{line.type}</td>
                  <td className="px-4 py-2.5">
                    {line.description}
                    {line.method ? (
                      <span className="ml-1 text-xs text-gray-400">
                        ({line.method})
                      </span>
                    ) : null}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                      line.type === "payment"
                        ? "text-success-600"
                        : line.type === "refund"
                          ? "text-error-600"
                          : ""
                    }`}
                  >
                    {line.type === "payment" ? "−" : line.type === "refund" ? "+" : ""}
                    {formatCurrency(line.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      className="text-xs font-medium text-error-600 hover:underline"
                      onClick={() => void removeLine(line.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function BalanceStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-semibold tabular-nums ${
          emphasize ? "text-error-600" : "text-gray-800 dark:text-white/90"
        }`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
