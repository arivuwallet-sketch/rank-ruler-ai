// Sitewide "Fix All & Deploy" — page discovery, per-page optimization and CMS write-back.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { GeneratedLayers } from "./cleaned-page";
import type { JsonValue } from "./generative";

export type SitePage = { url: string };

export type CmsTarget = {
  kind: "none" | "webhook" | "wordpress" | "shopify" | "webflow";
  endpoint?: string;
  token?: string;
};

export type PageFix = {
  url: string;
  ok: boolean;
  message: string;
  title?: string;
  description?: string;
  h1?: string;
  slug?: string;
  tags?: string[];
  altTags?: string[];
  keywords?: GeneratedLayers["keywordMatrix"];
  llmsTxt?: string;
  jsonLd?: JsonValue;
  synced: "written" | "not-connected" | "failed";
  syncNote?: string | undefined;
};

const UA =
  "Mozilla/5.0 (compatible; SEOAgentBot/1.0; +https://seo-agent.app/bot)";

function normalize(input: string): URL {
  let v = input.trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return new URL(v);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "user-agent": UA } });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/** Discovers pages from sitemap.xml (incl. sitemap indexes), falling back to homepage links. */
export const listSitePages = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ url: z.string().min(3).max(300), limit: z.number().min(1).max(50).optional() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ pages: string[]; source: string }> => {
    const target = normalize(data.url);
    const origin = target.origin;
    const limit = data.limit ?? 20;
    const found: string[] = [];
    const seen = new Set<string>();
    const push = (u: string) => {
      try {
        const abs = new URL(u, origin);
        if (abs.origin !== origin) return;
        if (/\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|css|js|xml)$/i.test(abs.pathname)) return;
        abs.hash = "";
        const key = abs.toString().replace(/\/$/, "") || abs.toString();
        if (seen.has(key)) return;
        seen.add(key);
        found.push(abs.toString());
      } catch {
        /* ignore */
      }
    };

    push(target.toString());

    let source = "homepage links";
    const sitemapXml = await fetchText(`${origin}/sitemap.xml`);
    if (sitemapXml) {
      source = "sitemap.xml";
      const locs = [...sitemapXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]!);
      const childSitemaps = locs.filter((l) => /\.xml($|\?)/i.test(l)).slice(0, 3);
      if (childSitemaps.length && /<sitemapindex/i.test(sitemapXml)) {
        for (const child of childSitemaps) {
          const xml = await fetchText(child);
          if (!xml) continue;
          for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) push(m[1]!);
          if (found.length >= limit) break;
        }
      } else {
        for (const l of locs) push(l);
      }
    }

    if (found.length < 2) {
      const html = await fetchText(target.toString());
      if (html) {
        source = "homepage links";
        for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["']/gi)) push(m[1]!);
      }
    }

    return { pages: found.slice(0, limit), source };
  });

async function writeToCms(
  cms: CmsTarget,
  url: string,
  fix: Omit<PageFix, "synced" | "ok" | "message" | "url">,
): Promise<{ synced: PageFix["synced"]; note?: string }> {
  if (!cms || cms.kind === "none" || !cms.endpoint) return { synced: "not-connected" };
  const body = {
    url,
    title: fix.title,
    meta_description: fix.description,
    h1: fix.h1,
    slug: fix.slug,
    tags: fix.tags,
    image_alt: fix.altTags,
    json_ld: fix.jsonLd,
    llms_txt: fix.llmsTxt,
    keywords: fix.keywords,
  };
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cms.token) {
    if (cms.kind === "shopify") headers["X-Shopify-Access-Token"] = cms.token;
    else headers["authorization"] = `Bearer ${cms.token}`;
  }
  try {
    const r = await fetch(cms.endpoint, { method: "POST", headers, body: JSON.stringify(body) });
    if (!r.ok) return { synced: "failed", note: `${cms.kind} responded HTTP ${r.status}` };
    return { synced: "written", note: `${cms.kind} accepted the update` };
  } catch {
    return { synced: "failed", note: `Could not reach the ${cms.kind} endpoint` };
  }
}

/** Cleans, generates and (when connected) writes back optimization for a single URL. */
export const optimizePage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        url: z.string().min(3).max(400),
        brandName: z.string().max(120).optional(),
        location: z.string().max(120).optional(),
        cms: z
          .object({
            kind: z.enum(["none", "webhook", "wordpress", "shopify", "webflow"]),
            endpoint: z.string().max(400).optional(),
            token: z.string().max(400).optional(),
          })
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<PageFix> => {
    const target = normalize(data.url);
    const html = await fetchText(target.toString());
    if (!html) {
      return {
        url: target.toString(),
        ok: false,
        message: "Page could not be loaded.",
        synced: "not-connected",
      };
    }

    const { extractPageContent, cleanContentError } = await import("./cleaned-page");
    const brand =
      data.brandName?.trim() ||
      target.hostname.replace(/^www\./, "").split(".")[0]!.replace(/\b\w/g, (c) => c.toUpperCase());
    const page = extractPageContent(html, target.toString(), brand);
    const blocked = cleanContentError(page);
    if (blocked) {
      return { url: target.toString(), ok: false, message: blocked, synced: "not-connected" };
    }

    let generated: GeneratedLayers;
    try {
      const pipeline = await import("./content-pipeline.server");
      const signals = await pipeline.getQuerySignals(page.primaryEntity, target.toString());
      generated = await pipeline.generateContentLayers(
        page,
        signals,
        target.toString(),
        data.location?.trim() || undefined,
      );
    } catch (err) {
      return {
        url: target.toString(),
        ok: false,
        message: err instanceof Error ? err.message : "Optimization failed.",
        synced: "not-connected",
      };
    }

    const fix = {
      title: generated.titleTag,
      description: generated.metaDescription,
      h1: generated.h1,
      slug: generated.urlSlug,
      tags: generated.tags,
      altTags: generated.altTags,
      keywords: generated.keywordMatrix,
      llmsTxt: generated.llmsTxt,
      jsonLd: generated.jsonLd,
    };
    const sync = await writeToCms((data.cms as CmsTarget) ?? { kind: "none" }, target.toString(), fix);

    return {
      url: target.toString(),
      ok: true,
      message: `Optimized "${page.primaryEntity || brand}"`,
      ...fix,
      synced: sync.synced,
      syncNote: sync.note,
    };
  });
