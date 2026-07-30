// Ground-truth business facts (brief §2). Single source for Header, Footer,
// SEO/JSON-LD, and the quote form. [CONFIRM] items are null → render as TODOs,
// never as invented data.

export const site = {
  name: "Jesse Walters",
  legalName: "Walter's Landscaping & Construction",
  tagline: "Landscaping",
  phone: "(919) 441-7049",
  phoneHref: "tel:+19194417049",
  email: "jbwalters3327@gmail.com" as string | null,
  hours: null as string | null, // TODO[CONFIRM]: business hours
  areas: ["Chapel Hill", "Durham", "Hillsborough"],
  zip: "27516",
  region: "NC",
  rating: { value: 5.0, count: 26 },
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
  items?: string[];
  emphasized?: boolean; // big featured card on home + larger heading on services
  homeCard?: boolean; // one of the three small cards under the featured one on home
};

// Seven plain-language groups (client services list). Property Maintenance is
// the flagship (emphasized); mulch, grading, and hardscaping are the three
// smaller cards previewed on the home page (homeCard).
export const serviceGroups: ServiceGroup[] = [
  {
    slug: "property-maintenance",
    title: "Property Maintenance",
    oneLiner:
      "Mowing, trimming, edging, and seasonal cleanups that keep your property sharp week to week and all year long.",
    items: ["Mowing", "Trimming & edging", "Leaf & storm cleanup", "Bed maintenance", "Seasonal upkeep"],
    emphasized: true,
  },
  {
    slug: "mulch-pinestraw",
    title: "Mulch & Pinestraw",
    oneLiner:
      "Fresh mulch or pinestraw and clean-edged beds that make the whole yard look finished and cared for.",
    items: ["Fresh mulch", "Pinestraw", "Bed edging", "Seasonal refreshes"],
    homeCard: true,
  },
  {
    slug: "grading-drainage",
    title: "Grading & Drainage Solutions",
    oneLiner:
      "Regrading, swales, and drainage work that moves water away from your home and keeps the yard from washing out.",
    items: ["Regrading", "Drainage & swales", "French drains", "Erosion control"],
    homeCard: true,
  },
  {
    slug: "hardscaping",
    title: "Hardscaping",
    oneLiner:
      "Patios, walkways, retaining walls, and stone work built to hold up and look good for decades.",
    items: ["Patios & pavers", "Walkways", "Retaining walls", "Stone & flagstone", "Concrete"],
    homeCard: true,
  },
  {
    slug: "landscape-installations",
    title: "Landscape Installations",
    oneLiner:
      "New plantings, beds, and sod, designed to fit your home and the way you use the yard.",
    items: ["Plantings", "New beds", "Sod & seeding", "Yard makeovers"],
  },
  {
    slug: "tree-services",
    title: "Tree Services",
    oneLiner:
      "Trimming, pruning, and removals that keep your trees healthy and clear of the house.",
    items: ["Pruning & trimming", "Limb removal", "Tree & stump removal", "Debris haul-off"],
  },
  {
    slug: "demolition",
    title: "Demolition",
    oneLiner:
      "Tearing out old driveways, patios, decks, and structures and hauling it away so the next project starts clean.",
    items: ["Driveway & patio removal", "Deck & structure teardown", "Site clearing", "Debris haul-off"],
  },
];
