// Ground-truth business facts (brief §2). Single source for Header, Footer,
// SEO/JSON-LD, and the quote form. [CONFIRM] items are null → render as TODOs,
// never as invented data.

export const site = {
  // Display brand. The header lockup splits it: wordmark "JESSE WALTERS" over
  // the "LANDSCAPING" rule, so the two read as one name.
  name: "Jesse Walters",
  legalName: "Jesse Walters Landscaping",
  // Google Business Profile name. Differs from legalName above — kept so
  // structured data can declare both and answer engines resolve them as one
  // business. TODO[CONFIRM]: exact GBP spelling before the profile is linked.
  gbpName: "Jesse Walters Landscape & Maintenance",
  tagline: "Landscaping",
  phone: "(919) 441-7049",
  phoneHref: "tel:+19194417049",
  email: "jbwalters3327@gmail.com" as string | null,
  // Confirmed 2026-09-18: no fixed business hours, so no openingHours is
  // emitted in JSON-LD. Omission is correct here — inventing hours would be
  // worse than having none.
  hours: null as string | null,
  areas: ["Chapel Hill", "Durham", "Hillsborough"],
  zip: "27516",
  region: "NC",
  rating: { value: 5.0, count: 26 },
  insured: true,
  // Analytics + advertising. The privacy policy renders its cookie and
  // third-party disclosures from these flags, so flip a flag in the SAME change
  // that adds the script — never before, never after. Leaving one false while
  // the script is live understates what the site does; the reverse claims
  // tracking that isn't running.
  tracking: {
    plausible: false, // cookieless, aggregate only, no personal data
    metaPixel: false, // sets cookies; shares visit + form data with Meta for ads
  },
  // Public profiles found 2026-09-18; phone on the listings matches site.phone.
  // These feed schema.org sameAs, which is how search/answer engines tie the
  // site, the Google Business Profile, and the social accounts to one entity.
  // TODO[CONFIRM]: verify both are the owner's current, active profiles.
  social: {
    facebook:
      "https://www.facebook.com/p/Jesse-Walters-Landscape-and-Maintenance-61576343244940/" as string | null,
    instagram: "https://www.instagram.com/jwlandscapeandmaintenance/" as string | null,
  },
};

export const nav = [
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export type ServiceGroup = {
  slug: string;
  title: string;
  oneLiner: string; // short version — home page cards
  intro?: string; // full opening paragraph on /services; falls back to oneLiner
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
    intro:
      "Mowing, trimming, edging, and seasonal cleanups that keep your property sharp week to week and " +
      "all year long. From spring through fall we're out weekly or biweekly for mowing, edging, " +
      "weedeating, and blowing. From fall through winter that shifts to weekly or biweekly leaf and " +
      "debris removal, with roof and gutter cleaning as scheduled.",
    items: ["Mowing", "Edging & weedeating", "Blowing", "Leaf & debris removal", "Roof & gutter cleaning"],
    emphasized: true,
  },
  {
    slug: "mulch-pinestraw",
    title: "Mulch & Pinestraw",
    oneLiner:
      "Fresh mulch or pinestraw and clean-edged beds that make the whole yard look finished and cared for.",
    intro:
      "Fresh mulch or pinestraw and clean-edged beds that make the whole yard look finished and cared " +
      "for. Either way we start with pre-installation prep, hand-pulling the active weeds to hold back " +
      "future growth. For mulch, you pick from locally sourced cedar, pine, hardwood, or designer dyed " +
      "red, black, or brown, and we finish the beds with metal edging so they stay sharp and distinctly " +
      "separated from the lawn. For pinestraw, our team rolls a tucked border by hand for a clean edge. " +
      "Both finish the same way, with a thorough blow-down of every driveway, walkway, patio, and turf " +
      "area so the property is left neat. Removing existing plants and replanting with the filler of " +
      "your choice is available.",
    items: ["Cedar, pine & hardwood mulch", "Dyed mulch", "Pinestraw", "Metal bed edging", "Plant removal & replanting"],
    homeCard: true,
  },
  {
    slug: "grading-drainage",
    title: "Grading & Drainage Solutions",
    oneLiner:
      "Regrading, swales, and drainage work that moves water away from your home and keeps the yard from washing out.",
    intro:
      "Regrading, swales, and drainage work that moves water away from your home and keeps the yard " +
      "from washing out — protecting your investment.",
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
