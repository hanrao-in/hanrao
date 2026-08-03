import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Share2, Download, FileText, ZoomIn, X, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { VideoPlayer } from "./VideoPlayer";

interface Props {
  projectName: string;
  images: string[];
  videoUrl?: string;
  brochureUrl?: string;
}

export function UnifiedMediaGallery({ projectName, images = [], videoUrl, brochureUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeLightbox, setActiveLightbox] = useState<number | null>(null);

  // Unified items list
  const items: Array<{
    type: "video" | "image" | "brochure";
    url: string;
    label: string;
  }> = [];

  if (videoUrl) {
    items.push({ type: "video", url: videoUrl, label: "Hero Video" });
  }

  images.forEach((img, idx) => {
    items.push({ type: "image", url: img, label: `Photo #${idx + 1}` });
  });

  if (brochureUrl) {
    items.push({ type: "brochure", url: brochureUrl, label: "Brochure" });
  }

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const amount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: projectName, url });
      } catch {}
    } else if (url) {
      await navigator.clipboard.writeText(url);
      toast.success("Project link copied to clipboard");
    }
  };

  if (!items.length) return null;

  return (
    <div className="relative w-full space-y-3">
      {/* Scroll Controls */}
      <div className="flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold">Media Gallery</span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground font-medium">
            {items.length} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous media"
            className="rounded-full border border-border bg-card p-2 text-foreground shadow-sm hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next media"
            className="rounded-full border border-border bg-card p-2 text-foreground shadow-sm hover:bg-secondary transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Swipe Carousel */}
      <div
        ref={containerRef}
        className="flex w-full gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 pb-4 scrollbar-none select-none"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="relative flex-none w-[85vw] sm:w-[500px] md:w-[600px] aspect-[16/10] snap-center rounded-2xl overflow-hidden border border-border bg-card shadow-soft group"
          >
            {item.type === "video" ? (
              <VideoPlayer src={item.url} className="h-full w-full" />
            ) : item.type === "brochure" ? (
              <div className="h-full w-full bg-gradient-to-br from-primary/10 via-secondary/30 to-background flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Official Project Brochure</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Download or view the complete master plan, approvals, and layout specs.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`${projectName}-Brochure`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveLightbox(idx)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-semibold hover:bg-secondary transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" /> Fullscreen View
                  </button>
                </div>
              </div>
            ) : (
              // Image
              <div className="relative h-full w-full cursor-pointer" onClick={() => setActiveLightbox(idx)}>
                <img
                  src={item.url}
                  alt={`${projectName} photo ${idx + 1}`}
                  loading={idx < 2 ? "eager" : "lazy"}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top overlay badge */}
                <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-white shadow-sm">
                  {item.label}
                </div>

                {/* Action buttons overlay */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      share();
                    }}
                    className="rounded-full bg-white/90 p-2 text-foreground shadow-md hover:bg-white"
                    title="Share link"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLightbox(idx);
                    }}
                    className="rounded-full bg-white/90 p-2 text-foreground shadow-md hover:bg-white"
                    title="Zoom Fullscreen"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeLightbox !== null && items[activeLightbox] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveLightbox(null)}
            className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            {items[activeLightbox].type === "brochure" ? (
              <iframe
                src={items[activeLightbox].url}
                title="Brochure Lightbox"
                className="h-[80vh] w-full rounded-2xl border-0 bg-white"
              />
            ) : (
              <img
                src={items[activeLightbox].url}
                alt={items[activeLightbox].label}
                className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
