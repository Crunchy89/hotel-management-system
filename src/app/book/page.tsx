"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Field, inputClass, selectClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { api } from "@/lib/api";
import {
  addDays,
  availableRoomsForDates,
  dayDiff,
  formatCurrency,
  formatDate,
  todayISO,
} from "@/lib/metrics";
import { useHotelData } from "@/lib/useHotelData";

type Step = "search" | "guest" | "done";

export default function BookPage() {
  const { rooms, reservations, room_types, loading, mutate, setError, error } =
    useHotelData();

  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(addDays(todayISO(), 1));
  const [typeSlug, setTypeSlug] = useState("");
  const [roomId, setRoomId] = useState("");
  const [step, setStep] = useState<Step>("search");
  const [reference, setReference] = useState("");
  const [depositPct, setDepositPct] = useState(30);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const nights = Math.max(0, dayDiff(checkIn, checkOut));
  const available = useMemo(
    () =>
      availableRoomsForDates(
        rooms,
        reservations,
        checkIn,
        checkOut,
        typeSlug || undefined,
      ),
    [rooms, reservations, checkIn, checkOut, typeSlug],
  );

  const selected = available.find((r) => r.id === roomId) ?? available[0];
  const stayTotal = selected ? selected.rate * nights : 0;
  const deposit = Math.round(stayTotal * (depositPct / 100) * 100) / 100;

  async function confirmBooking() {
    if (!selected) {
      setError("Select an available room");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }

    let createdRef = "";
    const ok = await mutate(async () => {
      const reservation = await api.createReservation({
        guest: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          id_document: "DIRECT",
        },
        room_id: selected.id,
        check_in: checkIn,
        check_out: checkOut,
        notes: "Booked via direct booking engine",
        adults: 1,
        room_amount: stayTotal,
        hold_rate: false,
        amount_paid: deposit,
        booking_source: "Direct Booking",
      });
      createdRef = reservation.reference || reservation.id.slice(0, 8);
    });

    if (ok) {
      setReference(createdRef);
      setStep("done");
      setError("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-gray-900">
        Loading availability…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              H
            </span>
            <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
              HMS Hotel
            </span>
          </div>
          <Link
            href="/reservations"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Staff login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white/90">
            Book a stay
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Check availability and reserve directly — commission-free.
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        {step === "done" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-semibold uppercase tracking-wide text-success-600">
              Booking confirmed
            </p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white/90">
              Thanks, {firstName}!
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Reference <strong>{reference}</strong>. A confirmation was saved to
              guest messages. Stay: {formatDate(checkIn)} → {formatDate(checkOut)}{" "}
              · {nights} night{nights === 1 ? "" : "s"} · deposit{" "}
              {formatCurrency(deposit)}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setStep("search");
                  setRoomId("");
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                  setPhone("");
                  setReference("");
                }}
              >
                Book another stay
              </Button>
              <Link href="/messages">
                <Button variant="outline">View guest messages</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Dates
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Check-in">
                  <input
                    type="date"
                    className={inputClass}
                    value={checkIn}
                    min={todayISO()}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCheckIn(next);
                      if (checkOut <= next) setCheckOut(addDays(next, 1));
                      setStep("search");
                    }}
                  />
                </Field>
                <Field label="Check-out">
                  <input
                    type="date"
                    className={inputClass}
                    value={checkOut}
                    min={addDays(checkIn, 1)}
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      setStep("search");
                    }}
                  />
                </Field>
                <Field label="Room type">
                  <select
                    className={selectClass}
                    value={typeSlug}
                    onChange={(e) => {
                      setTypeSlug(e.target.value);
                      setRoomId("");
                      setStep("search");
                    }}
                  >
                    <option value="">All types</option>
                    {room_types.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                {nights} night{nights === 1 ? "" : "s"} · {available.length} room
                {available.length === 1 ? "" : "s"} available
              </p>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Available rooms
                </h2>
              </div>
              {available.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-500">
                  No rooms available for these dates. Try different dates or room
                  types.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {available.map((room) => {
                    const total = room.rate * nights;
                    const active = (roomId || selected?.id) === room.id;
                    return (
                      <li key={room.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setRoomId(room.id);
                            setStep("guest");
                          }}
                          className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                            active ? "bg-brand-50/60 dark:bg-brand-500/10" : ""
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white/90">
                              Room {room.number}
                            </p>
                            <p className="text-sm text-gray-500">
                              {room_types.find((t) => t.slug === room.type)?.label ??
                                room.type}{" "}
                              · Floor {room.floor}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold tabular-nums text-gray-900 dark:text-white/90">
                              {formatCurrency(total)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(room.rate)} / night
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {step === "guest" && selected && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Guest details
                </h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  Room {selected.number} · {formatCurrency(stayTotal)} · deposit{" "}
                  {formatCurrency(deposit)} ({depositPct}%)
                </p>
                <div className="mb-4">
                  <Field label="Deposit %">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={depositPct}
                      onChange={(e) => setDepositPct(Number(e.target.value))}
                      className="w-full"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name">
                    <input
                      className={inputClass}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </Field>
                  <Field label="Last name">
                    <input
                      className={inputClass}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      className={inputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={inputClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button onClick={() => void confirmBooking()}>
                    Confirm booking
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
