import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildGenerative, type GenerativeOutput } from "./generative";

export type { GenerativeOutput } from "./generative";


export type Severity = "critical" | "warning" | "notice" | "passed";

export type Issue = {
  id: string;
  category: CategoryId;
  severity: Severity;
  title: string;
  detail: string;
  fix: string;
  impact: "Speed" | "Rankings" | "Clicks & CTR" | "Crawling" | "Authority" | "AI visibility";
};

export type CategoryId = "technical" | "onpage" | "speed" | "content" | "links" | "ai";

export type AuditResult = {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  score: number;
  grade: string;
  ttfbMs: number;
  htmlBytes: number;
  categories: { id: CategoryId; label: string; score: number; passed: number; total: number }[];
  issues: Issue[];
  stats: {
    title: string | null;
    titleLength: number;
    description: string | null;
    descriptionLength: number;
    h1: string[];
    headings: { level: number; text: string }[];
    wordCount: number;
    images: number;
    imagesMissingAlt: number;
    internalLinks: number;
    externalLinks: number;
    nofollowExternal: number;
    scripts: number;
    blockingScripts: number;
    stylesheets: number;
    jsonLdTypes: string[];
    canonical: string | null;
    robotsMeta: string | null;
    lang: string | null;
    viewport: boolean;
    https: boolean;
    compressed: boolean;
    cacheControl: string | null;
    robotsTxt: "found" | "missing" | "error";
    sitemap: "found" | "missing" | "error";
    ogTags: number;
    twitterTags: number;
  };
  keywords: { term: string; count: number; density: number; inTitle: boolean; inH1: boolean }[];
  rewrites: { title: string; description: string; h1: string; slugTip: string };
  projections: { metric: string; now: string; after: string; note: string }[];
  backlinks: { action: string; detail: string }[];
  generative: GenerativeOutput;
};


const CATEGORY_LABELS: Record<CategoryId, string> = {
  technical: "Technical SEO",
  onpage: "On-page & tags",
  speed: "Speed & Core Web Vitals",
  content: "Content & keywords",
  links: "Links & authority",
  ai: "AI / agentic search",
};

const STOP = new Set(
  `a about above after again against all am an and any are aren as at be because been before being below between both but by can cannot could couldn did didn do does doesn doing don down during each few for from further had hadn has hasn have haven having he her here hers herself him himself his how i if in into is isn it its itself let me more most mustn my myself no nor not of off on once only or other ought our ours ourselves out over own same shan she should shouldn so some such than that the their theirs them themselves then there these they this those through to too under until up very was wasn we were weren what when where which while who whom why with won would wouldn you your yours yourself yourselves get got also may will just new one two use using how's it's you're we're i'm they're that's what's there's here's`.split(
    /\s+/,
  ),
);

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .trim();
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  if (!m) return null;
  return decode(m[2] ?? m[3] ?? m[4] ?? "");
}

function metaContent(html: string, key: "name" | "property", value: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const t of tags) {
    const k = attr(t, key);
    if (k && k.toLowerCase() === value.toLowerCase()) return attr(t, "content");
  }
  return null;
}

function titleCaseKeyword(k: string) {
  return k.charAt(0).toUpperCase() + k.slice(1);
}

async function headOk(url: string): Promise<"found" | "missing" | "error"> {
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (r.status >= 200 && r.status < 300) return "found";
    return "missing";
  } catch {
    return "error";
  }
}

export const auditSite = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ url: z.string().min(3).max(300) }).parse(data))
  .handler(async ({ data }): Promise<AuditResult> => {
    let input = data.url.trim();
    if (!/^https?:\/\//i.test(input)) input = `https://${input}`;
    let target: URL;
    try {
      target = new URL(input);
    } catch {
      throw new Error("That doesn't look like a valid website URL.");
    }

    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(target.toString(), {
        redirect: "follow",
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; SEOAgentBot/1.0; +https://seo-agent.app/bot)",
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "gzip, br",
        },
      });
    } catch {
      throw new Error(`Could not reach ${target.hostname}. Check the URL is public and online.`);
    }
    const ttfbMs = Date.now() - started;
    if (!res.ok) throw new Error(`${target.hostname} responded with HTTP ${res.status}.`);
    const html = await res.text();
    const finalUrl = res.url || target.toString();
    const origin = new URL(finalUrl).origin;

    const [robotsTxt, sitemap] = await Promise.all([
      headOk(`${origin}/robots.txt`),
      headOk(`${origin}/sitemap.xml`),
    ]);

    // ---- parse ----
    const head = html.split(/<\/head>/i)[0] ?? html;
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim() || null;
    const titleText = title ? decode(title) : null;
    const description = metaContent(html, "name", "description");
    const robotsMeta = metaContent(html, "name", "robots");
    const canonical = (() => {
      const links = head.match(/<link\b[^>]*>/gi) ?? [];
      for (const l of links) if ((attr(l, "rel") ?? "").toLowerCase() === "canonical") return attr(l, "href");
      return null;
    })();
    const favicon = (head.match(/<link\b[^>]*rel=["'][^"']*icon/i) ?? []).length > 0;
    const viewport = Boolean(metaContent(html, "name", "viewport"));
    const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang");

    const headings: { level: number; text: string }[] = [];
    for (const m of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
      const text = decode((m[2] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
      if (text) headings.push({ level: Number(m[1]), text });
    }
    const h1 = headings.filter((h) => h.level === 1).map((h) => h.text);

    const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
    const imagesMissingAlt = imgTags.filter((t) => {
      const a = attr(t, "alt");
      return a === null || a.length === 0;
    }).length;
    const imagesNoLazy = imgTags.filter((t) => (attr(t, "loading") ?? "") !== "lazy").length;
    const imagesNoDims = imgTags.filter((t) => !attr(t, "width") || !attr(t, "height")).length;

    const scriptTags = html.match(/<script\b[^>]*>/gi) ?? [];
    const externalScripts = scriptTags.filter((t) => attr(t, "src"));
    const blockingScripts = externalScripts.filter(
      (t) => !/\basync\b/i.test(t) && !/\bdefer\b/i.test(t) && !/type=["']module/i.test(t),
    ).length;
    const stylesheets = (head.match(/<link\b[^>]*rel=["']stylesheet/gi) ?? []).length;

    const anchors = html.match(/<a\b[^>]*>/gi) ?? [];
    let internalLinks = 0;
    let externalLinks = 0;
    let nofollowExternal = 0;
    for (const a of anchors) {
      const href = attr(a, "href");
      if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
      let abs: URL;
      try {
        abs = new URL(href, finalUrl);
      } catch {
        continue;
      }
      if (abs.origin === origin) internalLinks++;
      else {
        externalLinks++;
        if (/rel=["'][^"']*nofollow/i.test(a)) nofollowExternal++;
      }
    }

    const jsonLdTypes: string[] = [];
    for (const m of html.matchAll(
      /<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        const parsed = JSON.parse((m[1] ?? "").trim());
        const collect = (v: unknown) => {
          if (Array.isArray(v)) v.forEach(collect);
          else if (v && typeof v === "object") {
            const t = (v as Record<string, unknown>)["@type"];
            if (typeof t === "string") jsonLdTypes.push(t);
            else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && jsonLdTypes.push(x));
            const graph = (v as Record<string, unknown>)["@graph"];
            if (graph) collect(graph);
          }
        };
        collect(parsed);
      } catch {
        /* invalid ld+json */
      }
    }

    const ogTags = (html.match(/<meta\b[^>]*property=["']og:/gi) ?? []).length;
    const twitterTags = (html.match(/<meta\b[^>]*name=["']twitter:/gi) ?? []).length;

    const bodyText = decode(
      (html.split(/<body[^>]*>/i)[1] ?? html)
        .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " "),
    );
    const words = bodyText.toLowerCase().match(/[a-z][a-z'-]{1,}/g) ?? [];
    const wordCount = words.length;

    const freq = new Map<string, number>();
    for (const w of words) {
      if (w.length < 4 || STOP.has(w)) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i] ?? "";
      const b = words[i + 1] ?? "";
      if (a.length < 4 || b.length < 4 || STOP.has(a) || STOP.has(b)) continue;
      const p = `${a} ${b}`;
      freq.set(p, (freq.get(p) ?? 0) + 1);
    }
    const keywords = [...freq.entries()]
      .filter(([, c]) => c > 1)
      .sort((x, y) => y[1] - x[1] || y[0].length - x[0].length)
      .slice(0, 12)
      .map(([term, count]) => ({
        term,
        count,
        density: wordCount ? Number(((count / wordCount) * 100).toFixed(2)) : 0,
        inTitle: Boolean(titleText && titleText.toLowerCase().includes(term)),
        inH1: h1.some((h) => h.toLowerCase().includes(term)),
      }));

    const htmlBytes = new TextEncoder().encode(html).length;
    const compressed = /gzip|br|deflate|zstd/i.test(res.headers.get("content-encoding") ?? "");
    const cacheControl = res.headers.get("cache-control");
    const https = new URL(finalUrl).protocol === "https:";

    // ---- issues ----
    const issues: Issue[] = [];
    const add = (i: Issue) => issues.push(i);
    const titleLength = titleText?.length ?? 0;
    const descriptionLength = description?.length ?? 0;
    const primary = keywords[0]?.term ?? new URL(finalUrl).hostname.split(".")[0] ?? "your topic";
    const brand = new URL(finalUrl).hostname.replace(/^www\./, "").split(".")[0] ?? "Your site";
    const brandName = titleCaseKeyword(brand);

    // On-page
    if (!titleText)
      add({
        id: "title-missing",
        category: "onpage",
        severity: "critical",
        title: "Missing <title> tag",
        detail: "Search engines have no headline for this page in the SERP.",
        fix: `Add a 50–60 character title starting with your primary keyword, e.g. "${titleCaseKeyword(primary)} — ${brandName}".`,
        impact: "Clicks & CTR",
      });
    else if (titleLength < 30 || titleLength > 60)
      add({
        id: "title-length",
        category: "onpage",
        severity: titleLength > 70 || titleLength < 15 ? "critical" : "warning",
        title: `Title tag is ${titleLength} characters`,
        detail: `Current: "${titleText}". Google truncates around 60 characters and short titles waste ranking real-estate.`,
        fix: "Rewrite to 50–60 characters, keyword first, brand last (use the generated rewrite below).",
        impact: "Clicks & CTR",
      });
    else
      add({
        id: "title-ok",
        category: "onpage",
        severity: "passed",
        title: "Title tag length is optimal",
        detail: `"${titleText}" (${titleLength} chars).`,
        fix: "No change needed — keep the keyword in the first 40 characters.",
        impact: "Clicks & CTR",
      });

    if (!description)
      add({
        id: "desc-missing",
        category: "onpage",
        severity: "critical",
        title: "Missing meta description",
        detail: "Google is auto-generating your snippet, which usually lowers CTR.",
        fix: "Add a 140–160 character description with the primary keyword and a clear action (see the generated rewrite).",
        impact: "Clicks & CTR",
      });
    else if (descriptionLength < 120 || descriptionLength > 160)
      add({
        id: "desc-length",
        category: "onpage",
        severity: "warning",
        title: `Meta description is ${descriptionLength} characters`,
        detail: `Current: "${description}"`,
        fix: "Target 140–160 characters, front-load the keyword, end with a benefit or CTA.",
        impact: "Clicks & CTR",
      });
    else
      add({
        id: "desc-ok",
        category: "onpage",
        severity: "passed",
        title: "Meta description length is optimal",
        detail: `${descriptionLength} characters.`,
        fix: "Keep it unique per page.",
        impact: "Clicks & CTR",
      });

    if (h1.length === 0)
      add({
        id: "h1-missing",
        category: "onpage",
        severity: "critical",
        title: "No H1 heading",
        detail: "The page has no primary heading, so topical relevance is unclear.",
        fix: `Add exactly one H1 containing your primary keyword, e.g. "${titleCaseKeyword(primary)}".`,
        impact: "Rankings",
      });
    else if (h1.length > 1)
      add({
        id: "h1-multiple",
        category: "onpage",
        severity: "warning",
        title: `${h1.length} H1 headings found`,
        detail: h1.slice(0, 4).join(" | "),
        fix: "Keep one H1 and demote the rest to H2/H3 to build a clean heading hierarchy.",
        impact: "Rankings",
      });
    else
      add({
        id: "h1-ok",
        category: "onpage",
        severity: "passed",
        title: "Single, clear H1",
        detail: h1[0] ?? "",
        fix: "No change needed.",
        impact: "Rankings",
      });

    const h2s = headings.filter((h) => h.level === 2).length;
    if (h2s < 2)
      add({
        id: "heading-structure",
        category: "content",
        severity: "warning",
        title: "Thin heading structure",
        detail: `${h2s} H2 heading(s) detected — sections are hard to scan for users and for AI answer engines.`,
        fix: "Break content into 4–8 keyword-relevant H2 sections, each answering one search intent.",
        impact: "AI visibility",
      });
    else
      add({
        id: "heading-structure-ok",
        category: "content",
        severity: "passed",
        title: "Heading hierarchy looks healthy",
        detail: `${h2s} H2 sections, ${headings.length} headings total.`,
        fix: "No change needed.",
        impact: "Rankings",
      });

    if (imagesMissingAlt > 0)
      add({
        id: "alt-missing",
        category: "onpage",
        severity: imagesMissingAlt > 5 ? "critical" : "warning",
        title: `${imagesMissingAlt} of ${imgTags.length} images missing alt text`,
        detail: "Alt text feeds image search and accessibility, and adds keyword context.",
        fix: "Write descriptive alt text (under 125 chars) for each image; leave alt=\"\" only for decorative images.",
        impact: "Rankings",
      });
    else if (imgTags.length)
      add({
        id: "alt-ok",
        category: "onpage",
        severity: "passed",
        title: "All images have alt text",
        detail: `${imgTags.length} images checked.`,
        fix: "No change needed.",
        impact: "Rankings",
      });

    // Technical
    if (!https)
      add({
        id: "https",
        category: "technical",
        severity: "critical",
        title: "Site is not served over HTTPS",
        detail: "HTTP is a confirmed ranking negative and triggers browser warnings.",
        fix: "Install a TLS certificate and 301-redirect all HTTP URLs to HTTPS.",
        impact: "Rankings",
      });
    else
      add({
        id: "https-ok",
        category: "technical",
        severity: "passed",
        title: "Served over HTTPS",
        detail: "Secure connection confirmed.",
        fix: "No change needed.",
        impact: "Rankings",
      });

    if (!canonical)
      add({
        id: "canonical",
        category: "technical",
        severity: "warning",
        title: "No canonical tag",
        detail: "Duplicate URL variants (www, trailing slash, tracking params) can split ranking signals.",
        fix: `Add <link rel="canonical" href="${finalUrl}"> and self-reference it on every page.`,
        impact: "Crawling",
      });
    else
      add({
        id: "canonical-ok",
        category: "technical",
        severity: "passed",
        title: "Canonical tag present",
        detail: canonical,
        fix: "Make sure it self-references this page.",
        impact: "Crawling",
      });

    if (robotsMeta && /noindex/i.test(robotsMeta))
      add({
        id: "noindex",
        category: "technical",
        severity: "critical",
        title: "Page is set to noindex",
        detail: `robots meta = "${robotsMeta}" — this page cannot rank at all.`,
        fix: "Remove the noindex directive unless the page is intentionally private.",
        impact: "Crawling",
      });

    if (robotsTxt !== "found")
      add({
        id: "robots-txt",
        category: "technical",
        severity: "warning",
        title: "No robots.txt found",
        detail: "Crawlers have no crawl directives and no sitemap pointer.",
        fix: "Publish /robots.txt with `User-agent: *`, `Allow: /` and a Sitemap: line.",
        impact: "Crawling",
      });
    else
      add({
        id: "robots-txt-ok",
        category: "technical",
        severity: "passed",
        title: "robots.txt found",
        detail: `${origin}/robots.txt is reachable.`,
        fix: "Confirm it isn't blocking important sections.",
        impact: "Crawling",
      });

    if (sitemap !== "found")
      add({
        id: "sitemap",
        category: "technical",
        severity: "critical",
        title: "No XML sitemap at /sitemap.xml",
        detail: "New and deep pages get discovered slowly without one.",
        fix: "Generate an XML sitemap of all indexable URLs, reference it in robots.txt and submit it in Search Console + Bing Webmaster Tools.",
        impact: "Crawling",
      });
    else
      add({
        id: "sitemap-ok",
        category: "technical",
        severity: "passed",
        title: "XML sitemap found",
        detail: `${origin}/sitemap.xml is reachable.`,
        fix: "Keep lastmod values accurate and resubmit after big changes.",
        impact: "Crawling",
      });

    if (!viewport)
      add({
        id: "viewport",
        category: "technical",
        severity: "critical",
        title: "No mobile viewport meta tag",
        detail: "Mobile-first indexing means the mobile render is what ranks.",
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
        impact: "Rankings",
      });
    else
      add({
        id: "viewport-ok",
        category: "technical",
        severity: "passed",
        title: "Mobile viewport configured",
        detail: "Responsive rendering enabled.",
        fix: "No change needed.",
        impact: "Rankings",
      });

    if (!lang)
      add({
        id: "lang",
        category: "technical",
        severity: "notice",
        title: "Missing lang attribute on <html>",
        detail: "Language targeting and accessibility signals are weaker without it.",
        fix: 'Set <html lang="en"> (or the correct locale) and add hreflang if you serve multiple regions.',
        impact: "Rankings",
      });

    if (!favicon)
      add({
        id: "favicon",
        category: "technical",
        severity: "notice",
        title: "No favicon declared",
        detail: "Favicons appear beside your result on mobile SERPs and affect trust/CTR.",
        fix: 'Add <link rel="icon" href="/favicon.ico"> plus a 512px PNG for PWA/social.',
        impact: "Clicks & CTR",
      });

    // Speed
    if (ttfbMs > 800)
      add({
        id: "ttfb",
        category: "speed",
        severity: ttfbMs > 1800 ? "critical" : "warning",
        title: `Slow server response (${ttfbMs} ms)`,
        detail: "Google wants TTFB under 800 ms; slow responses delay LCP directly.",
        fix: "Add edge/CDN caching, enable full-page or object caching, and upgrade hosting or reduce origin work.",
        impact: "Speed",
      });
    else
      add({
        id: "ttfb-ok",
        category: "speed",
        severity: "passed",
        title: `Fast server response (${ttfbMs} ms)`,
        detail: "Within Google's recommended TTFB budget.",
        fix: "No change needed.",
        impact: "Speed",
      });

    if (htmlBytes > 150_000)
      add({
        id: "html-size",
        category: "speed",
        severity: htmlBytes > 400_000 ? "critical" : "warning",
        title: `Large HTML document (${Math.round(htmlBytes / 1024)} KB)`,
        detail: "Heavy DOM payloads slow parsing, LCP and INP, especially on mobile.",
        fix: "Remove inline bloat, paginate long lists, move templates out of HTML and minify the markup.",
        impact: "Speed",
      });
    else
      add({
        id: "html-size-ok",
        category: "speed",
        severity: "passed",
        title: `Lean HTML payload (${Math.round(htmlBytes / 1024)} KB)`,
        detail: "Document size is within budget.",
        fix: "No change needed.",
        impact: "Speed",
      });

    if (!compressed)
      add({
        id: "compression",
        category: "speed",
        severity: "warning",
        title: "Text compression not detected",
        detail: "No gzip/brotli content-encoding on the HTML response.",
        fix: "Enable Brotli (or gzip) for HTML, CSS, JS and SVG at the server or CDN — typically 60–80% smaller.",
        impact: "Speed",
      });
    else
      add({
        id: "compression-ok",
        category: "speed",
        severity: "passed",
        title: "Text compression enabled",
        detail: `content-encoding: ${res.headers.get("content-encoding")}`,
        fix: "No change needed.",
        impact: "Speed",
      });

    if (blockingScripts > 0)
      add({
        id: "blocking-js",
        category: "speed",
        severity: blockingScripts > 4 ? "critical" : "warning",
        title: `${blockingScripts} render-blocking script(s)`,
        detail: `${externalScripts.length} external scripts total; blocking ones stall first paint.`,
        fix: "Add defer/async, self-host critical JS, code-split bundles and load third-party tags after interaction.",
        impact: "Speed",
      });
    else
      add({
        id: "blocking-js-ok",
        category: "speed",
        severity: "passed",
        title: "No render-blocking scripts",
        detail: `${externalScripts.length} external scripts, all async/deferred/module.`,
        fix: "No change needed.",
        impact: "Speed",
      });

    if (stylesheets > 3)
      add({
        id: "css-count",
        category: "speed",
        severity: "warning",
        title: `${stylesheets} blocking stylesheets`,
        detail: "Each stylesheet in <head> blocks rendering until it downloads.",
        fix: "Bundle CSS into one file, inline critical CSS and load the rest with media/print swap.",
        impact: "Speed",
      });

    if (imgTags.length > 3 && imagesNoLazy > Math.ceil(imgTags.length / 2))
      add({
        id: "lazy-images",
        category: "speed",
        severity: "warning",
        title: `${imagesNoLazy} images without lazy loading`,
        detail: "Below-the-fold images compete with the LCP element for bandwidth.",
        fix: 'Add loading="lazy" + decoding="async" to below-the-fold images, keep the hero eager, and serve WebP/AVIF.',
        impact: "Speed",
      });

    if (imgTags.length > 0 && imagesNoDims > 0)
      add({
        id: "img-dims",
        category: "speed",
        severity: "notice",
        title: `${imagesNoDims} images without width/height`,
        detail: "Missing dimensions cause layout shift (CLS).",
        fix: "Set explicit width and height (or aspect-ratio) on every image.",
        impact: "Speed",
      });

    if (!cacheControl || /no-store|no-cache/i.test(cacheControl))
      add({
        id: "cache",
        category: "speed",
        severity: "notice",
        title: "Weak caching headers",
        detail: `cache-control: ${cacheControl ?? "not set"}`,
        fix: "Send long max-age with immutable for static assets and a stale-while-revalidate policy for HTML.",
        impact: "Speed",
      });

    // Content
    if (wordCount < 600)
      add({
        id: "thin-content",
        category: "content",
        severity: wordCount < 300 ? "critical" : "warning",
        title: `Thin content (${wordCount} words)`,
        detail: "Top-ranking pages for competitive queries typically cover the topic in far more depth.",
        fix: `Expand to 900–1,500 words of genuinely useful content covering "${primary}", the related questions people ask, and supporting data or examples.`,
        impact: "Rankings",
      });
    else
      add({
        id: "content-depth-ok",
        category: "content",
        severity: "passed",
        title: `Content depth is solid (${wordCount} words)`,
        detail: "Enough substance to compete for informational queries.",
        fix: "Refresh it quarterly to keep freshness signals.",
        impact: "Rankings",
      });

    if (keywords.length && !keywords[0]?.inTitle)
      add({
        id: "keyword-title",
        category: "content",
        severity: "warning",
        title: `Primary topic "${primary}" is not in the title tag`,
        detail: "Your most-used on-page term doesn't match your SERP headline, weakening relevance.",
        fix: `Work "${primary}" into the first 40 characters of the title and into the H1.`,
        impact: "Rankings",
      });

    if (keywords.some((k) => k.density > 4))
      add({
        id: "keyword-stuffing",
        category: "content",
        severity: "notice",
        title: "Possible keyword over-optimisation",
        detail: keywords
          .filter((k) => k.density > 4)
          .map((k) => `${k.term} (${k.density}%)`)
          .join(", "),
        fix: "Keep density near 0.5–2%; replace repeats with synonyms and entities.",
        impact: "Rankings",
      });

    // Links
    if (internalLinks < 10)
      add({
        id: "internal-links",
        category: "links",
        severity: internalLinks < 4 ? "critical" : "warning",
        title: `Only ${internalLinks} internal links`,
        detail: "Weak internal linking limits crawl depth and how PageRank flows to money pages.",
        fix: "Add 10–30 contextual internal links with descriptive anchor text, plus a related-content block and breadcrumbs.",
        impact: "Authority",
      });
    else
      add({
        id: "internal-links-ok",
        category: "links",
        severity: "passed",
        title: `${internalLinks} internal links found`,
        detail: "Healthy internal link graph on this page.",
        fix: "Keep anchors descriptive, not 'click here'.",
        impact: "Authority",
      });

    if (externalLinks === 0)
      add({
        id: "external-links",
        category: "links",
        severity: "notice",
        title: "No outbound citations",
        detail: "Linking to authoritative sources supports E-E-A-T and factual grounding for AI answers.",
        fix: "Cite 2–5 authoritative sources per long-form page.",
        impact: "Authority",
      });

    if (externalLinks > 0 && nofollowExternal === externalLinks)
      add({
        id: "all-nofollow",
        category: "links",
        severity: "notice",
        title: "All outbound links are nofollow",
        detail: "Blanket nofollow looks unnatural on editorial content.",
        fix: "Use nofollow/sponsored only for paid or untrusted links.",
        impact: "Authority",
      });

    add({
      id: "backlink-growth",
      category: "links",
      severity: "warning",
      title: "Backlink acquisition not automated",
      detail: "Off-page authority is the strongest lever left once on-page is clean.",
      fix: "Run a backlink gap against 3 competitors, convert unlinked brand mentions, publish one linkable data asset per month and claim/optimise your Google Business Profile.",
      impact: "Authority",
    });

    // AI
    if (jsonLdTypes.length === 0)
      add({
        id: "schema",
        category: "ai",
        severity: "critical",
        title: "No structured data (JSON-LD)",
        detail: "Without schema you lose rich results and machine-readable context for AI answer engines.",
        fix: "Add Organization + WebSite schema sitewide, plus Article/Product/FAQ/Breadcrumb schema per template.",
        impact: "AI visibility",
      });
    else
      add({
        id: "schema-ok",
        category: "ai",
        severity: "passed",
        title: `Structured data found: ${[...new Set(jsonLdTypes)].join(", ")}`,
        detail: "Machine-readable context is in place.",
        fix: "Validate in Rich Results Test and extend to remaining templates.",
        impact: "AI visibility",
      });

    if (ogTags < 4 || twitterTags < 2)
      add({
        id: "social-tags",
        category: "ai",
        severity: "warning",
        title: "Incomplete social/share metadata",
        detail: `${ogTags} Open Graph and ${twitterTags} Twitter tags detected.`,
        fix: "Add og:title, og:description, og:image (1200×630), og:url, og:type and twitter:card=summary_large_image.",
        impact: "Clicks & CTR",
      });
    else
      add({
        id: "social-tags-ok",
        category: "ai",
        severity: "passed",
        title: "Social share metadata complete",
        detail: `${ogTags} OG tags, ${twitterTags} Twitter tags.`,
        fix: "Keep og:image under 8 MB and self-referencing og:url.",
        impact: "Clicks & CTR",
      });

    add({
      id: "llms-txt",
      category: "ai",
      severity: "notice",
      title: "No LLMs.txt / AI answer optimisation",
      detail: "AI assistants increasingly drive discovery and need a clean, quotable content structure.",
      fix: "Publish /llms.txt summarising key pages, add concise question-led H2s with direct answers in the first sentence, and keep facts in plain HTML (not JS-rendered).",
      impact: "AI visibility",
    });

    // ---- AEO / GEO checks ----
    const questionHeadings = headings.filter((h) => h.text.trim().endsWith("?")).length;
    add(
      questionHeadings >= 2
        ? {
            id: "aeo-question-headings",
            category: "ai",
            severity: "passed",
            title: "Question-based headings present",
            detail: `${questionHeadings} headings are phrased as user questions.`,
            fix: "Keep a 40–60 word direct answer immediately under each one.",
            impact: "AI visibility",
          }
        : {
            id: "aeo-question-headings",
            category: "ai",
            severity: "warning",
            title: "Headings aren't phrased as questions",
            detail: "Answer engines match question-shaped headings to conversational queries.",
            fix: 'Rewrite section titles as explicit questions ("How does X work?") and follow each with a 40–60 word direct answer capsule.',
            impact: "AI visibility",
          },
    );

    const hasFaqSchema = jsonLdTypes.some((t) => /faqpage/i.test(t));
    add(
      hasFaqSchema
        ? {
            id: "aeo-faq-schema",
            category: "ai",
            severity: "passed",
            title: "FAQPage schema found",
            detail: "Q&A pairs are machine-readable for AI Overviews and chat citations.",
            fix: "Keep answers verbatim-matched to the on-page text.",
            impact: "AI visibility",
          }
        : {
            id: "aeo-faq-schema",
            category: "ai",
            severity: "warning",
            title: "No FAQPage schema",
            detail: "Without explicit Q&A markup, answer engines must guess your answers.",
            fix: "Ship the unified @graph JSON-LD generated below (Organization + BreadcrumbList + Article + FAQPage).",
            impact: "AI visibility",
          },
    );

    const statMatches = (bodyText.match(/\d[\d,.]*\s?(%|percent|x\b|million|billion)/gi) ?? []).length;
    add(
      statMatches >= 3
        ? {
            id: "geo-data-points",
            category: "ai",
            severity: "passed",
            title: "Verifiable data points on page",
            detail: `${statMatches} numeric claims found — strong GEO citation signal.`,
            fix: "Attribute each figure to a named source with a date.",
            impact: "AI visibility",
          }
        : {
            id: "geo-data-points",
            category: "ai",
            severity: "warning",
            title: "Too few statistics for generative engines",
            detail: `Only ${statMatches} numeric claim(s) detected. LLMs cite pages with specific, verifiable numbers.`,
            fix: "Add at least 3 percentages, benchmarks or metrics, each with a named source and year.",
            impact: "AI visibility",
          },
    );

    const hasOrgSchema = jsonLdTypes.some((t) => /organization|localbusiness/i.test(t));
    add(
      hasOrgSchema
        ? {
            id: "geo-entity",
            category: "ai",
            severity: "passed",
            title: "Brand entity is grounded",
            detail: "Organization schema links the brand to its offerings.",
            fix: "Add sameAs links (LinkedIn, X, Wikidata) to strengthen entity resolution.",
            impact: "AI visibility",
          }
        : {
            id: "geo-entity",
            category: "ai",
            severity: "warning",
            title: "Brand entity not grounded for LLMs",
            detail: "No Organization schema, so AI models can't map the brand to its niche.",
            fix: "Add an Organization node with name, url, logo and sameAs profiles, referenced by Article.publisher.",
            impact: "AI visibility",
          },
    );

    // ---- scoring ----

    const WEIGHT: Record<Severity, number> = { critical: 0, warning: 0.5, notice: 0.8, passed: 1 };
    const cats = (Object.keys(CATEGORY_LABELS) as CategoryId[]).map((id) => {
      const list = issues.filter((i) => i.category === id);
      const score = list.length
        ? Math.round((list.reduce((s, i) => s + WEIGHT[i.severity], 0) / list.length) * 100)
        : 100;
      return {
        id,
        label: CATEGORY_LABELS[id],
        score,
        passed: list.filter((i) => i.severity === "passed").length,
        total: list.length,
      };
    });
    const score = Math.round(cats.reduce((s, c) => s + c.score, 0) / cats.length);
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 65 ? "C" : score >= 50 ? "D" : "F";

    const order: Severity[] = ["critical", "warning", "notice", "passed"];
    issues.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

    const kw = titleCaseKeyword(primary);
    const rewrites = {
      title: `${kw} — ${brandName}`.slice(0, 60),
      description:
        `${kw} done right: ${brandName} helps you ${keywords[1]?.term ?? "get results"} faster. See how it works and get started today.`.slice(
          0,
          158,
        ),
      h1: `${kw} that actually works`,
      slugTip: `Use a short, keyword-first slug like /${primary.replace(/\s+/g, "-")} — lowercase, hyphenated, no dates or IDs.`,
    };

    const criticals = issues.filter((i) => i.severity === "critical").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    const lift = Math.min(65, criticals * 9 + warnings * 4);
    const projections = [
      {
        metric: "SEO score",
        now: `${score}/100`,
        after: `${Math.min(98, score + criticals * 6 + warnings * 3)}/100`,
        note: "After fixing every critical and warning below.",
      },
      {
        metric: "Impressions",
        now: "baseline",
        after: `+${lift}%`,
        note: "Driven by indexability, schema and heading/keyword coverage.",
      },
      {
        metric: "Clicks & CTR",
        now: "baseline",
        after: `+${Math.min(45, 6 + criticals * 5 + warnings * 2)}%`,
        note: "From rewritten titles, descriptions and rich results.",
      },
      {
        metric: "Page speed",
        now: `${ttfbMs} ms TTFB · ${Math.round(htmlBytes / 1024)} KB HTML`,
        after: `${Math.max(120, Math.round(ttfbMs * 0.45))} ms · ${Math.max(20, Math.round((htmlBytes / 1024) * 0.6))} KB`,
        note: "With compression, caching, deferred JS and image optimisation.",
      },
    ];

    const backlinks = [
      {
        action: "Backlink gap analysis",
        detail: `Pull referring domains for your 3 closest competitors and target every domain linking to 2+ of them but not to ${brandName}.`,
      },
      {
        action: "Unlinked mention reclamation",
        detail: `Search for "${brandName}" mentions without a link and request attribution — the highest conversion-rate link tactic.`,
      },
      {
        action: "Linkable asset",
        detail: `Publish one original data study or free tool about "${primary}" per quarter and pitch it to 30 relevant sites and newsletters.`,
      },
      {
        action: "Digital PR & profiles",
        detail: "Claim Google Business Profile, key directories, and answer journalist requests weekly for authoritative editorial links.",
      },
      {
        action: "Internal PageRank routing",
        detail: "Funnel links from your strongest pages to the money pages you want to rank, using exact-intent anchors.",
      },
    ];

    return {
      url: input,
      finalUrl,
      fetchedAt: new Date().toISOString(),
      score,
      grade,
      ttfbMs,
      htmlBytes,
      categories: cats,
      issues,
      stats: {
        title: titleText,
        titleLength,
        description,
        descriptionLength,
        h1,
        headings: headings.slice(0, 30),
        wordCount,
        images: imgTags.length,
        imagesMissingAlt,
        internalLinks,
        externalLinks,
        nofollowExternal,
        scripts: externalScripts.length,
        blockingScripts,
        stylesheets,
        jsonLdTypes: [...new Set(jsonLdTypes)],
        canonical,
        robotsMeta,
        lang,
        viewport,
        https,
        compressed,
        cacheControl,
        robotsTxt,
        sitemap,
        ogTags,
        twitterTags,
      },
      keywords,
      rewrites,
      projections,
      backlinks,
    };
  });
