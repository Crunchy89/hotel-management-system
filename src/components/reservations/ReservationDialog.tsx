"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Field, inputClass, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { dayDiff, formatDate } from "@/lib/metrics";
import type { Guest, Room, RoomTypeRecord } from "@/lib/types";
import {
  ARRIVAL_TIMES,
  BOOKING_SOURCES,
  ID_DOCUMENT_TYPES,
  PAYMENT_COLLECT_OPTIONS,
  type ReservationFormValues,
  type ReservationTab,
  bookingTotals,
  defaultReservationForm,
  formatCurrency,
  formatStayLength,
  guestToFormFields,
  roomsForType,
} from "./reservationFormUtils";

export type { ReservationFormValues };

const TABS: { id: ReservationTab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "guest", label: "Guest" },
  { id: "notes", label: "Notes" },
];

const selectClass = inputClass;

interface ReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  rooms: Room[];
  roomTypes: RoomTypeRecord[];
  initial: ReservationFormValues;
  onCreate: (values: ReservationFormValues) => Promise<boolean>;
}

function BookingSummary({
  form,
  room,
  nights,
}: {
  form: ReservationFormValues;
  room: Room | undefined;
  nights: number;
}) {
  const totals = bookingTotals(form, room, nights);

  return (
    <aside className="w-full shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:w-72">
      <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
        Booking summary
      </h5>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500 dark:text-gray-400">Room total</dt>
          <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">
            {formatCurrency(totals.roomTotal)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500 dark:text-gray-400">Extra persons</dt>
          <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">
            {formatCurrency(form.extra_person || 0)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500 dark:text-gray-400">Discount</dt>
          <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">
            −{formatCurrency(form.discount || 0)}
          </dd>
        </div>
        <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-gray-700 dark:text-gray-300">Total</dt>
            <dd className="font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatCurrency(totals.grandTotal)}
            </dd>
          </div>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500 dark:text-gray-400">Received</dt>
          <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">
            {formatCurrency(form.amount_paid || 0)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="font-semibold text-error-600 dark:text-error-400">Amount due</dt>
          <dd className="font-bold tabular-nums text-error-600 dark:text-error-400">
            {formatCurrency(totals.amountDue)}
          </dd>
        </div>
      </dl>

      <label className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <input
          type="checkbox"
          checked
          readOnly
          className="rounded border-gray-300 text-brand-500"
        />
        Tax included ({formatCurrency(totals.tax)})
      </label>
    </aside>
  );
}

const ReservationDialog: React.FC<ReservationDialogProps> = ({
  isOpen,
  onClose,
  guests,
  rooms,
  roomTypes,
  initial,
  onCreate,
}) => {
  const [form, setForm] = useState(initial);
  const [tab, setTab] = useState<ReservationTab>("details");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let next = defaultReservationForm(initial);
    if (initial.guest_id) {
      const guest = guests.find((g) => g.id === initial.guest_id);
      if (guest) {
        next = {
          ...next,
          ...guestToFormFields(guest),
          guest_mode: "existing",
        };
      }
    }
    if (initial.room_id) {
      const room = rooms.find((r) => r.id === initial.room_id);
      if (room) next = { ...next, room_type: room.type };
    }
    setForm(next);
    setTab("details");
  }, [isOpen, initial, guests, rooms]);

  const isUnallocated = Boolean(form.room_type && !form.room_id);
  const nights = Math.max(0, dayDiff(form.check_in, form.check_out));
  const selectedRoom = rooms.find((r) => r.id === form.room_id);
  const typeSlug = form.room_type || selectedRoom?.type || "";
  const roomsInType = useMemo(
    () => roomsForType(rooms, typeSlug),
    [rooms, typeSlug],
  );
  const typeLabel =
    roomTypes.find((t) => t.slug === typeSlug)?.label ??
    typeSlug.replace(/-/g, " ");

  useEffect(() => {
    if (!form.hold_rate || nights <= 0) return;
    const nightly = selectedRoom?.rate ?? 0;
    const nextAmount = nightly * nights;
    setForm((prev) =>
      prev.room_amount === nextAmount
        ? prev
        : { ...prev, room_amount: nextAmount },
    );
  }, [form.hold_rate, form.room_id, form.room_type, nights, selectedRoom?.rate]);

  function patch(values: Partial<ReservationFormValues>) {
    setForm((prev) => ({ ...prev, ...values }));
  }

  function selectGuest(guestId: string) {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) {
      patch({ guest_id: guestId });
      return;
    }
    patch({ guest_mode: "existing", ...guestToFormFields(guest) });
  }

  function selectRoomType(slug: string) {
    const inType = roomsForType(rooms, slug);
    patch({
      room_type: slug,
      room_id: inType[0]?.id ?? "",
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onCreate(form);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[95vh] max-w-[1120px] overflow-hidden p-0"
    >
      <form onSubmit={onSubmit} className="flex max-h-[95vh] flex-col">
        {/* Tab bar */}
        <div className="flex shrink-0 gap-1 overflow-x-auto bg-brand-500 px-4 py-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                tab === item.id
                  ? "bg-white text-brand-600"
                  : "text-white/90 hover:bg-white/15"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row lg:p-8">
          <div className="min-w-0 flex-1 space-y-6">
            {tab === "details" && (
              <>
                {/* Dates */}
                <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Check-in">
                      <input
                        className={inputClass}
                        type="date"
                        required
                        value={form.check_in}
                        onChange={(e) => patch({ check_in: e.target.value })}
                      />
                    </Field>
                    <Field label="Check-out">
                      <input
                        className={inputClass}
                        type="date"
                        required
                        value={form.check_out}
                        onChange={(e) => patch({ check_out: e.target.value })}
                      />
                    </Field>
                    <div className="flex items-end sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={form.hold_rate}
                          onChange={(e) =>
                            patch({ hold_rate: e.target.checked })
                          }
                          className="rounded border-gray-300 text-brand-500"
                        />
                        Hold rate for selected dates
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Length of stay:{" "}
                      <strong className="text-gray-800 dark:text-white/90">
                        {formatStayLength(nights)}
                      </strong>
                    </span>
                    <span>
                      Status:{" "}
                      <strong className="text-brand-600 dark:text-brand-400">
                        Confirmed
                      </strong>
                    </span>
                  </div>
                </section>

                {/* Room */}
                <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Room details
                  </h5>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Room type">
                      {isUnallocated ? (
                        <input
                          className={`${inputClass} capitalize`}
                          readOnly
                          value={typeLabel}
                        />
                      ) : (
                        <select
                          className={selectClass}
                          value={typeSlug}
                          onChange={(e) => selectRoomType(e.target.value)}
                        >
                          {roomTypes.map((type) => (
                            <option key={type.id} value={type.slug}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>

                    <Field label="Room rate">
                      <input
                        className={inputClass}
                        readOnly
                        value={
                          selectedRoom
                            ? `$${selectedRoom.rate}/night`
                            : isUnallocated
                              ? "Unallocated"
                              : "—"
                        }
                      />
                    </Field>

                    <Field label="Room number">
                      {isUnallocated ? (
                        <input
                          className={inputClass}
                          readOnly
                          value="Unallocated"
                        />
                      ) : (
                        <select
                          className={selectClass}
                          required
                          value={form.room_id}
                          onChange={(e) => {
                            const room = rooms.find((r) => r.id === e.target.value);
                            patch({
                              room_id: e.target.value,
                              room_type: room?.type ?? form.room_type,
                            });
                          }}
                        >
                          <option value="" disabled>
                            Select room
                          </option>
                          {roomsInType.map((r) => (
                            <option key={r.id} value={r.id}>
                              Room {r.number}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>

                    <Field label="Adults">
                      <input
                        className={inputClass}
                        type="number"
                        min={1}
                        value={form.adults}
                        onChange={(e) =>
                          patch({ adults: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Children">
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        value={form.children}
                        onChange={(e) =>
                          patch({ children: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Infants">
                      <input
                        className={inputClass}
                        type="number"
                        min={0}
                        value={form.infants}
                        onChange={(e) =>
                          patch({ infants: Number(e.target.value) })
                        }
                      />
                    </Field>

                    <Field label="Room charge">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          $
                        </span>
                        <input
                          className={`${inputClass} pl-7`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.room_amount}
                          onChange={(e) =>
                            patch({
                              room_amount: Number(e.target.value),
                              hold_rate: false,
                            })
                          }
                        />
                      </div>
                    </Field>
                    <Field label="Extra person">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          $
                        </span>
                        <input
                          className={`${inputClass} pl-7`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.extra_person}
                          onChange={(e) =>
                            patch({ extra_person: Number(e.target.value) })
                          }
                        />
                      </div>
                    </Field>
                    <Field label="Discount">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          $
                        </span>
                        <input
                          className={`${inputClass} pl-7`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.discount}
                          onChange={(e) =>
                            patch({ discount: Number(e.target.value) })
                          }
                        />
                      </div>
                    </Field>
                  </div>
                </section>

                {/* Quick guest on details tab */}
                <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Main contact
                  </h5>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => patch({ guest_mode: "existing" })}
                      className={`rounded-lg px-3 py-1.5 text-theme-xs font-medium transition ${
                        form.guest_mode === "existing"
                          ? "bg-brand-500 text-white"
                          : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      Existing guest
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patch({ guest_mode: "new", guest_id: "" })
                      }
                      className={`rounded-lg px-3 py-1.5 text-theme-xs font-medium transition ${
                        form.guest_mode === "new"
                          ? "bg-brand-500 text-white"
                          : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      New guest
                    </button>
                  </div>

                  {form.guest_mode === "existing" ? (
                    <Field label="Guest">
                      <select
                        className={selectClass}
                        required
                        value={form.guest_id}
                        onChange={(e) => selectGuest(e.target.value)}
                      >
                        <option value="" disabled>
                          Select guest
                        </option>
                        {guests.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.first_name} {g.last_name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="First name">
                        <input
                          className={inputClass}
                          required
                          value={form.first_name}
                          onChange={(e) =>
                            patch({ first_name: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Last name">
                        <input
                          className={inputClass}
                          required
                          value={form.last_name}
                          onChange={(e) =>
                            patch({ last_name: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Booking source">
                      <select
                        className={selectClass}
                        value={form.booking_source}
                        onChange={(e) =>
                          patch({ booking_source: e.target.value })
                        }
                      >
                        {BOOKING_SOURCES.map((source) => (
                          <option key={source} value={source}>
                            {source}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Payment collection">
                      <select
                        className={selectClass}
                        value={form.payment_collect}
                        onChange={(e) =>
                          patch({
                            payment_collect: e.target.value as
                              | "property"
                              | "channel",
                          })
                        }
                      >
                        {PAYMENT_COLLECT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                        {
                          PAYMENT_COLLECT_OPTIONS.find(
                            (o) => o.value === form.payment_collect,
                          )?.hint
                        }
                      </p>
                    </Field>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Arrival time">
                      <select
                        className={selectClass}
                        value={form.arrival_time}
                        onChange={(e) =>
                          patch({ arrival_time: e.target.value })
                        }
                      >
                        <option value="">Select arrival time</option>
                        {ARRIVAL_TIMES.filter(Boolean).map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </section>
              </>
            )}

            {tab === "guest" && (
              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Guest information
                </h5>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="First name">
                    <input
                      className={inputClass}
                      required={form.guest_mode === "new"}
                      value={form.first_name}
                      onChange={(e) => patch({ first_name: e.target.value })}
                    />
                  </Field>
                  <Field label="Last name">
                    <input
                      className={inputClass}
                      required={form.guest_mode === "new"}
                      value={form.last_name}
                      onChange={(e) => patch({ last_name: e.target.value })}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={inputClass}
                      type="email"
                      value={form.email}
                      onChange={(e) => patch({ email: e.target.value })}
                    />
                  </Field>
                  <Field label="Mobile">
                    <input
                      className={inputClass}
                      value={form.phone}
                      onChange={(e) => patch({ phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Organization" className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={form.organization}
                      onChange={(e) =>
                        patch({ organization: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Address line 1" className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={form.address_line1}
                      onChange={(e) =>
                        patch({ address_line1: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Address line 2" className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={form.address_line2}
                      onChange={(e) =>
                        patch({ address_line2: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className={inputClass}
                      value={form.city}
                      onChange={(e) => patch({ city: e.target.value })}
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      className={inputClass}
                      value={form.country}
                      onChange={(e) => patch({ country: e.target.value })}
                    />
                  </Field>
                  <Field label="Postal code">
                    <input
                      className={inputClass}
                      value={form.postal_code}
                      onChange={(e) =>
                        patch({ postal_code: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Reference">
                    <input
                      className={inputClass}
                      value={form.reference}
                      onChange={(e) => patch({ reference: e.target.value })}
                    />
                  </Field>
                  <Field label="ID document type">
                    <select
                      className={selectClass}
                      value={form.id_document_type}
                      onChange={(e) =>
                        patch({ id_document_type: e.target.value })
                      }
                    >
                      <option value="">Select type</option>
                      {ID_DOCUMENT_TYPES.filter(Boolean).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ID number">
                    <input
                      className={inputClass}
                      value={form.id_document}
                      onChange={(e) =>
                        patch({ id_document: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </section>
            )}

            {tab === "notes" && (
              <section className="space-y-4">
                <Field label="Internal notes">
                  <textarea
                    className={textareaClass}
                    rows={4}
                    placeholder="Staff notes, housekeeping requests…"
                    value={form.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                  />
                </Field>
                <Field label="Guest comments">
                  <textarea
                    className={textareaClass}
                    rows={4}
                    placeholder="Guest requests and preferences…"
                    value={form.guest_comments}
                    onChange={(e) =>
                      patch({ guest_comments: e.target.value })
                    }
                  />
                </Field>
                <Field label="Amount received">
                  <div className="relative max-w-xs">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      $
                    </span>
                    <input
                      className={`${inputClass} pl-7`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.amount_paid}
                      onChange={(e) =>
                        patch({ amount_paid: Number(e.target.value) })
                      }
                    />
                  </div>
                </Field>
              </section>
            )}
          </div>

          <BookingSummary form={form} room={selectedRoom} nights={nights} />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {form.check_in && form.check_out
              ? `${formatDate(form.check_in)} → ${formatDate(form.check_out)} · ${formatStayLength(nights)}`
              : "Select dates to continue"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" type="button" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Confirm booking"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ReservationDialog;
export { defaultReservationForm };
