"use client";

import { FormEvent, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageHeader from "@/components/common/PageHeader";
import { Alert, Field, inputClass, selectClass, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  PageShell,
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
import { useT } from "@/context/LocaleContext";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/metrics";
import type { HotelService, HotelServiceCategory } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const CATEGORIES: HotelServiceCategory[] = [
  "room_service",
  "spa",
  "laundry",
  "transfer",
  "dining",
  "other",
];

const emptyForm = {
  name: "",
  description: "",
  category: "room_service" as HotelServiceCategory,
  price: 0,
  active: true,
};

export default function HotelServicesPage() {
  const t = useT();
  const { hotel_services, loading, error, mutate } = useHotelData();
  const [editing, setEditing] = useState<HotelService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  const services = useMemo(
    () =>
      [...hotel_services].sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
      ),
    [hotel_services],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    openModal();
  }

  function openEdit(service: HotelService) {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      active: service.active,
    });
    openModal();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      active: form.active,
    };
    const ok = await mutate(() =>
      editing
        ? api.updateHotelService({ id: editing.id, ...payload })
        : api.createHotelService(payload),
    );
    setSaving(false);
    if (ok) closeModal();
  }

  async function onToggle(id: string) {
    await mutate(() => api.toggleHotelService(id));
  }

  async function onDelete(id: string) {
    await mutate(() => api.deleteHotelService(id));
  }

  const countKey =
    services.length === 1 ? "services.count" : "services.count_other";

  return (
    <PageShell>
      <PageHeader
        title={t("services.title")}
        description={t("services.description")}
        action={
          <Button size="sm" onClick={openCreate}>
            {t("services.add")}
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <ComponentCard title={t("services.title")} desc={t(countKey, { count: services.length })}>
        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("services.name")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("services.category")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("services.price")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("services.active")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.actions")}
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {services.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading ? t("common.loading") : t("services.empty")}
                  </TableCell>
                </TableRow>
              )}
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className={tableBodyCell}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-gray-800 dark:text-white/90">
                        {service.name}
                      </span>
                      {service.description ? (
                        <span className="line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">
                          {service.description}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    {t(`services.category.${service.category}`)}
                  </TableCell>
                  <TableCell className={`${tableBodyCell} tabular-nums`}>
                    {service.price > 0
                      ? formatCurrency(service.price)
                      : t("services.complimentary")}
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    <span
                      className={
                        service.active
                          ? "text-success-600 dark:text-success-400"
                          : "text-gray-400"
                      }
                    >
                      {service.active
                        ? t("services.activeYes")
                        : t("services.activeNo")}
                    </span>
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => openEdit(service)}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => void onToggle(service.id)}
                      >
                        {service.active
                          ? t("services.hide")
                          : t("services.show")}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-error-600 hover:text-error-700 dark:text-error-400"
                        onClick={() => void onDelete(service.id)}
                      >
                        {t("common.delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-6 lg:p-8"
      >
        <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? t("services.editTitle") : t("services.addTitle")}
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {t("services.description")}
        </p>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("services.name")} className="sm:col-span-2">
              <input
                className={inputClass}
                required
                placeholder={t("services.namePlaceholder")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field
              label={t("services.descriptionLabel")}
              className="sm:col-span-2"
            >
              <textarea
                className={textareaClass}
                rows={3}
                placeholder={t("services.descriptionPlaceholder")}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Field>
            <Field label={t("services.category")}>
              <select
                className={selectClass}
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as HotelServiceCategory,
                  })
                }
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`services.category.${cat}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("services.price")}>
              <input
                className={inputClass}
                type="number"
                min={0}
                step={1000}
                required
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
            </Field>
            <label className="flex items-center gap-2 sm:col-span-2 text-theme-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
              />
              {t("services.active")}
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3 sm:justify-end">
            <Button size="sm" variant="outline" type="button" onClick={closeModal}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("services.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
