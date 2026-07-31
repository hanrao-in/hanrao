// Central site config — phone/email/social used by nav, footer, floating buttons.
export const SITE = {
  name: "HanRao Realty",
  tagline: "Premium Open Plots",
  phone: "+91 83415 05195",
  phoneE164: "+918341505195",
  whatsapp: "918341505195",
  email: "hanraoreality@gmail.com",
  address: "Financial District, Hyderabad, Telangana 500032",
  navLinks: [
    { to: "/", label: "Home" },
    { to: "/projects", label: "Projects" },
    { to: "/search", label: "Search" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ],
} as const;

export const PLOT_TYPES = [
  { value: "open", label: "Open Plot" },
  { value: "villa", label: "Villa Plot" },
  { value: "commercial", label: "Commercial" },
  { value: "farm", label: "Farm Land" },
] as const;

export const APPROVAL_TYPES = ["DTCP", "HMDA", "RERA"] as const;

export function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatPricePerSqYd(n: number) {
  return `₹${n.toLocaleString("en-IN")}/sq.yd`;
}
