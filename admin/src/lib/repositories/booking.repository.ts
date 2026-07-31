import { BaseRepository } from "./base.repository";
import type { Booking } from "../mockDb";

export class BookingRepository extends BaseRepository<Booking> {
  constructor(dbClient?: any) {
    super("bookings", dbClient);
  }
}
