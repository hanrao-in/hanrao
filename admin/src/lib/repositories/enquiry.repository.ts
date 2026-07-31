import { BaseRepository } from "./base.repository";
import type { Enquiry } from "../mockDb";

export class EnquiryRepository extends BaseRepository<Enquiry> {
  constructor(dbClient?: any) {
    super("enquiries", dbClient);
  }
}
