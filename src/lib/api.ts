import * as store from "@/lib/store";
import type {
  BulkChannelRateUpdateInput,
  BulkRateUpdateInput,
  Channel,
  ChannelRateEntry,
  CreateFolioLineInput,
  CreateGuestInput,
  CreateReservationInput,
  CreateRoomInput,
  CreateRoomTypeInput,
  CreateYieldRuleInput,
  DashboardStats,
  FolioLine,
  Guest,
  GuestMessage,
  HousekeepingRecord,
  RateEntry,
  RatePlan,
  Reservation,
  Room,
  RoomTypeRecord,
  SendGuestMessageInput,
  UpdateChannelInput,
  UpdateGuestInput,
  UpdateHousekeepingInput,
  UpsertChannelRateEntryInput,
  UpsertRateEntryInput,
  UpdateRoomInput,
  UpdateRoomTypeInput,
  UpdateYieldRuleInput,
  UpdateReservationPaymentInput,
  YieldRule,
  BookingActivity,
  KeyCard,
  MoveReservationRoomInput,
  WriteKeyCardInput,
  HotelService,
  CreateHotelServiceInput,
  UpdateHotelServiceInput,
} from "@/lib/types";

function asPromise<T>(fn: () => T): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}

export const api = {
  listRooms: (): Promise<Room[]> => asPromise(() => store.listRooms()),
  createRoom: (input: CreateRoomInput): Promise<Room> =>
    asPromise(() => store.createRoom(input)),
  updateRoom: (input: UpdateRoomInput): Promise<Room> =>
    asPromise(() => store.updateRoom(input)),
  setRoomStatus: (id: string, status: string): Promise<Room> =>
    asPromise(() => store.setRoomStatus(id, status)),
  listRoomTypes: (): Promise<RoomTypeRecord[]> =>
    asPromise(() => store.listRoomTypes()),
  createRoomType: (input: CreateRoomTypeInput): Promise<RoomTypeRecord> =>
    asPromise(() => store.createRoomType(input)),
  updateRoomType: (input: UpdateRoomTypeInput): Promise<RoomTypeRecord> =>
    asPromise(() => store.updateRoomType(input)),
  deleteRoomType: (id: string): Promise<void> =>
    asPromise(() => store.deleteRoomType(id)),
  listGuests: (): Promise<Guest[]> => asPromise(() => store.listGuests()),
  getGuest: (id: string): Promise<Guest> => asPromise(() => store.getGuest(id)),
  createGuest: (input: CreateGuestInput): Promise<Guest> =>
    asPromise(() => store.createGuest(input)),
  updateGuest: (input: UpdateGuestInput): Promise<Guest> =>
    asPromise(() => store.updateGuest(input)),
  listReservations: (): Promise<Reservation[]> =>
    asPromise(() => store.listReservations()),
  createReservation: (input: CreateReservationInput): Promise<Reservation> =>
    asPromise(() => store.createReservation(input)),
  cancelReservation: (id: string): Promise<Reservation> =>
    asPromise(() => store.cancelReservation(id)),
  updateReservationPayment: (
    input: UpdateReservationPaymentInput,
  ): Promise<Reservation> =>
    asPromise(() => store.updateReservationPayment(input)),
  checkIn: (id: string): Promise<Reservation> => asPromise(() => store.checkIn(id)),
  checkOut: (id: string): Promise<Reservation> => asPromise(() => store.checkOut(id)),
  moveReservationRoom: (
    input: MoveReservationRoomInput,
  ): Promise<Reservation> => asPromise(() => store.moveReservationRoom(input)),
  listKeyCards: (reservationId?: string): Promise<KeyCard[]> =>
    asPromise(() => store.listKeyCards(reservationId)),
  writeKeyCard: (input: WriteKeyCardInput): Promise<KeyCard> =>
    asPromise(() => store.writeKeyCard(input)),
  revokeKeyCard: (id: string): Promise<KeyCard> =>
    asPromise(() => store.revokeKeyCard(id)),
  listFolioLines: (reservationId?: string): Promise<FolioLine[]> =>
    asPromise(() => store.listFolioLines(reservationId)),
  createFolioLine: (input: CreateFolioLineInput): Promise<FolioLine> =>
    asPromise(() => store.createFolioLine(input)),
  deleteFolioLine: (id: string): Promise<void> =>
    asPromise(() => store.deleteFolioLine(id)),
  listGuestMessages: (reservationId?: string): Promise<GuestMessage[]> =>
    asPromise(() => store.listGuestMessages(reservationId)),
  sendGuestMessage: (input: SendGuestMessageInput): Promise<GuestMessage> =>
    asPromise(() => store.sendGuestMessage(input)),
  listHousekeeping: (date?: string): Promise<HousekeepingRecord[]> =>
    asPromise(() => store.listHousekeeping(date)),
  upsertHousekeeping: (input: UpdateHousekeepingInput): Promise<HousekeepingRecord> =>
    asPromise(() => store.upsertHousekeeping(input)),
  listRatePlans: (roomTypeSlug?: string): Promise<RatePlan[]> =>
    asPromise(() => store.listRatePlans(roomTypeSlug)),
  listRateEntries: (from?: string, to?: string): Promise<RateEntry[]> =>
    asPromise(() => store.listRateEntries(from, to)),
  upsertRateEntry: (input: UpsertRateEntryInput): Promise<RateEntry> =>
    asPromise(() => store.upsertRateEntry(input)),
  bulkUpdateRates: (input: BulkRateUpdateInput): Promise<number> =>
    asPromise(() => store.bulkUpdateRates(input)),
  listChannels: (): Promise<Channel[]> => asPromise(() => store.listChannels()),
  updateChannel: (input: UpdateChannelInput): Promise<Channel> =>
    asPromise(() => store.updateChannel(input)),
  reorderChannels: (orderedIds: string[]): Promise<Channel[]> =>
    asPromise(() => store.reorderChannels(orderedIds)),
  listChannelRateEntries: (
    channelId?: string,
    from?: string,
    to?: string,
  ): Promise<ChannelRateEntry[]> =>
    asPromise(() => store.listChannelRateEntries(channelId, from, to)),
  upsertChannelRateEntry: (
    input: UpsertChannelRateEntryInput,
  ): Promise<ChannelRateEntry> =>
    asPromise(() => store.upsertChannelRateEntry(input)),
  bulkUpdateChannelRates: (input: BulkChannelRateUpdateInput): Promise<number> =>
    asPromise(() => store.bulkUpdateChannelRates(input)),
  syncChannelRates: (channelId: string): Promise<number> =>
    asPromise(() => store.syncChannelRates(channelId)),
  listYieldRules: (): Promise<YieldRule[]> =>
    asPromise(() => store.listYieldRules()),
  createYieldRule: (input: CreateYieldRuleInput): Promise<YieldRule> =>
    asPromise(() => store.createYieldRule(input)),
  updateYieldRule: (input: UpdateYieldRuleInput): Promise<YieldRule> =>
    asPromise(() => store.updateYieldRule(input)),
  deleteYieldRule: (id: string): Promise<void> =>
    asPromise(() => store.deleteYieldRule(id)),
  toggleYieldRule: (id: string): Promise<YieldRule> =>
    asPromise(() => store.toggleYieldRule(id)),
  getDashboardStats: (): Promise<DashboardStats> =>
    asPromise(() => store.getDashboardStats()),
  listBookingActivities: (): Promise<BookingActivity[]> =>
    asPromise(() => store.listBookingActivities()),
  listHotelServices: (activeOnly?: boolean): Promise<HotelService[]> =>
    asPromise(() => store.listHotelServices(activeOnly)),
  createHotelService: (input: CreateHotelServiceInput): Promise<HotelService> =>
    asPromise(() => store.createHotelService(input)),
  updateHotelService: (input: UpdateHotelServiceInput): Promise<HotelService> =>
    asPromise(() => store.updateHotelService(input)),
  deleteHotelService: (id: string): Promise<void> =>
    asPromise(() => store.deleteHotelService(id)),
  toggleHotelService: (id: string): Promise<HotelService> =>
    asPromise(() => store.toggleHotelService(id)),
};

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong";
}
