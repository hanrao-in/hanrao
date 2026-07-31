import { motion } from "framer-motion";
import { Building2, Sparkles, Clock, BellRing, PhoneCall } from "lucide-react";
import { SITE } from "@/lib/site";

interface Props {
  title?: string;
  subtitle?: string;
  showContactAction?: boolean;
}

export function NewProjectsComingSoon({
  title = "New Projects Adding Soon...",
  subtitle = "Our team is curating brand new HMDA & DTCP approved layouts across prime Hyderabad locations. Stay tuned!",
  showContactAction = true,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-secondary/30 p-10 md:p-14 text-center shadow-luxe ring-1 ring-white/10"
    >
      {/* Background glowing ambient light effect */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      {/* Floating Animated Icon */}
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        {/* Pulsing ring behind icon */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-primary/15"
        />

        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-primary to-accent text-primary-foreground shadow-lg ring-1 ring-white/20"
        >
          <Building2 className="h-8 w-8 text-primary-foreground" />
        </motion.div>

        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-foreground shadow-md"
        >
          <Sparkles className="h-4 w-4" />
        </motion.div>
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-accent"
      >
        <Clock className="h-3 w-3 animate-spin text-accent" style={{ animationDuration: "6s" }} />
        <span>Coming Soon</span>
      </motion.div>

      {/* Title with animated ellipsis */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 font-serif text-2xl font-bold md:text-3xl text-foreground tracking-tight"
      >
        {title.replace(/\.\.\.$/, "")}
        <span className="inline-flex">
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
          >
            .
          </motion.span>
        </span>
      </motion.h3>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-auto mt-3 max-w-md text-sm md:text-base text-muted-foreground leading-relaxed"
      >
        {subtitle}
      </motion.p>

      {/* Action buttons */}
      {showContactAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href={`tel:${SITE.phone}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.02] focus-visible:outline-none"
          >
            <PhoneCall className="h-4 w-4" />
            <span>Enquire Early Access</span>
          </a>
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-secondary hover:scale-[1.02]"
          >
            <BellRing className="h-4 w-4 text-emerald-600" />
            <span>Notify Me on WhatsApp</span>
          </a>
        </motion.div>
      )}
    </motion.div>
  );
}
