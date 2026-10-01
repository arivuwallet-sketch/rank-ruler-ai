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

const UA = "Mozilla/5.0 (compatible; SEOAgentBot/1.1; +https://rank-ruler-ai.lovable.app/bot)";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 1_500_000;
const MAX_AUX_BYTES = 2_000_000;

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  ) {
    return true;
  }

  const ipv4 = host.split(".").map((part) => Number(part));
  if (
    ipv4.length === 4 &&
    ipv4.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    const a = ipv4[0] ?? -1;
    const b = ipv4[1] ?? -1;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (host.includes(":")) {
    return (
      host === "::" ||
      host === "::1" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      /^fe[89ab]/.test(host)
    );
  }

  return false;
}

function assertSafeUrl(url: URL): void {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only public HTTP or HTTPS websites can be checked.");
  }
  if (url.username || url.password) {
    throw new Error("Website URLs with embedded credentials are not supported.");
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error("Private, local and internal network addresses cannot be scanned.");
  }
}

async function fetchWithRedirectValidation(
  input: URL,
  headers: HeadersInit,
): Promise<{ response: Response; finalUrl: URL }> {
  let current = new URL(input);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    assertSafeUrl(current);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { response, finalUrl: current };
      if (redirectCount === MAX_REDIRECTS) {
        throw new Error("The website redirected too many times.");
      }
      current = new URL(location, current);
      continue;
    }

    return { response, finalUrl: current };
  }

  throw new Error("The website redirected too many times.");
}

async function readTextLimited(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error("The website response is too large to scan safely.");
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("The website response is too large to scan safely.");
    }

    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

async function fetchOptionalText(url: URL, maxBytes: number): Promise<string | null> {
  try {
    const { response } = await fetchWithRedirectValidation(url, {
      "user-agent": UA,
      accept: "text/plain,application/xml,text/xml,*/*;q=0.5",
    });
    if (!response.ok) return null;
    return await readTextLimited(response, maxBytes);
  } catch {
    return null;
  }
}

/** Accepts "my-app", "my-app.lovable.app", or a full URL (incl. custom domains). */
export function resolveLovableUrl(input: string): { url: string; slug: string } {
  let value = input.trim();
  if (!value || /\s/.test(value)) {
    throw new Error("Enter a valid public website address without spaces.");
  }

  if (!/^https?:\/\//i.test(value)) {
    value = value.replace(/^\/+|\/+$/g, "");
    const host = value.split("/")[0] ?? "";
    if (!host.includes(".")) value = `${value}.lovable.app`;
    value = `https://${value}`;
  }

  const parsed = new URL(value);
  parsed.hash = "";
  assertSafeUrl(parsed);

  const host = parsed.hostname.replace(/^www\./, "");
  const slug = host.split(".")[0] || host;
  return { url: parsed.toString(), slug };
}

export const checkLovableSite = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ input: z.string().min(2).max(300) }).parse(data))
  .handler(async ({ data }): Promise<LovableSiteCheck> => {
    let normalized: { url: string; slug: string };
    try {
      normalized = resolveLovableUrl(data.input);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Enter a valid public website URL.");
    }

    let status: number | null = null;
    let html = "";
    let finalUrl = new URL(normalized.url);

    try {
      const result = await fetchWithRedirectValidation(finalUrl, {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
      });
      status = result.response.status;
      finalUrl = result.finalUrl;
      if (result.response.ok) html = await readTextLimited(result.response, MAX_HTML_BYTES);
    } catch {
      status = null;
    }

    const origin = finalUrl.origin;
    const [robots, sitemap] = await Promise.all([
      fetchOptionalText(new URL("/robots.txt", origin), MAX_AUX_BYTES),
      fetchOptionalText(new URL("/sitemap.xml", origin), MAX_AUX_BYTES),
    ]);

    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || null;
    const isLovable =
      /\.lovable\.app$/i.test(finalUrl.hostname) ||
      /lovable\.(dev|app)/i.test(html) ||
      /gptengineer|lovable\.js/i.test(html);
    const pageCount = sitemap ? [...sitemap.matchAll(/<loc>/gi)].length || null : null;

    const live = status !== null && status < 400 && html.length > 0;
    const note = !live
      ? status
        ? `The address answered with ${status}. Check the name or publish the project first.`
        : "That address could not be reached safely. Check the spelling, availability, or redirect chain."
      : isLovable
        ? "Connected to a Lovable-published site. Ready to scan and optimize."
        : "Site is live. It doesn't look Lovable-published, but it can still be scanned.";

    return {
      url: finalUrl.toString(),
      slug: normalized.slug,
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
