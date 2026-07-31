import { BaseRepository } from "./base.repository";

export interface AuditLog {
  id: string;
  user_id?: string;
  email?: string;
  ip_address?: string;
  action: string;
  details?: any;
  created_at: string;
}

export class AuditRepository extends BaseRepository<AuditLog> {
  constructor(dbClient?: any) {
    super("audit_logs", dbClient);
  }

  async logAction(log: Omit<AuditLog, "id" | "created_at">): Promise<void> {
    const { error } = await this.dbClient.from("audit_logs").insert({
      user_id: log.user_id || null,
      email: log.email || null,
      ip_address: log.ip_address || null,
      action: log.action,
      details: log.details || {},
    });

    if (error) {
      console.error("[Audit Logging Failed]", error);
    }
  }
}
