import React, { useState, useEffect, useRef } from "react";
import { MapPin, Check, ChevronDown } from "lucide-react";

const POPULAR_LOCATIONS = [
  { village: "Kompally", city: "Hyderabad", district: "Medchal-Malkajgiri", state: "Telangana" },
  { village: "Shamshabad", city: "Hyderabad", district: "Rangareddy", state: "Telangana" },
  { village: "Shankarpally", city: "Hyderabad", district: "Rangareddy", state: "Telangana" },
  { village: "Sangareddy", city: "Sangareddy", district: "Sangareddy", state: "Telangana" },
  { village: "Adibatla", city: "Hyderabad", district: "Rangareddy", state: "Telangana" },
  { village: "Patancheru", city: "Hyderabad", district: "Sangareddy", state: "Telangana" },
  { village: "Kothur", city: "Hyderabad", district: "Rangareddy", state: "Telangana" },
  { village: "Kokapet", city: "Hyderabad", district: "Rangareddy", state: "Telangana" },
  { village: "Kondapur", city: "Hyderabad", district: "Rangareddy", state: "Telangana" },
  { village: "Nellore", city: "Nellore", district: "SPSR Nellore", state: "Andhra Pradesh" },
];

interface Props {
  village: string;
  city: string;
  district: string;
  state: string;
  onSelect: (loc: { village: string; city: string; district: string; state: string }) => void;
}

export function LocationCombobox({ village, city, district, state, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const filtered = POPULAR_LOCATIONS.filter((l) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      l.village.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.district.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={ref} className="relative space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Location Preset Autocomplete
        </label>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          <span>Choose Popular Location</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-border bg-card p-2 shadow-xl ring-1 ring-border/50">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search village, city, district..."
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary mb-2"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground text-center">No preset matches found.</p>
            ) : (
              filtered.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelect(loc);
                    setOpen(false);
                  }}
                  className="w-full text-left flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-secondary transition-colors"
                >
                  <div>
                    <span className="font-medium text-foreground">{loc.village}</span>
                    <span className="text-muted-foreground text-[11px] ml-1.5">
                      ({loc.city}, {loc.district})
                    </span>
                  </div>
                  {village === loc.village && district === loc.district && (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
