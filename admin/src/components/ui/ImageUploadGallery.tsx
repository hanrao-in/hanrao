import React, { useState } from "react";
import { Upload, X, RefreshCw, MoveLeft, MoveRight, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { processImagePipeline, validateImageFile } from "@/lib/imagePipeline";
import { toast } from "sonner";

export interface GalleryItem {
  id: string;
  url: string; // Base64 compressed or HTTPS public URL
  thumbnailUrl?: string;
  status: "idle" | "compressing" | "ready" | "error";
  progress: number;
  errorMessage?: string;
  file?: File;
}

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUploadGallery({ urls = [], onChange, maxFiles = 20 }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(() =>
    urls.map((u, idx) => ({
      id: `existing-${idx}-${u.slice(-10)}`,
      url: u,
      status: "ready",
      progress: 100,
    })),
  );

  const syncParent = (newItems: GalleryItem[]) => {
    setItems(newItems);
    const validUrls = newItems
      .filter((i) => i.status === "ready" || i.status === "idle")
      .map((i) => i.url);
    onChange(validUrls);
  };

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    if (items.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} gallery photos allowed.`);
      return;
    }

    const newItems: GalleryItem[] = [...items];

    for (const file of files) {
      const val = validateImageFile(file, 10);
      if (!val.valid) {
        toast.error(val.error);
        continue;
      }

      const itemId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const placeholder: GalleryItem = {
        id: itemId,
        url: "",
        file,
        status: "compressing",
        progress: 30,
      };
      newItems.push(placeholder);
      setItems([...newItems]);

      try {
        const processed = await processImagePipeline(file);
        const idx = newItems.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          newItems[idx] = {
            ...newItems[idx],
            url: processed.dataUrl,
            thumbnailUrl: processed.thumbnailDataUrl,
            status: "ready",
            progress: 100,
          };
          syncParent([...newItems]);
        }
      } catch (err: any) {
        const idx = newItems.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          newItems[idx] = {
            ...newItems[idx],
            status: "error",
            errorMessage: err.message || "Compression failed",
            progress: 0,
          };
          setItems([...newItems]);
        }
        toast.error(`Failed to process "${file.name}"`);
      }
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) handleFiles(files);
  };

  const removeItem = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    syncParent(next);
  };

  const moveItem = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    syncParent(next);
  };

  const retryItem = async (item: GalleryItem) => {
    if (!item.file) return;
    const next = items.map((i) => (i.id === item.id ? { ...i, status: "compressing" as const, progress: 50 } : i));
    setItems(next);
    try {
      const processed = await processImagePipeline(item.file);
      const updated = next.map((i) =>
        i.id === item.id ? { ...i, url: processed.dataUrl, status: "ready" as const, progress: 100 } : i,
      );
      syncParent(updated);
    } catch (e: any) {
      const updated = next.map((i) =>
        i.id === item.id ? { ...i, status: "error" as const, errorMessage: e.message } : i,
      );
      setItems(updated);
    }
  };

  return (
    <div className="space-y-3">
      {/* Dropzone header */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20 p-5 text-center transition-colors hover:bg-secondary/40 cursor-pointer"
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleFiles(files);
            e.target.value = "";
          }}
        />
        <div className="rounded-full bg-primary/10 p-2.5 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <p className="mt-2 text-xs font-semibold text-foreground">
          Drag & Drop Gallery Photos or <span className="text-primary underline">Browse Files</span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Supports JPG, PNG, WebP · Max 10MB per file · Auto WebP compression
        </p>
      </div>

      {/* Gallery Cards Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
            >
              {/* Image Preview / Skeleton */}
              <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {item.status === "compressing" ? (
                  <div className="flex flex-col items-center gap-2 p-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-[10px] font-medium text-muted-foreground">Optimizing...</span>
                  </div>
                ) : item.status === "error" ? (
                  <div className="flex flex-col items-center gap-1.5 p-2 text-destructive text-center">
                    <AlertCircle className="h-6 w-6" />
                    <span className="text-[10px] line-clamp-2">{item.errorMessage || "Error"}</span>
                    <button
                      type="button"
                      onClick={() => retryItem(item)}
                      className="mt-1 flex items-center gap-1 text-[10px] font-medium text-primary underline"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  </div>
                ) : item.url ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={`Gallery ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}

                {/* Status Badge */}
                {item.status === "ready" && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500/90 p-0.5 text-white shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                )}

                {/* Controls overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveItem(idx, "left")}
                      title="Move Left"
                      className="rounded-full bg-white/90 p-1.5 text-foreground hover:bg-white"
                    >
                      <MoveLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {idx < items.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveItem(idx, "right")}
                      title="Move Right"
                      className="rounded-full bg-white/90 p-1.5 text-foreground hover:bg-white"
                    >
                      <MoveRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title="Remove Photo"
                    className="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] bg-secondary/30 text-muted-foreground">
                <span>Photo #{idx + 1}</span>
                <span className="font-mono text-[10px]">
                  {item.file ? `${(item.file.size / 1024 / 1024).toFixed(1)}MB` : "Saved"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
