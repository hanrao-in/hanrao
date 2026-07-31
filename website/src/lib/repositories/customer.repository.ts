import { BaseRepository } from "./base.repository";
import type { Customer } from "../mockDb";

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(dbClient?: any) {
    super("customers", dbClient);
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await this.dbClient
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (error) this.handleError(error);
    return (data as Customer) || null;
  }
}
