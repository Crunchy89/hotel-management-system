"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  filterYieldRules,
  formatRuleDates,
  RULE_TYPE_OPTIONS,
  roomTypeLabel,
  ruleTypeLabel,
  ruleValueLabel,
  summarizeYieldRules,
} from "@/components/yield/yieldRulesUtils";
import PageHeader from "@/components/common/PageHeader";
import { Alert, Field, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  FilterToolbar,
  PageShell,
  SidePanel,
  SidePanelItem,
  SidePanelLinkItem,
  StatGrid,
  StatTile,
  SurfaceCard,
  TwoColumnLayout,
  tableBodyCell,
  tableHeaderCell,
} from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { todayISO } from "@/lib/metrics";
import type {
  CreateYieldRuleInput,
  YieldRule,
  YieldRuleType,
} from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const emptyForm: CreateYieldRuleInput = {
  name: "",
  rule_type: "min_stay",
  room_type_slug: "all",
  date_from: todayISO(),
  date_to: todayISO(),
  value: 1,
  status: "active",
};

function StatusToggle({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition ${
        active ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"
      }`}
      aria-label={active ? "Deactivate rule" : "Activate rule"}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          active ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function YieldRulesPage() {
  const { yield_rules, room_types, error, mutate } = useHotelData();

  const [typeFilter, setTypeFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<YieldRule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const modal = useModal();

  const filtered = useMemo(
    () =>
      filterYieldRules(
        yield_rules,
        typeFilter,
        roomTypeFilter,
        statusFilter,
        query,
      ),
    [yield_rules, typeFilter, roomTypeFilter, statusFilter, query],
  );

  const summary = useMemo(
    () => summarizeYieldRules(yield_rules),
    [yield_rules],
  );

  useEffect(() => {
    if (modal.isOpen) {
      setForm(
        editing
          ? {
              name: editing.name,
              rule_type: editing.rule_type,
              room_type_slug: editing.room_type_slug,
              date_from: editing.date_from,
              date_to: editing.date_to,
              value: editing.value,
              status: editing.status,
              priority: editing.priority,
            }
          : { ...emptyForm, date_to: todayISO() },
      );
    }
  }, [modal.isOpen, editing]);

  function openCreate() {
    setEditing(null);
    modal.openModal();
  }

  function openEdit(rule: YieldRule) {
    setEditing(rule);
    modal.openModal();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await mutate(() =>
      editing
        ? api.updateYieldRule({ id: editing.id, ...form })
        : api.createYieldRule(form),
    );
    setSaving(false);
    if (ok) modal.closeModal();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this yield rule?")) return;
    await mutate(() => api.deleteYieldRule(id));
  }

  return (
    <PageShell>
      <PageHeader
        title="Yield Rules"
        description="Automate restrictions and pricing by occupancy, date, and room type."
        action={
          <Button size="sm" onClick={openCreate}>
            Add rule
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <TwoColumnLayout
        sidebar={
          <>
            <SidePanel title="Rule types">
              <ul className="space-y-1">
                <li>
                  <SidePanelItem
                    active={typeFilter === "all"}
                    onClick={() => setTypeFilter("all")}
                    label="All rules"
                  />
                </li>
                {RULE_TYPE_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <SidePanelLinkItem
                      active={typeFilter === opt.value}
                      onClick={() => setTypeFilter(opt.value)}
                      label={opt.label}
                      compact
                    />
                  </li>
                ))}
              </ul>
            </SidePanel>

            <StatGrid cols={2}>
              <StatTile label="Total" value={summary.total} />
              <StatTile label="Active" value={summary.active} tone="success" />
              <StatTile label="Restrictions" value={summary.restrictions} />
              <StatTile label="Pricing" value={summary.pricing} tone="brand" />
            </StatGrid>
          </>
        }
      >
          <FilterToolbar className="mb-4">
            <div className="relative min-w-[200px] flex-1">
              <input
                className={`${inputClass} pl-10`}
                placeholder="Search rules…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
            <select
              className={`${inputClass} w-auto min-w-[140px]`}
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
            >
              <option value="all">All room types</option>
              {room_types.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              className={`${inputClass} w-auto min-w-[120px]`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FilterToolbar>

          <SurfaceCard className="overflow-hidden">
            <div className="custom-scrollbar overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-200 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className={tableHeaderCell}>
                      Active
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Rule
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Type
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Room type
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Dates
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Value
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="px-4 py-12 text-center text-theme-sm text-gray-500"
                      >
                        No yield rules match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className={tableBodyCell}>
                        <StatusToggle
                          active={rule.status === "active"}
                          onClick={() =>
                            void mutate(() => api.toggleYieldRule(rule.id))
                          }
                        />
                      </TableCell>
                      <TableCell
                        className={`${tableBodyCell} font-medium text-gray-900 dark:text-white/90`}
                      >
                        {rule.name}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        {ruleTypeLabel(rule.rule_type)}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        {roomTypeLabel(rule.room_type_slug, room_types)}
                      </TableCell>
                      <TableCell className={`${tableBodyCell} tabular-nums`}>
                        {formatRuleDates(rule.date_from, rule.date_to)}
                      </TableCell>
                      <TableCell className={`${tableBodyCell} font-semibold`}>
                        {ruleValueLabel(rule)}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openEdit(rule)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => void onDelete(rule.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SurfaceCard>
      </TwoColumnLayout>

      <Modal isOpen={modal.isOpen} onClose={modal.closeModal} className="max-w-lg p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit yield rule" : "New yield rule"}
        </h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Rules apply to bookings within the selected date range.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Rule name">
            <input
              className={inputClass}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rule type">
              <select
                className={inputClass}
                value={form.rule_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rule_type: e.target.value as YieldRuleType,
                  })
                }
              >
                {RULE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room type">
              <select
                className={inputClass}
                value={form.room_type_slug}
                onChange={(e) =>
                  setForm({ ...form, room_type_slug: e.target.value })
                }
              >
                <option value="all">All room types</option>
                {room_types.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From">
              <input
                className={inputClass}
                type="date"
                required
                value={form.date_from}
                onChange={(e) => setForm({ ...form, date_from: e.target.value })}
              />
            </Field>
            <Field label="To">
              <input
                className={inputClass}
                type="date"
                required
                value={form.date_to}
                onChange={(e) => setForm({ ...form, date_to: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label={
              form.rule_type === "rate_adjustment"
                ? "Adjustment (%)"
                : form.rule_type === "min_stay" || form.rule_type === "max_stay"
                  ? "Nights"
                  : "Value"
            }
          >
            <input
              className={inputClass}
              type="number"
              required
              min={0}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={modal.closeModal}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create rule"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
