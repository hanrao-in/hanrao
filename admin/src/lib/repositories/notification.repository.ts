import { BaseRepository } from "./base.repository";
import type { Notification } from "../mockDb";

export class NotificationRepository extends BaseRepository<Notification> {
  constructor(dbClient?: any) {
    super("notifications", dbClient);
  }

  async markRead(id: string): Promise<void> {
    const { error } = await this.dbClient.from("notifications").update({ read: true }).eq("id", id);

    if (error) this.handleError(error);
  }

  async markAllRead(): Promise<void> {
    const { error } = await this.dbClient
      .from("notifications")
      .update({ read: true })
      .eq("read", false);

    if (error) this.handleError(error);
  }

  async unreadCount(): Promise<number> {
    const { count, error } = await this.dbClient
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);

    if (error) this.handleError(error);
    return count || 0;
  }
}
