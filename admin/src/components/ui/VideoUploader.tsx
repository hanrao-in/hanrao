import React, { useState } from "react";
import { Video, Upload, Link, X, Play, Loader2 } from "lucide-react";
import { validateVideoFile } from "@/lib/imagePipeline";
import { toast } from "sonner";

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

export function VideoUploader({ value = "", onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [tab, setTab] = useState<"file" | "url">("file");

  const handleFile = (file: File) => {
    const val = validateVideoFile(file, 50);
    if (!val.valid) {
      toast.error(val.error);
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setLoading(false);
      toast.error("Failed to read video file.");
    };
    reader.onload = (e) => {
      setLoading(false);
      const res = e.target?.result as string;
      if (res) {
        onChange(res);
        toast.success(`Video "${file.name}" attached.`);
      }
    };
    reader.readAsDataURL(file);
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
            onClick={() => onChange("")}
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
              onClick={() => onChange("")}
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
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Video className="h-6 w-6 text-muted-foreground/60" />
              )}
              <p className="mt-1 text-xs font-medium text-foreground">Click to upload Video File</p>
              <p className="text-[10px] text-muted-foreground">MP4, MOV, WEBM up to 50MB</p>
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
