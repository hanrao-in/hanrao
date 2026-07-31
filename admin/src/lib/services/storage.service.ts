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
      const base64Data = value.substring(commaIndex + 1).replace(/\s/g, ""); // Strip line breaks/whitespace
      const buffer = Buffer.from(base64Data, "base64");

      const match = header.match(/^data:([^;]+);base64$/);
      if (!match) {
        throw new Error("Invalid base64 header structure.");
      }

      const contentType = match[1]; // e.g. "image/png" or "application/octet-stream"

      // Validate size (10MB limit)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("Image size exceeds maximum 10MB limit.");
      }

      // Determine extension
      let ext = "png";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("gif")) ext = "gif";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("svg")) ext = "svg";

      const filename = `${randomUUID()}.${ext}`;
      const filePath = `uploads/${filename}`;

      // Upload binary to Supabase Storage using admin client (bypasses RLS write restriction)
      const { data, error } = await this.client.storage.from(bucketName).upload(filePath, buffer, {
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

      // Record in the media table catalog
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
