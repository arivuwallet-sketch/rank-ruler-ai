// Step 1 + Step 4 of the content pipeline: real HTML cleaning and output validation.
// Pure functions — client/server safe.
import type { JsonValue } from "./generative";

export type CleanedPage = {
  brand: string;
  pageType: "homepage" | "product" | "category" | "article";
  primaryEntity: string;
  entityDescription: string;
  specs: { label: string; value: string }[];
  priceINR?: number | null;
  searchIntent: string;
  wordCountAfterCleaning: number;
};

export type QuerySignals = {
  autocomplete: string[];
  gscQueries: string[];
};

export type GeneratedLayers = {
  titleTag: string;
  metaDescription: string;
  h1: string;
  urlSlug: string;
  directAnswerCapsule: string;
  faq: { question: string; answer: string }[];
  geoStats: string[];
  llmsTxt: string;
  agentRouting: string;
  jsonLd: JsonValue;
};

const CHROME_TAG = /<(nav|header|footer|aside|form|button|select|option|template|script|style|noscript|svg|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi;
const CHROME_ATTR = /\b(?:class|id)\s*=\s*["'][^"']*\b(nav|navbar|navigation|menu|cart|footer|header|login|signin|sign-in|search|breadcrumb|announcement|drawer|cookie|newsletter|social|pagination)\b/i;

const BANNED_LINE = [
  /add to cart/i,
  /view cart/i,
  /check ?out/i,
  /sign ?up|log ?in|sign ?in/i,
  /^(shop all|home|catalog|contact|search|menu|cart|about|blog)$/i,
  /sold out/i,
  /regular price|sale price|unit price/i,
  /(rs\.?|inr|₹)\s?[\d,]+(\.\d{2})?/i,
  /^[\s\W\d]*$/,
];

const BAD_ENTITY = /price|cart|home|menu|login|search|checkout/i;

/** Collection/promo strings that are never the real subject of a page. */
const GENERIC_ENTITY =
  /^(browse|shop|explore|discover|featured|new arrivals?|our (products|collection|story)|best ?sellers?|collections?|products?|welcome|catalog)\b|latest products/i;

export const BANNED_OUTPUT =
  /add to cart|view cart|check ?out|sign ?up|log ?in|regular price|sale price|sold out|answers ".*" directly/i;

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ");
}

function strip(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function keepLine(line: string) {
  const t = line.trim();
  if (t.length < 3) return false;
  return !BANNED_LINE.some((re) => re.test(t));
}

function detectType(url: string, headings: string[], html: string): CleanedPage["pageType"] {
  const p = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return "/";
    }
  })();
  if (/\/(products|product|item)\//.test(p) || /"@type"\s*:\s*"Product"/i.test(html)) return "product";
  if (/\/(collections|category|categories|shop|tag)\b/.test(p)) return "category";
  if (/\/(blog|article|news|post|guide|guides|docs)\b/.test(p)) return "article";
  if (p.replace(/\/+$/, "") === "") return "homepage";
  return headings.length > 6 ? "category" : "article";
}

/** Removes navigation, commerce and UI chrome and returns typed page content. */
export function extractPageContent(html: string, url: string, brandFallback: string): CleanedPage {
  let body = html.split(/<body[^>]*>/i)[1] ?? html;

  // remove chrome tags and chrome-classed blocks (two passes for nesting)
  for (let i = 0; i < 2; i++) {
    body = body.replace(CHROME_TAG, " ");
    body = body.replace(/<(div|section|ul|ol|li|span)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (full, _t, attrs: string) =>
      CHROME_ATTR.test(attrs) ? " " : full,
    );
  }

  const headingTexts: string[] = [];
  for (const m of body.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = strip(m[2] ?? "");
    if (t && keepLine(t)) headingTexts.push(t);
  }

  const paragraphs: string[] = [];
  for (const m of body.matchAll(/<(p|li|dd|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = strip(m[2] ?? "");
    if (t.split(/\s+/).length >= 6 && keepLine(t)) paragraphs.push(t);
  }
  if (paragraphs.length === 0) {
    const flat = strip(body)
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.split(/\s+/).length >= 6 && keepLine(s));
    paragraphs.push(...flat.slice(0, 40));
  }

  // specs from tables / definition lists / "Label: value" lines
  const specs: { label: string; value: string }[] = [];
  for (const m of body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...(m[1] ?? "").matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => strip(c[1] ?? ""));
    if (cells.length >= 2 && cells[0] && cells[1] && keepLine(cells[0]) && keepLine(cells[1]))
      specs.push({ label: cells[0], value: cells[1] });
  }
  for (const line of [...paragraphs, ...headingTexts]) {
    const m = line.match(/^([A-Z][A-Za-z /&-]{2,28})\s*[:–—]\s*(.{2,80})$/);
    if (m && keepLine(m[1]!) && keepLine(m[2]!)) specs.push({ label: m[1]!.trim(), value: m[2]!.trim() });
  }
  const seenSpec = new Set<string>();
  const uniqueSpecs = specs
    .filter((s) => {
      const k = s.label.toLowerCase();
      if (seenSpec.has(k)) return false;
      seenSpec.add(k);
      return true;
    })
    .slice(0, 12);

  const priceMatch = html.match(/(?:₹|Rs\.?|INR)\s?([\d,]+(?:\.\d{2})?)/i);
  const priceINR = priceMatch ? Number(priceMatch[1]!.replace(/,/g, "")) : null;

  const title = strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)/i)?.[1];
  const brand =
    (html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)/i)?.[1] ??
      title.split(/[|–—-]/).pop() ??
      brandFallback)
      .trim() || brandFallback;

  const pageType = detectType(url, headingTexts, html);

  const entityCandidates = [
    headingTexts[0],
    ogTitle ? decodeEntities(ogTitle) : "",
    title.split(/[|–—]/)[0],
    headingTexts[1],
  ]
    .map((s) => (s ?? "").trim())
    .filter((s) => s.length > 2 && s.length < 110 && keepLine(s) && !BAD_ENTITY.test(s));
  const specific = entityCandidates.filter((s) => !GENERIC_ENTITY.test(s));
  const primaryEntity =
    specific[0] ??
    uniqueSpecs[0]?.label ??
    entityCandidates[0] ??
    headingTexts[0] ??
    title ??
    "";

  const entityDescription = paragraphs.slice(0, 12).join(" ").slice(0, 4000);
  const wordCountAfterCleaning = `${headingTexts.join(" ")} ${entityDescription}`
    .split(/\s+/)
    .filter(Boolean).length;

  const searchIntent =
    pageType === "product"
      ? `Transactional — a shopper evaluating ${primaryEntity || brand} on specs, materials and value before buying.`
      : pageType === "category"
        ? `Commercial investigation — a shopper browsing ${brand} options in this range to shortlist one.`
        : pageType === "article"
          ? `Informational — a reader researching ${primaryEntity || brand} and what to do next.`
          : `Brand / commercial — a visitor deciding whether ${brand} is right for them.`;

  return {
    brand,
    pageType,
    primaryEntity,
    entityDescription,
    specs: uniqueSpecs,
    priceINR,
    searchIntent,
    wordCountAfterCleaning,
  };
}

/** Hard gate — never generate off content that fails this check. */
export function cleanContentError(page: CleanedPage): string | null {
  if (page.wordCountAfterCleaning < 20 || !page.primaryEntity || BAD_ENTITY.test(page.primaryEntity))
    return "Not enough clean content found on this page";
  return null;
}

/** Step 4 — enforce banned phrases and exact lengths in code. */
export function needsRepair(g: GeneratedLayers): string | null {
  if (BANNED_OUTPUT.test(JSON.stringify(g))) return "Output contained banned navigation/commerce phrasing; remove it entirely.";
  if (g.titleTag.length < 50 || g.titleTag.length > 60)
    return `Your titleTag was ${g.titleTag.length} characters; rewrite between 50-60.`;
  if (g.metaDescription.length < 140 || g.metaDescription.length > 155)
    return `Your metaDescription was ${g.metaDescription.length} characters; rewrite between 140-155.`;
  if (!Array.isArray(g.faq) || g.faq.length < 3) return "Return 3-5 FAQ entries grounded in the page data.";
  return null;
}
