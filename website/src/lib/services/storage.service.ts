import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { randomUUID } from "node:crypto";

export class StorageService {
  constructor(private readonly client = supabaseAdmin) {}

  /**
   * Helper to detect if a string is a base64 Data URL
   */
  isBase64DataUrl(value?: string): boolean {
    if (!value) return false;
    return value.startsWith("data:") && value.includes(";base64,");
  }

  /**
   * Extract bucket name and file path from a Supabase public Storage URL
   */
  parseStorageUrl(url: string): { bucket: string; filePath: string } | null {
    if (!url || !url.includes("/storage/v1/object/public/")) return null;
    try {
      const parts = url.split("/storage/v1/object/public/")[1]?.split("/");
      if (!parts || parts.length < 2) return null;
      const bucket = parts[0];
      const filePath = parts.slice(1).join("/");
      return { bucket, filePath };
    } catch {
      return null;
    }
  }

  /**
   * Deletes a file from Supabase Storage and media catalog by its public URL.
   */
  async deleteByUrl(url: string): Promise<boolean> {
    if (!url) return false;
    const parsed = this.parseStorageUrl(url);
    if (!parsed) return false;

    try {
      const { bucket, filePath } = parsed;
      await this.client.storage.from(bucket).remove([filePath]);
      await this.client.from("media").delete().eq("url", url);
      return true;
    } catch (err) {
      console.warn("[StorageService.deleteByUrl failed]", err);
      return false;
    }
  }

  /**
   * Uploads base64 image data to the given bucket, returns public URL.
   * If value is already an HTTP(S) URL, returns it as-is.
   */
  async uploadImage(value: string, bucketName: string): Promise<string> {
    if (!value || !value.trim()) return "";

    // If it's already a public URL, just return it
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    if (!this.isBase64DataUrl(value)) {
      throw new Error("Invalid image format: Must be an HTTP(S) URL or base64 data URL");
    }

    try {
      const commaIndex = value.indexOf(",");
      if (commaIndex === -1) {
        throw new Error("Failed to parse base64 image structure.");
      }

      const header = value.substring(0, commaIndex);
      const base64Data = value.substring(commaIndex + 1).replace(/\s/g, "");
      const buffer = Buffer.from(base64Data, "base64");

      const match = header.match(/^data:([^;]+);base64$/);
      if (!match) {
        throw new Error("Invalid base64 header structure.");
      }

      const contentType = match[1]; // e.g. "image/png", "image/webp", "application/pdf", "video/mp4"

      // Validate size (Images: 10MB, Videos: 50MB, Documents: 15MB)
      const isVideo = contentType.startsWith("video/");
      const isPdf = contentType.includes("pdf");
      const maxSize = isVideo ? 50 * 1024 * 1024 : isPdf ? 15 * 1024 * 1024 : 10 * 1024 * 1024;

      if (buffer.length > maxSize) {
        throw new Error(`File size exceeds maximum ${maxSize / (1024 * 1024)}MB limit.`);
      }

      // Determine extension
      let ext = "png";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("pdf")) ext = "pdf";
      else if (contentType.includes("mp4")) ext = "mp4";
      else if (contentType.includes("quicktime") || contentType.includes("mov")) ext = "mov";
      else if (contentType.includes("webm")) ext = "webm";

      const filename = `${randomUUID()}.${ext}`;
      const filePath = `uploads/${filename}`;

      // Upload binary to Supabase Storage
      const { error } = await this.client.storage.from(bucketName).upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.client.storage.from(bucketName).getPublicUrl(filePath);

      // Record in media catalog table
      await this.client.from("media").insert({
        url: publicUrl,
        bucket: bucketName,
        file_path: filePath,
        size_bytes: buffer.length,
        content_type: contentType,
      });

      return publicUrl;
    } catch (err: any) {
      console.error(`[StorageService Upload Error] [bucket: ${bucketName}]`, err);
      throw new Error(`Failed to upload asset: ${err.message}`);
    }
  }

  /**
   * Process and upload an array of base64 images
   */
  async uploadImages(values: string[], bucketName: string): Promise<string[]> {
    if (!values || !Array.isArray(values)) return [];
    return Promise.all(values.map((v) => this.uploadImage(v, bucketName)));
  }
}
