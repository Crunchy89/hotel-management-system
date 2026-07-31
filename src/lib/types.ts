export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";
export type RoomType = "standard" | "deluxe" | "suite";
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
}

export interface Reservation {
  id: string;
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  status: ReservationStatus | string;
  notes: string;
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
}

export interface UpdateGuestInput extends CreateGuestInput {
  id: string;
}

export interface CreateReservationInput {
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  notes: string;
}

export interface DashboardStats {
  available_rooms: number;
  occupied_rooms: number;
  total_guests: number;
  arrivals_today: number;
  departures_today: number;
  booked_active: number;
}
