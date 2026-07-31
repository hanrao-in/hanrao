import { ProjectRepository } from "../repositories/project.repository";
import { PlotRepository } from "../repositories/plot.repository";
import { StorageService } from "./storage.service";
import type { Project, Plot } from "../types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class ProjectService {
  private readonly projectRepo: ProjectRepository;
  private readonly plotRepo: PlotRepository;
  private readonly storageService: StorageService;

  constructor(dbClient: any = supabaseAdmin) {
    this.projectRepo = new ProjectRepository(dbClient);
    this.plotRepo = new PlotRepository(dbClient);
    this.storageService = new StorageService(dbClient);
  }

  // ─── PROJECTS ────────────────────────────────────────────────────────────

  async listProjects(): Promise<Project[]> {
    return this.projectRepo.list("created_at", false);
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projectRepo.find(id);
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    return this.projectRepo.findBySlug(slug);
  }

  async listFeaturedProjects(limit: number = 6): Promise<Project[]> {
    return this.projectRepo.listFeatured(limit);
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    if (data.thumbnail_url && this.storageService.isBase64DataUrl(data.thumbnail_url)) {
      data.thumbnail_url = await this.storageService.uploadImage(data.thumbnail_url, "projects");
    }

    if (data.gallery_urls && Array.isArray(data.gallery_urls)) {
      data.gallery_urls = await this.storageService.uploadImages(data.gallery_urls, "projects");
    }

    return this.projectRepo.create(data);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (updates.thumbnail_url && this.storageService.isBase64DataUrl(updates.thumbnail_url)) {
      updates.thumbnail_url = await this.storageService.uploadImage(
        updates.thumbnail_url,
        "projects",
      );
    }

    if (updates.gallery_urls && Array.isArray(updates.gallery_urls)) {
      updates.gallery_urls = await this.storageService.uploadImages(
        updates.gallery_urls,
        "projects",
      );
    }

    return this.projectRepo.update(id, updates);
  }

  async deleteProject(id: string): Promise<void> {
    return this.projectRepo.delete(id);
  }

  // ─── PLOTS ───────────────────────────────────────────────────────────────

  async listPlots(): Promise<Plot[]> {
    return this.plotRepo.list("plot_number", true);
  }

  async listPlotsByProject(projectId: string): Promise<Plot[]> {
    return this.plotRepo.listByProject(projectId);
  }

  async getPlot(id: string): Promise<Plot | null> {
    return this.plotRepo.find(id);
  }

  async createPlot(data: Partial<Plot>): Promise<Plot> {
    if (data.images && Array.isArray(data.images)) {
      data.images = await this.storageService.uploadImages(data.images, "plots");
    }

    return this.plotRepo.create(data);
  }

  async updatePlot(id: string, updates: Partial<Plot>): Promise<Plot> {
    if (updates.images && Array.isArray(updates.images)) {
      updates.images = await this.storageService.uploadImages(updates.images, "plots");
    }

    return this.plotRepo.update(id, updates);
  }

  async deletePlot(id: string): Promise<void> {
    return this.plotRepo.delete(id);
  }
}
