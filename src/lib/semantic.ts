// 3-Step Semantic Pipeline: boilerplate removal → synthesis → generation guardrails.
// Pure functions, client/server safe.

export type PageContext = {
  business: string;
  intent: string;
  primaryKeyword: string;
  secondaryKeyword: string;
  evidence: string[];
  removed: string[];
};

/** UI / commerce boilerplate that must never become a keyword, heading or question. */
const BOILERPLATE_TERMS = [
  "add to cart",
  "add to bag",
  "added to your cart",
  "view cart",
  "shopping cart",
  "cart",
  "checkout",
  "check out",
  "buy now",
  "buy",
  "shop now",
  "order now",
  "login",
  "log in",
  "sign in",
  "sign up",
  "signup",
  "register",
  "my account",
  "account",
  "search",
  "menu",
  "navigation",
  "home",
  "homepage",
  "price",
  "prices",
  "pricing",
  "sale price",
  "regular price",
  "unit price",
  "sold out",
  "quantity",
  "quantity selector",
  "subtotal",
  "total",
  "shipping",
  "free shipping",
  "returns",
  "refund policy",
  "privacy policy",
  "terms of service",
  "terms",
  "cookie",
  "cookies",
  "newsletter",
  "subscribe",
  "email address",
  "follow us",
  "share",
  "skip to content",
  "read more",
  "learn more",
  "click here",
  "view all",
  "browse",
  "browse our latest products",
  "all rights reserved",
  "copyright",
  "contact us",
  "faq",
  "wishlist",
  "compare",
  "filter",
  "sort by",
  "reviews",
  "rating",
  "select options",
  "choose an option",
  "size",
  "color",
  "colour",
  "instagram",
  "facebook",
  "twitter",
  "tiktok",
  "youtube",
  "linkedin",
  "whatsapp",
];

const BOILERPLATE_SET = new Set(BOILERPLATE_TERMS);

/** True when a term (single word or phrase) is generic UI/commerce chrome. */
export function isBoilerplateTerm(term: string): boolean {
  const t = term.toLowerCase().trim();
  if (!t) return true;
  if (BOILERPLATE_SET.has(t)) return true;
  if (/^\d[\d,.]*$/.test(t)) return true; // raw numbers / prices
  if (/[$€£¥₹]/.test(t)) return true;
  if (/\b(cart|checkout|login|signup|sign in|sign up|price|menu|wishlist|subtotal|coupon|voucher|discount code)\b/.test(t))
    return true;
  // phrase where every word is boilerplate
  const parts = t.split(/\s+/);
  if (parts.length > 1 && parts.every((p) => BOILERPLATE_SET.has(p))) return true;
  return false;
}

/** True when a heading is UI chrome rather than real content. */
export function isBoilerplateHeading(text: string): boolean {
  const t = text.toLowerCase().replace(/[^a-z0-9$€£¥₹ ]/g, " ").replace(/\s+/g, " ").trim();
  if (!t || t.length < 3) return true;
  if (isBoilerplateTerm(t)) return true;
  if (/^(your (cart|bag|order)|item added|added to (your )?cart|main menu|footer menu|quick links|useful links|social|customer (care|service)|payment methods|we accept|sign up (and save|for)|join our|get \d+% off)/.test(t))
    return true;
  return false;
}

const CHROME_TAGS = /<(nav|header|footer|aside|form|button|select|option|template)\b[^>]*>[\s\S]*?<\/\1>/gi;
const CHROME_CLASS =
  /class\s*=\s*["'][^"']*\b(nav|navbar|navigation|menu|header|footer|breadcrumb|cart|drawer|modal|cookie|newsletter|sidebar|announcement|topbar|social|pagination|filters?)\b/i;

/**
 * Step 1 — Content cleaning: strip navigation, footers, forms, buttons, cookie
 * banners and price chrome, then return only the main editorial text.
 */
export function extractMainText(html: string): { mainText: string; removed: string[] } {
  const removed: string[] = [];
  let body = html.split(/<body[^>]*>/i)[1] ?? html;

  body = body.replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ");

  // Prefer explicit main content containers when present.
  const main =
    body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ??
    body.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ??
    body.match(/<div\b[^>]*\brole=["']main["'][^>]*>([\s\S]*?)<\/div>/i);
  if (main?.[1]) {
    body = main[1];
    removed.push("Kept <main>/<article> content only");
  }

  if (CHROME_TAGS.test(body)) removed.push("Navigation, header, footer, forms and buttons");
  body = body.replace(CHROME_TAGS, " ");

  // Drop divs/sections whose class marks them as chrome (one shallow pass).
  body = body.replace(/<(div|section|ul|ol)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, _tag, attrs: string) =>
    CHROME_CLASS.test(attrs) ? " " : full,
  );

  let text = body
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

  const before = text.length;
  text = text.replace(/[$€£¥₹]\s?\d[\d,.]*(\s?(usd|eur|gbp|inr|aud|cad))?/gi, " ");
  if (text.length < before) removed.push("Currency values and price tags");

  const cleaned = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => {
      const t = s.trim();
      if (t.length < 3) return false;
      return !isBoilerplateTerm(t);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return { mainText: cleaned, removed };
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * Step 2 — Mandatory synthesis: what is actually sold/published here, what the
 * searcher wants, and a non-generic primary keyword.
 */
export function synthesizeContext(input: {
  finalUrl: string;
  brandName: string;
  title: string | null;
  h1: string[];
  headings: { level: number; text: string }[];
  keywords: { term: string; count: number }[];
  mainText: string;
  removed: string[];
  pageType: string;
}): PageContext {
  const { finalUrl, brandName, title, h1, headings, keywords, mainText, removed, pageType } = input;

  const safeKeywords = keywords.filter((k) => !isBoilerplateTerm(k.term));
  const contentHeadings = headings.filter((h) => !isBoilerplateHeading(h.text));
  const path = new URL(finalUrl).pathname
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/[-_]+/g, " "))
    .filter((s) => !isBoilerplateTerm(s));

  const primaryKeyword =
    safeKeywords.find((k) => k.term.includes(" "))?.term ??
    safeKeywords[0]?.term ??
    path[path.length - 1] ??
    (h1[0] && !isBoilerplateHeading(h1[0]) ? h1[0].toLowerCase() : "") ??
    brandName.toLowerCase();

  const secondaryKeyword =
    safeKeywords.find((k) => k.term !== primaryKeyword && !primaryKeyword.includes(k.term))?.term ?? "";

  const subject =
    (h1[0] && !isBoilerplateHeading(h1[0]) ? h1[0] : "") ||
    (title ? title.split(/[|–—-]/)[0]!.trim() : "") ||
    contentHeadings[0]?.text ||
    titleCase(primaryKeyword);

  const offering = /product|category/i.test(pageType)
    ? `Selling ${subject.toLowerCase().replace(/^(buy|shop)\s+/i, "")}`
    : /blog|article|docs/i.test(pageType)
      ? `Publishing editorial content about ${primaryKeyword}`
      : `Offering ${subject.toLowerCase()}`;

  const business = `${brandName} — ${offering}.`;

  const intent = /product|category/i.test(pageType)
    ? `Transactional: someone comparing or ready to buy ${primaryKeyword}, looking at specs, materials and value before choosing.`
    : /blog|article|docs/i.test(pageType)
      ? `Informational: someone researching how ${primaryKeyword} works and what to do next.`
      : `Commercial investigation: someone evaluating whether ${brandName} is the right choice for ${primaryKeyword}.`;

  const evidence = [
    h1[0] && !isBoilerplateHeading(h1[0]) ? `H1: "${h1[0]}"` : null,
    contentHeadings[1] ? `Section: "${contentHeadings[1].text}"` : null,
    safeKeywords.length ? `Content terms: ${safeKeywords.slice(0, 4).map((k) => k.term).join(", ")}` : null,
    mainText ? `Cleaned copy: ${mainText.split(/\s+/).filter(Boolean).length} words analysed` : null,
  ].filter((v): v is string => Boolean(v));

  return { business, intent, primaryKeyword, secondaryKeyword, evidence, removed };
}
