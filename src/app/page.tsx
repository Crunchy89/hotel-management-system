"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageHeader from "@/components/common/PageHeader";
import ForecastChart from "@/components/dashboard/ForecastChart";
import MetricCard from "@/components/dashboard/MetricCard";
import OperationsList from "@/components/dashboard/OperationsList";
import RoomStatusChart from "@/components/dashboard/RoomStatusChart";
import ReservationDetailDialog, {
  type ReservationAction,
} from "@/components/reservations/ReservationDetailDialog";
import { Alert } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import {
  coversDate,
  dailyMetrics,
  dateRange,
  formatCurrency,
  isActive,
  summarize,
  todayISO,
} from "@/lib/metrics";
import type { Reservation } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

export default function DashboardPage() {
  const { rooms, reservations, guests, room_types, error, reload, mutate } =
    useHotelData();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const detailModal = useModal();

  const today = todayISO();

  const { arrivals, departures, inHouse } = useMemo(() => {
    const active = reservations.filter(isActive);
    return {
      arrivals: active.filter(
        (r) => r.check_in === today && r.status === "booked",
      ),
      departures: active.filter(
        (r) => r.check_out === today && r.status === "checked_in",
      ),
      inHouse: active.filter(
        (r) => r.status === "checked_in" && coversDate(r, today),
      ),
    };
  }, [reservations, today]);

  const forecast = useMemo(
    () => dailyMetrics(dateRange(today, 14), reservations, rooms),
    [reservations, rooms, today],
  );

  const weekSummary = useMemo(
    () => summarize(forecast.slice(0, 7), rooms.length),
    [forecast, rooms.length],
  );

  const roomCounts = useMemo(() => {
    const count = (status: string) =>
      rooms.filter((r) => r.status === status).length;
    return {
      available: count("available"),
      occupied: count("occupied"),
      cleaning: count("cleaning"),
      maintenance: count("maintenance"),
    };
  }, [rooms]);

  const todayMetrics = forecast[0];
  const occupancyToday = todayMetrics
    ? Math.round(todayMetrics.occupancyRate * 100)
    : 0;

  function openReservation(reservation: Reservation) {
    setSelected(reservation);
    detailModal.openModal();
  }

  const onAction = (action: ReservationAction, id: string) =>
    mutate(() => {
      if (action === "checkin") return api.checkIn(id);
      if (action === "checkout") return api.checkOut(id);
      return api.cancelReservation(id);
    });

  return (
    <div>
      <PageHeader
        title="Daily operations"
        description="Everything the front desk needs to start the day."
        action={
          <>
            <Link href="/calendar">
              <Button size="sm">Open calendar</Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => void reload()}>
              Refresh
            </Button>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <MetricCard
          label="Occupancy today"
          value={`${occupancyToday}%`}
          hint={`${todayMetrics?.occupied ?? 0} of ${rooms.length} rooms sold`}
          tone="brand"
        />
        <MetricCard
          label="Revenue today"
          value={formatCurrency(todayMetrics?.revenue ?? 0)}
          hint={`${formatCurrency(weekSummary.revenue)} next 7 days`}
          tone="success"
        />
        <MetricCard
          label="ADR (7 days)"
          value={formatCurrency(weekSummary.adr)}
          hint="Average daily rate per sold room"
          tone="info"
        />
        <MetricCard
          label="RevPAR (7 days)"
          value={formatCurrency(weekSummary.revpar)}
          hint={`${Math.round(weekSummary.occupancyRate * 100)}% forecast occupancy`}
          tone="warning"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        <OperationsList
          title="Arrivals today"
          emptyLabel="No arrivals scheduled."
          reservations={arrivals}
          tone="brand"
          actionLabel="Check in"
          onAction={(id) => void onAction("checkin", id)}
          onSelect={openReservation}
        />
        <OperationsList
          title="Departures today"
          emptyLabel="No departures scheduled."
          reservations={departures}
          tone="warning"
          actionLabel="Check out"
          onAction={(id) => void onAction("checkout", id)}
          onSelect={openReservation}
        />
        <OperationsList
          title="In house"
          emptyLabel="No guests staying tonight."
          reservations={inHouse}
          tone="success"
          onSelect={openReservation}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        <ComponentCard
          title="14-day forecast"
          desc="Rooms sold and expected room revenue"
          className="xl:col-span-2"
        >
          <ForecastChart days={forecast} roomCount={rooms.length} />
        </ComponentCard>

        <ComponentCard title="Room status" desc="Current housekeeping split">
          <RoomStatusChart {...roomCounts} />
        </ComponentCard>
      </div>

      <ReservationDetailDialog
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        reservation={selected}
        guest={guests.find((g) => g.id === selected?.guest_id) ?? null}
        rooms={rooms}
        roomTypes={room_types}
        onAction={onAction}
      />
    </div>
  );
}
