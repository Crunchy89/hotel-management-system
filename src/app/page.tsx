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
import { PageShell } from "@/components/ui/layout";
import { useT } from "@/context/LocaleContext";
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
  const t = useT();
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
    <PageShell>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        action={
          <>
            <Link href="/reservations">
              <Button size="sm">{t("dashboard.openReservations")}</Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => void reload()}>
              {t("dashboard.refresh")}
            </Button>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <MetricCard
          label={t("dashboard.occupancyToday")}
          value={`${occupancyToday}%`}
          hint={t("dashboard.roomsSoldHint", {
            occupied: todayMetrics?.occupied ?? 0,
            total: rooms.length,
          })}
          tone="brand"
        />
        <MetricCard
          label={t("dashboard.revenueToday")}
          value={formatCurrency(todayMetrics?.revenue ?? 0)}
          hint={t("dashboard.next7Days", {
            amount: formatCurrency(weekSummary.revenue),
          })}
          tone="success"
        />
        <MetricCard
          label={t("dashboard.adr7d")}
          value={formatCurrency(weekSummary.adr)}
          hint={t("dashboard.adrHint")}
          tone="info"
        />
        <MetricCard
          label={t("dashboard.revpar7d")}
          value={formatCurrency(weekSummary.revpar)}
          hint={t("dashboard.revparHint", {
            pct: Math.round(weekSummary.occupancyRate * 100),
          })}
          tone="warning"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        <OperationsList
          title={t("dashboard.arrivalsToday")}
          emptyLabel={t("dashboard.noArrivals")}
          reservations={arrivals}
          tone="brand"
          actionLabel={t("resDetail.checkIn")}
          onAction={(id) => void onAction("checkin", id)}
          onSelect={openReservation}
        />
        <OperationsList
          title={t("dashboard.departuresToday")}
          emptyLabel={t("dashboard.noDepartures")}
          reservations={departures}
          tone="warning"
          actionLabel={t("resDetail.checkOut")}
          onAction={(id) => void onAction("checkout", id)}
          onSelect={openReservation}
        />
        <OperationsList
          title={t("dashboard.inHouse")}
          emptyLabel={t("dashboard.noInHouse")}
          reservations={inHouse}
          tone="success"
          onSelect={openReservation}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
        <ComponentCard
          title={t("dashboard.forecast14d")}
          desc={t("dashboard.forecastDesc")}
          className="xl:col-span-2"
        >
          <ForecastChart days={forecast} roomCount={rooms.length} />
        </ComponentCard>

        <ComponentCard
          title={t("dashboard.roomStatus")}
          desc={t("dashboard.roomStatusDesc")}
        >
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
    </PageShell>
  );
}
