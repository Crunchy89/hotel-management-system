import * as store from "@/lib/store";
import type {
  CreateGuestInput,
  CreateReservationInput,
  CreateRoomInput,
  DashboardStats,
  Guest,
  Reservation,
  Room,
  UpdateGuestInput,
  UpdateRoomInput,
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
  checkIn: (id: string): Promise<Reservation> => asPromise(() => store.checkIn(id)),
  checkOut: (id: string): Promise<Reservation> => asPromise(() => store.checkOut(id)),
  getDashboardStats: (): Promise<DashboardStats> =>
    asPromise(() => store.getDashboardStats()),
};

export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong";
}
