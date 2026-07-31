"use client";

import React, { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import PageHeader from "@/components/common/PageHeader";
import TapeChart from "@/components/calendar/TapeChart";
import ReservationDetailDialog, {
  type ReservationAction,
} from "@/components/reservations/ReservationDetailDialog";
import ReservationDialog, {
  type ReservationFormValues,
} from "@/components/reservations/ReservationDialog";
import { Alert } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, formatDate, isActive, todayISO } from "@/lib/metrics";
import type { Reservation, Room } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const RANGES = [7, 14, 30];

const statusTone: Record<string, string> = {
  booked: "primary",
  checked_in: "success",
  checked_out: "warning",
};

const legend = [
  { label: "Booked", className: "bg-brand-500" },
  { label: "In house", className: "bg-success-500" },
  { label: "Checked out", className: "bg-gray-300 dark:bg-gray-700" },
];

function renderEventContent(eventInfo: EventContentArg) {
  const tone = (eventInfo.event.extendedProps.tone as string) ?? "primary";
  return (
    <div
      className={`event-fc-color fc-event-main fc-bg-${tone} flex rounded-sm p-1`}
    >
      <div className="fc-daygrid-event-dot" />
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
}

const BookingCalendar: React.FC = () => {
  const { reservations, guests, rooms, error, mutate } = useHotelData();

  const [view, setView] = useState<"timeline" | "month">("timeline");
  const [days, setDays] = useState(14);
  const [start, setStart] = useState(() => addDays(todayISO(), -2));

  const [selected, setSelected] = useState<Reservation | null>(null);
  const [draft, setDraft] = useState<ReservationFormValues | null>(null);
  const [draftKey, setDraftKey] = useState(0);

  const createModal = useModal();
  const detailModal = useModal();

  const events: EventInput[] = useMemo(
    () =>
      reservations.filter(isActive).map((r) => ({
        id: r.id,
        title: `${r.room_number ?? "?"} · ${r.guest_name ?? "Guest"}`,
        start: r.check_in,
        end: r.check_out,
        allDay: true,
        extendedProps: { tone: statusTone[r.status] ?? "primary" },
      })),
    [reservations],
  );

  function openDraft(values: ReservationFormValues) {
    setDraft(values);
    setDraftKey((k) => k + 1);
    createModal.openModal();
  }

  function handleCellSelect(room: Room, date: string) {
    openDraft({
      guest_id: guests[0]?.id ?? "",
      room_id: room.id,
      check_in: date,
      check_out: addDays(date, 1),
      notes: "",
    });
  }

  function handleMonthSelect(selectInfo: DateSelectArg) {
    const checkIn = selectInfo.startStr.slice(0, 10);
    const checkOut = selectInfo.endStr.slice(0, 10);
    openDraft({
      guest_id: guests[0]?.id ?? "",
      room_id:
        rooms.find((r) => r.status === "available")?.id ?? rooms[0]?.id ?? "",
      check_in: checkIn,
      check_out: checkOut > checkIn ? checkOut : addDays(checkIn, 1),
      notes: "",
    });
  }

  function openReservation(reservation: Reservation) {
    setSelected(reservation);
    detailModal.openModal();
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const reservation = reservations.find((r) => r.id === clickInfo.event.id);
    if (reservation) openReservation(reservation);
  }

  const onCreate = (values: ReservationFormValues) =>
    mutate(() => api.createReservation(values));

  const onAction = (action: ReservationAction, id: string) =>
    mutate(() => {
      if (action === "checkin") return api.checkIn(id);
      if (action === "checkout") return api.checkOut(id);
      return api.cancelReservation(id);
    });

  const rangeLabel = `${formatDate(start)} – ${formatDate(addDays(start, days - 1))}`;

  return (
    <div>
      <PageHeader
        title="Booking calendar"
        description="Click an open night to create a booking, or a stay to manage it."
        action={
          <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {(["timeline", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-4 py-2 text-theme-sm font-medium capitalize transition ${
                  view === v
                    ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      {view === "timeline" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setStart(addDays(start, -days))}
              >
                ‹ Prev
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setStart(addDays(todayISO(), -2))}
              >
                Today
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setStart(addDays(start, days))}
              >
                Next ›
              </Button>
              <span className="ml-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                {rangeLabel}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 sm:flex">
                {legend.map((item) => (
                  <span
                    key={item.label}
                    className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.className}`}
                    />
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDays(r)}
                    className={`rounded-md px-3 py-1.5 text-theme-xs font-medium transition ${
                      days === r
                        ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <TapeChart
            rooms={rooms}
            reservations={reservations}
            start={start}
            days={days}
            onSelectReservation={openReservation}
            onSelectCell={handleCellSelect}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="custom-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "today",
              }}
              events={events}
              selectable
              select={handleMonthSelect}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              height="auto"
            />
          </div>
        </div>
      )}

      {draft && (
        <ReservationDialog
          key={draftKey}
          isOpen={createModal.isOpen}
          onClose={createModal.closeModal}
          guests={guests}
          rooms={rooms}
          initial={draft}
          onCreate={onCreate}
        />
      )}

      <ReservationDetailDialog
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        reservation={selected}
        rooms={rooms}
        onAction={onAction}
      />
    </div>
  );
};

export default BookingCalendar;
