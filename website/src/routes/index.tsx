import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award,
  Building2,
  ChevronDown,
  MapPin,
  Shield,
  Sparkles,
  Star,
  TreePine,
  TrendingUp,
  Users,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectGridSkeleton } from "@/components/LoadingSkeleton";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { NewProjectsComingSoon } from "@/components/NewProjectsComingSoon";
import { listFeaturedProjects } from "@/lib/supabase.functions";
import { SITE } from "@/lib/site";
import heroImg from "@/assets/hero.jpg";

const featuredQuery = {
  queryKey: ["projects", "featured"],
  queryFn: () => listFeaturedProjects(),
};

export const Route = createFileRoute("/")({
  loader: ({ context }: any) => context.queryClient.ensureQueryData(featuredQuery),
  head: () => ({
    meta: [
      // ── Primary SEO ──────────────────────────────────────────────────────────
      { title: "HanRao Realty — Premium HMDA, DTCP & RERA Approved Open Plots | Nellore & Andhra Pradesh" },
      {
        name: "description",
        content:
          "HanRao Realty offers premium HMDA, DTCP and RERA approved open plots, villa plots and farm land for sale across Nellore, Kavali, and Andhra Pradesh.",
      },
      {
        name: "keywords",
        content:
          "HanRao Realty, open plots Nellore, Kavali plots, HMDA plots, DTCP plots, RERA approved plots, gated community plots, real estate Andhra Pradesh",
      },
      { name: "author", content: "HanRao Realty" },
      { name: "robots", content: "index, follow" },
      // ── Open Graph ───────────────────────────────────────────────────────────
      { property: "og:type", content: "website" },
      { property: "og:title", content: "HanRao Realty — Premium HMDA, DTCP & RERA Approved Open Plots | Nellore & Andhra Pradesh" },
      {
        property: "og:description",
        content:
          "Explore premium HMDA, DTCP and RERA approved gated community open plots across Nellore, Kavali, and Andhra Pradesh.",
      },
      { property: "og:url", content: "https://hanrao.in" },
      { property: "og:image", content: "https://hanrao.in/og-image.png" },
      // ── Twitter Card ─────────────────────────────────────────────────────────
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HanRao Realty — Premium HMDA, DTCP & RERA Approved Open Plots | Nellore & Andhra Pradesh" },
      {
        name: "twitter:description",
        content:
          "Explore premium HMDA, DTCP and RERA approved gated community open plots across Nellore, Kavali, and Andhra Pradesh.",
      },
      { name: "twitter:image", content: "https://hanrao.in/og-image.png" },
    ],
    links: [
      // ── Canonical ────────────────────────────────────────────────────────────
      { rel: "canonical", href: "https://hanrao.in" },
      {
        rel: "preload",
        as: "image",
        href: heroImg,
      },
    ],
    scripts: [
      // ── RealEstateAgent Structured Data (JSON-LD) ─────────────────────────────
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: "HanRao Realty",
          url: "https://hanrao.in",
          logo: "https://hanrao.in/favicon.png",
          image: "https://hanrao.in/og-image.png",
          description:
            "Premium HMDA, DTCP & RERA approved open plots, villa plots, and farm lands for sale across Nellore.",
          telephone: "+918341505195",
          address: {
            "@type": "PostalAddress",
            streetAddress: SITE.office.address,
            addressLocality: SITE.office.locality,
            addressRegion: SITE.office.state,
            postalCode: SITE.office.postalCode,
            addressCountry: "IN",
          },
        }),
      },
    ],
  }),
  component: HomePage,
} as any);

function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Suspense fallback={<FeaturedProjectsFallback />}>
        <FeaturedProjects />
      </Suspense>
      <Amenities />
      <WhyUs />
      <Reviews />
      <FAQ />
      <CTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden" aria-label="Hero">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Aerial view of a premium gated plotted community at golden hour"
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background" />
      </div>
      <div className="container-luxe flex min-h-[88vh] flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-background/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Premium Real Estate · Nellore
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
          className="mt-6 max-w-4xl text-balance font-serif text-5xl font-semibold leading-[1.05] text-primary-foreground sm:text-6xl md:text-7xl"
        >
          Where your <span className="italic text-[color:var(--gold)]">next address</span> begins.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
          className="mt-5 max-w-2xl text-balance text-lg text-primary-foreground/90"
        >
          Curated HMDA, DTCP and RERA approved open plots, villa plots and farm land across
          Nellore's most sought-after locations.
        </motion.p>

        {/* Smart search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
          className="mt-9 w-full max-w-2xl"
        >
          <SmartSearchBar
            placeholder="Search by location, village, district or project"
            size="lg"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-primary-foreground/80"
        >
          <span className="opacity-70">Popular:</span>
          {["Shamshabad", "Kompally", "Sangareddy", "Shankarpally", "Adibatla"].map((t) => (
            <Link
              key={t}
              to="/search"
              search={{ q: t }}
              className="rounded-full border border-primary-foreground/30 px-3 py-1 transition-colors hover:bg-primary-foreground/10"
            >
              {t}
            </Link>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <ChevronDown className="h-6 w-6 text-primary-foreground/60" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { icon: Building2, label: "Premium Projects", value: "20+" },
    { icon: Users, label: "Happy Families", value: "500+" },
    { icon: Award, label: "Years of Trust", value: "12" },
    { icon: TrendingUp, label: "Avg. Appreciation", value: "18% p.a." },
  ];
  return (
    <section className="border-b border-border/60 bg-secondary/50 py-8" aria-label="Key statistics">
      <div className="container-luxe grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="flex items-center gap-3"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-serif text-2xl font-semibold text-foreground">{s.value}</div>
              <div className="truncate text-xs text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProjectsFallback() {
  return (
    <section className="container-luxe py-20 md:py-24">
      <SectionHeading
        eyebrow="Featured"
        title="Signature Projects"
        subtitle="Handpicked communities where design, location and value converge."
      />
      <ProjectGridSkeleton count={3} />
    </section>
  );
}

function FeaturedProjects() {
  const { data } = useSuspenseQuery(featuredQuery);
  return (
    <section className="container-luxe py-20 md:py-24" aria-label="Featured projects">
      <SectionHeading
        eyebrow="Featured"
        title="Signature Projects"
        subtitle="Handpicked communities where design, location and value converge."
      />
      {data.length === 0 ? (
        <div className="mt-10 max-w-3xl mx-auto">
          <NewProjectsComingSoon />
        </div>
      ) : (
        <>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              View all projects
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function Amenities() {
  const items = [
    {
      icon: Shield,
      title: "Gated Community",
      body: "24/7 security, CCTV surveillance and gated access.",
    },
    {
      icon: TreePine,
      title: "Landscaped Gardens",
      body: "Lush parks, avenue plantations and open green spaces.",
    },
    {
      icon: Building2,
      title: "Clubhouse",
      body: "Modern clubhouse with gym, pool and community hall.",
    },
    {
      icon: MapPin,
      title: "Prime Locations",
      body: "Strategic addresses with excellent connectivity.",
    },
    { icon: Award, title: "Full Approvals", body: "HMDA, DTCP and RERA approved layouts only." },
    {
      icon: TrendingUp,
      title: "High Appreciation",
      body: "Locations with proven long-term value growth.",
    },
  ];
  return (
    <section className="bg-secondary/40 py-20 md:py-24" aria-label="Amenities">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Amenities"
          title="Thoughtfully crafted for you"
          subtitle="Every HanRao community is designed for the way modern families live."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border/60 transition-shadow hover:shadow-luxe"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent">
                <it.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold">{it.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const reasons = [
    {
      title: "Verified Legal Titles",
      body: "Every plot is title-verified with a full legal audit before listing.",
    },
    {
      title: "Transparent Pricing",
      body: "Clear per-sq.yd pricing with no hidden fees. What you see is what you pay.",
    },
    {
      title: "End-to-End Support",
      body: "From site visit to registration — our team walks with you every step.",
    },
    {
      title: "Post-Sale Services",
      body: "Compound wall, boundary demarcation and construction referrals on request.",
    },
  ];
  return (
    <section className="container-luxe py-20 md:py-24" aria-label="Why HanRao Realty">
      <SectionHeading
        eyebrow="Why HanRao Realty"
        title="Trusted by families across Nellore"
        subtitle="Twelve years of curated real estate, delivered with integrity."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 2) * 0.06 }}
            className="flex gap-4 rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border/60"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-serif text-lg">
              {i + 1}
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold">{r.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Reviews() {
  const reviews = [
    {
      name: "Ramesh K.",
      city: "Shamshabad",
      text: "The team walked us through every step. Registration was smooth and our plot's value has already grown 30% in two years.",
    },
    {
      name: "Priya S.",
      city: "Kompally",
      text: "Transparent pricing and honest advice. We looked at three developers — HanRao was the clear choice.",
    },
    {
      name: "Anil Reddy",
      city: "Shankarpally",
      text: "Our villa plot is exactly what was shown on the layout. Refreshing to work with builders you can trust.",
    },
  ];
  return (
    <section
      className="bg-primary py-20 text-primary-foreground md:py-24"
      aria-label="Customer testimonials"
    >
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Testimonials"
          title="Kind words from our owners"
          subtitle="Nothing matters more than the trust of the families we serve."
          light
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.figure
              key={r.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl bg-primary-foreground/5 p-6 ring-1 ring-primary-foreground/15 backdrop-blur"
            >
              <div className="flex gap-0.5 text-[color:var(--gold)]">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 font-serif text-lg leading-snug">
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm text-primary-foreground/80">
                <span className="font-medium text-primary-foreground">{r.name}</span> · {r.city}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "What approvals do your plots carry?",
      a: "Every HanRao layout is HMDA, DTCP or RERA approved. Approval type is clearly listed on each project card and detail page.",
    },
    {
      q: "Can I book a site visit before purchasing?",
      a: "Yes — we strongly encourage it. Use the Book Site Visit button on any project page or contact us directly.",
    },
    {
      q: "Do you assist with loans and registration?",
      a: "We work with major banks for plot loans and handle the full registration process on your behalf.",
    },
    {
      q: "How do I know my title is clear?",
      a: "Every plot is title-verified with a full legal audit before listing. We share all documents openly.",
    },
    {
      q: "Which locations do you cover?",
      a: "Nellore, Kavali, Gudur, Naidupeta, and surrounding regions.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container-luxe py-20 md:py-24" aria-label="Frequently asked questions">
      <SectionHeading
        eyebrow="FAQ"
        title="Answers, before you ask"
        subtitle="Common questions from families exploring plots with us."
      />
      <div className="mx-auto mt-10 max-w-3xl divide-y divide-border rounded-2xl bg-card shadow-soft ring-1 ring-border/60">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-serif text-lg font-semibold">{it.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {it.a}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container-luxe pb-6" aria-label="Call to action">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[color:var(--olive)] p-10 text-center text-primary-foreground shadow-luxe md:p-16">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[color:var(--gold)]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance font-serif text-3xl font-semibold sm:text-4xl md:text-5xl">
            Ready to see your plot in person?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Book a complimentary site visit — we'll arrange transport from Nellore.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-primary transition-transform hover:scale-[1.02]"
            >
              Browse Projects
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-xs font-semibold uppercase tracking-[0.28em] ${light ? "text-[color:var(--gold)]" : "text-accent"}`}
      >
        {eyebrow}
      </div>
      <h2
        className={`mt-3 text-balance font-serif text-4xl font-semibold md:text-5xl ${light ? "text-primary-foreground" : "text-foreground"}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mx-auto mt-3 max-w-2xl text-balance text-base ${light ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
