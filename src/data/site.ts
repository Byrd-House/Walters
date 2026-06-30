// Ground-truth business facts (brief §2). Single source for Header, Footer,
// SEO/JSON-LD, and the quote form. [CONFIRM] items are null → render as TODOs,
// never as invented data.

export const site = {
  name: "Walter's",
  legalName: "Walter's — Landscaping & Construction",
  tagline: "Landscaping & Construction",
  phone: "(919) 441-7049",
  phoneHref: "tel:+19194417049",
  email: null as string | null, // TODO[CONFIRM]: real business email
  hours: null as string | null, // TODO[CONFIRM]: business hours
  areas: ["Chapel Hill", "Durham", "Hillsborough", "Meadowmont"],
  zip: "27516",
  region: "NC",
  rating: { value: 5.0, count: 25 },
  insured: true,
  // Active social handle: "JW Landscape and Maintenance" (Facebook + Nextdoor).
  social: {
    facebook: null as string | null, // TODO[CONFIRM]: profile URL
    instagram: null as string | null, // TODO[CONFIRM]: profile URL
  },
};

export const nav = [
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export type ServiceGroup = {
  slug: string;
  title: string;
  oneLiner: string;
  emphasized?: boolean;
};

// Four plain-language groups (copy doc). "Patios, Walkways & Construction" is
// the emphasized differentiator.
export const serviceGroups: ServiceGroup[] = [
  {
    slug: "lawn-care",
    title: "Lawn Care & Maintenance",
    oneLiner:
      "Mowing, trimming, and seasonal upkeep that keeps your property sharp all year — including leaf and storm cleanup when the weather turns.",
  },
  {
    slug: "landscaping-mulch",
    title: "Landscaping & Mulch",
    oneLiner:
      "Custom landscape design, planting, and fresh mulch that makes the whole yard look finished and cared for.",
  },
  {
    slug: "patios-construction",
    title: "Patios, Walkways & Construction",
    oneLiner:
      "Pavers, walkways, porches, decks, driveways, concrete, and excavation. The bigger builds — the work that lasts.",
    emphasized: true,
  },
  {
    slug: "cleanup-removal",
    title: "Cleanup & Removal",
    oneLiner:
      "Fallen-tree and debris removal, junk removal, and storm cleanup. One call and it's gone.",
  },
];
