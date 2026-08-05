import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Compass,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  Ruler,
  Share2,
  ShieldCheck,
  ZoomIn,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { getProjectBySlug, submitEnquiry, submitSiteVisit } from "@/lib/supabase.functions";
import { SITE, formatINR, formatPricePerSqYd } from "@/lib/site";
import type { Plot, ProjectWithPlots } from "@/lib/types";
import { UnifiedMediaGallery } from "@/components/UnifiedMediaGallery";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData({
      queryKey: ["project", params.slug],
      queryFn: () => getProjectBySlug({ data: { slug: params.slug } }),
    });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Project not found — HanRao Prime Portal" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData;
    const location = [p.village, p.city, p.district, p.state].filter(Boolean).join(", ");
    const approvalText = (p.approval_types || []).length > 0 ? `${p.approval_types.join(", ")} Approved ` : "";
    const pageTitle = `${p.name} | ${approvalText}Open Plots in ${p.city || p.district || "Telangana"}`;
    const desc = `${p.name} in ${location}. ${approvalText}premium open plots available. ${p.description?.slice(0, 150) || ""}`;

    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: desc },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        ...(p.thumbnail_url ? [{ property: "og:image", content: p.thumbnail_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: `/projects/${p.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: p.name,
            description: desc,
            url: `https://hanrao.in/projects/${p.slug}`,
            image: p.thumbnail_url || p.gallery_urls?.[0],
            address: {
              "@type": "PostalAddress",
              addressLocality: p.city || p.district,
              addressRegion: p.state || "Andhra Pradesh",
              addressCountry: "IN",
            },
            offeredBy: {
              "@type": "RealEstateAgent",
              name: "HanRao Realty",
              url: "https://hanrao.in",
            },
          }),
        },
      ],
    };
  },
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const project = Route.useLoaderData();
  const { data } = useSuspenseQuery({
    queryKey: ["project", project.slug],
    queryFn: () => getProjectBySlug({ data: { slug: project.slug } }),
  });
  const p = (data ?? project) as ProjectWithPlots;

  useEffect(() => {
    if (p?.name) {
      trackEvent("project_view", {
        project_name: p.name,
        project_id: p.id,
        project_location: [p.village, p.city, p.district].filter(Boolean).join(", "),
        project_type: (p.approval_types || []).join(", "),
      });
    }
  }, [p?.id, p?.name]);

  const [activePlotImages, setActivePlotImages] = useState<string[] | null>(null);
  const [activePlotIndex, setActivePlotIndex] = useState(0);

  const availablePlots = p.plots.filter((x) => x.availability === "available");
  const minPrice = p.plots.length ? Math.min(...p.plots.map((x) => Number(x.price_per_sqyd))) : 0;
  const totalArea = p.plots.reduce((s, x) => s + Number(x.area_sqyd), 0);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: p.name, url });
      } catch {}
    } else if (url) {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="space-y-8">
      <UnifiedMediaGallery
        projectName={p.name}
        images={[p.thumbnail_url, ...(p.gallery_urls || [])].filter(Boolean) as string[]}
        videoUrl={p.video_url || undefined}
        videoUrls={p.video_urls || []}
        brochureUrl={p.brochure_url || undefined}
      />

      <div className="container-luxe grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(p.approval_types || []).map((a) => (
              <span
                key={a}
                className="rounded-full bg-primary/10 px-3 py-1 font-semibold uppercase tracking-wider text-primary"
              >
                {a} Approved
              </span>
            ))}
            {p.status === "upcoming" && (
              <span className="rounded-full bg-accent px-3 py-1 font-semibold uppercase tracking-wider text-accent-foreground">
                Upcoming
              </span>
            )}
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">{p.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            {[p.village, p.district, p.state].filter(Boolean).join(", ")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={Ruler}
              label="Starting"
              value={minPrice ? formatPricePerSqYd(minPrice) : "—"}
            />
            <Stat icon={Compass} label="Total Plots" value={String(p.plots.length)} />
            <Stat icon={ShieldCheck} label="Available" value={String(availablePlots.length)} />
            <Stat
              icon={MapPin}
              label="Total Area"
              value={`${totalArea.toLocaleString("en-IN")} sq.yd`}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={share}
              aria-label="Share this project"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/50 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            {p.brochure_url && (
              <a
                href={p.brochure_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("brochure_download", { project_name: p.name })}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/50 transition-colors"
              >
                <Download className="h-4 w-4" /> Brochure
              </a>
            )}
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                `Hi HanRao Realty, I'm interested in ${p.name}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("whatsapp_click", { location: "project_detail", project_name: p.name })}
              aria-label={`WhatsApp enquiry for ${p.name}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#20bb5a] hover:shadow-md transition-all"
            >
              <svg viewBox="0 0 32 32" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M19.11 17.21c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.63.14-.19.28-.72.9-.88 1.09-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.24-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.44.12-.58.13-.13.28-.32.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.87-2.08-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35s-.99.97-.99 2.36.99 2.74 1.13 2.93c.14.19 1.95 2.98 4.72 4.18.66.28 1.18.45 1.58.58.66.21 1.26.18 1.74.11.53-.08 1.66-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33ZM16 3.2A12.8 12.8 0 0 0 4.62 22.02L3.2 28.8l6.98-1.4A12.8 12.8 0 1 0 16 3.2Zm0 23.31a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-4.14.83.83-4.04-.25-.4A10.5 10.5 0 1 1 16 26.51Z" />
              </svg>
              WhatsApp
            </a>
            <a
              href={`tel:${SITE.phoneE164}`}
              onClick={() => trackEvent("phone_click", { location: "project_detail", project_name: p.name })}
              aria-label={`Call HanRao Realty about ${p.name}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          </div>

          <Section title="About this project">
            <p className="whitespace-pre-line leading-relaxed text-foreground/85">
              {p.description}
            </p>
          </Section>

          {(p.amenities || []).length > 0 && (
            <Section title="Amenities">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(p.amenities || []).map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-border"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Available plots">
            <div className="table-responsive-container rounded-2xl ring-1 ring-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Plot #</th>
                    <th className="px-4 py-3 text-left">Area</th>
                    <th className="px-4 py-3 text-left">Facing</th>
                    <th className="px-4 py-3 text-left">Price/sq.yd</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Photos</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {p.plots.map((pl: Plot) => {
                    const total = Number(pl.area_sqyd) * Number(pl.price_per_sqyd);
                    const plotPhotos = pl.images || [];
                    return (
                      <tr key={pl.id}>
                        <td className="px-4 py-3 font-medium">{pl.plot_number}</td>
                        <td className="px-4 py-3">{pl.area_sqyd} yd²</td>
                        <td className="px-4 py-3">{pl.facing}</td>
                        <td className="px-4 py-3">
                          {formatPricePerSqYd(Number(pl.price_per_sqyd))}
                        </td>
                        <td className="px-4 py-3 font-medium">{formatINR(total)}</td>
                        <td className="px-4 py-3">
                          {plotPhotos.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActivePlotImages(plotPhotos);
                                setActivePlotIndex(0);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              <span>{plotPhotos.length}</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground/35 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <AvailabilityBadge value={pl.availability} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {p.nearby && (
            <Section title="Nearby">
              <div className="grid gap-3 sm:grid-cols-2">
                {p.nearby.schools && p.nearby.schools.length > 0 && (
                  <NearbyGroup title="Schools" items={p.nearby.schools} />
                )}
                {p.nearby.hospitals && p.nearby.hospitals.length > 0 && (
                  <NearbyGroup title="Hospitals" items={p.nearby.hospitals} />
                )}
                {p.nearby.highway_km !== undefined && (
                  <NearbyGroup
                    title="Connectivity"
                    items={[
                      { name: "Nearest Highway", distance: `${p.nearby.highway_km} km` },
                      ...(p.nearby.airport_km !== undefined
                        ? [{ name: "Airport", distance: `${p.nearby.airport_km} km` }]
                        : []),
                    ]}
                  />
                )}
              </div>
            </Section>
          )}

          <Section title="Location">
            {p.map_embed_url ? (
              <iframe
                src={getMapEmbedSrc(p.map_embed_url)}
                title={`Map of ${p.name}`}
                loading="lazy"
                allowFullScreen
                className="h-[380px] w-full rounded-2xl border border-border"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : p.map_lat && p.map_lng ? (
              <iframe
                src={`https://www.google.com/maps?q=${p.map_lat},${p.map_lng}&hl=en&z=14&output=embed`}
                title={`Map of ${p.name}`}
                loading="lazy"
                allowFullScreen
                className="h-[380px] w-full rounded-2xl border border-border"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <MapPlaceholder
                name={p.name}
                location={[p.village, p.district].filter(Boolean).join(", ")}
              />
            )}
          </Section>

          <Section title="Price Calculator">
            <PriceCalculator defaultPrice={minPrice || 20000} />
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div id="book" className="rounded-2xl bg-card p-6 shadow-luxe ring-1 ring-border">
            <h2 className="font-serif text-2xl font-semibold">Book a Site Visit</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complimentary transport from Nellore.
            </p>
            <SiteVisitForm projectId={p.id} projectName={p.name} />
          </div>
          <div className="mt-6 rounded-2xl bg-primary p-6 text-primary-foreground shadow-soft">
            <h3 className="font-serif text-xl font-semibold">Quick Enquiry</h3>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Prefer a callback? Drop your number and we'll ring you in 15 minutes.
            </p>
            <EnquiryForm projectId={p.id} projectName={p.name} />
          </div>
        </aside>
      </div>

      {/* Plot images lightbox */}
      <AnimatePresence>
        {activePlotImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePlotImages(null)}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setActivePlotImages(null)}
              aria-label="Close plot photos"
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 text-lg transition-colors font-sans"
            >
              ✕
            </button>
            <div className="relative flex max-h-[80vh] max-w-[90vw] items-center justify-center">
              <motion.img
                key={activePlotIndex}
                src={activePlotImages[activePlotIndex]}
                alt={`Plot photo ${activePlotIndex + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              />

              {activePlotImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePlotIndex(
                        (idx) => (idx - 1 + activePlotImages.length) % activePlotImages.length,
                      );
                    }}
                    aria-label="Previous photo"
                    className="absolute left-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 text-xl font-sans"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePlotIndex((idx) => (idx + 1) % activePlotImages.length);
                    }}
                    aria-label="Next photo"
                    className="absolute right-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 text-xl font-sans"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 text-sm font-medium text-white/80">
              Photo {activePlotIndex + 1} of {activePlotImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Ruler; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <Icon className="h-4 w-4 text-accent" />
      <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-serif text-lg font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="mt-10"
    >
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

function AvailabilityBadge({ value }: { value: "available" | "reserved" | "sold" }) {
  const map: Record<typeof value, string> = {
    available: "bg-primary/10 text-primary",
    reserved: "bg-[color:var(--gold)]/20 text-[color:var(--gold)]",
    sold: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${map[value]}`}
    >
      {value}
    </span>
  );
}

function NearbyGroup({
  title,
  items,
}: {
  title: string;
  items: { name: string; distance: string }[];
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((it) => (
          <li key={it.name} className="flex items-center justify-between gap-3">
            <span>{it.name}</span>
            <span className="text-muted-foreground">{it.distance}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Gallery placeholder when no images are provided
function GalleryPlaceholder({ name }: { name: string }) {
  return (
    <div className="container-luxe pt-6">
      <div className="flex aspect-[16/8] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-muted to-secondary/80 md:aspect-[16/6]">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10">
            <ZoomIn className="h-8 w-8 text-primary/60" aria-hidden="true" />
          </div>
          <p className="mt-4 font-serif text-2xl font-semibold text-foreground/70">{name}</p>
          <p className="mt-1 text-sm text-muted-foreground">Gallery images coming soon</p>
        </div>
      </div>
    </div>
  );
}

function Gallery({ images, name }: { images: string[]; name: string }) {
  const validImages = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (validImages.length === 0) return <GalleryPlaceholder name={name} />;

  return (
    <>
      <div className="container-luxe pt-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          {/* Main image */}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Open gallery fullscreen"
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                src={validImages[active]}
                alt={`${name} — photo ${active + 1} of ${validImages.length}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full object-cover"
                fetchPriority={active === 0 ? "high" : undefined}
              />
            </AnimatePresence>
            {/* Zoom hint */}
            <div className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
              <ZoomIn className="h-4 w-4 text-foreground" aria-hidden="true" />
            </div>
            {/* Image counter */}
            <div className="absolute left-3 bottom-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              {active + 1} / {validImages.length}
            </div>
          </button>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2 md:grid-cols-2">
            {validImages.slice(0, 4).map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View photo ${i + 1}`}
                aria-pressed={active === i}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg ring-2 transition-all duration-150 ${
                  active === i ? "ring-primary" : "ring-transparent hover:ring-primary/30"
                }`}
              >
                <img
                  src={src}
                  alt={`${name} thumbnail ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                {active === i && <div className="absolute inset-0 bg-primary/10" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close gallery"
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              ✕
            </button>
            <motion.img
              key={active}
              src={validImages[active]}
              alt={`${name} — photo ${active + 1}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
            {/* Prev / Next */}
            {validImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive((a) => (a - 1 + validImages.length) % validImages.length);
                  }}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive((a) => (a + 1) % validImages.length);
                  }}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  ›
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Convert any Google Maps URL to an embeddable format at render time
function getMapEmbedSrc(url: string): string {
  if (!url) return "";
  // Already an embed URL — use as-is
  if (url.includes("/maps/embed") || url.includes("output=embed")) {
    return url;
  }
  // Try extracting coordinates
  const coordMatch =
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=en&z=15&output=embed`;
  }
  // Try extracting ?q= query
  const qMatch = url.match(/[?&]q=([^&]+)/);
  if (qMatch) {
    return `https://www.google.com/maps?q=${qMatch[1]}&hl=en&z=15&output=embed`;
  }
  // Place name from URL path
  const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    return `https://www.google.com/maps?q=${placeMatch[1]}&hl=en&z=15&output=embed`;
  }
  // Fallback: use the whole URL as search query
  return `https://www.google.com/maps?q=${encodeURIComponent(url)}&hl=en&z=15&output=embed`;
}

// Google Maps placeholder — shown when map coordinates or embed URL are absent
function MapPlaceholder({ name, location }: { name: string; location: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-gradient-to-br from-secondary via-muted to-secondary/60">
      {/* Decorative grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative flex h-64 flex-col items-center justify-center gap-3 text-center md:h-80">
        {/* Pin icon */}
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 shadow-soft">
          <MapPin className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="font-serif text-xl font-semibold text-foreground">{name}</p>
          {location && <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>}
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Interactive map will appear once location coordinates are configured.
        </p>
        {location && (
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(name + " " + location + " Nellore")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Search on Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

function PriceCalculator({ defaultPrice }: { defaultPrice: number }) {
  const [areaStr, setAreaStr] = useState(String(240));
  const [priceStr, setPriceStr] = useState(String(defaultPrice));
  const area = Number(areaStr) || 0;
  const price = Number(priceStr) || 0;
  const total = area * price;

  const handleNumericChange =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip leading zeros: "02" → "2", but keep "0" as "0"
      const raw = e.target.value;
      if (raw === "" || raw === "-") {
        setter(raw);
        return;
      }
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        setter(String(parsed));
      }
    };

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h3 className="font-serif text-lg font-semibold">Price Calculator</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-muted-foreground">Area (sq.yd)</span>
          <input
            type="number"
            value={areaStr}
            min={0}
            onChange={handleNumericChange(setAreaStr)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Rate ₹/sq.yd</span>
          <input
            type="number"
            value={priceStr}
            min={0}
            onChange={handleNumericChange(setPriceStr)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="mt-4 rounded-xl bg-primary/5 p-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Total value</div>
        <div className="mt-1 font-serif text-2xl font-semibold text-primary">
          {formatINR(total)}
        </div>
      </div>
    </div>
  );
}



function SiteVisitForm({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setSubmitting(true);
        try {
          await submitSiteVisit({
            data: {
              name: String(fd.get("name") ?? "").trim(),
              phone: String(fd.get("phone") ?? "").trim(),
              email: (String(fd.get("email") ?? "").trim() || undefined) as string | undefined,
              preferred_date: String(fd.get("preferred_date") ?? ""),
              preferred_time: String(fd.get("preferred_time") ?? "10:00 AM"),
              message: (String(fd.get("message") ?? "").trim() || undefined) as string | undefined,
              project_id: projectId,
              project_name: projectName,
            },
          });
          toast.success("Site visit booked! We'll call you to confirm.");
          form.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
      className="mt-4 space-y-3"
    >
      <Input name="name" placeholder="Full name" required maxLength={100} />
      <Input
        name="phone"
        placeholder="Phone number"
        required
        type="tel"
        minLength={6}
        maxLength={20}
      />
      <Input name="email" placeholder="Email (optional)" type="email" maxLength={255} />
      <div className="grid grid-cols-2 gap-2">
        <Input
          name="preferred_date"
          type="date"
          required
          min={new Date().toISOString().split("T")[0]}
          icon={<Calendar className="h-4 w-4" />}
        />
        <select
          name="preferred_time"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          defaultValue="10:00 AM"
        >
          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <textarea
        name="message"
        rows={2}
        placeholder="Anything specific? (optional)"
        maxLength={2000}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? "Booking…" : "Book Site Visit"}
      </button>
    </form>
  );
}

function EnquiryForm({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setSubmitting(true);
        try {
          await submitEnquiry({
            data: {
              name: String(fd.get("name") ?? "").trim(),
              phone: String(fd.get("phone") ?? "").trim(),
              email: undefined,
              budget: (String(fd.get("budget") ?? "").trim() || undefined) as string | undefined,
              message: undefined,
              project_id: projectId,
              project_name: projectName,
            },
          });
          toast.success("We'll call you shortly.");
          form.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
      className="mt-4 space-y-3"
    >
      <input
        name="name"
        placeholder="Your name"
        required
        maxLength={100}
        className="w-full rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:border-primary-foreground/50"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone"
        required
        minLength={6}
        maxLength={20}
        className="w-full rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:border-primary-foreground/50"
      />
      <select
        name="budget"
        className="w-full rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2.5 text-sm text-primary-foreground outline-none focus:border-primary-foreground/50"
      >
        <option value="" className="text-foreground bg-background">
          Budget range (optional)
        </option>
        <option value="Under ₹10L" className="text-foreground bg-background">
          Under ₹10 Lakhs
        </option>
        <option value="₹10L–₹25L" className="text-foreground bg-background">
          ₹10 – ₹25 Lakhs
        </option>
        <option value="₹25L–₹50L" className="text-foreground bg-background">
          ₹25 – ₹50 Lakhs
        </option>
        <option value="₹50L–₹1Cr" className="text-foreground bg-background">
          ₹50 Lakhs – ₹1 Crore
        </option>
        <option value="Above ₹1Cr" className="text-foreground bg-background">
          Above ₹1 Crore
        </option>
      </select>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-primary-foreground py-3 text-sm font-medium text-primary transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Request Callback"}
      </button>
    </form>
  );
}

function Input({
  icon,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary ${icon ? "pl-9" : ""} ${className}`}
      />
    </div>
  );
}
