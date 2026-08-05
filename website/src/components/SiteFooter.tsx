import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="container-luxe grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-serif text-3xl font-semibold">HanRao Realty</div>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/80">
            Curating premium open plots, villa plots and farm land across Hyderabad. Trusted by
            hundreds of families building their dream address.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
            Explore
          </div>
          <ul className="space-y-2 text-sm">
            {SITE.navLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-primary-foreground/85 hover:text-primary-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
            Contact
          </div>
          <ul className="space-y-3 text-sm text-primary-foreground/85">
            <li className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a
                href={`tel:${SITE.phoneE164}`}
                onClick={() => trackEvent("phone_click", { location: "footer" })}
              >
                {SITE.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
            <li className="flex gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span
                className="cursor-pointer hover:underline"
                onClick={() => trackEvent("map_click", { location: "footer" })}
              >
                {SITE.address}
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-primary-foreground/60">
          <span>© {new Date().getFullYear()} HanRao Realty. All rights reserved.</span>
          <span>Premium Open Plots · Hyderabad · Telangana</span>
        </div>
      </div>
    </footer>
  );
}
