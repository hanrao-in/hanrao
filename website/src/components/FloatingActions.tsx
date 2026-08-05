import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";


export function FloatingActions() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show contact icons only after scrolling down past the hero search section (>400px)
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initialize check on load
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 50 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-4"
          aria-label="Quick contact buttons"
        >
          {/* WhatsApp */}
          <div className="group flex items-center gap-3 relative cursor-pointer">
            <span
              className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-luxe ring-1 ring-border 
                         opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none transition-all duration-300 whitespace-nowrap"
            >
              Chat on WhatsApp
            </span>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                "Hi HanRao Realty, I'm interested in your plots.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("whatsapp_click", { location: "floating_action" })}
              aria-label="Chat with HanRao Realty on WhatsApp"
              className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-luxe transition-all duration-200 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
            >
              {/* Pulsing ring — draws attention */}
              <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/30 [animation-duration:2.5s]" />
              <svg viewBox="0 0 32 32" className="relative h-7 w-7 fill-current" aria-hidden="true">
                <path d="M19.11 17.21c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.63.14-.19.28-.72.9-.88 1.09-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.24-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.44.12-.58.13-.13.28-.32.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.87-2.08-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35s-.99.97-.99 2.36.99 2.74 1.13 2.93c.14.19 1.95 2.98 4.72 4.18.66.28 1.18.45 1.58.58.66.21 1.26.18 1.74.11.53-.08 1.66-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33ZM16 3.2A12.8 12.8 0 0 0 4.62 22.02L3.2 28.8l6.98-1.4A12.8 12.8 0 1 0 16 3.2Zm0 23.31a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-4.14.83.83-4.04-.25-.4A10.5 10.5 0 1 1 16 26.51Z" />
              </svg>
            </a>
          </div>

          {/* Call */}
          <div className="group flex items-center gap-3 relative cursor-pointer">
            <span
              className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-luxe ring-1 ring-border 
                         opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none transition-all duration-300 whitespace-nowrap"
            >
              {SITE.phone}
            </span>
            <a
              href={`tel:${SITE.phoneE164}`}
              onClick={() => trackEvent("phone_click", { location: "floating_action" })}
              aria-label={`Call HanRao Realty at ${SITE.phone}`}
              className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-luxe transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            >
              <Phone
                className="h-6 w-6 transition-transform duration-200 group-hover:rotate-12"
                aria-hidden="true"
              />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
