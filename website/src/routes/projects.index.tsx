import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Suspense, useMemo, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectGridSkeleton } from "@/components/LoadingSkeleton";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { NewProjectsComingSoon } from "@/components/NewProjectsComingSoon";
import { listProjects } from "@/lib/supabase.functions";
import { APPROVAL_TYPES } from "@/lib/site";

const projectsQuery = { queryKey: ["projects", "all"], queryFn: () => listProjects() };

export const Route = createFileRoute("/projects/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  head: () => ({
    meta: [
      { title: "All Projects — HanRao Realty" },
      {
        name: "description",
        content:
          "Browse all HanRao Realty projects across Hyderabad — HMDA, DTCP and RERA approved open plots, villa plots and farm land.",
      },
      { property: "og:title", content: "All Projects — HanRao Realty" },
      {
        property: "og:description",
        content: "Explore every HanRao Realty community across Hyderabad.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: ProjectsIndex,
});

const PAGE_SIZE = 9;

function ProjectsIndex() {
  return (
    <div className="container-luxe py-10 md:py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Portfolio
        </div>
        <h1 className="mt-2 font-serif text-4xl font-semibold md:text-5xl">Our Projects</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Every community, curated to the same premium standard.
        </p>
      </motion.div>

      <Suspense
        fallback={
          <div className="mt-8">
            <div className="mx-auto max-w-xl">
              <div className="h-14 w-full animate-pulse rounded-full bg-muted/70" />
            </div>
            <ProjectGridSkeleton count={6} />
          </div>
        }
      >
        <ProjectsGrid />
      </Suspense>
    </div>
  );
}

function ProjectsGrid() {
  const { data } = useSuspenseQuery(projectsQuery);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [activeApproval, setActiveApproval] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = data;
    if (activeApproval) {
      list = list.filter((p) => (p.approval_types || []).includes(activeApproval));
    }
    if (activeStatus) {
      list = list.filter((p) => p.status === activeStatus);
    }
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter((p) =>
        [p.name, p.village, p.city, p.district, ...(p.approval_types || [])]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term)),
      );
    }
    return list;
  }, [q, data, activeApproval, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setActiveApproval(null);
    setActiveStatus(null);
    setQ("");
    setPage(1);
  };

  const hasFilters = Boolean(activeApproval || activeStatus || q.trim());

  return (
    <>
      {/* Search bar */}
      <div className="mx-auto mt-8 max-w-xl">
        <SmartSearchBar
          initialValue={q}
          placeholder="Filter by name, village, district…"
          size="md"
          onSearch={(val) => {
            setQ(val);
            setPage(1);
          }}
        />
      </div>

      {/* Quick filters */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {APPROVAL_TYPES.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setActiveApproval(activeApproval === a ? null : a);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              activeApproval === a
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            {a}
          </button>
        ))}
        {(
          [
            { value: "active", label: "Active" },
            { value: "upcoming", label: "Upcoming" },
          ] as const
        ).map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setActiveStatus(activeStatus === s.value ? null : s.value);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              activeStatus === s.value
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-accent/50 hover:text-accent"
            }`}
          >
            {s.label}
          </button>
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      {hasFilters && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> project
          {filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Grid */}
      {pageItems.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-10 max-w-3xl mx-auto">
          <NewProjectsComingSoon
            title={data.length === 0 ? "New Projects Adding Soon..." : "No Matching Projects..."}
            subtitle={
              data.length === 0
                ? "Our team is curating brand new HMDA & DTCP approved layouts across prime Hyderabad locations. Stay tuned!"
                : "Try a different keyword or clear your active filters."
            }
          />
          {hasFilters && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-border bg-card px-5 py-2 text-xs font-medium hover:border-primary/40"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to page ${i + 1}`}
              aria-current={currentPage === i + 1 ? "page" : undefined}
              onClick={() => setPage(i + 1)}
              className={`h-9 min-w-9 rounded-full px-3 text-sm font-medium transition-all ${
                currentPage === i + 1
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "border border-border bg-card hover:border-primary/40 hover:text-primary"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
