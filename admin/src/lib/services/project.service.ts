import { ProjectRepository } from "../repositories/project.repository";
import { PlotRepository } from "../repositories/plot.repository";
import { StorageService } from "./storage.service";
import type { Project, Plot } from "../mockDb";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Convert any Google Maps URL format into an embeddable iframe URL.
 * Supports:
 *   - Already-embeddable URLs (https://www.google.com/maps/embed?pb=...)
 *   - Place URLs (https://www.google.com/maps/place/.../@lat,lng,...)
 *   - Search URLs (https://www.google.com/maps?q=... or maps/search/...)
 *   - Coordinate URLs (https://www.google.com/maps/@lat,lng,...)
 *   - Short links (https://maps.app.goo.gl/... or https://goo.gl/maps/...)
 *   - Plain text queries ("Hyderabad, Telangana")
 */
function toMapEmbedUrl(input: string): string {
  if (!input || !input.trim()) return "";
  const url = input.trim();

  // Already an embed URL — return as-is
  if (url.includes("/maps/embed") || url.includes("maps?output=embed") || url.includes("&output=embed")) {
    return url;
  }

  // Try to extract lat,lng from various URL patterns
  // Pattern: @lat,lng  or  ?q=lat,lng  or  /place/.../@lat,lng
  const coordPatterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,           // @lat,lng
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,       // ?q=lat,lng
    /\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/, // /place/.../@lat,lng
  ];

  for (const pattern of coordPatterns) {
    const match = url.match(pattern);
    if (match) {
      const lat = match[1];
      const lng = match[2];
      return `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;
    }
  }

  // Extract search query from ?q=... parameter
  const qMatch = url.match(/[?&]q=([^&]+)/);
  if (qMatch) {
    const query = decodeURIComponent(qMatch[1]);
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=15&output=embed`;
  }

  // Extract place name from /maps/place/PlaceName/ URLs
  const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    const place = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    return `https://www.google.com/maps?q=${encodeURIComponent(place)}&hl=en&z=15&output=embed`;
  }

  // Extract from /maps/search/Query/ URLs
  const searchMatch = url.match(/\/maps\/search\/([^/]+)/);
  if (searchMatch) {
    const query = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=en&z=15&output=embed`;
  }

  // Short links (maps.app.goo.gl, goo.gl/maps) — these can't be embedded,
  // so convert to a search-based embed using the URL itself as the query
  if (url.includes("goo.gl") || url.includes("maps.app")) {
    // We can't resolve short links server-side easily,
    // so store as a search-based embed with the full URL
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}&hl=en&z=15&output=embed`;
  }

  // If it looks like a URL but we couldn't parse it, try embedding it as a query
  if (url.startsWith("http")) {
    return `https://www.google.com/maps?q=${encodeURIComponent(url)}&hl=en&z=15&output=embed`;
  }

  // Plain text (e.g. "Hyderabad, Telangana") — use as search query
  return `https://www.google.com/maps?q=${encodeURIComponent(url)}&hl=en&z=15&output=embed`;
}

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
    const list = await this.projectRepo.list("created_at", false);
    return list.map((p) => {
      const mapped = { ...p } as any;
      mapped.location_link = mapped.map_embed_url;
      return mapped;
    });
  }

  async getProject(id: string): Promise<Project | null> {
    const p = await this.projectRepo.find(id);
    if (!p) return null;
    const mapped = { ...p } as any;
    mapped.location_link = mapped.map_embed_url;
    return mapped;
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const p = await this.projectRepo.findBySlug(slug);
    if (!p) return null;
    const mapped = { ...p } as any;
    mapped.location_link = mapped.map_embed_url;
    return mapped;
  }

  async listFeaturedProjects(limit: number = 6): Promise<Project[]> {
    const list = await this.projectRepo.listFeatured(limit);
    return list.map((p) => {
      const mapped = { ...p } as any;
      mapped.location_link = mapped.map_embed_url;
      return mapped;
    });
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    // 1. Process thumbnail image if base64
    if (data.thumbnail_url && this.storageService.isBase64DataUrl(data.thumbnail_url)) {
      data.thumbnail_url = await this.storageService.uploadImage(data.thumbnail_url, "projects");
    }

    // 2. Process gallery images if base64
    if (data.gallery_urls && Array.isArray(data.gallery_urls)) {
      data.gallery_urls = await this.storageService.uploadImages(data.gallery_urls, "projects");
    }

    // Map location_link -> map_embed_url for database (with smart URL conversion)
    const dbData = { ...data } as any;
    if ("location_link" in dbData) {
      dbData.map_embed_url = toMapEmbedUrl(dbData.location_link || "");
      delete dbData.location_link;
    }

    // 3. Save to database
    const created = await this.projectRepo.create(dbData);

    // Map map_embed_url -> location_link for frontend
    const result = { ...created } as any;
    result.location_link = result.map_embed_url;
    return result;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const hasMediaUpdates =
      "video_url" in updates ||
      "brochure_url" in updates ||
      "thumbnail_url" in updates ||
      "gallery_urls" in updates;

    if (hasMediaUpdates) {
      const current = await this.projectRepo.find(id);
      if (current) {
        if ("video_url" in updates && current.video_url && current.video_url !== updates.video_url) {
          await this.storageService.deleteByUrl(current.video_url);
        }
        if ("brochure_url" in updates && current.brochure_url && current.brochure_url !== updates.brochure_url) {
          await this.storageService.deleteByUrl(current.brochure_url);
        }
        if ("thumbnail_url" in updates && current.thumbnail_url && current.thumbnail_url !== updates.thumbnail_url) {
          await this.storageService.deleteByUrl(current.thumbnail_url);
        }
        if (updates.gallery_urls && Array.isArray(updates.gallery_urls) && current.gallery_urls) {
          const removed = current.gallery_urls.filter((url) => !updates.gallery_urls?.includes(url));
          for (const url of removed) {
            await this.storageService.deleteByUrl(url);
          }
        }
      }
    }

    // 1. Process thumbnail image if base64
    if (updates.thumbnail_url && this.storageService.isBase64DataUrl(updates.thumbnail_url)) {
      updates.thumbnail_url = await this.storageService.uploadImage(
        updates.thumbnail_url,
        "projects",
      );
    }

    // 2. Process gallery images if base64
    if (updates.gallery_urls && Array.isArray(updates.gallery_urls)) {
      updates.gallery_urls = await this.storageService.uploadImages(
        updates.gallery_urls,
        "projects",
      );
    }

    // Map location_link -> map_embed_url for database (with smart URL conversion)
    const dbUpdates = { ...updates } as any;
    if ("location_link" in dbUpdates) {
      dbUpdates.map_embed_url = toMapEmbedUrl(dbUpdates.location_link || "");
      delete dbUpdates.location_link;
    }

    // 3. Update database
    const updated = await this.projectRepo.update(id, dbUpdates);

    // Map map_embed_url -> location_link for frontend
    const result = { ...updated } as any;
    result.location_link = result.map_embed_url;
    return result;
  }

  async deleteProject(id: string): Promise<void> {
    const current = await this.projectRepo.find(id);
    if (current) {
      if (current.video_url) {
        await this.storageService.deleteByUrl(current.video_url);
      }
      if (current.brochure_url) {
        await this.storageService.deleteByUrl(current.brochure_url);
      }
      if (current.thumbnail_url) {
        await this.storageService.deleteByUrl(current.thumbnail_url);
      }
      if (current.gallery_urls && Array.isArray(current.gallery_urls)) {
        for (const url of current.gallery_urls) {
          await this.storageService.deleteByUrl(url);
        }
      }
    }
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
    // 1. Process plot images if base64
    if (data.images && Array.isArray(data.images)) {
      data.images = await this.storageService.uploadImages(data.images, "plots");
    }

    // 2. Create plot
    return this.plotRepo.create(data);
  }

  async updatePlot(id: string, updates: Partial<Plot>): Promise<Plot> {
    // 1. Process plot images if base64
    if (updates.images && Array.isArray(updates.images)) {
      updates.images = await this.storageService.uploadImages(updates.images, "plots");
    }

    // 2. Update plot
    return this.plotRepo.update(id, updates);
  }

  async deletePlot(id: string): Promise<void> {
    return this.plotRepo.delete(id);
  }
}
