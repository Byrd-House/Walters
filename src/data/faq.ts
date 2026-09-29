// FAQ content — answers from Jesse's questionnaire (2026-09-29), edited for tone.
// Single source for both the rendered page and its FAQPage JSON-LD, so the two can
// never disagree; an answer engine quoting the schema quotes what the page says.
//
// Every figure here is Jesse's, not an estimate. Do not round, hedge, or invent a
// number that isn't in his answers — a wrong price on this page is a wrong price in
// Google's answer box. Questions he didn't answer stay off the page.

export type FaqItem = {
  q: string;
  /** Paragraphs of the answer, in order. */
  a: string[];
  /** Optional starting-price rows, rendered as a list. */
  prices?: StartingPrice[];
};

export type StartingPrice = {
  service: string;
  /** Display string, exactly as it appears on the page. */
  price: string;
  /** Numeric floor for schema.org priceSpecification. */
  from: number;
  /** Service group this is the floor for, where the mapping is unambiguous.
   *  Left off when a price doesn't map cleanly to one group — a wrong price in
   *  structured data is worse than no price. */
  slug?: string;
};

// Single source for every published price. The FAQ renders these rows and
// /services emits the slugged ones as schema.org offers; both read this array so a
// price can never be right in one place and stale in the other.
export const startingPrices: StartingPrice[] = [
  { service: "Yard maintenance", price: "from $60", from: 60, slug: "property-maintenance" },
  { service: "Weekly and biweekly leaf cleanup", price: "from $60", from: 60 },
  { service: "Pruning and trimming", price: "from $100", from: 100 },
  { service: "Aeration", price: "from $125", from: 125 },
  { service: "Overseeding", price: "from $125", from: 125 },
  { service: "Top dressing", price: "from $200", from: 200 },
  { service: "Leaf removal", price: "from $300", from: 300 },
  { service: "Mulch", price: "from $450", from: 450, slug: "mulch-pinestraw" },
  { service: "Lot clearing", price: "from $1,700 for a seven-hour day", from: 1700 },
];

export type FaqGroup = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const faqGroups: FaqGroup[] = [
  {
    id: "pricing",
    title: "Pricing",
    items: [
      {
        q: "What does a typical mulch job cost?",
        a: [
          "Mulch jobs start at $450, which covers a three-yard minimum. From there the price moves with the amount of ground you're covering, how deep you want it laid, and which material you choose — standard shredded costs less than dyed.",
          "Access and terrain matter as much as square footage. Tight gates, obstacles, and slope all add time. So does bed preparation: hand edging, clearing leaves and debris, and pulling out old mulch where it has built up over the years.",
          "We'll walk the property and give you a firm number before any work starts.",
        ],
      },
      {
        q: "What does weekly or biweekly mowing run?",
        a: [
          "Weekly mowing starts at $60. A standard Chapel Hill yard runs around $70 a visit.",
          "Lot size is the main variable, so we confirm the rate once we've seen the property.",
        ],
      },
      {
        q: "Do you have a minimum job size or minimum charge?",
        a: [
          "There's a starting price rather than a flat minimum, and it depends on the service:",
        ],
        prices: startingPrices,
      },
      {
        q: "Do you charge by the hour?",
        a: [
          "No. Everything is priced by the job, so you have the number before work begins rather than watching a clock.",
        ],
      },
      {
        q: "Are estimates free?",
        a: ["Yes. Estimates are free."],
      },
      {
        q: "How do you take payment, and when is it due?",
        a: [
          "For residential work, payment is due on completion. We take cash, check, card, Venmo, and bank payment.",
          "Jobs above $1,000 require a 50% deposit up front.",
          "Commercial accounts are billed Net 30.",
        ],
      },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling and timing",
    items: [
      {
        q: "How soon can you start?",
        a: [
          "In spring and fall — the busiest stretch of the year — the wait is two to three weeks at most. In winter it's usually about a week.",
          "We do take same-day emergency calls: storm cleanup, fallen trees, and drainage problems that can't wait for a scheduled visit.",
        ],
      },
      {
        q: "When is the right time of year to mulch in the Triangle?",
        a: [
          "January through June is the ideal window. The leaves have finished falling by then, so fresh mulch stays visible and clean instead of disappearing under debris a few weeks later.",
          "If you're on a maintenance plan with us, the beds get cleared as part of the routine — which makes mulch worth laying any month of the year.",
        ],
      },
      {
        q: "Do I need to be home while you work?",
        a: ["No, unless you'd prefer to be there."],
      },
      {
        q: "What happens when it rains or the weather turns?",
        a: [
          "We work as much as the weather allows, rain included. The only thing that stops us is genuinely dangerous conditions.",
        ],
      },
      {
        q: "Am I locked into a contract for maintenance?",
        a: [
          "Residential maintenance doesn't require a contract.",
          "Commercial properties do.",
        ],
      },
    ],
  },
  {
    id: "trust",
    title: "Trust and credentials",
    items: [
      {
        // Owner confirmed 2026-09-29 that there is no coverage figure to publish.
        // "Fully insured" without a number is the answer, not a placeholder — do
        // not add a dollar amount here later without asking him again.
        q: "Are you insured?",
        a: [
          "Yes — fully insured for both residential and commercial work, and the crew is covered by workers' compensation.",
        ],
      },
      {
        q: "Do you guarantee your work, and what happens if something's wrong?",
        a: [
          "Projects carry a one-year warranty. If a plant doesn't make it inside that year, we replace it at no charge.",
          "If a mowing visit gets missed, we come back and take care of it as soon as we can, at no cost to you.",
        ],
      },
      {
        q: "Who actually shows up — you, or a crew?",
        a: [
          "Maintenance customers see a consistent crew, and there's always a foreman on site. Jesse isn't typically on maintenance visits.",
          "On larger projects, Jesse is on site.",
        ],
      },
      {
        q: "How long have you been doing this?",
        a: ["Six years."],
      },
    ],
  },
  {
    id: "service-area",
    title: "Service area and scope",
    items: [
      {
        q: "Which towns do you serve?",
        a: [
          "Chapel Hill, Durham, Hillsborough, Carrboro, Pittsboro, Mebane, Cedar Grove, Hurdle Mills, and Eli Whitney.",
          "That range covers maintenance. For larger projects we'll travel further — ask and we'll tell you straight whether it's workable. More detail is on our service area page.",
        ],
      },
      {
        q: "Do you do commercial work, or residential only?",
        a: [
          "Both. Alongside residential properties we hold contracts with HOAs, apartment complexes, and small businesses.",
        ],
      },
      {
        q: "What do you not do?",
        a: [
          "We don't take on irrigation, and we don't do chemical or pest control treatments. For those you'll want a licensed applicator.",
        ],
      },
    ],
  },
  {
    id: "practical",
    title: "Practical details",
    items: [
      {
        q: "Do you haul away the debris and old material?",
        a: [
          "Yes, and it's included. Old mulch, branches, and demolition material are covered by the quote you received — not added afterward.",
        ],
      },
      {
        q: "Where does your mulch and material come from?",
        a: [
          "From a family-owned landscape supply in Chapel Hill. They take in tree and brush material from landscapers working around the area and process it into mulch, so what goes down in your beds is local wood.",
        ],
      },
      {
        q: "What's the best way to reach you?",
        a: [
          "Text or the quote form on this site are the fastest. Calls work too. Either way, you'll hear back the same day.",
        ],
      },
    ],
  },
];

// Flatten an answer to the plain text FAQPage schema expects. Prices become a
// readable clause rather than markup, since the schema field takes text.
export function answerText(item: FaqItem): string {
  const prose = item.a.join(" ");
  if (!item.prices?.length) return prose;
  return `${prose} ${item.prices.map((p) => `${p.service} ${p.price}`).join(". ")}.`;
}
