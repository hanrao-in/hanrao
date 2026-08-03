import React, { useState } from "react";
import { Video, Upload, Link, X, Play, Loader2 } from "lucide-react";
import { validateVideoFile } from "@/lib/imagePipeline";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  onUploadingStateChange?: (uploading: boolean) => void;
}

function parseStorageUrl(url: string): { bucket: string; filePath: string } | null {
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

export function VideoUploader({ value = "", onChange, onUploadingStateChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inputUrl, setInputUrl] = useState("");
  const [tab, setTab] = useState<"file" | "url">("file");

  const handleFile = async (file: File) => {
    const val = validateVideoFile(file, 50);
    if (!val.valid) {
      toast.error(val.error);
      return;
    }

    setLoading(true);
    setProgress(0);
    if (onUploadingStateChange) onUploadingStateChange(true);

    try {
      const ext = file.name.split(".").pop() || "mp4";
      const filePath = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      // Upload with chunked progress tracking
      const { data, error } = await supabase.storage.from("videos").upload(filePath, file, {
        contentType: file.type,
        upsert: true,
        onUploadProgress: (progressEvent: any) => {
          const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(pct);
        },
      } as any);

      if (error) {
        let msg = "Upload failed. Please try again.";
        const errorStr = (error.message || "").toLowerCase();
        if (errorStr.includes("bucket not found")) {
          msg = "Video storage bucket not found. Please contact administrator.";
        } else if (errorStr.includes("permission denied") || errorStr.includes("unauthorized")) {
          msg = "Access denied: You do not have permissions to upload videos.";
        } else if (errorStr.includes("payload too large") || errorStr.includes("413")) {
          msg = "Video exceeds size limit (Max: 50MB).";
        } else if (errorStr.includes("timeout")) {
          msg = "Connection timed out. Please check your network.";
        } else if (errorStr.includes("cancelled")) {
          msg = "Upload cancelled.";
        }
        throw new Error(msg);
      }

      setProgress(100);
      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(filePath);

      // If there was a previous video, delete it
      if (value) {
        const parsed = parseStorageUrl(value);
        if (parsed && parsed.bucket === "videos") {
          await supabase.storage.from("videos").remove([parsed.filePath]);
        }
      }

      onChange(publicUrl);
      toast.success(`Video "${file.name}" uploaded successfully.`);
    } catch (err: any) {
      toast.error(err.message || "Video upload failed. Please try again.");
    } finally {
      setLoading(false);
      setProgress(0);
      if (onUploadingStateChange) onUploadingStateChange(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      const parsed = parseStorageUrl(value);
      if (parsed && parsed.bucket === "videos") {
        try {
          await supabase.storage.from("videos").remove([parsed.filePath]);
          toast.success("Previous video file removed from storage.");
        } catch (e) {
          console.warn("Failed to delete video file from storage", e);
        }
      }
    }
    onChange("");
  };

  const applyUrl = () => {
    if (!inputUrl.trim()) return;
    onChange(inputUrl.trim());
    setInputUrl("");
    toast.success("Video URL applied.");
  };

  const isEmbed = value.includes("youtube.com") || value.includes("youtu.be") || value.includes("vimeo.com");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Project Hero Video (MP4 / MOV / WEBM / YouTube / Vimeo)
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-medium text-destructive hover:underline flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Remove Video
          </button>
        )}
      </div>

      {value ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black/90 flex items-center justify-center">
            {isEmbed ? (
              <iframe
                src={
                  value.includes("youtube.com/watch?v=")
                    ? value.replace("watch?v=", "embed/")
                    : value.includes("youtu.be/")
                    ? `https://www.youtube.com/embed/${value.split("youtu.be/")[1]}`
                    : value
                }
                title="Project Video"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={value} controls className="h-full w-full object-contain" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground truncate font-mono max-w-[70%]">{value}</p>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs font-medium text-primary hover:underline"
            >
              Replace Video
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex gap-2 border-b border-border pb-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab("file")}
              className={`px-3 py-1 rounded-md transition-colors ${
                tab === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              Upload Video File
            </button>
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`px-3 py-1 rounded-md transition-colors ${
                tab === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              YouTube / Vimeo Link
            </button>
          </div>

          {tab === "file" ? (
            <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/10 p-4 text-center cursor-pointer hover:bg-secondary/30 transition-colors">
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                disabled={loading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              {loading ? (
                <div className="w-full max-w-[200px] space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-[11px] font-semibold text-primary">Uploading ({progress}%)</span>
                  </div>
                  <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <Video className="h-6 w-6 text-muted-foreground/60" />
                  <p className="mt-1 text-xs font-medium text-foreground">Click to upload Video File</p>
                  <p className="text-[10px] text-muted-foreground">MP4, MOV, WEBM up to 50MB</p>
                </>
              )}
            </label>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={applyUrl}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                Apply URL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
