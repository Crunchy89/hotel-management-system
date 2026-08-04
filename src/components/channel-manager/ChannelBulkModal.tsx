"use client";

import React, { useMemo, useState } from "react";
import { Field, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { WEEKDAYS } from "@/components/rates/ratesUtils";
import { addDays } from "@/lib/metrics";
import type { BulkChannelRateUpdateInput, RatePlan } from "@/lib/types";

const selectClass = inputClass;

interface ChannelBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  plans: RatePlan[];
  selectedPlanIds: string[];
  defaultDate: string;
  onApply: (input: BulkChannelRateUpdateInput) => Promise<boolean>;
}

const ChannelBulkModal: React.FC<ChannelBulkModalProps> = ({
  isOpen,
  onClose,
  channelId,
  channelName,
  plans,
  selectedPlanIds,
  defaultDate,
  onApply,
}) => {
  const [field, setField] = useState<"rate" | "availability">("rate");
  const [value, setValue] = useState(0);
  const [dateFrom, setDateFrom] = useState(defaultDate);
  const [dateTo, setDateTo] = useState(addDays(defaultDate, 7));
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPlanIds(selectedPlanIds.length > 0 ? selectedPlanIds : plans.map((p) => p.id));
      setDateFrom(defaultDate);
      setDateTo(addDays(defaultDate, 7));
      setValue(0);
    }
  }, [isOpen, selectedPlanIds, plans, defaultDate]);

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.room_type_slug.toLowerCase().includes(q),
    );
  }, [plans, search]);

  function togglePlan(id: string) {
    setPlanIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onApply({
      channel_id: channelId,
      rate_plan_ids: planIds,
      field,
      value,
      date_from: dateFrom,
      date_to: dateTo,
      weekdays,
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[90vh] max-w-lg overflow-y-auto p-6 lg:p-8">
      <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
        Bulk update — {channelName}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Push new rates or availability to this channel. Changes stay pending until you sync.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Set">
            <select
              className={selectClass}
              value={field}
              onChange={(e) => setField(e.target.value as "rate" | "availability")}
            >
              <option value="rate">Rate</option>
              <option value="availability">Availability</option>
            </select>
          </Field>
          <Field label="To">
            <input
              className={inputClass}
              type="number"
              min={0}
              step={field === "rate" ? "0.01" : "1"}
              required
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="From">
            <input
              className={inputClass}
              type="date"
              required
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              className={inputClass}
              type="date"
              required
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
            Selected days
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                className={`rounded-lg px-3 py-1.5 text-theme-xs font-semibold transition ${
                  weekdays.includes(day.value)
                    ? "bg-brand-500 text-white"
                    : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
              Rate plans on {channelName}
            </p>
            <div className="flex gap-2 text-theme-xs">
              <button
                type="button"
                className="text-brand-600 hover:underline dark:text-brand-400"
                onClick={() => setPlanIds(plans.map((p) => p.id))}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-gray-500 hover:underline"
                onClick={() => setPlanIds([])}
              >
                Clear all
              </button>
            </div>
          </div>
          <input
            className={`${inputClass} mb-2`}
            placeholder="Search rate plans…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
            {filteredPlans.map((plan) => (
              <label
                key={plan.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <input
                  type="checkbox"
                  checked={planIds.includes(plan.id)}
                  onChange={() => togglePlan(plan.id)}
                  className="rounded border-gray-300 text-brand-500"
                />
                <span className="text-theme-xs text-gray-700 dark:text-gray-300">
                  {plan.label}{" "}
                  <span className="text-gray-400">· {plan.room_type_slug}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={saving || planIds.length === 0}>
            {saving ? "Applying…" : "Apply changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChannelBulkModal;
