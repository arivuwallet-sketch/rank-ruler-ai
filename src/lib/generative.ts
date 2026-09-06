// Pure generators for unified SEO + AEO (Answer Engine) + GEO (Generative Engine) output.
// Safe to import on client and server (no side effects, no server-only APIs).

export type PageType = "Landing Page" | "Blog / Article" | "Product" | "FAQ" | "Category" | "Docs";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type GenerativeOutput = {
  context: {
    url: string;
    pageType: PageType;
    brandName: string;
    primaryKeyword: string;
    secondaryKeyword: string;
    entity: string;
    questions: string[];
  };
  seo_metadata: {
    title: string;
    title_char_count: number;
    description: string;
    description_char_count: number;
  };
  aeo_content: {
    primary_question_heading: string;
    direct_answer_capsule: string;
    answer_word_count: number;
    faqs: { question: string; answer: string }[];
    heading_rewrites: { from: string; to: string }[];
    structured_formats: { label: string; recommendation: string }[];
  };
  geo_signals: {
    data_points_included: string[];
    entity_associations: string[];
    citation_hooks: string[];
    expert_quote: string;
  };
  json_ld_schema: JsonValue;
};

const QUESTION_WORDS = /^(what|how|why|when|where|who|which|can|do|does|is|are|should)\b/i;

export function detectPageType(url: string, headings: { level: number; text: string }[]): PageType {
  const p = url.toLowerCase();
  if (/\/(blog|article|news|post|guide|guides|insights)(\/|$)/.test(p)) return "Blog / Article";
  if (/\/(product|products|shop|store|item|pricing)(\/|$)/.test(p)) return "Product";
  if (/\/(faq|faqs|help|support|answers)(\/|$)/.test(p)) return "FAQ";
  if (/\/(docs|documentation|reference|api)(\/|$)/.test(p)) return "Docs";
  if (/\/(category|collections|tag)(\/|$)/.test(p)) return "Category";
  const q = headings.filter((h) => h.text.trim().endsWith("?")).length;
  if (q >= 3) return "FAQ";
  if (new URL(url).pathname.replace(/\/$/, "") === "") return "Landing Page";
  return "Blog / Article";
}

function toQuestion(heading: string, keyword: string): string {
  const t = heading.trim().replace(/\s+/g, " ");
  if (t.endsWith("?")) return t;
  if (QUESTION_WORDS.test(t)) return `${t}?`;
  if (/^(pricing|plans|cost)/i.test(t)) return `How much does ${keyword} cost?`;
  if (/^(process|how it works|workflow|steps)/i.test(t)) return `How does ${keyword} work?`;
  if (/^(benefits|why|advantages)/i.test(t)) return `Why does ${keyword} matter?`;
  if (/^(features|what we do|services|solutions)/i.test(t)) return `What can you do with ${t.toLowerCase()}?`;
  if (/^(about|team|company)/i.test(t)) return `Who is behind ${keyword}?`;
  return `What is ${t.toLowerCase()}?`;
}

/** Builds a self-contained 40–60 word direct answer capsule. */
function answerCapsule(question: string, keyword: string, brand: string, source: string): string {
  const clean = source
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s/)
    .filter((s) => s.split(" ").length > 5)
    .slice(0, 4)
    .join(" ");
  let words = `${brand} ${keyword} answers "${question}" directly: ${clean}`
    .replace(/\s+/g, " ")
    .split(" ");
  const filler = [
    `${brand} focuses on ${keyword}`,
    "delivering measurable results",
    "for teams that need clear outcomes",
    "documented steps",
    "and verifiable data",
    "so both search engines and AI answer engines can quote the page confidently",
  ];
  let fi = 0;
  while (words.length < 44 && fi < filler.length) {
    words = words.concat(filler[fi]!.split(" "));
    fi++;
  }
  if (words.length > 58) words = words.slice(0, 58);
  let out = words.join(" ").replace(/[,;:]$/, "");
  if (!/[.!?]$/.test(out)) out += ".";
  return out;
}

export function buildGenerative(input: {
  finalUrl: string;
  brandName: string;
  primary: string;
  secondary: string;
  title: string | null;
  description: string | null;
  headings: { level: number; text: string }[];
  bodyText: string;
  keywords: { term: string }[];
  logoUrl: string | null;
}): GenerativeOutput {
  const { finalUrl, brandName, primary, secondary, headings, bodyText } = input;
  const url = new URL(finalUrl);
  const origin = url.origin;
  const pageType = detectPageType(finalUrl, headings);
  const kw = primary.charAt(0).toUpperCase() + primary.slice(1);

  // ---- SEO metadata (50–60 / 140–155) ----
  let title = `${kw} | ${brandName}`;
  if (title.length < 50) title = `${kw} — ${secondary ? secondary + " " : ""}Guide | ${brandName}`;
  if (title.length > 60) title = `${kw} | ${brandName}`.slice(0, 60);
  if (title.length < 50) title = (`${kw} That Works | ${brandName} ${pageType === "Product" ? "Platform" : "Guide"}`).slice(0, 60);

  let description = `${kw} explained: how ${brandName} improves ${secondary || "results"} with measurable data, expert guidance and clear next steps. Start optimising today.`;
  if (description.length > 155) description = description.slice(0, 152).replace(/[ ,.]$/, "") + "...";
  while (description.length < 140) description += " Get the full breakdown now.";
  description = description.slice(0, 155);

  // ---- AEO ----
  const sectionHeadings = headings.filter((h) => h.level === 2 || h.level === 3).slice(0, 6);
  const questions = (
    sectionHeadings.length
      ? sectionHeadings.map((h) => toQuestion(h.text, primary))
      : [
          `What is ${primary}?`,
          `How does ${primary} work?`,
          `Why is ${primary} important for ${secondary || "growth"}?`,
        ]
  ).filter((q, i, a) => a.indexOf(q) === i);

  const faqs = questions.slice(0, 4).map((q, i) => ({
    question: q,
    answer: answerCapsule(
      q,
      primary,
      brandName,
      bodyText.slice(i * 400, i * 400 + 600) || bodyText.slice(0, 600),
    ),
  }));

  const heading_rewrites = sectionHeadings
    .map((h) => ({ from: h.text, to: toQuestion(h.text, primary) }))
    .filter((r) => r.from !== r.to)
    .slice(0, 6);

  // ---- GEO ----
  const numbers = [...bodyText.matchAll(/(\d[\d,.]*\s?(%|percent|x|k|m|bn|billion|million|users|customers|hours|days|minutes|seconds|ms))/gi)]
    .map((m) => m[0].trim())
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);
  const data_points_included = numbers.length
    ? numbers
    : [
        `Add at least 3 verifiable statistics about ${primary} (e.g. "cuts audit time by 62%")`,
        "Cite a named industry study with year and source",
        "Include a benchmark table with before/after numbers",
      ];

  const entity_associations = [
    `${brandName} → ${primary}`,
    `${brandName} → ${secondary || "organic growth"}`,
    ...input.keywords.slice(0, 4).map((k) => `${brandName} → ${k.term}`),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const citation_hooks = [
    `Define "${primary}" in one quotable sentence near the top of the page.`,
    "Attribute every statistic to a named source with a date so LLMs can verify it.",
    "Add an author bio with credentials and a linked professional profile (E-E-A-T).",
    "Keep facts in server-rendered HTML — AI crawlers rarely execute JavaScript.",
    `Publish /llms.txt listing your key ${primary} pages for answer engines.`,
  ];

  const expert_quote = `"${kw} only compounds when the page is machine-readable: concise answers, verifiable numbers and clean schema," says the ${brandName} SEO lead.`;

  // ---- Unified @graph JSON-LD ----
  const pagePath = url.pathname.replace(/\/$/, "");
  const crumbs = pagePath.split("/").filter(Boolean);
  const now = new Date().toISOString();
  const json_ld_schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: brandName,
        url: origin,
        ...(input.logoUrl ? { logo: input.logoUrl } : {}),
        sameAs: [
          `https://twitter.com/${brandName.toLowerCase()}`,
          `https://www.linkedin.com/company/${brandName.toLowerCase()}`,
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${finalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: origin },
          ...crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: c.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
            item: `${origin}/${crumbs.slice(0, i + 1).join("/")}`,
          })),
        ],
      },
      {
        "@type": "Article",
        "@id": `${finalUrl}#article`,
        isPartOf: { "@id": finalUrl },
        headline: title,
        description,
        mainEntityOfPage: finalUrl,
        datePublished: now,
        dateModified: now,
        about: { "@type": "Thing", name: kw },
        author: {
          "@type": "Person",
          name: `${brandName} Editorial Team`,
          jobTitle: "SEO & Content Strategy",
          sameAs: `https://www.linkedin.com/company/${brandName.toLowerCase()}`,
        },
        publisher: { "@id": `${origin}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${finalUrl}#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };

  return {
    context: {
      url: finalUrl,
      pageType,
      brandName,
      primaryKeyword: primary,
      secondaryKeyword: secondary,
      entity: `${brandName} — ${primary} (${url.hostname})`,
      questions,
    },
    seo_metadata: {
      title,
      title_char_count: title.length,
      description,
      description_char_count: description.length,
    },
    aeo_content: {
      primary_question_heading: faqs[0]?.question ?? `What is ${primary}?`,
      direct_answer_capsule: faqs[0]?.answer ?? "",
      answer_word_count: (faqs[0]?.answer ?? "").split(/\s+/).filter(Boolean).length,
      faqs,
      heading_rewrites,
      structured_formats: [
        { label: "Numbered steps", recommendation: `Output every ${primary} procedure as an ordered list — answer engines lift numbered steps verbatim.` },
        { label: "Comparison table", recommendation: "Convert any multi-variable comparison into a Markdown/HTML table with a header row." },
        { label: "Definition block", recommendation: "Open each section with a bolded 40–60 word definition before elaborating." },
      ],
    },
    geo_signals: { data_points_included, entity_associations, citation_hooks, expert_quote },
    json_ld_schema,
  };
}
