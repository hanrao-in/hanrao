import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { ProjectCard } from "@/components/ProjectCard";
import { SearchResultsSkeleton, FilterSidebarSkeleton } from "@/components/LoadingSkeleton";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { NewProjectsComingSoon } from "@/components/NewProjectsComingSoon";
import { searchProjects } from "@/lib/supabase.functions";
import { APPROVAL_TYPES, PLOT_TYPES } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------
const searchSchema = z.object({
  q: z.string().max(120).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  plotType: z.enum(["open", "villa", "commercial", "farm"]).optional(),
  approval: z.enum(["DTCP", "HMDA", "RERA"]).optional(),
  availability: z.enum(["available", "reserved"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "area"]).optional(),
});
type SearchParams = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["search", deps],
      queryFn: () =>
        searchProjects({
          data: { ...deps, sort: deps.sort ?? "newest", q: deps.q ?? "" },
        }),
    }),
  head: () => ({
    meta: [
      { title: "Search Plots — HanRao Realty" },
      {
        name: "description",
        content:
          "Search premium HMDA, DTCP and RERA approved plots across Nellore. Filter by location, price, area, plot type and approval.",
      },
      { property: "og:title", content: "Search Plots — HanRao Realty" },
      { property: "og:description", content: "Find your perfect plot in Nellore." },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const setSearch = (updates: Partial<SearchParams>) => {
    navigate({ search: (prev: SearchParams) => ({ ...prev, ...updates }) });
    if (updates.q?.trim()) {
      trackEvent("search", { search_term: updates.q.trim() });
    }
    const filterKeys = Object.keys(updates).filter((k) => k !== "q" && k !== "sort");
    if (filterKeys.length > 0) {
      const key = filterKeys[0];
      trackEvent("filter_applied", { filter_type: key, filter_value: String(updates[key as keyof SearchParams]) });
    }
  };

  const activeFilters = useMemo(() => {
    const arr: { key: keyof SearchParams; label: string }[] = [];
    if (search.plotType)
      arr.push({
        key: "plotType",
        label: PLOT_TYPES.find((t) => t.value === search.plotType)?.label ?? search.plotType,
      });
    if (search.approval) arr.push({ key: "approval", label: search.approval });
    if (search.availability)
      arr.push({
        key: "availability",
        label: search.availability === "available" ? "Available only" : "Reserved",
      });
    if (search.minPrice)
      arr.push({ key: "minPrice", label: `≥ ₹${search.minPrice.toLocaleString("en-IN")}/yd` });
    if (search.maxPrice)
      arr.push({ key: "maxPrice", label: `≤ ₹${search.maxPrice.toLocaleString("en-IN")}/yd` });
    if (search.minArea) arr.push({ key: "minArea", label: `≥ ${search.minArea} yd²` });
    if (search.maxArea) arr.push({ key: "maxArea", label: `≤ ${search.maxArea} yd²` });
    return arr;
  }, [search]);

  return (
    <div className="container-luxe py-10 md:py-14">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Search</div>
        <h1 className="mt-2 font-serif text-4xl font-semibold md:text-5xl">Find Your Plot</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Search by location, village, district or project name.
        </p>
      </div>

      {/* Smart search bar */}
      <div className="mx-auto mt-8 max-w-3xl">
        <SmartSearchBar
          initialValue={search.q ?? ""}
          placeholder="Search by location, village, district or project"
          size="md"
          onSearch={(q) => setSearch({ q: q || undefined })}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ── Filter sidebar ── */}
        <aside>
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="mb-4 inline-flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {activeFilters.length}
                </span>
              )}
            </span>
            <X
              className={`h-4 w-4 transition-transform duration-200 ${showFilters ? "" : "rotate-45"}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {(showFilters || true) && (
              <motion.div
                key="filters"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden ${!showFilters ? "hidden lg:block" : ""}`}
              >
                <Suspense fallback={<FilterSidebarSkeleton />}>
                  <FilterPanel
                    search={search}
                    setSearch={setSearch}
                    activeFilters={activeFilters}
                    navigate={navigate}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* ── Results ── */}
        <div>
          {/* Active filter chips + sort */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSearch({ [f.key]: undefined })}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/15 transition-colors"
                >
                  {f.label} <X className="h-3 w-3" />
                </button>
              ))}
              {activeFilters.length > 1 && (
                <button
                  type="button"
                  onClick={() => navigate({ search: { q: search.q, sort: search.sort } })}
                  className="text-xs text-muted-foreground hover:text-accent underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
            </div>
            <select
              value={search.sort ?? "newest"}
              onChange={(e) =>
                setSearch({
                  sort: e.target.value as SearchParams["sort"],
                })
              }
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium outline-none focus:border-primary"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area">Total Area</option>
            </select>
          </div>

          <Suspense fallback={<SearchResultsSkeleton count={4} />}>
            <SearchResults search={search} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Panel
// ---------------------------------------------------------------------------
function FilterPanel({
  search,
  setSearch,
  activeFilters,
  navigate,
}: {
  search: SearchParams;
  setSearch: (u: Partial<SearchParams>) => void;
  activeFilters: { key: keyof SearchParams; label: string }[];
  navigate: ReturnType<typeof Route.useNavigate>;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">Filters</h2>
        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={() => navigate({ search: { q: search.q, sort: search.sort } })}
            className="text-xs text-accent hover:underline"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Plot Type */}
      <FilterGroup label="Plot Type">
        <div className="flex flex-wrap gap-1.5">
          {PLOT_TYPES.map((t) => (
            <ToggleChip
              key={t.value}
              active={search.plotType === t.value}
              onClick={() =>
                setSearch({ plotType: search.plotType === t.value ? undefined : t.value })
              }
            >
              {t.label}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>

      {/* Approval */}
      <FilterGroup label="Approval Type">
        <div className="flex flex-wrap gap-1.5">
          {APPROVAL_TYPES.map((a) => (
            <ToggleChip
              key={a}
              active={search.approval === a}
              onClick={() => setSearch({ approval: search.approval === a ? undefined : a })}
            >
              {a}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>

      {/* Availability */}
      <FilterGroup label="Availability">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "available" as const, label: "Available" },
            { value: "reserved" as const, label: "Reserved" },
          ].map((opt) => (
            <ToggleChip
              key={opt.value}
              active={search.availability === opt.value}
              onClick={() =>
                setSearch({
                  availability: search.availability === opt.value ? undefined : opt.value,
                })
              }
            >
              {opt.label}
            </ToggleChip>
          ))}
        </div>
      </FilterGroup>

      {/* Price range */}
      <FilterGroup label="Price per sq.yd (₹)">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            placeholder="Min"
            value={search.minPrice}
            onChange={(v) => setSearch({ minPrice: v })}
          />
          <NumberInput
            placeholder="Max"
            value={search.maxPrice}
            onChange={(v) => setSearch({ maxPrice: v })}
          />
        </div>
        {/* Quick price presets */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { label: "< ₹10k", max: 10000 },
            { label: "₹10–20k", min: 10000, max: 20000 },
            { label: "> ₹20k", min: 20000 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setSearch({ minPrice: p.min, maxPrice: p.max })}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Area range */}
      <FilterGroup label="Area (sq.yd)">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            placeholder="Min"
            value={search.minArea}
            onChange={(v) => setSearch({ minArea: v })}
          />
          <NumberInput
            placeholder="Max"
            value={search.maxArea}
            onChange={(v) => setSearch({ maxArea: v })}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { label: "< 200 yd", max: 200 },
            { label: "200–400 yd", min: 200, max: 400 },
            { label: "> 400 yd", min: 400 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setSearch({ minArea: p.min, maxArea: p.max })}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
function SearchResults({ search }: { search: SearchParams }) {
  const { data } = useSuspenseQuery({
    queryKey: ["search", search],
    queryFn: () =>
      searchProjects({
        data: { ...search, sort: search.sort ?? "newest", q: search.q ?? "" },
      }),
  });

  if (data.length === 0) {
    return (
      <NewProjectsComingSoon
        title="New Projects Adding Soon..."
        subtitle="No plot results matched your current search filters. Try widening your price, location or layout filters, or check back soon for our newest project launches."
      />
    );
  }

  return (
    <>
      <p className="mb-5 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{data.length}</span> project
        {data.length === 1 ? "" : "s"} found
      </p>
      <motion.div layout className="grid gap-6 sm:grid-cols-2">
        {data.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0 [&+&]:mt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const n = e.target.value === "" ? undefined : Number(e.target.value);
        onChange(Number.isFinite(n) ? n : undefined);
      }}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
    />
  );
}
