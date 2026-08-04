export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";
export type CleaningStatus = "pending" | "in_progress" | "clean" | "inspected";

export type OccupancyStatus = "occupied" | "check_in_only" | "empty";

export interface HousekeepingRecord {
  room_id: string;
  date: string;
  cleaning_status: CleaningStatus;
  note: string;
  updated_at: string;
}

export interface UpdateHousekeepingInput {
  room_id: string;
  date: string;
  cleaning_status?: CleaningStatus;
  note?: string;
}

export interface RatePlan {
  id: string;
  slug: string;
  label: string;
  room_type_slug: string;
  sort_order: number;
  channels: string[];
  base_rate: number;
}

export interface RateEntry {
  rate_plan_id: string;
  date: string;
  rate: number;
  availability: number;
  updated_at: string;
}

export interface BulkRateUpdateInput {
  rate_plan_ids: string[];
  field: "rate" | "availability";
  value: number;
  date_from: string;
  date_to: string;
  /** 0=Sun … 6=Sat */
  weekdays: number[];
}

export interface UpsertRateEntryInput {
  rate_plan_id: string;
  date: string;
  rate?: number;
  availability?: number;
}
export type RoomType = "standard" | "deluxe" | "suite";

export interface RoomTypeRecord {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
}

export interface CreateRoomTypeInput {
  label: string;
  sort_order?: number;
}

export interface UpdateRoomTypeInput {
  id: string;
  label: string;
  sort_order?: number;
}
export type ReservationStatus =
  | "booked"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export interface Room {
  id: string;
  number: string;
  type: RoomType | string;
  floor: number;
  status: RoomStatus | string;
  rate: number;
}

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_document: string;
  organization?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  id_document_type?: string;
}

export interface Reservation {
  id: string;
  guest_id: string;
  /** Empty when the booking is unallocated to a specific room. */
  room_id: string;
  /** Room type slug for unallocated bookings. */
  room_type?: string;
  check_in: string;
  check_out: string;
  status: ReservationStatus | string;
  notes: string;
  guest_comments?: string;
  adults?: number;
  children?: number;
  infants?: number;
  room_amount?: number;
  extra_person?: number;
  discount?: number;
  amount_paid?: number;
  hold_rate?: boolean;
  booking_source?: string;
  arrival_time?: string;
  reference?: string;
  created_at: string;
  updated_at: string;
  guest_name?: string;
  room_number?: string;
}

export interface CreateRoomInput {
  number: string;
  type: string;
  floor: number;
  status: string;
  rate: number;
}

export interface UpdateRoomInput extends CreateRoomInput {
  id: string;
}

export interface CreateGuestInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_document: string;
  organization?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  id_document_type?: string;
}

export interface UpdateGuestInput extends CreateGuestInput {
  id: string;
}

export interface CreateReservationInput {
  guest_id?: string;
  guest?: CreateGuestInput;
  room_id: string;
  room_type?: string;
  check_in: string;
  check_out: string;
  notes: string;
  guest_comments?: string;
  adults?: number;
  children?: number;
  infants?: number;
  room_amount?: number;
  extra_person?: number;
  discount?: number;
  amount_paid?: number;
  hold_rate?: boolean;
  booking_source?: string;
  arrival_time?: string;
  reference?: string;
}

export interface DashboardStats {
  available_rooms: number;
  occupied_rooms: number;
  total_guests: number;
  arrivals_today: number;
  departures_today: number;
  booked_active: number;
}

export type ChannelStatus = "active" | "inactive";

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: ChannelStatus;
  sync_days: number;
  mapped_count: number;
  is_connected: boolean;
  sort_order: number;
  has_warning?: boolean;
  last_synced_at?: string;
}

export interface UpdateChannelInput {
  id: string;
  status?: ChannelStatus;
  mapped_count?: number;
  is_connected?: boolean;
  last_synced_at?: string;
}

export type ChannelSyncStatus = "pending" | "synced" | "error";

export interface ChannelRateEntry {
  channel_id: string;
  rate_plan_id: string;
  date: string;
  rate: number;
  availability: number;
  sync_status: ChannelSyncStatus;
  updated_at: string;
  last_synced_at?: string;
}

export interface UpsertChannelRateEntryInput {
  channel_id: string;
  rate_plan_id: string;
  date: string;
  rate?: number;
  availability?: number;
}

export interface BulkChannelRateUpdateInput {
  channel_id: string;
  rate_plan_ids: string[];
  field: "rate" | "availability";
  value: number;
  date_from: string;
  date_to: string;
  /** 0=Sun … 6=Sat */
  weekdays: number[];
}

export type YieldRuleType =
  | "min_stay"
  | "max_stay"
  | "stop_sell"
  | "closed_to_arrival"
  | "closed_to_departure"
  | "rate_adjustment";

export type YieldRuleStatus = "active" | "inactive";

export interface YieldRule {
  id: string;
  name: string;
  rule_type: YieldRuleType;
  room_type_slug: string;
  date_from: string;
  date_to: string;
  value: number;
  status: YieldRuleStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateYieldRuleInput {
  name: string;
  rule_type: YieldRuleType;
  room_type_slug: string;
  date_from: string;
  date_to: string;
  value: number;
  status?: YieldRuleStatus;
  priority?: number;
}

export interface UpdateYieldRuleInput extends CreateYieldRuleInput {
  id: string;
}

/** Folio line on a reservation (Little Hotelier / Cloudbeds-style payments). */
export type FolioLineType = "charge" | "payment" | "refund";
export type FolioPaymentMethod = "cash" | "card" | "transfer" | "other";

export interface FolioLine {
  id: string;
  reservation_id: string;
  type: FolioLineType;
  description: string;
  /** Always positive; sign comes from `type`. */
  amount: number;
  method?: FolioPaymentMethod;
  created_at: string;
}

export interface CreateFolioLineInput {
  reservation_id: string;
  type: FolioLineType;
  description: string;
  amount: number;
  method?: FolioPaymentMethod;
}

export type MessageKind =
  | "confirmation"
  | "pre_arrival"
  | "thank_you"
  | "custom";

export type MessageChannel = "email" | "sms";

export interface GuestMessage {
  id: string;
  reservation_id: string;
  guest_id: string;
  kind: MessageKind;
  channel: MessageChannel;
  subject: string;
  body: string;
  status: "draft" | "sent";
  sent_at?: string;
  created_at: string;
}

export interface SendGuestMessageInput {
  reservation_id: string;
  kind: MessageKind;
  channel?: MessageChannel;
  subject?: string;
  body?: string;
}
