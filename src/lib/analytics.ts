// Deterministic simulated analytics data model for the Omnipotent Analytics Studio.
// Client/server safe: pure functions, no side effects. Values are derived from the
// scanned host so a given site always renders the same dataset.

export type RangeKey = "live" | "today" | "7d" | "30d" | "90d" | "ytd" | "custom";

export type Point = { label: string; users: number; clicks: number; revenue: number };
export type Row = Record<string, string | number>;

export type BusinessModel =
  | "ecommerce"
  | "subscription"
  | "marketplace"
  | "leadgen"
  | "content"
  | "unknown";

export type AnalyticsData = {
  host: string;
  range: RangeKey;
  /** True whenever no real analytics source is connected — every value is sample data. */
  sample: boolean;
  businessModel: BusinessModel;
  /** Which metric groups fit the detected model. Nothing else is invented. */
  metricGroups: { commerce: boolean; leads: boolean; subscription: boolean };
  live: { users: number; pages: { path: string; users: number }[]; pins: { city: string; country: string; users: number; x: number; y: number }[]; feed: string[] };
  kpis: { label: string; value: string; raw: number; delta: number; spark: number[] }[];
  series: Point[];
  gsc: { clicks: number; impressions: number; ctr: number; position: number };
  engagement: { users: number; newUsers: number; returning: number; sessions: number; pageviews: number; engagementRate: number; avgDuration: number; bounceRate: number };
  acquisition: { channel: string; sessions: number; share: number }[];
  geo: { country: string; code: string; users: number; share: number; cities: { city: string; users: number }[] }[];
  age: { bracket: string; users: number }[];
  gender: { label: string; share: number }[];
  languages: { label: string; share: number }[];
  devices: { label: string; share: number }[];
  browsers: { label: string; share: number }[];
  os: { label: string; share: number }[];
  resolutions: { label: string; share: number }[];
  ecommerce: { revenue: number; orders: number; conversionRate: number; aov: number; clv: number; revenuePerUser: number; cartAbandonment: number };
  funnel: { step: string; users: number }[];
  scroll: { depth: string; share: number }[];
  clickMap: { element: string; clicks: number; share: number }[];
  exitPages: { path: string; exits: number; bounceRate: number }[];
  keywords: Row[];
  pages: Row[];
  products: Row[];
  sources: { connected: boolean; name: string; detail: string }[];
};

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const RANGE_DAYS: Record<RangeKey, number> = { live: 1, today: 1, "7d": 7, "30d": 30, "90d": 90, ytd: 180, custom: 14 };

export function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 14;
  return Math.min(365, Math.max(1, Math.round(Math.abs(b - a) / 86400000) + 1));
}

function share(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  return values.map((v) => Math.round((v / total) * 1000) / 10);
}

export function buildAnalytics(
  finalUrl: string,
  range: RangeKey,
  primary: string,
  tick = 0,
  customDays?: number,
  opts: { businessModel?: BusinessModel; sitePaths?: string[] } = {},
): AnalyticsData {
  const url = new URL(finalUrl);
  const host = url.hostname.replace(/^www\./, "");
  const days = range === "custom" && customDays ? customDays : RANGE_DAYS[range];
  const rnd = seeded(host + range + days);
  const scale = days === 1 ? 1 : days;
  const base = 240 + Math.round(rnd() * 900);
  const businessModel: BusinessModel = opts.businessModel ?? "unknown";
  // Only paths the scan actually found on the real site may be displayed.
  const paths = (opts.sitePaths?.length ? opts.sitePaths : ["/"]).slice(0, 6);

  // ---- Live ----
  const liveRnd = seeded(host + tick);
  const liveUsers = Math.max(3, Math.round(base * 0.06 + liveRnd() * base * 0.05));
  const livePages = paths.slice(0, 5).map((p) => ({ path: p, users: Math.max(1, Math.round(liveUsers * (0.1 + liveRnd() * 0.35))) }));
  const cities = [
    ["New York", "United States", 24, 36],
    ["London", "United Kingdom", 47, 27],
    ["Berlin", "Germany", 52, 28],
    ["Mumbai", "India", 68, 45],
    ["Sydney", "Australia", 88, 76],
    ["São Paulo", "Brazil", 33, 68],
    ["Toronto", "Canada", 23, 28],
    ["Singapore", "Singapore", 76, 54],
  ] as const;
  const pins = cities.map(([city, country, x, y]) => ({ city, country, users: Math.max(1, Math.round(liveRnd() * liveUsers * 0.4)), x, y }));
  const feed = [
    `New session from ${pins[0]!.city} → ${paths[0]}`,
    `Organic click on "${primary}" → ${paths[Math.min(1, paths.length - 1)]}`,
    `Scroll depth 75% on ${paths[Math.min(2, paths.length - 1)]}`,
    ...(businessModel === "ecommerce" ? [`Add to cart · ${paths[Math.min(3, paths.length - 1)]}`] : []),
    `Returning visitor from ${pins[3]!.city}`,
    `Referral from google.com → ${paths[Math.min(4, paths.length - 1)]}`,
  ];

  // ---- Time series ----
  const buckets = range === "live" || range === "today" ? 24 : Math.min(days, 90);
  const series: Point[] = Array.from({ length: buckets }, (_, i) => {
    const wave = 0.7 + Math.sin((i / buckets) * Math.PI * 2) * 0.25 + rnd() * 0.2;
    const users = Math.round(base * wave * (buckets === 24 ? 0.09 : 1));
    return {
      label: buckets === 24 ? `${String(i).padStart(2, "0")}:00` : `D-${buckets - i}`,
      users,
      clicks: Math.round(users * (0.45 + rnd() * 0.2)),
      revenue: Math.round(users * (1.4 + rnd() * 2.6)),
    };
  });

  const users = series.reduce((s, p) => s + p.users, 0);
  const clicks = series.reduce((s, p) => s + p.clicks, 0);
  const revenue = series.reduce((s, p) => s + p.revenue, 0);
  const impressions = Math.round(clicks * (14 + rnd() * 12));
  const sessions = Math.round(users * (1.18 + rnd() * 0.2));
  const orders = Math.max(1, Math.round(sessions * (0.012 + rnd() * 0.02)));

  const spark = (mult: number) => series.slice(-14).map((p) => Math.round(p.users * mult));
  const kpis = [
    { label: "Organic clicks", value: clicks.toLocaleString(), raw: clicks, delta: Math.round((rnd() * 40 - 12) * 10) / 10, spark: spark(0.5) },
    { label: "Revenue", value: `$${revenue.toLocaleString()}`, raw: revenue, delta: Math.round((rnd() * 36 - 8) * 10) / 10, spark: spark(2.1) },
    { label: "Users", value: users.toLocaleString(), raw: users, delta: Math.round((rnd() * 30 - 6) * 10) / 10, spark: spark(1) },
    { label: "Conversion rate", value: `${((orders / sessions) * 100).toFixed(2)}%`, raw: orders / sessions, delta: Math.round((rnd() * 20 - 7) * 10) / 10, spark: spark(0.04) },
  ];

  // ---- Acquisition ----
  const acqRaw = [users * 0.46, users * 0.19, users * 0.12, users * 0.09, users * 0.09, users * 0.05].map((v) => Math.round(v * (0.85 + rnd() * 0.3)));
  const acqShares = share(acqRaw);
  const acquisition = ["Organic search", "Direct", "Referral", "Paid search", "Social", "Email"].map((channel, i) => ({
    channel,
    sessions: acqRaw[i]!,
    share: acqShares[i]!,
  }));

  // ---- Geography ----
  const geoRaw = [
    ["United States", "US", ["New York", "San Francisco", "Austin"]],
    ["United Kingdom", "GB", ["London", "Manchester", "Bristol"]],
    ["India", "IN", ["Mumbai", "Bengaluru", "Delhi"]],
    ["Germany", "DE", ["Berlin", "Munich", "Hamburg"]],
    ["Canada", "CA", ["Toronto", "Vancouver", "Montreal"]],
    ["Australia", "AU", ["Sydney", "Melbourne", "Brisbane"]],
    ["Brazil", "BR", ["São Paulo", "Rio de Janeiro", "Recife"]],
    ["Singapore", "SG", ["Singapore"]],
  ] as const;
  const geoVals = geoRaw.map((_, i) => Math.round(users * (0.34 / (i + 1)) * (0.8 + rnd() * 0.5)));
  const geoShares = share(geoVals);
  const geo = geoRaw.map(([country, code, cityList], i) => ({
    country,
    code,
    users: geoVals[i]!,
    share: geoShares[i]!,
    cities: cityList.map((city, j) => ({ city, users: Math.round(geoVals[i]! * (0.5 - j * 0.15)) })),
  }));

  // ---- Demographics ----
  const ageRaw = [0.14, 0.31, 0.24, 0.16, 0.09, 0.06].map((w) => Math.round(users * w * (0.85 + rnd() * 0.3)));
  const age = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((bracket, i) => ({ bracket, users: ageRaw[i]! }));
  const gShare = share([0.56 + rnd() * 0.1, 0.4 + rnd() * 0.1, 0.03]);
  const gender = ["Male", "Female", "Unknown"].map((label, i) => ({ label, share: gShare[i]! }));
  const langShare = share([0.62, 0.11, 0.08, 0.07, 0.06, 0.06].map((w) => w * (0.85 + rnd() * 0.3)));
  const languages = ["en-US", "en-GB", "de-DE", "hi-IN", "pt-BR", "es-ES"].map((label, i) => ({ label, share: langShare[i]! }));
  const devShare = share([0.52 + rnd() * 0.1, 0.41 + rnd() * 0.1, 0.07]);
  const devices = ["Mobile", "Desktop", "Tablet"].map((label, i) => ({ label, share: devShare[i]! }));
  const brShare = share([0.58, 0.18, 0.12, 0.07, 0.05].map((w) => w * (0.85 + rnd() * 0.3)));
  const browsers = ["Chrome", "Safari", "Edge", "Firefox", "Other"].map((label, i) => ({ label, share: brShare[i]! }));
  const osShare = share([0.31, 0.27, 0.22, 0.14, 0.06].map((w) => w * (0.85 + rnd() * 0.3)));
  const os = ["Android", "iOS", "Windows", "macOS", "Linux"].map((label, i) => ({ label, share: osShare[i]! }));
  const resShare = share([0.24, 0.21, 0.19, 0.2, 0.16].map((w) => w * (0.85 + rnd() * 0.3)));
  const resolutions = ["390x844", "1920x1080", "1440x900", "1366x768", "412x915"].map((label, i) => ({ label, share: resShare[i]! }));

  // ---- Ecommerce ----
  const aov = Math.round((revenue / orders) * 100) / 100;
  const ecommerce = {
    revenue,
    orders,
    conversionRate: Math.round((orders / sessions) * 10000) / 100,
    aov,
    clv: Math.round(aov * (2.4 + rnd() * 1.8) * 100) / 100,
    revenuePerUser: Math.round((revenue / users) * 100) / 100,
    cartAbandonment: Math.round((62 + rnd() * 16) * 10) / 10,
  };

  const funnelStart = sessions;
  const funnel = [
    { step: "Landing view", users: funnelStart },
    { step: "Product / offer view", users: Math.round(funnelStart * 0.52) },
    { step: "Add to cart", users: Math.round(funnelStart * 0.19) },
    { step: "Checkout started", users: Math.round(funnelStart * 0.08) },
    { step: "Purchase", users: orders },
  ];
  const scroll = [
    { depth: "25%", share: 92 },
    { depth: "50%", share: Math.round(64 + rnd() * 10) },
    { depth: "75%", share: Math.round(38 + rnd() * 12) },
    { depth: "100%", share: Math.round(17 + rnd() * 10) },
  ];
  const clickRaw = ["Primary CTA button", "Nav · Pricing", "Hero demo video", "FAQ accordion", "Footer contact link"].map(() => Math.round(users * (0.03 + rnd() * 0.14)));
  const clickShares = share(clickRaw);
  const clickMap = ["Primary CTA button", "Nav · Pricing", "Hero demo video", "FAQ accordion", "Footer contact link"].map((element, i) => ({
    element,
    clicks: clickRaw[i]!,
    share: clickShares[i]!,
  }));
  const exitPages = paths.slice(0, 5).map((p) => ({
    path: p,
    exits: Math.round(users * (0.04 + rnd() * 0.12)),
    bounceRate: Math.round((28 + rnd() * 44) * 10) / 10,
  }));

  // ---- Tables ----
  const kwSeeds = [primary, `${primary} pricing`, `best ${primary}`, `${primary} tools`, `${primary} vs alternatives`, `how to ${primary}`, `${primary} guide`, `${primary} agency`];
  const keywords: Row[] = kwSeeds.map((term, i) => {
    const kClicks = Math.max(1, Math.round(clicks * (0.22 / (i + 1)) * (0.7 + rnd() * 0.7)));
    const kImpr = Math.round(kClicks * (12 + rnd() * 22));
    return {
      Keyword: term,
      Clicks: kClicks,
      Impressions: kImpr,
      CTR: `${((kClicks / kImpr) * 100).toFixed(1)}%`,
      Position: Math.round((1.4 + i * 1.7 + rnd() * 3) * 10) / 10,
    };
  });
  const pages: Row[] = paths.map((p, i) => {
    const pClicks = Math.max(1, Math.round(clicks * (0.26 / (i + 1)) * (0.7 + rnd() * 0.7)));
    const pImpr = Math.round(pClicks * (10 + rnd() * 20));
    return {
      Page: p,
      Clicks: pClicks,
      Impressions: pImpr,
      CTR: `${((pClicks / pImpr) * 100).toFixed(1)}%`,
      "Avg. position": Math.round((2 + i * 1.5 + rnd() * 3) * 10) / 10,
    };
  });
  const products: Row[] = ["Starter plan", "Pro plan", "Enterprise plan", "Annual bundle", "Add-on: audits"].map((name, i) => {
    const qty = Math.max(1, Math.round(orders * (0.34 / (i + 1)) * (0.7 + rnd() * 0.7)));
    const rev = Math.round(qty * aov * (0.6 + rnd() * 1.4));
    return { Product: name, SKU: `SKU-${1000 + i * 7}`, Units: qty, Revenue: `$${rev.toLocaleString()}`, "Rev. share": `${((rev / revenue) * 100).toFixed(1)}%` };
  });

  const sources = [
    { connected: false, name: "Google Analytics 4 Data API", detail: "OAuth 2.0 / service account — connect to stream real users, acquisition and demographics." },
    { connected: false, name: "Google Search Console API", detail: "Connect to pull live clicks, impressions, CTR and average position." },
    { connected: false, name: "Shopify / WooCommerce / Stripe", detail: "Connect a store to stream orders, revenue and funnel drop-off." },
    { connected: false, name: "Live socket stream", detail: "Realtime active-user socket — running in simulation until a property is connected." },
  ];

  return {
    host,
    range,
    live: { users: liveUsers, pages: livePages, pins, feed },
    kpis,
    series,
    gsc: {
      clicks,
      impressions,
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      position: Math.round((6 + rnd() * 12) * 10) / 10,
    },
    engagement: {
      users,
      newUsers: Math.round(users * (0.58 + rnd() * 0.15)),
      returning: users - Math.round(users * (0.58 + rnd() * 0.15)),
      sessions,
      pageviews: Math.round(sessions * (2.1 + rnd() * 1.6)),
      engagementRate: Math.round((52 + rnd() * 26) * 10) / 10,
      avgDuration: Math.round(64 + rnd() * 160),
      bounceRate: Math.round((28 + rnd() * 26) * 10) / 10,
    },
    acquisition,
    geo,
    age,
    gender,
    languages,
    devices,
    browsers,
    os,
    resolutions,
    ecommerce,
    funnel,
    scroll,
    clickMap,
    exitPages,
    keywords,
    pages,
    products,
    sources,
  };
}

export function comparePrevious(d: AnalyticsData): AnalyticsData {
  const rnd = seeded(d.host + "prev" + d.range);
  const factor = 0.72 + rnd() * 0.4;
  return buildAnalytics(`https://${d.host}`, d.range, "previous period", Math.round(factor * 100));
}

export function toCsv(rows: Row[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n");
}
