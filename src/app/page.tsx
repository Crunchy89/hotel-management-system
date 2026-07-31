"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DashboardStats, Reservation } from "@/lib/types";
import { api, formatError } from "@/lib/api";
import { ReservationStatusBadge } from "@/components/StatusBadge";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [today, setToday] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, reservations] = await Promise.all([
        api.getDashboardStats(),
        api.listReservations(),
      ]);
      setStats(s);
      const d = new Date().toISOString().slice(0, 10);
      setToday(
        reservations.filter(
          (r) =>
            (r.check_in === d || r.check_out === d) &&
            r.status !== "cancelled" &&
            r.status !== "checked_out",
        ),
      );
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = [
    { label: "Available rooms", value: stats?.available_rooms ?? 0 },
    { label: "Occupied rooms", value: stats?.occupied_rooms ?? 0 },
    { label: "Arrivals today", value: stats?.arrivals_today ?? 0 },
    { label: "Departures today", value: stats?.departures_today ?? 0 },
    { label: "Active bookings", value: stats?.booked_active ?? 0 },
    { label: "Guests on file", value: stats?.total_guests ?? 0 },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Front-desk overview for today&apos;s operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/reservations"
            className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-[#0c5c48]"
          >
            New reservation
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-line bg-surface px-4 py-4"
          >
            <div className="text-xs font-semibold tracking-wide text-muted uppercase">
              {c.label}
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {loading ? "—" : c.value}
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Today&apos;s movements</h2>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-bg/80 text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Check-in</th>
                <th className="px-4 py-3 font-semibold">Check-out</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {today.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    {loading ? "Loading…" : "No arrivals or departures scheduled for today."}
                  </td>
                </tr>
              )}
              {today.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                  <td className="px-4 py-3">{r.room_number}</td>
                  <td className="px-4 py-3 tabular-nums">{r.check_in}</td>
                  <td className="px-4 py-3 tabular-nums">{r.check_out}</td>
                  <td className="px-4 py-3">
                    <ReservationStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
