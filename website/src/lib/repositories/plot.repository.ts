import { BaseRepository } from "./base.repository";
import type { Plot } from "../types";

export class PlotRepository extends BaseRepository<Plot> {
  constructor(dbClient?: any) {
    super("plots", dbClient);
  }

  async listByProject(projectId: string): Promise<Plot[]> {
    const { data, error } = await this.dbClient
      .from("plots")
      .select("*")
      .eq("project_id", projectId)
      .order("plot_number", { ascending: true });

    if (error) this.handleError(error);
    return (data || []) as Plot[];
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
    return (data || []) as Plot[];
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
    return (data || []) as Plot[];
  }
}
