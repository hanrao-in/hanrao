import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Phone, Ruler, ImageIcon } from "lucide-react";
import { SITE, formatPricePerSqYd } from "@/lib/site";
import type { Project } from "@/lib/types";
import { useState } from "react";

type Props = {
  project: Project & {
    _minPrice?: number;
    _availableCount?: number;
    _plotCount?: number;
    _plotImages?: string[];
  };
  index?: number;
};

// Availability pill colours
function AvailabilityPill({ available, total }: { available: number; total: number }) {
  if (total === 0) return null;
  const pct = total > 0 ? available / total : 0;
  const colour =
    available === 0
      ? "bg-muted text-muted-foreground"
      : pct > 0.5
        ? "bg-primary/10 text-primary"
        : "bg-[color:var(--gold)]/20 text-[color:var(--terracotta)]";
  const label =
    available === 0 ? "Fully Booked" : available === 1 ? "1 plot left" : `${available} plots left`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${colour}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${available === 0 ? "bg-muted-foreground" : pct > 0.5 ? "bg-primary" : "bg-[color:var(--terracotta)]"}`}
      />
      {label}
    </span>
  );
}

// Placeholder gradient for missing thumbnails
function ImagePlaceholder({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-secondary via-muted to-secondary/60">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 font-serif text-4xl font-semibold text-primary">
        {initial}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Preview coming soon</p>
    </div>
  );
}

// Plot image strip — shows up to 4 thumbnails with click-to-enlarge lightbox
function PlotImageStrip({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className="px-5 pb-4 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5 mb-2">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plot Photos
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {images.slice(0, 4).map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox(src)}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted ring-1 ring-border hover:ring-primary/50 transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={src}
                alt={`Plot photo ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Full size plot photo"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

function cleanSlug(slug?: string, name?: string) {
  let s = (slug || "").trim();
  if (!s || s.startsWith("http://") || s.startsWith("https://")) {
    s = (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  return s;
}

export function ProjectCard({ project, index = 0 }: Props) {
  const minPrice = project._minPrice ?? 0;
  const available = project._availableCount ?? 0;
  const total = project._plotCount ?? 0;
  const plotImages = project._plotImages ?? [];

  // Use first plot image as thumbnail fallback if project has no thumbnail
  const effectiveThumbnail = project.thumbnail_url || plotImages[0] || "";
  const hasImage = Boolean(effectiveThumbnail);
  const safeSlug = cleanSlug(project.slug, project.name);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-luxe"
    >
      {/* ── Thumbnail ── */}
      <Link
        to="/projects/$slug"
        params={{ slug: safeSlug }}
        className="block overflow-hidden"
        aria-label={`View ${project.name} project details`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {hasImage ? (
            <img
              src={effectiveThumbnail}
              alt={`${project.name} — ${project.village}, ${project.district}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <ImagePlaceholder name={project.name} />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Approval badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {(project.approval_types || []).map((a) => (
              <span
                key={a}
                className="rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur-sm"
              >
                {a}
              </span>
            ))}
          </div>

          {/* Status badge */}
          {project.status === "upcoming" && (
            <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground shadow-sm">
              Upcoming
            </span>
          )}
          {project.status === "sold_out" && (
            <span className="absolute right-3 top-3 rounded-full bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sold Out
            </span>
          )}
        </div>
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-serif text-2xl font-semibold text-foreground leading-snug">
            {project.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            {[project.village, project.district].filter(Boolean).join(", ")}
          </p>
        </div>

        {/* Pricing + availability */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {minPrice > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Ruler className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {formatPricePerSqYd(minPrice)}
            </span>
          )}
          {total > 0 && <AvailabilityPill available={available} total={total} />}
        </div>

        {/* Description snippet */}
        {project.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {project.description}
          </p>
        )}

        {/* CTA row */}
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            to="/projects/$slug"
            params={{ slug: safeSlug }}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            View Details
          </Link>
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
              `Hi HanRao Realty, I'm interested in ${project.name}.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp enquiry for ${project.name}`}
            className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#20bb5a] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
          >
            <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M19.11 17.21c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.63.14-.19.28-.72.9-.88 1.09-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.24-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.44.12-.58.13-.13.28-.32.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.87-2.08-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35s-.99.97-.99 2.36.99 2.74 1.13 2.93c.14.19 1.95 2.98 4.72 4.18.66.28 1.18.45 1.58.58.66.21 1.26.18 1.74.11.53-.08 1.66-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33ZM16 3.2A12.8 12.8 0 0 0 4.62 22.02L3.2 28.8l6.98-1.4A12.8 12.8 0 1 0 16 3.2Zm0 23.31a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-4.14.83.83-4.04-.25-.4A10.5 10.5 0 1 1 16 26.51Z" />
            </svg>
            <span className="ml-1.5 hidden sm:inline">WhatsApp</span>
          </a>
          <a
            href={`tel:${SITE.phoneE164}`}
            aria-label={`Call about ${project.name}`}
            className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-transparent px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* ── Plot Photos Strip (only shown if plots have images) ── */}
      <PlotImageStrip images={plotImages} />
    </motion.article>
  );
}
