// Verify and prepare a Lovable-published website (yours or anyone else's) for scanning.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type LovableSiteCheck = {
  url: string;
  slug: string;
  live: boolean;
  status: number | null;
  isLovable: boolean;
  title: string | null;
  hasRobots: boolean;
  hasSitemap: boolean;
  pageCount: number | null;
  note: string;
};

const UA = "Mozilla/5.0 (compatible; SEOAgentBot/1.0; +https://seo-agent.app/bot)";

/** Accepts "my-app", "my-app.lovable.app", or a full URL (incl. custom domains). */
export function resolveLovableUrl(input: string): { url: string; slug: string } {
  let v = input.trim().replace(/\s+/g, "");
  v = v.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!v.includes(".")) v = `${v}.lovable.app`;
  const host = v.split("/")[0]!;
  const slug = host.replace(/^www\./, "").split(".")[0]!;
  return { url: `https://${v}`, slug };
}

export const checkLovableSite = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ input: z.string().min(2).max(300) }).parse(data))
  .handler(async ({ data }): Promise<LovableSiteCheck> => {
    const { url, slug } = resolveLovableUrl(data.input);
    const origin = new URL(url).origin;

    let status: number | null = null;
    let html = "";
    try {
      const r = await fetch(url, { redirect: "follow", headers: { "user-agent": UA } });
      status = r.status;
      if (r.ok) html = await r.text();
    } catch {
      status = null;
    }

    const [robots, sitemap] = await Promise.all([
      fetch(`${origin}/robots.txt`, { headers: { "user-agent": UA } })
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null),
      fetch(`${origin}/sitemap.xml`, { headers: { "user-agent": UA } })
        .then((r) => (r.ok ? r.text() : null))
        .catch(() => null),
    ]);

    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || null;
    const isLovable =
      /\.lovable\.app$/i.test(new URL(url).hostname) ||
      /lovable\.(dev|app)/i.test(html) ||
      /gptengineer|lovable\.js/i.test(html);
    const pageCount = sitemap ? [...sitemap.matchAll(/<loc>/gi)].length || null : null;

    const live = status !== null && status < 400 && html.length > 0;
    const note = !live
      ? status
        ? `The address answered with ${status}. Check the name or publish the project first.`
        : "That address could not be reached. Check the spelling, or publish the project first."
      : isLovable
        ? "Connected to a Lovable-published site. Ready to scan and optimize."
        : "Site is live. It doesn't look Lovable-published, but it can still be scanned.";

    return {
      url,
      slug,
      live,
      status,
      isLovable,
      title,
      hasRobots: Boolean(robots),
      hasSitemap: Boolean(sitemap),
      pageCount,
      note,
    };
  });
