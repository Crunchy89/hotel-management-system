"use client";

import { useMemo, useState } from "react";
import TapeChart from "@/components/calendar/TapeChart";
import RoomTypeDialog, {
  type RoomTypeFormValues,
} from "@/components/calendar/RoomTypeDialog";
import AvailableRoomsModal from "@/components/reservations/AvailableRoomsModal";
import FindBookingModal, {
  type BookingQuery,
} from "@/components/reservations/FindBookingModal";
import KeyCardDialog from "@/components/reservations/KeyCardDialog";
import MoveRoomDialog from "@/components/reservations/MoveRoomDialog";
import ReservationDetailDialog, {
  type ReservationAction,
} from "@/components/reservations/ReservationDetailDialog";
import ReservationDialog, {
  defaultReservationForm,
} from "@/components/reservations/ReservationDialog";
import { formToCreateInput } from "@/components/reservations/reservationFormUtils";
import {
  defaultFilters,
  filterReservations,
  type ReservationFilters,
} from "@/components/reservations/reservationListUtils";
import { Alert } from "@/components/form";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import { PageShell } from "@/components/ui/layout";
import { useT } from "@/context/LocaleContext";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, dayDiff, formatDate, todayISO } from "@/lib/metrics";
import type { Reservation, Room, RoomTypeRecord } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

type ViewMode = "7" | "14" | "month";

const VIEW_MODE_KEYS: { value: ViewMode; labelKey: string }[] = [
  { value: "7", labelKey: "reservations.view7d" },
  { value: "14", labelKey: "reservations.view14d" },
  { value: "month", labelKey: "reservations.viewMonth" },
];

const LEGEND_KEYS = [
  { labelKey: "reservations.legendBooked", className: "bg-brand-500" },
  { labelKey: "reservations.legendInHouse", className: "bg-success-500" },
  {
    labelKey: "reservations.legendCheckedOut",
    className: "bg-gray-300 dark:bg-gray-700",
  },
  {
    labelKey: "reservations.legendCancelled",
    className: "border border-dashed border-gray-400 bg-gray-50",
  },
];

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function addMonths(iso: string, count: number): string {
  const date = new Date(`${monthStart(iso)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + count);
  return date.toISOString().slice(0, 10);
}

function daysInMonth(iso: string): number {
  return dayDiff(monthStart(iso), addMonths(iso, 1));
}

export default function ReservationsPage() {
  const t = useT();
  const { reservations, guests, rooms, room_types, folio_lines, error, mutate } =
    useHotelData();

  const today = todayISO();

  const [availSearch, setAvailSearch] = useState({
    from: today,
    to: addDays(today, 1),
    roomType: "",
    adults: 1,
    children: 0,
    infants: 0,
  });

  const emptyQuery: BookingQuery = { reference: "", lastName: "" };
  const [query, setQuery] = useState<BookingQuery>(emptyQuery);
  const [appliedQuery, setAppliedQuery] = useState<BookingQuery>(emptyQuery);
  const [searched, setSearched] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [start, setStart] = useState(() => monthStart(today));
  const [showCancelled, setShowCancelled] = useState(false);

  const [selected, setSelected] = useState<Reservation | null>(null);
  const [moveTarget, setMoveTarget] = useState<Reservation | null>(null);
  const [keyTarget, setKeyTarget] = useState<Reservation | null>(null);
  const [justBooked, setJustBooked] = useState<Reservation | null>(null);
  const [draft, setDraft] = useState<ReturnType<
    typeof defaultReservationForm
  > | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeRecord | null>(
    null,
  );

  const createModal = useModal();
  const detailModal = useModal();
  const roomTypeModal = useModal();
  const availableModal = useModal();
  const findModal = useModal();
  const moveModal = useModal();
  const keyModal = useModal();

  const days = viewMode === "month" ? daysInMonth(start) : Number(viewMode);

  // A code or name lookup should reach every stay, so the date window is open.
  const appliedFilters = useMemo<ReservationFilters>(
    () => ({
      ...defaultFilters(today),
      dateFrom: "",
      dateTo: "",
      reference: appliedQuery.reference,
      lastName: appliedQuery.lastName,
    }),
    [today, appliedQuery],
  );

  const filteredRows = useMemo(
    () =>
      filterReservations(
        reservations,
        guests,
        rooms,
        appliedFilters,
        folio_lines,
      ),
    [reservations, guests, rooms, appliedFilters, folio_lines],
  );

  const filteredReservations = useMemo(
    () => filteredRows.map((row) => row.reservation),
    [filteredRows],
  );

  // With no search applied, filteredRows holds every booking, so the first
  // active one doubles as a sample result inside the find dialog.
  const exampleRow = useMemo(
    () =>
      searched
        ? undefined
        : (filteredRows.find((row) => row.reservation.status === "booked") ??
          filteredRows.find(
            (row) => row.reservation.status === "checked_in",
          ) ??
          filteredRows[0]),
    [searched, filteredRows],
  );

  function patchQuery(values: Partial<BookingQuery>) {
    setQuery((prev) => ({ ...prev, ...values }));
  }

  function patchAvail(values: Partial<typeof availSearch>) {
    setAvailSearch((prev) => {
      const next = { ...prev, ...values };
      if (values.from && next.to <= values.from) {
        next.to = addDays(values.from, 1);
      }
      return next;
    });
  }

  function findBooking() {
    setAppliedQuery({ ...query });
    setSearched(true);
  }

  function resetBookingSearch() {
    setQuery(emptyQuery);
    setAppliedQuery(emptyQuery);
    setSearched(false);
  }

  function openDraft(
    values: Partial<ReturnType<typeof defaultReservationForm>>,
  ) {
    setDraft(defaultReservationForm(values));
    setDraftKey((k) => k + 1);
    createModal.openModal();
  }

  function openReserve(
    room: Room,
    checkIn: string,
    checkOut: string,
    party: { adults: number; children: number; infants: number },
  ) {
    const nights = Math.max(0, dayDiff(checkIn, checkOut));
    availableModal.closeModal();
    openDraft({
      guest_id: guests[0]?.id ?? "",
      guest_mode: guests[0] ? "existing" : "new",
      room_id: room.id,
      room_type: room.type,
      check_in: checkIn,
      check_out: checkOut,
      room_amount: room.rate * nights,
      hold_rate: false,
      booking_source: "Offline",
      adults: party.adults,
      children: party.children,
      infants: party.infants,
    });
  }

  function handleCellSelect(room: Room, date: string) {
    openDraft({
      guest_id: guests[0]?.id ?? "",
      guest_mode: guests[0] ? "existing" : "new",
      room_id: room.id,
      room_type: room.type,
      check_in: date,
      check_out: addDays(date, 1),
      room_amount: room.rate,
      booking_source: "Offline",
    });
  }

  function handleUnallocatedCellSelect(typeSlug: string, date: string) {
    openDraft({
      guest_id: guests[0]?.id ?? "",
      guest_mode: guests[0] ? "existing" : "new",
      room_id: "",
      room_type: typeSlug,
      check_in: date,
      check_out: addDays(date, 1),
      booking_source: "Offline",
    });
  }

  function openReservation(reservation: Reservation) {
    findModal.closeModal();
    setSelected(reservation);
    detailModal.openModal();
  }

  function openMoveRoom(reservation: Reservation) {
    detailModal.closeModal();
    setMoveTarget(reservation);
    moveModal.openModal();
  }

  function openKeyCard(reservation: Reservation) {
    setKeyTarget(reservation);
    keyModal.openModal();
  }

  function handleCheckedIn(reservation: Reservation) {
    detailModal.closeModal();
    openKeyCard(reservation);
  }

  const onCreate = async (values: ReturnType<typeof defaultReservationForm>) => {
    let created: Reservation | null = null;
    const ok = await mutate(async () => {
      created = await api.createReservation(formToCreateInput(values));
      return created;
    });
    if (ok) setJustBooked(created);
    return ok;
  };

  const onAction = (action: ReservationAction, id: string) =>
    mutate(() => {
      if (action === "checkin") return api.checkIn(id);
      if (action === "checkout") return api.checkOut(id);
      return api.cancelReservation(id);
    });

  const onSaveRoomType = (values: RoomTypeFormValues) =>
    mutate(() =>
      editingRoomType
        ? api.updateRoomType({ id: editingRoomType.id, ...values })
        : api.createRoomType(values),
    );

  const onDeleteRoomType = () =>
    editingRoomType
      ? mutate(() => api.deleteRoomType(editingRoomType.id))
      : Promise.resolve(false);

  function stepBack() {
    setStart(viewMode === "month" ? addMonths(start, -1) : addDays(start, -days));
  }

  function stepForward() {
    setStart(viewMode === "month" ? addMonths(start, 1) : addDays(start, days));
  }

  function goToday() {
    setStart(viewMode === "month" ? monthStart(today) : addDays(today, -2));
  }

  function changeView(mode: ViewMode) {
    setViewMode(mode);
    setStart(mode === "month" ? monthStart(start) : addDays(today, -2));
  }

  const rangeLabel =
    viewMode === "month"
      ? formatDate(start, { month: "long", year: "numeric" })
      : `${formatDate(start)} – ${formatDate(addDays(start, days - 1))}`;

  const searchSummary = [
    appliedQuery.reference &&
      t("reservations.searchCode", { value: appliedQuery.reference }),
    appliedQuery.lastName &&
      t("reservations.searchName", { value: appliedQuery.lastName }),
  ]
    .filter(Boolean)
    .join(" · ");

  // Keep the selected booking in sync after a move or status change.
  const selectedLive = selected
    ? (reservations.find((r) => r.id === selected.id) ?? selected)
    : null;

  const matchCount = filteredReservations.length;
  const matchLabel =
    matchCount === 1
      ? t("reservations.match", { count: matchCount })
      : t("reservations.match_other", { count: matchCount });

  return (
    <PageShell>
      <PageHeader
        title={t("reservations.title")}
        description={t("reservations.description")}
      />

      {error && <Alert>{error}</Alert>}

      {justBooked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success-200 bg-success-50 px-5 py-4 dark:border-success-500/30 dark:bg-success-500/10">
          <p className="text-theme-sm text-success-700 dark:text-success-400">
            {t("reservations.bookedConfirmedRef", {
              name: justBooked.guest_name ?? "",
              ref: justBooked.reference ? ` · ${justBooked.reference}` : "",
            })}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-theme-xs text-success-700/80 dark:text-success-400/80">
              {t("reservations.keyAtCheckIn")}
            </span>
            <button
              type="button"
              onClick={() => setJustBooked(null)}
              className="text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={availableModal.openModal}>
          {t("reservations.findAvailable")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setQuery(appliedQuery);
            findModal.openModal();
          }}
        >
          {t("reservations.findBooking")}
        </Button>

        {searched && (
          <span className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {t("reservations.filteredBy", {
              summary: searchSummary || t("reservations.customFilters"),
            })}
            <button
              type="button"
              onClick={resetBookingSearch}
              aria-label={t("reservations.clearFilter")}
              className="text-brand-500 hover:text-brand-700 dark:hover:text-brand-300"
            >
              ✕
            </button>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs" variant="outline" onClick={stepBack}>
            {t("reservations.prev")}
          </Button>
          <Button size="xs" variant="outline" onClick={goToday}>
            {t("reservations.today")}
          </Button>
          <Button size="xs" variant="outline" onClick={stepForward}>
            {t("reservations.next")}
          </Button>
          <span className="ml-1 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            {rangeLabel}
          </span>
          {searched && (
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">
              · {matchLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
            />
            {t("reservations.showCancelled")}
          </label>
          <div className="hidden items-center gap-3 sm:flex">
            {LEGEND_KEYS.map((item) => (
              <span
                key={item.labelKey}
                className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
                {t(item.labelKey)}
              </span>
            ))}
          </div>
          <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {VIEW_MODE_KEYS.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => changeView(mode.value)}
                className={`rounded-md px-3 py-1.5 text-theme-xs font-medium transition ${
                  viewMode === mode.value
                    ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {t(mode.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TapeChart
        rooms={rooms}
        roomTypes={room_types}
        reservations={filteredReservations}
        availabilityReservations={reservations}
        start={start}
        days={days}
        showCancelled={showCancelled}
        onSelectReservation={openReservation}
        onSelectCell={handleCellSelect}
        onSelectUnallocatedCell={handleUnallocatedCellSelect}
        onAddRoomType={() => {
          setEditingRoomType(null);
          roomTypeModal.openModal();
        }}
        onEditRoomType={(type) => {
          setEditingRoomType(type);
          roomTypeModal.openModal();
        }}
      />

      <AvailableRoomsModal
        isOpen={availableModal.isOpen}
        onClose={availableModal.closeModal}
        rooms={rooms}
        reservations={reservations}
        roomTypes={room_types}
        checkIn={availSearch.from}
        checkOut={availSearch.to}
        roomType={availSearch.roomType}
        adults={availSearch.adults}
        children={availSearch.children}
        infants={availSearch.infants}
        onChange={patchAvail}
        onReserve={openReserve}
      />

      <FindBookingModal
        isOpen={findModal.isOpen}
        onClose={findModal.closeModal}
        query={query}
        onChange={patchQuery}
        onSearch={findBooking}
        onReset={resetBookingSearch}
        rows={filteredRows}
        searched={searched}
        exampleRow={exampleRow}
        onSelect={openReservation}
      />

      {draft && (
        <ReservationDialog
          key={draftKey}
          isOpen={createModal.isOpen}
          onClose={createModal.closeModal}
          guests={guests}
          rooms={rooms}
          roomTypes={room_types}
          initial={draft}
          onCreate={onCreate}
        />
      )}

      <ReservationDetailDialog
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        reservation={selectedLive}
        guest={guests.find((g) => g.id === selectedLive?.guest_id) ?? null}
        rooms={rooms}
        roomTypes={room_types}
        onAction={onAction}
        onMoveRoom={openMoveRoom}
        onCheckedIn={handleCheckedIn}
      />

      <MoveRoomDialog
        isOpen={moveModal.isOpen}
        onClose={moveModal.closeModal}
        reservation={moveTarget}
        rooms={rooms}
        roomTypes={room_types}
        reservations={reservations}
      />

      <KeyCardDialog
        isOpen={keyModal.isOpen}
        onClose={keyModal.closeModal}
        reservation={
          keyTarget
            ? (reservations.find((r) => r.id === keyTarget.id) ?? keyTarget)
            : null
        }
        rooms={rooms}
      />

      <RoomTypeDialog
        isOpen={roomTypeModal.isOpen}
        onClose={roomTypeModal.closeModal}
        editing={editingRoomType}
        onSave={onSaveRoomType}
        onDelete={editingRoomType ? onDeleteRoomType : undefined}
      />
    </PageShell>
  );
}
