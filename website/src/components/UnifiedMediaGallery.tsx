import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video as VideoIcon,
  Image as ImageIcon,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectName: string;
  images: string[];
  videoUrl?: string;
  videoUrls?: string[];
  brochureUrl?: string;
}

export function UnifiedMediaGallery({
  projectName,
  images = [],
  videoUrl,
  videoUrls = [],
  brochureUrl
}: Props) {
  const [activeTab, setActiveTab] = useState<"photos" | "videos" | "brochure">("photos");
  const [activeLightbox, setActiveLightbox] = useState<number | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<number | null>(null);
  const [activeBrochurePreview, setActiveBrochurePreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  // Combine videos
  const allVideos = [videoUrl, ...videoUrls].filter(Boolean) as string[];

  // Share functionality
  const shareMedia = async (url?: string) => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: projectName, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightbox !== null) {
        if (e.key === "ArrowRight") {
          setActiveLightbox((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : prev));
          setZoomLevel(1);
        } else if (e.key === "ArrowLeft") {
          setActiveLightbox((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
          setZoomLevel(1);
        } else if (e.key === "Escape") {
          setActiveLightbox(null);
        }
      }
      if (activeVideoModal !== null) {
        if (e.key === "Escape") {
          setActiveVideoModal(null);
        } else if (e.key === "ArrowRight") {
          setActiveVideoModal((prev) => (prev !== null && prev < allVideos.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowLeft") {
          setActiveVideoModal((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
        }
      }
      if (activeBrochurePreview && e.key === "Escape") {
        setActiveBrochurePreview(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightbox, activeVideoModal, activeBrochurePreview, images.length, allVideos.length]);

  return (
    <div className="w-full space-y-6">
      {/* 1. HERO VIDEO BANNER */}
      {videoUrl && images[0] && (
        <div 
          onClick={() => setActiveVideoModal(0)}
          className="relative w-full h-[260px] sm:h-[380px] md:h-[460px] lg:h-[500px] rounded-[24px] overflow-hidden cursor-pointer group shadow-lg border border-border/40 bg-black/90 transition-all duration-300 hover:shadow-xl"
        >
          <img
            src={images[0]}
            alt={projectName}
            className="w-full h-full object-cover opacity-80 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-soft-luxe text-white transition-all duration-300 group-hover:bg-primary group-hover:border-primary"
            >
              <Play className="h-6 w-6 sm:h-8 sm:w-8 fill-current ml-1" />
            </motion.div>
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-primary">PROJECT TOUR</span>
              <h2 className="text-xl sm:text-3xl font-serif text-white font-semibold drop-shadow-md">
                Watch {projectName} Video Tour
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* 2. MEDIA SECTION NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Explore Media Gallery
          </h2>
        </div>
        <div className="flex p-1 bg-secondary/30 backdrop-blur-sm rounded-full border border-border/60 w-fit self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full tracking-wider uppercase transition-all ${
              activeTab === "photos"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Photos ({images.length})</span>
          </button>
          
          {allVideos.length > 0 && (
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full tracking-wider uppercase transition-all ${
                activeTab === "videos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <VideoIcon className="h-3.5 w-3.5" />
              <span>Videos ({allVideos.length})</span>
            </button>
          )}

          {brochureUrl && (
            <button
              onClick={() => setActiveTab("brochure")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full tracking-wider uppercase transition-all ${
                activeTab === "brochure"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Brochure</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. PHOTOS SECTION GRID */}
      {activeTab === "photos" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveLightbox(idx);
                setZoomLevel(1);
              }}
              className="relative aspect-square sm:aspect-[4/3] rounded-2xl md:rounded-[24px] overflow-hidden border border-border/40 bg-muted/30 cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Skeleton Placeholder */}
              {!imageLoaded[img] && (
                <div className="absolute inset-0 bg-gradient-to-r from-muted/50 via-muted-foreground/10 to-muted/50 animate-pulse" />
              )}
              <img
                src={img}
                alt={`${projectName} Photo ${idx + 1}`}
                loading="lazy"
                onLoad={() => setImageLoaded((prev) => ({ ...prev, [img]: true }))}
                className={`w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out ${
                  imageLoaded[img] ? "opacity-100" : "opacity-0"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-white text-xs font-medium tracking-wider">Photo {idx + 1} / {images.length}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. VIDEOS SECTION */}
      {activeTab === "videos" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allVideos.map((video, idx) => (
            <div
              key={idx}
              onClick={() => setActiveVideoModal(idx)}
              className="relative aspect-video rounded-[20px] md:rounded-[24px] overflow-hidden border border-border/40 bg-black/90 cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300"
            >
              {images[0] ? (
                <img
                  src={images[0]}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-[1.04] transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/30" />
              )}
              
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-colors" />

              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <span className="self-end rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-white tracking-wider">
                  {idx === 0 ? "TOUR" : `DRONE WALK #${idx}`}
                </span>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white transition-all group-hover:bg-primary group-hover:border-primary shadow-soft">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-white">
                      {idx === 0 ? "Project Walkthrough" : `Drone Video View #${idx}`}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-mono">0:48</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. BROCHURE SECTION */}
      {activeTab === "brochure" && brochureUrl && (
        <div className="max-w-xl mx-auto rounded-[24px] border border-border/60 bg-card p-6 md:p-8 text-center shadow-soft-luxe space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <FileText className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg md:text-xl font-bold tracking-tight">
              Official Project Brochure
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Explore the complete layout plan, HMDA/RERA approval documents, layout specifications, and connectivity charts.
            </p>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider bg-secondary/30 px-3 py-1 rounded-full w-fit mx-auto border border-border/45">
              File type: PDF Document (approx. 4.8 MB)
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={brochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`${projectName}-Brochure`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 hover:shadow-sm transition-all"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
            <button
              onClick={() => setActiveBrochurePreview(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-xs font-semibold hover:bg-secondary transition-colors"
            >
              <Maximize2 className="h-4 w-4" /> Preview Brochure
            </button>
          </div>
        </div>
      )}

      {/* 6. PHOTO LIGHTBOX MODAL */}
      <AnimatePresence>
        {activeLightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-lg p-4 select-none"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between w-full border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveLightbox(null)}
                className="flex items-center gap-2 text-white hover:text-primary transition-colors text-xs font-semibold uppercase tracking-wider"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="text-center">
                <h4 className="text-white text-xs font-semibold uppercase tracking-widest">{projectName}</h4>
                <p className="text-white/60 text-[10px] tracking-wide font-mono mt-0.5">
                  Photo {activeLightbox + 1} / {images.length}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <a
                  href={images[activeLightbox]}
                  download={`${projectName}-Photo-${activeLightbox + 1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10"
                  title="Download Image"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => shareMedia(images[activeLightbox])}
                  className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10"
                  title="Share Image"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveLightbox(null)}
                  className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image viewport */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
              <button
                onClick={() => {
                  setActiveLightbox((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
                  setZoomLevel(1);
                }}
                disabled={activeLightbox === 0}
                className="absolute left-2 z-10 rounded-full bg-black/40 border border-white/10 p-3 text-white hover:bg-black/60 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <motion.img
                key={activeLightbox}
                src={images[activeLightbox]}
                alt={`${projectName} Lightbox`}
                style={{ scale: zoomLevel }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: zoomLevel }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
              />

              <button
                onClick={() => {
                  setActiveLightbox((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : prev));
                  setZoomLevel(1);
                }}
                disabled={activeLightbox === images.length - 1}
                className="absolute right-2 z-10 rounded-full bg-black/40 border border-white/10 p-3 text-white hover:bg-black/60 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Bottom bar controls */}
            <div className="flex items-center justify-between w-full border-t border-white/10 pt-3 text-xs text-white/50 px-4">
              <button
                onClick={() => {
                  setActiveLightbox((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
                  setZoomLevel(1);
                }}
                disabled={activeLightbox === 0}
                className="hover:text-primary transition-colors disabled:opacity-20 flex items-center gap-1 font-semibold uppercase tracking-wider"
              >
                ← Previous
              </button>
              <span className="hidden sm:inline tracking-wider font-semibold">Swipe / Keys Navigation enabled</span>
              <button
                onClick={() => {
                  setActiveLightbox((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : prev));
                  setZoomLevel(1);
                }}
                disabled={activeLightbox === images.length - 1}
                className="hover:text-primary transition-colors disabled:opacity-20 flex items-center gap-1 font-semibold uppercase tracking-wider"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. VIDEO PLAYER MODAL */}
      <AnimatePresence>
        {activeVideoModal !== null && allVideos[activeVideoModal] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4"
          >
            {/* Modal Container */}
            <div className="relative max-w-5xl w-full flex flex-col bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Header Bar */}
              <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
                <span className="rounded-full bg-black/60 backdrop-blur-sm px-4 py-1.5 text-xs text-white font-semibold tracking-wider border border-white/10">
                  {projectName} — Video Tour
                </span>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="pointer-events-auto rounded-full bg-black/60 backdrop-blur-sm p-2 text-white hover:bg-black/80 border border-white/10 transition-colors shadow-soft"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Video frame */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                {/* Prev Control */}
                {activeVideoModal > 0 && (
                  <button
                    onClick={() => setActiveVideoModal(activeVideoModal - 1)}
                    className="absolute left-4 z-10 rounded-full bg-black/40 p-2.5 text-white hover:bg-black/60 border border-white/10 transition-all shadow-soft"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}

                <video
                  src={allVideos[activeVideoModal]}
                  autoPlay
                  controls
                  className="h-full w-full object-contain aspect-video"
                />

                {/* Next Control */}
                {activeVideoModal < allVideos.length - 1 && (
                  <button
                    onClick={() => setActiveVideoModal(activeVideoModal + 1)}
                    className="absolute right-4 z-10 rounded-full bg-black/40 p-2.5 text-white hover:bg-black/60 border border-white/10 transition-all shadow-soft"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. BROCHURE FULLSCREEN MODAL PREVIEW */}
      <AnimatePresence>
        {activeBrochurePreview && brochureUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4"
          >
            <div className="relative max-w-5xl h-[85vh] w-full flex flex-col bg-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <span className="font-serif text-sm font-bold tracking-tight text-foreground">
                  Preview — {projectName} Brochure
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={brochureUrl}
                    download={`${projectName}-Brochure`}
                    className="rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => setActiveBrochurePreview(false)}
                    className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Preview Document frame */}
              <iframe
                src={brochureUrl}
                title="Brochure PDF Preview"
                className="flex-1 w-full border-0 bg-muted"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
