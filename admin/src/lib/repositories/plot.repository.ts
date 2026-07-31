import { BaseRepository } from "./base.repository";
import type { Plot } from "../mockDb";

export class PlotRepository extends BaseRepository<Plot> {
  constructor(dbClient?: any) {
    super("plots", dbClient);
  }

  override async create(data: Partial<Plot>): Promise<Plot> {
    const dbData = { ...data } as any;
    delete dbData.project_name;
    const created = await super.create(dbData);
    return {
      ...created,
      project_name: data.project_name || "",
    };
  }

  override async update(id: string, updates: Partial<Plot>): Promise<Plot> {
    const dbUpdates = { ...updates } as any;
    delete dbUpdates.project_name;
    const updated = await super.update(id, dbUpdates);
    return {
      ...updated,
      project_name: updates.project_name || "",
    };
  }

  override async list(orderBy: string = "plot_number", ascending: boolean = true): Promise<Plot[]> {
    const { data, error } = await this.dbClient
      .from("plots")
      .select(`
        *,
        projects (
          name
        )
      `)
      .order(orderBy, { ascending });

    if (error) this.handleError(error);
    return (data || []).map((p: any) => ({
      ...p,
      project_name: p.projects?.name || "",
    })) as unknown as Plot[];
  }

  override async find(id: string): Promise<Plot | null> {
    const { data, error } = await this.dbClient
      .from("plots")
      .select(`
        *,
        projects (
          name
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    if (!data) return null;
    return {
      ...data,
      project_name: (data as any).projects?.name || "",
    } as unknown as Plot;
  }

  async listByProject(projectId: string): Promise<Plot[]> {
    const { data, error } = await this.dbClient
      .from("plots")
      .select(`
        *,
        projects (
          name
        )
      `)
      .eq("project_id", projectId)
      .order("plot_number", { ascending: true });

    if (error) this.handleError(error);
    return (data || []).map((p: any) => ({
      ...p,
      project_name: p.projects?.name || "",
    })) as unknown as Plot[];
  }

  async listByProjectOrName(projectId: string, projectName?: string): Promise<Plot[]> {
    if (!projectName) {
      return this.listByProject(projectId);
    }

    const { data, error } = await this.dbClient
      .from("plots")
      .select(
        `
        *,
        projects!inner (
          id,
          name
        )
      `,
      )
      .or(`project_id.eq.${projectId},projects.name.eq.${projectName}`)
      .order("plot_number", { ascending: true });

    if (error) this.handleError(error);
    return (data || []).map((p: any) => ({
      ...p,
      project_name: p.projects?.name || "",
    })) as unknown as Plot[];
  }

  async listAvailable(filters: {
    projectIds?: string[];
    projectNames?: string[];
    plotType?: string;
    minArea?: number;
    maxArea?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Plot[]> {
    let query = this.dbClient
      .from("plots")
      .select(
        `
        *,
        projects!inner (
          id,
          name
        )
      `,
      )
      .neq("availability", "sold");

    if (filters.projectIds && filters.projectIds.length > 0) {
      query = query.in("project_id", filters.projectIds);
    }
    if (filters.plotType) {
      query = query.eq("plot_type", filters.plotType);
    }
    if (filters.minArea !== undefined) {
      query = query.gte("area_sqyd", filters.minArea);
    }
    if (filters.maxArea !== undefined) {
      query = query.lte("area_sqyd", filters.maxArea);
    }
    if (filters.minPrice !== undefined) {
      query = query.gte("price_per_sqyd", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price_per_sqyd", filters.maxPrice);
    }

    const { data, error } = await query;
    if (error) this.handleError(error);
    return (data || []).map((p: any) => ({
      ...p,
      project_name: p.projects?.name || "",
    })) as unknown as Plot[];
  }
}
