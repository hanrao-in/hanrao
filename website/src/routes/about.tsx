import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Building2, HandshakeIcon, Heart, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — HanRao Realty" },
      {
        name: "description",
        content:
          "HanRao Realty has curated premium open plots across Hyderabad for over a decade. Learn about our story, values and team.",
      },
      { property: "og:title", content: "About HanRao Realty" },
      {
        property: "og:description",
        content: "A decade of curated real estate across Hyderabad.",
      },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <section className="bg-secondary/40 py-16 md:py-24">
        <div className="container-luxe text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Our Story
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-3 text-balance font-serif text-4xl font-semibold md:text-6xl"
          >
            Land, curated with <span className="italic text-accent">integrity</span>.
          </motion.h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            For over twelve years, HanRao Realty has helped families across Hyderabad find land they
            can build a lifetime on — with clear titles, fair pricing, and honest advice.
          </p>
        </div>
      </section>

      <section className="container-luxe py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">Why we started</h2>
            <p className="mt-4 leading-relaxed text-foreground/85">
              HanRao Realty was founded on a simple belief: buying land shouldn't feel like a
              gamble. Too many families we knew had bought plots without clear approvals, or paid
              inflated prices to middlemen, or waited years for registrations that never came.
            </p>
            <p className="mt-3 leading-relaxed text-foreground/85">
              We set out to change that — by curating only HMDA, DTCP and RERA approved layouts, by
              publishing our per-square-yard prices openly, and by walking with each buyer from the
              first site visit right through registration and post-sale services.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Building2, label: "Projects launched", value: "20+" },
              { icon: Users, label: "Families served", value: "500+" },
              { icon: Award, label: "Years in business", value: "12" },
              { icon: ShieldCheck, label: "Legal audits", value: "100%" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border"
              >
                <s.icon className="h-6 w-6 text-accent" />
                <div className="mt-3 font-serif text-3xl font-semibold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container-luxe">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--gold)]">
              Values
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">
              What we stand for
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Integrity",
                body: "Verified titles, transparent pricing, no hidden fees. Ever.",
              },
              {
                icon: Heart,
                title: "Care",
                body: "Every customer is family. We answer calls, not tickets.",
              },
              {
                icon: HandshakeIcon,
                title: "Partnership",
                body: "We're with you long after the registration is done.",
              },
            ].map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl bg-primary-foreground/5 p-6 ring-1 ring-primary-foreground/15 backdrop-blur"
              >
                <v.icon className="h-6 w-6 text-[color:var(--gold)]" />
                <h3 className="mt-4 font-serif text-2xl font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-luxe py-16 md:py-20">
        <div className="rounded-3xl bg-secondary/40 p-10 text-center md:p-16">
          <h2 className="font-serif text-3xl font-semibold md:text-4xl">
            Ready to explore your options?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Browse our current projects or reach out — we'll help you find the right plot.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/projects"
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View Projects
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-primary/30 px-6 py-3 text-sm font-medium text-primary hover:bg-primary/5"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
