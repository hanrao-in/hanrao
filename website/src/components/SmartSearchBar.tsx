import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, TrendingUp, X, Building2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Suggestion = {
  type: "location" | "project";
  label: string;
  sublabel?: string;
  q: string;
  slug?: string;
};

const TRENDING = ["Shamshabad", "Kompally", "Sangareddy", "Shankarpally", "Adibatla", "Nellore"];

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

  const [q, setQ] = useState(initialValue);
  const [debouncedQ, setDebouncedQ] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Debounce input value by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Listen to visualViewport for mobile soft keyboard positioning
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const heightDiff = window.innerHeight - window.visualViewport.height;
      setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
    };

    window.visualViewport.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  // Fetch dynamic suggestions from Supabase PostgreSQL (full text / ILIKE)
  useEffect(() => {
    if (!debouncedQ.trim()) {
      setSuggestions([]);
      return;
    }

    let isMounted = true;
    const fetchSuggestions = async () => {
      try {
        const term = debouncedQ.trim();
        // Call RPC procedure or query projects table
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, slug, village, city, district, state")
          .or(`name.ilike.%${term}%,village.ilike.%${term}%,city.ilike.%${term}%,district.ilike.%${term}%,slug.ilike.%${term}%`)
          .limit(6);

        if (error || !data) return;

        const results: Suggestion[] = [];
        const locationSet = new Set<string>();

        data.forEach((p) => {
          results.push({
            type: "project",
            label: p.name,
            sublabel: [p.village, p.city, p.district].filter(Boolean).join(", "),
            q: p.name,
            slug: p.slug,
          });

          if (p.village && !locationSet.has(p.village.toLowerCase())) {
            locationSet.add(p.village.toLowerCase());
            results.push({
              type: "location",
              label: p.village,
              sublabel: `${p.district} District`,
              q: p.village,
            });
          }
          if (p.city && !locationSet.has(p.city.toLowerCase())) {
            locationSet.add(p.city.toLowerCase());
            results.push({
              type: "location",
              label: p.city,
              sublabel: `${p.state}`,
              q: p.city,
            });
          }
        });

        if (isMounted) setSuggestions(results.slice(0, 7));
      } catch (err) {
        console.warn("[SmartSearchBar query failed]", err);
      }
    };

    fetchSuggestions();
    return () => {
      isMounted = false;
    };
  }, [debouncedQ]);

  const showDropdown = focused && (suggestions.length > 0 || q.trim().length === 0);

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

  // Close dropdown on click outside
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items =
      q.trim().length > 0
        ? suggestions
        : TRENDING.map((t) => ({ type: "location" as const, q: t, label: t }));

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
      ? "shrink-0 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg sm:px-9 min-h-[48px]"
      : "shrink-0 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-h-[48px]";

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

      {/* Dynamic Suggestions Dropdown (Positioned safely above keyboard) */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ marginBottom: keyboardHeight ? `${keyboardHeight}px` : "0px" }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl ring-1 ring-border/50 backdrop-blur-md"
          >
            {q.trim().length === 0 ? (
              <div>
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" /> Popular Searches
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5 px-2 pb-2">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setQ(t);
                        submit(t);
                      }}
                      className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="space-y-1">
                {suggestions.map((item, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.type === "project" && item.slug) {
                          navigate({ to: "/projects/$slug", params: { slug: item.slug } });
                        } else {
                          setQ(item.label);
                          submit(item.q);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                        activeIndex === idx ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.type === "project" ? (
                          <div className="rounded-lg bg-accent/10 p-1.5 text-accent shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="rounded-lg bg-primary/10 p-1.5 text-primary shrink-0">
                            <MapPin className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate text-foreground">{item.label}</p>
                          {item.sublabel && <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground shrink-0 ml-2">
                        {item.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-3 text-xs text-muted-foreground text-center">No matching locations or projects found.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
