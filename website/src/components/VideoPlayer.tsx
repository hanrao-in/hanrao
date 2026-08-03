import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  className?: string;
  autoplayVisible?: boolean;
}

export function VideoPlayer({ src, poster, className = "", autoplayVisible = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isEmbed = src.includes("youtube.com") || src.includes("youtu.be") || src.includes("vimeo.com");

  // IntersectionObserver for autoplay when visible and pause when offscreen
  useEffect(() => {
    if (isEmbed || !autoplayVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting) {
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [src, isEmbed, autoplayVisible]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  if (isEmbed) {
    let embedUrl = src;
    if (src.includes("youtube.com/watch?v=")) {
      embedUrl = src.replace("watch?v=", "embed/");
    } else if (src.includes("youtu.be/")) {
      embedUrl = `https://www.youtube.com/embed/${src.split("youtu.be/")[1]}`;
    }

    return (
      <div className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-luxe ${className}`}>
        <iframe
          src={embedUrl}
          title="Project Hero Video"
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-luxe ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted={isMuted}
        preload="metadata"
        className="h-full w-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controls overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex justify-end">
          <span className="rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-white uppercase tracking-wider">
            Project Hero Video
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="rounded-full bg-white/90 p-2.5 text-foreground hover:bg-white transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              className="rounded-full bg-black/60 backdrop-blur-sm p-2.5 text-white hover:bg-black/80 transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Fullscreen video"
            className="rounded-full bg-black/60 backdrop-blur-sm p-2.5 text-white hover:bg-black/80 transition-colors"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
