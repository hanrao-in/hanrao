import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { randomUUID } from "node:crypto";

export class StorageService {
  constructor(private readonly client = supabaseAdmin) {}

  isBase64DataUrl(value?: string): boolean {
    if (!value) return false;
    return value.startsWith("data:image/") && value.includes(";base64,");
  }

  async uploadImage(value: string, bucketName: string): Promise<string> {
    if (!value || !value.trim()) return "";

    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    if (!this.isBase64DataUrl(value)) {
      throw new Error("Invalid image format: Must be an HTTP(S) URL or base64 data:image/");
    }

    try {
      const match = value.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!match) {
        throw new Error("Failed to parse base64 image structure.");
      }

      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("Image size exceeds maximum 10MB limit.");
      }

      let ext = "png";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      else if (contentType.includes("gif")) ext = "gif";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("svg")) ext = "svg";

      const filename = `${randomUUID()}.${ext}`;
      const filePath = `uploads/${filename}`;

      const { data, error } = await this.client.storage.from(bucketName).upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = this.client.storage.from(bucketName).getPublicUrl(filePath);

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

  async uploadImages(values: string[], bucketName: string): Promise<string[]> {
    if (!values || !Array.isArray(values)) return [];
    return Promise.all(values.map((v) => this.uploadImage(v, bucketName)));
  }
}
