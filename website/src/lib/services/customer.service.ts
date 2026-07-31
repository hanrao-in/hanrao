import { CustomerRepository } from "../repositories/customer.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { EnquiryRepository } from "../repositories/enquiry.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import type { Customer, Booking, Enquiry, Notification } from "../mockDb";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class CustomerService {
  private readonly customerRepo: CustomerRepository;
  private readonly bookingRepo: BookingRepository;
  private readonly enquiryRepo: EnquiryRepository;
  private readonly notificationRepo: NotificationRepository;

  constructor(dbClient: any = supabaseAdmin) {
    this.customerRepo = new CustomerRepository(dbClient);
    this.bookingRepo = new BookingRepository(dbClient);
    this.enquiryRepo = new EnquiryRepository(dbClient);
    this.notificationRepo = new NotificationRepository(dbClient);
  }

  // ─── CUSTOMERS ───────────────────────────────────────────────────────────

  async listCustomers(): Promise<Customer[]> {
    return this.customerRepo.list("created_at", false);
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return this.customerRepo.create(data);
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    return this.customerRepo.update(id, updates);
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.customerRepo.delete(id);
  }

  // ─── ENQUIRIES ───────────────────────────────────────────────────────────

  async listEnquiries(): Promise<Enquiry[]> {
    return this.enquiryRepo.list("created_at", false);
  }

  async submitEnquiry(data: Partial<Enquiry>): Promise<void> {
    const enquiry = await this.enquiryRepo.create(data);

    const existingCustomer = await this.customerRepo.findByPhone(enquiry.phone);
    if (!existingCustomer) {
      await this.customerRepo.create({
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email || undefined,
        address: undefined,
        source: "website",
        status: "lead",
        notes: undefined,
        enquiry_id: enquiry.id,
      } as any);
    }

    await this.notificationRepo.create({
      title: "New Enquiry",
      message: `${enquiry.name} submitted an enquiry${enquiry.project_name ? ` about ${enquiry.project_name}` : ""}.`,
      type: "info",
      read: false,
      entity_type: "enquiry",
      entity_id: enquiry.id,
    } as any);
  }

  async updateEnquiry(id: string, updates: Partial<Enquiry>): Promise<Enquiry> {
    const enquiry = await this.enquiryRepo.update(id, updates);

    if (updates.lead_status && enquiry.phone) {
      const customer = await this.customerRepo.findByPhone(enquiry.phone);
      if (customer) {
        let newStatus: Customer["status"] = "lead";
        if (updates.lead_status === "converted") {
          newStatus = "customer";
        } else if (updates.lead_status === "lost") {
          newStatus = "inactive";
        } else if (["contacted", "interested", "visited"].includes(updates.lead_status)) {
          newStatus = "prospect";
        }

        await this.customerRepo.update(customer.id, { status: newStatus });
      }
    }

    return enquiry;
  }

  async deleteEnquiry(id: string): Promise<void> {
    return this.enquiryRepo.delete(id);
  }

  // ─── BOOKINGS ────────────────────────────────────────────────────────────

  async listBookings(): Promise<Booking[]> {
    return this.bookingRepo.list("created_at", false);
  }

  async createBooking(data: Partial<Booking>): Promise<Booking> {
    const booking = await this.bookingRepo.create(data);

    if (booking.customer_phone) {
      const customer = await this.customerRepo.findByPhone(booking.customer_phone);
      if (customer) {
        await this.customerRepo.update(customer.id, { status: "customer" });
      } else {
        await this.customerRepo.create({
          name: booking.customer_name,
          phone: booking.customer_phone,
          source: "walk-in",
          status: "customer",
        } as any);
      }
    }

    await this.notificationRepo.create({
      title: "New Booking",
      message: `${booking.customer_name} booked${booking.plot_number ? ` plot ${booking.plot_number}` : ""}.`,
      type: "success",
      read: false,
      entity_type: "booking",
      entity_id: booking.id,
    } as any);

    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    return this.bookingRepo.update(id, updates);
  }

  async deleteBooking(id: string): Promise<void> {
    return this.bookingRepo.delete(id);
  }
}
