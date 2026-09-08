// Step 2 + Step 3: real query signals and one real model call returning strict JSON.
import {
  needsRepair,
  type CleanedPage,
  type GeneratedLayers,
  type QuerySignals,
} from "./cleaned-page";

const MODEL = "google/gemini-3.8-flash";

const SYSTEM_PROMPT = `You are writing SEO/AEO/GEO/AAO content for a website. You'll receive a \`page\` object (already-cleaned content — never raw HTML) and, optionally, \`querySignals\` (real autocomplete suggestions and/or Search Console queries for this page).

Question sourcing, in priority order:
1. If querySignals has usable entries, select and lightly clean up the 3-5 most relevant, on-topic ones — drop anything nonsensical, off-topic, or navigational. Prefer real query wording over inventing new phrasing.
2. If querySignals is empty or too thin, generate questions using ONLY the archetypes that page.specs / page.entityDescription actually support: identity (only if the entity name is genuinely unfamiliar), feature, comparison, suitability, pricing (only if priceINR is set), trust/policy (only if stated), how-to, local/availability. Never force every archetype — pick what fits this specific page.

Hard rules, always:
- Never write: cart, checkout, login, sign up, "add to", "view cart", "regular price", "sale price", "sold out", navigation, menu, catalog — or any currency figure unless priceINR is set and pricing was requested.
- Vary question form (What / How / Is / Does / Which / Why / Where). Don't default to "What is [name]?" for every question.
- Every answer is original prose synthesized from entityDescription and specs. Never copy input text verbatim, never use a template phrase like \`X answers "Y" directly:\`.
- Don't invent facts, specs, certifications, or statistics not present in the input.
- Statistic suggestions must fit the actual category in primaryEntity — never reuse an example from an unrelated industry.
- titleTag must be 50-60 characters. metaDescription must be 140-155 characters. Count exactly; revise until you hit the range.
- directAnswerCapsule must be 40-60 words of original prose.
- llmsTxt is dense markdown with a "# Brand", "> summary", "## Core facts" (only real facts from the input), "## Frequently asked" table.
- jsonLd is a schema.org @graph object with Organization, BreadcrumbList, the page type, and FAQPage built from your faq array.

Return ONLY this JSON shape, no markdown fences, no preamble:
{"titleTag": "", "metaDescription": "", "h1": "", "urlSlug": "", "directAnswerCapsule": "", "faq": [{"question": "", "answer": ""}], "geoStats": [""], "llmsTxt": "", "jsonLd": {}}`;

async function getAutocomplete(q: string): Promise<string[]> {
  try {
    const r = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
    );
    if (!r.ok) return [];
    const data = (await r.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1].slice(0, 10) : [];
  } catch {
    return [];
  }
}

/** Real search-query signals: Google Autocomplete now, GSC queries when connected. */
export async function getQuerySignals(entity: string, pageUrl?: string): Promise<QuerySignals> {
  const e = entity.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 70);
  if (!e) return { autocomplete: [], gscQueries: [] };
  const prefixes = [e, `is ${e}`, `how to ${e}`, `${e} vs`, `${e} price`, `best ${e}`];
  const lists = await Promise.all(prefixes.map(getAutocomplete));
  const autocomplete = [...new Set(lists.flat())].slice(0, 40);
  const gscQueries = pageUrl ? await getGSCQueriesForUrl(pageUrl) : [];
  return { autocomplete, gscQueries };
}

/** Search Console queries — returns [] until a Search Console account is connected. */
export async function getGSCQueriesForUrl(_pageUrl: string): Promise<string[]> {
  return [];
}

async function callModel(messages: { role: "system" | "user"; content: string }[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project yet.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, messages, response_format: { type: "json_object" } }),
  });
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      message = (JSON.parse(body).error?.message ?? JSON.parse(body).message ?? body) as string;
    } catch {
      /* raw body */
    }
    if (res.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error(message || "AI credits exhausted for this workspace.");
    if (res.status === 403) throw new Error(message || "AI access is blocked for this workspace.");
    throw new Error(message || `AI request failed (${res.status}).`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

function parseLayers(raw: string): GeneratedLayers {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const parsed = JSON.parse(start > 0 ? cleaned.slice(start) : cleaned) as GeneratedLayers;
  return {
    titleTag: String(parsed.titleTag ?? ""),
    metaDescription: String(parsed.metaDescription ?? ""),
    h1: String(parsed.h1 ?? ""),
    urlSlug: String(parsed.urlSlug ?? ""),
    directAnswerCapsule: String(parsed.directAnswerCapsule ?? ""),
    faq: (Array.isArray(parsed.faq) ? parsed.faq : []).map((f) => ({
      question: String(f?.question ?? ""),
      answer: String(f?.answer ?? ""),
    })),
    geoStats: (Array.isArray(parsed.geoStats) ? parsed.geoStats : []).map((s) => String(s)),
    llmsTxt: String(parsed.llmsTxt ?? ""),
    jsonLd: parsed.jsonLd ?? {},
  };
}

/** One real model call (plus at most one repair pass) producing every content layer. */
export async function generateContentLayers(
  page: CleanedPage,
  querySignals?: QuerySignals,
  pageUrl?: string,
): Promise<GeneratedLayers> {
  const payload = JSON.stringify({ page, querySignals, pageUrl });
  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: payload },
  ];
  let generated = parseLayers(await callModel(messages));
  const violation = needsRepair(generated);
  if (violation) {
    const repaired = parseLayers(
      await callModel([
        ...messages,
        {
          role: "user",
          content: `Your previous output was rejected. ${violation} Return the full JSON object again, corrected.`,
        },
      ]),
    );
    if (needsRepair(repaired)) {
      throw new Error(
        "The AI writer could not produce valid output for this page (length or banned-phrase check failed twice).",
      );
    }
    generated = repaired;
  }
  return generated;
}
