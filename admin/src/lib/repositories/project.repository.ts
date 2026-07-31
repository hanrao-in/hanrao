import { BaseRepository } from "./base.repository";
import type { Project } from "../mockDb";

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
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) this.handleError(error);
    return (data || []) as Project[];
  }
}
