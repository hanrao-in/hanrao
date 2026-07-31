/**
 * SmartSearchBar — reusable search input with live suggestions.
 * Powers both the homepage hero search and the /search page.
 * Suggestions are derived from mock project + location data client-side.
 * When Supabase is connected, the same component works unchanged.
 */
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, TrendingUp, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Static suggestion data (mirrors mock data in realty.functions.ts)
// ---------------------------------------------------------------------------
type Suggestion = {
  type: "location" | "project";
  label: string;
  sublabel?: string;
  q: string;
};

const SUGGESTIONS: Suggestion[] = [
  // Locations — real HanRao operating areas
  { type: "location", label: "Shamshabad", sublabel: "Rangareddy District", q: "Shamshabad" },
  { type: "location", label: "Kompally", sublabel: "Medchal District", q: "Kompally" },
  { type: "location", label: "Sangareddy", sublabel: "Sangareddy District", q: "Sangareddy" },
  { type: "location", label: "Shankarpally", sublabel: "Rangareddy District", q: "Shankarpally" },
  { type: "location", label: "Adibatla", sublabel: "Rangareddy District", q: "Adibatla" },
  { type: "location", label: "Patancheru", sublabel: "Sangareddy District", q: "Patancheru" },
  { type: "location", label: "Rangareddy", sublabel: "District", q: "Rangareddy" },
  { type: "location", label: "Medchal", sublabel: "District", q: "Medchal" },
];

const TRENDING = ["Shamshabad", "Kompally", "Sangareddy", "Shankarpally", "Adibatla"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type Props = {
  initialValue?: string;
  placeholder?: string;
  size?: "lg" | "md";
  autoFocus?: boolean;
  onSearch?: (q: string) => void;
};

export function SmartSearchBar({
  initialValue = "",
  placeholder = "Search by location, village, district or project",
  size = "lg",
  autoFocus = false,
  onSearch,
}: Props) {
  const navigate = useNavigate();
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [q, setQ] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Filter suggestions on input
  const filtered: Suggestion[] =
    q.trim().length < 1
      ? []
      : SUGGESTIONS.filter(
          (s) =>
            s.label.toLowerCase().includes(q.toLowerCase()) ||
            (s.sublabel ?? "").toLowerCase().includes(q.toLowerCase()),
        ).slice(0, 7);

  const showDropdown = focused && (filtered.length > 0 || q.trim().length === 0);

  const submit = useCallback(
    (value: string) => {
      const term = value.trim();
      setFocused(false);
      if (onSearch) {
        onSearch(term);
      } else {
        navigate({ to: "/search", search: { q: term || undefined } });
      }
    },
    [navigate, onSearch],
  );

  const clearQuery = () => {
    setQ("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items =
      q.trim().length > 0 ? filtered : TRENDING.map((t) => ({ q: t, label: t }) as Suggestion);
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        setQ(items[activeIndex].label);
        submit(items[activeIndex].q);
      } else {
        submit(q);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
      setActiveIndex(-1);
    }
  };

  const inputClass =
    size === "lg"
      ? "w-full min-w-0 bg-transparent py-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground"
      : "w-full min-w-0 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground";

  const btnClass =
    size === "lg"
      ? "shrink-0 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg sm:px-9"
      : "shrink-0 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        aria-label="Search plots"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="flex w-full overflow-hidden rounded-full bg-background p-1.5 shadow-luxe ring-1 ring-border/60 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40"
      >
        <div className="flex flex-1 items-center gap-3 px-4">
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            autoComplete="off"
            autoFocus={autoFocus}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            maxLength={120}
            aria-label="Search plots by location or project"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? `${inputId}-list` : undefined}
            aria-activedescendant={activeIndex >= 0 ? `${inputId}-item-${activeIndex}` : undefined}
            className={inputClass}
          />
          {q.trim().length > 0 && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button type="submit" className={btnClass}>
          Search
        </button>
      </form>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl bg-background shadow-luxe ring-1 ring-border/60"
          >
            {q.trim().length === 0 ? (
              /* Trending / empty state */
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Popular Searches
                </div>
                <ul ref={listRef} id={`${inputId}-list`} role="listbox" className="space-y-0.5">
                  {TRENDING.map((t, i) => (
                    <li
                      key={t}
                      role="option"
                      id={`${inputId}-item-${i}`}
                      aria-selected={activeIndex === i}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQ(t);
                          submit(t);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                          activeIndex === i
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : filtered.length > 0 ? (
              /* Matching suggestions */
              <ul ref={listRef} id={`${inputId}-list`} role="listbox" className="p-2 space-y-0.5">
                {filtered.map((s, i) => (
                  <li
                    key={`${s.type}-${s.label}`}
                    role="option"
                    id={`${inputId}-item-${i}`}
                    aria-selected={activeIndex === i}
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setQ(s.label);
                        submit(s.q);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        activeIndex === i
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {s.type === "location" ? (
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                      ) : (
                        <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm bg-primary/15 text-[8px] font-bold text-primary">
                          P
                        </span>
                      )}
                      <span className="flex-1 text-left">
                        <HighlightMatch text={s.label} query={q} />
                      </span>
                      {s.sublabel && (
                        <span className="text-xs text-muted-foreground">{s.sublabel}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              /* No results hint */
              <div className="px-5 py-4 text-sm text-muted-foreground">
                No suggestions for "<strong>{q}</strong>" — press Enter to search anyway.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Highlights the matching portion of a suggestion label
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/15 text-primary rounded-sm not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
