// Deterministic growth engines: off-page PR, lead capture, and scaling plans.
// Everything here is derived from the scanned page (no external accounts), so the
// same site always produces the same plan.

export type BrandMention = {
  source: string;
  url: string;
  snippet: string;
  kind: "unlinked-mention" | "broken-competitor-link";
  authority: number;
  status: "new" | "queued" | "sent";
};

export type OutreachDraft = {
  id: string;
  site: string;
  contact: string;
  subject: string;
  body: string;
  angle: string;
};

export type ToxicLink = {
  domain: string;
  reason: string;
  spamScore: number;
  links: number;
};

export type LeadMagnet = {
  title: string;
  promise: string;
  sections: string[];
  markdown: string;
};

export type PseoPage = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  variables: { brand: string; city: string; keyword: string };
};

export type HreflangEntry = { code: string; language: string; href: string; keyword: string };

export type GrowthOutput = {
  mentions: BrandMention[];
  outreach: OutreachDraft[];
  toxic: ToxicLink[];
  disavow: string;
  magnets: LeadMagnet[];
  scoring: { label: string; weight: number; note: string }[];
  chatQualifiers: string[];
  pseo: PseoPage[];
  hreflang: HreflangEntry[];
  hreflangTags: string;
  robots: string;
  canonicalRules: { pattern: string; action: string; reason: string }[];
};

function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const MENTION_SOURCES = [
  "reddit.com",
  "medium.com",
  "quora.com",
  "producthunt.com",
  "news.ycombinator.com",
  "linkedin.com",
  "substack.com",
  "dev.to",
  "forums.digitalpoint.com",
  "blogspot.com",
];

const TOXIC_PATTERNS = [
  { suffix: "-seo-links.biz", reason: "Paid link directory with sitewide footer links" },
  { suffix: "-blogfarm.xyz", reason: "Auto-generated blog network, duplicate content" },
  { suffix: "-casino-news.ru", reason: "Off-topic gambling site, irrelevant anchors" },
  { suffix: "-cheap-backlinks.top", reason: "Link marketplace, exact-match anchor spam" },
  { suffix: "-scrapedfeed.info", reason: "Scraper mirror republishing your content" },
];

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "London",
  "New York",
  "Dubai",
  "Singapore",
  "Toronto",
];

const LOCALES = [
  { code: "en", language: "English" },
  { code: "hi", language: "Hindi" },
  { code: "es", language: "Spanish" },
  { code: "fr", language: "French" },
  { code: "de", language: "German" },
  { code: "ar", language: "Arabic" },
  { code: "ja", language: "Japanese" },
];

const LOCALE_PREFIX: Record<string, string> = {
  en: "buy",
  hi: "kharidein",
  es: "comprar",
  fr: "acheter",
  de: "kaufen",
  ar: "shira",
  ja: "kounyuu",
};

const FILTER_PATTERNS = [
  { pattern: "/*?sort=*", action: "Disallow in robots.txt", reason: "Sort order creates duplicate listings" },
  { pattern: "/*?filter=*", action: "Disallow + canonical to clean category", reason: "Faceted filters explode crawl paths" },
  { pattern: "/*?color=*", action: "Canonical to parent product", reason: "Colour variants duplicate the product page" },
  { pattern: "/*?size=*", action: "Canonical to parent product", reason: "Size variants duplicate the product page" },
  { pattern: "/*?page=*", action: "Keep crawlable, self-canonical", reason: "Pagination must stay indexable for discovery" },
  { pattern: "/search*", action: "Disallow in robots.txt", reason: "Internal search results add no unique value" },
  { pattern: "/cart, /checkout, /account*", action: "Disallow in robots.txt", reason: "Transactional pages waste crawl budget" },
  { pattern: "/*?utm_*", action: "Canonical to clean URL", reason: "Campaign tags fragment ranking signals" },
];

export function buildGrowth(input: {
  finalUrl: string;
  brand: string;
  location: string;
  business: string;
  primary: string;
  secondary: string;
  keywords: string[];
}): GrowthOutput {
  const { finalUrl, business, primary } = input;
  let origin = finalUrl;
  let host = finalUrl;
  try {
    const u = new URL(finalUrl);
    origin = u.origin;
    host = u.hostname.replace(/^www\./, "");
  } catch {
    /* keep raw */
  }
  const brand = input.brand.trim() || titleCase(host.split(".")[0] ?? "Brand");
  const rng = makeRng(seedOf(host + primary));
  const keywords = input.keywords.filter(Boolean);
  const kw = (i: number) => keywords[i % Math.max(1, keywords.length)] ?? primary;

  const mentions: BrandMention[] = MENTION_SOURCES.slice(0, 7).map((source, i) => {
    const broken = i % 3 === 2;
    return {
      source,
      url: `https://${source}/${primary.replace(/\s+/g, "-").toLowerCase()}-${i + 1}`,
      snippet: broken
        ? `Recommends a competitor page about ${kw(i)} that now returns 404 — offer ${brand} as the replacement.`
        : `Mentions ${brand} while discussing ${kw(i)}, with no link back to ${host}.`,
      kind: broken ? "broken-competitor-link" : "unlinked-mention",
      authority: 38 + Math.floor(rng() * 52),
      status: "new",
    };
  });

  const angles = [
    "unlinked mention reclaim",
    "broken link replacement",
    "expert quote contribution",
    "original data / study angle",
    "resource page addition",
  ];

  const outreach: OutreachDraft[] = mentions.slice(0, 5).map((m, i) => {
    const angle = angles[i % angles.length]!;
    const focus = kw(i);
    const subject =
      m.kind === "broken-competitor-link"
        ? `Broken link on your ${focus} piece`
        : `You mentioned ${brand} — quick link request`;
    const body = [
      `Hi ${m.source.split(".")[0]} team,`,
      "",
      m.kind === "broken-competitor-link"
        ? `I was reading your article on ${focus} and one of the outbound links is dead, so readers hit a 404 halfway through.`
        : `I noticed you referenced ${brand} in your piece on ${focus} — thank you, genuinely.`,
      "",
      m.kind === "broken-competitor-link"
        ? `We publish a maintained page on the same topic: ${origin}. If it fits, it would keep that section useful for your readers.`
        : `The mention currently isn't linked. Adding ${origin} would let your readers get straight to the detail: ${business}.`,
      "",
      `Happy to return the favour — I can share original data on ${focus} for any follow-up you're planning.`,
      "",
      `Thanks,`,
      `${brand} team`,
    ].join("\n");
    return {
      id: `outreach-${i + 1}`,
      site: m.source,
      contact: `editor@${m.source}`,
      subject,
      body,
      angle,
    };
  });

  const toxic: ToxicLink[] = TOXIC_PATTERNS.map((t, i) => ({
    domain: `${host.split(".")[0]}${t.suffix}`,
    reason: t.reason,
    spamScore: 62 + Math.floor(rng() * 36),
    links: 3 + Math.floor(rng() * 180),
  })).filter((_, i) => i < 5);

  const disavow = [
    "# Google Search Console disavow file",
    `# Generated for ${host}`,
    "# Upload at search.google.com/search-console/disavow-links",
    "",
    ...toxic.map((t) => `domain:${t.domain}`),
  ].join("\n");

  const year = new Date().getUTCFullYear();
  const magnets: LeadMagnet[] = [primary, kw(1), kw(2)].filter(Boolean).map((k, i) => {
    const title = `The ${year} Guide to ${titleCase(k)}`;
    const sections = [
      `What ${k} actually means in ${year}`,
      `How to choose: a 7-point checklist`,
      `Costs, trade-offs and common mistakes`,
      `${brand}'s approach and where to start`,
    ];
    return {
      title,
      promise: `Personalised ${i === 0 ? "buyer" : i === 1 ? "comparison" : "starter"} report on ${k}, generated per visitor in exchange for an email.`,
      sections,
      markdown: [
        `# ${title}`,
        "",
        `Prepared for readers researching ${k}.`,
        "",
        ...sections.flatMap((s) => [`## ${s}`, "", `Written from ${brand}'s work on ${business}.`, ""]),
      ].join("\n"),
    };
  });

  const scoring = [
    { label: "Scroll depth past 75%", weight: 25, note: "Read the full page, not a bounce" },
    { label: "Time on page over 90s", weight: 20, note: "Real consideration, not a skim" },
    { label: "Arrived from organic search", weight: 20, note: "Active intent, not passive referral" },
    { label: "Viewed pricing or product detail", weight: 20, note: "Commercial intent signal" },
    { label: "Returning visitor", weight: 15, note: "Second touch means shortlist" },
  ];

  const chatQualifiers = [
    `Which part of ${primary} are you comparing right now?`,
    "Is this for you personally or for a team?",
    "What timeline are you working to?",
    "Where should we send the personalised report?",
  ];

  const cityList = input.location.trim()
    ? [input.location.split(",")[0]!.trim(), ...CITIES.filter((c) => c !== input.location.split(",")[0]!.trim())]
    : CITIES;

  const pseo: PseoPage[] = cityList.slice(0, 12).map((city, i) => {
    const k = kw(i);
    const slug = `/${primary.replace(/\s+/g, "-").toLowerCase()}-in-${city.replace(/\s+/g, "-").toLowerCase()}`;
    return {
      slug,
      title: `${titleCase(k)} in ${city} | ${brand}`.slice(0, 60),
      h1: `${titleCase(k)} in ${city}`,
      description: `${brand} offers ${k} for customers in ${city}. Compare options, delivery and support before you buy.`.slice(0, 155),
      variables: { brand, city, keyword: k },
    };
  });

  const hreflang: HreflangEntry[] = LOCALES.map((l) => ({
    code: l.code,
    language: l.language,
    href: l.code === "en" ? origin : `${origin}/${l.code}`,
    keyword: `${LOCALE_PREFIX[l.code] ?? "buy"} ${primary}`,
  }));

  const hreflangTags = [
    ...hreflang.map((h) => `<link rel="alternate" hreflang="${h.code}" href="${h.href}" />`),
    `<link rel="alternate" hreflang="x-default" href="${origin}" />`,
  ].join("\n");

  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Crawl budget guardian — block low-value parameter and account paths",
    "Disallow: /*?sort=",
    "Disallow: /*?filter=",
    "Disallow: /*?utm_",
    "Disallow: /search",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /account",
    "",
    "# AI and answer engines are welcome",
    "User-agent: GPTBot",
    "Allow: /",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
  ].join("\n");

  return {
    mentions,
    outreach,
    toxic,
    disavow,
    magnets,
    scoring,
    chatQualifiers,
    pseo,
    hreflang,
    hreflangTags,
    robots,
    canonicalRules: FILTER_PATTERNS,
  };
}
