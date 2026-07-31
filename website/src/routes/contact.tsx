import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { submitEnquiry, listProjects } from "@/lib/supabase.functions";
import { SITE } from "@/lib/site";
import type { Project } from "@/lib/types";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — HanRao Realty" },
      {
        name: "description",
        content:
          "Get in touch with HanRao Realty. Call, email or visit our office in Hyderabad's Financial District.",
      },
      { property: "og:title", content: "Contact HanRao Realty" },
      {
        property: "og:description",
        content: "Call, email or visit our Hyderabad office.",
      },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let active = true;
    listProjects()
      .then((data) => {
        if (active) setProjects(data || []);
      })
      .catch((err) => console.error("Failed to fetch projects:", err));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="bg-secondary/40 py-16 md:py-20">
        <div className="container-luxe text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Contact
          </div>
          <h1 className="mt-3 font-serif text-4xl font-semibold md:text-6xl">
            We'd love to hear from you
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Questions about a project, site visits, or paperwork — we're a call away.
          </p>
        </div>
      </section>

      <section className="container-luxe py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl bg-card p-8 shadow-soft ring-1 ring-border">
            <h2 className="font-serif text-2xl font-semibold">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">We reply within one business hour.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                setSubmitting(true);
                
                const projId = String(fd.get("project_id") ?? "").trim();
                const selectedProj = projects.find((p) => p.id === projId);
                const projectName = selectedProj ? selectedProj.name : undefined;

                try {
                  await submitEnquiry({
                    data: {
                      name: String(fd.get("name") ?? "").trim(),
                      phone: String(fd.get("phone") ?? "").trim(),
                      email: (String(fd.get("email") ?? "").trim() || undefined) as
                        string | undefined,
                      budget: (String(fd.get("budget") ?? "").trim() || undefined) as
                        string | undefined,
                      message: (String(fd.get("message") ?? "").trim() || undefined) as
                        string | undefined,
                      project_id: projId || undefined,
                      project_name: projectName,
                      source: "website",
                    },
                  });
                  toast.success("Thanks — we'll be in touch shortly.");
                  form.reset();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Something went wrong");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="mt-6 space-y-3"
            >
              <input
                name="name"
                required
                placeholder="Full name"
                maxLength={100}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="Phone"
                  minLength={6}
                  maxLength={20}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email (optional)"
                  maxLength={255}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  name="project_id"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Select Project (optional)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  name="budget"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Budget range (optional)</option>
                  <option value="Under ₹10L">Under ₹10 Lakhs</option>
                  <option value="₹10L–₹25L">₹10 – ₹25 Lakhs</option>
                  <option value="₹25L–₹50L">₹25 – ₹50 Lakhs</option>
                  <option value="₹50L–₹1Cr">₹50 Lakhs – ₹1 Crore</option>
                  <option value="Above ₹1Cr">Above ₹1 Crore</option>
                </select>
              </div>
              <textarea
                name="message"
                rows={4}
                placeholder="Tell us what you're looking for…"
                maxLength={2000}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <a
              href={`tel:${SITE.phoneE164}`}
              className="flex items-center gap-4 rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border transition-shadow hover:shadow-luxe"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Phone</div>
                <div className="truncate font-serif text-xl font-semibold">{SITE.phone}</div>
              </div>
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-4 rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border transition-shadow hover:shadow-luxe"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
                <div className="truncate font-serif text-xl font-semibold">{SITE.email}</div>
              </div>
            </a>
            <div className="flex items-start gap-4 rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Office</div>
                <div className="font-serif text-lg font-semibold leading-tight">{SITE.address}</div>
              </div>
            </div>

            <iframe
              title="HanRao Realty office"
              src="https://www.google.com/maps?q=Financial+District+Hyderabad&hl=en&z=13&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full rounded-2xl border border-border"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
