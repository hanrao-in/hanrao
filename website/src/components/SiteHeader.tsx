import { Link } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/site";
import logo from "@/assets/hanrao-logo.png";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-luxe grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 md:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img
            src={logo}
            alt="HanRao Realty"
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
          <div className="min-w-0">
            <div className="truncate font-serif text-xl font-semibold leading-none text-primary">
              HanRao Realty
            </div>
            <div className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Premium Open Plots
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {SITE.navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${SITE.phoneE164}`}
            className="group inline-flex items-center justify-start rounded-full bg-primary p-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-all duration-300 ease-in-out hover:px-5 max-w-[40px] hover:max-w-[220px] overflow-hidden whitespace-nowrap hover:bg-primary/90 hover:shadow-luxe"
          >
            <Phone className="h-5 w-5 shrink-0" />
            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out font-medium">
              {SITE.phone}
            </span>
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="container-luxe flex flex-col gap-1 py-3">
            {SITE.navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary"
                activeProps={{ className: "bg-secondary text-primary" }}
                activeOptions={{ exact: link.to === "/" }}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`tel:${SITE.phoneE164}`}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              <Phone className="h-4 w-4" /> Call {SITE.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
