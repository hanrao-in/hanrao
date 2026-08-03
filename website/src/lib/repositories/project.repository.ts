import { BaseRepository } from "./base.repository";
import type { Project } from "../types";

export class ProjectRepository extends BaseRepository<Project> {
  constructor(dbClient?: any) {
    super("projects", dbClient);
  }

  async findBySlug(slug: string): Promise<Project | null> {
    // Attempt match by slug directly
    const { data, error } = await this.dbClient
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error);
    if (data) return data as Project;

    // Fallback match by id (UUID)
    if (slug.length === 36) {
      const res = await this.dbClient.from("projects").select("*").eq("id", slug).maybeSingle();
      if (res.error) this.handleError(res.error);
      if (res.data) return res.data as Project;
    }

    // Fallback match case-insensitive by name
    const cleanedName = slug.replace(/[^a-zA-Z0-9]/g, "%");
    const nameRes = await this.dbClient
      .from("projects")
      .select("*")
      .ilike("name", cleanedName)
      .maybeSingle();

    if (nameRes.error) this.handleError(nameRes.error);
    return (nameRes.data as Project) || null;
  }

  async listFeatured(limit: number = 6): Promise<Project[]> {
    const { data, error } = await this.dbClient
      .from("projects")
      .select("*");

    if (error) this.handleError(error);

    const projects = (data || []) as Project[];

    // 1. Try to find active featured projects (not deleted)
    const featured = projects.filter(
      (p) => p.featured === true && p.status === "active" && !p.deleted_at,
    );
    if (featured.length > 0) {
      featured.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return featured.slice(0, limit);
    }

    // 2. Fallback to active projects (not deleted)
    const active = projects.filter((p) => p.status === "active" && !p.deleted_at);
    if (active.length > 0) {
      active.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return active.slice(0, limit);
    }

    // 3. Fallback to any project (not deleted)
    const nonDeleted = projects.filter((p) => !p.deleted_at);
    nonDeleted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return nonDeleted.slice(0, limit);
  }
}
