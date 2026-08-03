/**
 * Browser-side Image Pipeline
 * - Compress large images with canvas
 * - Strip EXIF metadata
 * - Convert to WebP format
 * - Generate 300px WebP thumbnail
 */

export interface ProcessedImageResult {
  dataUrl: string;
  thumbnailDataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export function validateImageFile(file: File, maxMb = 10): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: `Invalid image format "${file.type}". Must be JPG, PNG, or WebP.` };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { valid: false, error: `Image "${file.name}" exceeds maximum size limit of ${maxMb}MB.` };
  }
  return { valid: true };
}

export function validateDocumentFile(file: File, maxMb = 15): { valid: boolean; error?: string } {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: `Invalid brochure format. Must be PDF, PNG, or JPG.` };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { valid: false, error: `Brochure file exceeds maximum size limit of ${maxMb}MB.` };
  }
  return { valid: true };
}

export function validateVideoFile(file: File, maxMb = 50): { valid: boolean; error?: string } {
  const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: `Invalid video format "${file.type}". Must be MP4, MOV, or WEBM.` };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { valid: false, error: `Video file exceeds maximum size limit of ${maxMb}MB.` };
  }
  return { valid: true };
}

export async function processImagePipeline(
  file: File,
  maxDimension = 1920,
  quality = 0.85,
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image element."));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          // Main Canvas (EXIF Stripped, Resized, WebP)
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas 2d context.");

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/webp", quality);

          // Thumbnail Canvas (300px max)
          const thumbMax = 300;
          let thumbW = width;
          let thumbH = height;
          if (thumbW > thumbMax || thumbH > thumbMax) {
            if (thumbW > thumbH) {
              thumbH = Math.round((thumbH * thumbMax) / thumbW);
              thumbW = thumbMax;
            } else {
              thumbW = Math.round((thumbW * thumbMax) / thumbH);
              thumbH = thumbMax;
            }
          }

          const thumbCanvas = document.createElement("canvas");
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const thumbCtx = thumbCanvas.getContext("2d");
          if (!thumbCtx) throw new Error("Could not get thumbnail canvas context.");

          thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
          const thumbnailDataUrl = thumbCanvas.toDataURL("image/webp", 0.75);

          const compressedSize = Math.round((dataUrl.length * 3) / 4);

          resolve({
            dataUrl,
            thumbnailDataUrl,
            originalSize: file.size,
            compressedSize,
            width,
            height,
          });
        } catch (err: any) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
