import { createFileRoute } from "@tanstack/react-router";
import AnalyticsStudio from "@/components/AnalyticsStudio";
import KeywordMatrix from "@/components/KeywordMatrix";
import FixAllBar from "@/components/FixAllBar";
import GrowthEngines from "@/components/GrowthEngines";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Bot,
  Eye,
  FlaskConical,
  Rocket,
  Terminal,
  Check,
  Copy,
  Gauge,
  Info,
  Link2,
  Loader2,
  Radar,
  Search,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import heroImage from "@/assets/hero-agent.jpg";
import {
  auditSite,
  type AuditResult,
  type GenerativeOutput,
  type Level3Output,
  type Severity,
} from "@/lib/audit.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEO Agent — Scan, Fix & Optimize Any Website" },
      {
        name: "description",
        content:
          "Enter a URL and the SEO agent scans the whole page, finds every issue, and writes the fixes — titles, metas, headers, speed, keywords and backlinks.",
      },
      { property: "og:title", content: "SEO Agent — Scan, Fix & Optimize Any Website" },
      {
        property: "og:description",
        content:
          "Instant technical, on-page, speed, content, link and AI-visibility audit with ready-to-ship fixes and rewritten metadata.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "SEO Agent",
          applicationCategory: "BusinessApplication",
          description:
            "AI SEO agent that scans a website URL, detects issues and generates the fixes to improve speed, rankings, traffic and SEO score.",
        }),
      },
    ],
  }),
  component: Home,
});

const CAPABILITIES = [
  {
    icon: Radar,
    title: "Full-page crawl",
    body: "Fetches your URL, parses every tag, header and asset, and scores six workstreams.",
  },
  {
    icon: Gauge,
    title: "Speed diagnostics",
    body: "TTFB, payload size, compression, caching and render-blocking resources.",
  },
  {
    icon: Search,
    title: "Keyword extraction",
    body: "Real term frequency and density, checked against your title and H1.",
  },
  {
    icon: Link2,
    title: "Link & authority plan",
    body: "Internal/external link profile plus a concrete backlink action list.",
  },
  {
    icon: Bot,
    title: "AI visibility",
    body: "How LLM crawlers and answer engines read your page — and what's missing.",
  },
  {
    icon: TrendingUp,
    title: "Ships the fix",
    body: "Rewritten title, description and H1 you can copy straight into your site.",
  },
];

const SEV_META: Record<Severity, { label: string; icon: typeof XCircle; cls: string }> = {
  critical: { label: "Critical", icon: XCircle, cls: "text-rose-400 border-rose-400/40 bg-rose-400/10" },
  warning: { label: "Warning", icon: AlertTriangle, cls: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
  notice: { label: "Notice", icon: Info, cls: "text-sky-400 border-sky-400/40 bg-sky-400/10" },
  passed: { label: "Passed", icon: Check, cls: "text-mint border-mint/40 bg-mint/10" },
};

function Home() {
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [place, setPlace] = useState("");
  const scan = useServerFn(auditSite);
  const mutation = useMutation<AuditResult, Error, string>({
    mutationFn: (value) =>
      scan({
        data: {
          url: value,
          brandName: brand.trim() || undefined,
          location: place.trim() || undefined,
        },
      }),
  });

  const result = mutation.data;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-accent text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            SEO Agent
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#scan">
              Scan
            </a>
            <a className="transition-colors hover:text-foreground" href="#capabilities">
              Capabilities
            </a>
            <a className="transition-colors hover:text-foreground" href="#workflow">
              Workflow
            </a>
          </nav>
          <a
            href="#scan"
            className="rounded-full bg-gradient-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Scan a site
          </a>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden bg-hero">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-mint" />
              Autonomous SEO, end to end
            </span>
            <h1 className="mt-6 text-5xl leading-[0.95] font-bold md:text-6xl">
              Scan any website.
              <br />
              <span className="text-gradient">Fix every SEO issue.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              The agent crawls your URL, finds what's breaking your rankings, and writes the exact
              fixes — titles, meta descriptions, headers, tags, speed, keywords and backlinks.
            </p>

            <form
              id="scan"
              onSubmit={(e) => {
                e.preventDefault();
                if (url.trim()) mutation.mutate(url.trim());
              }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourwebsite.com"
                inputMode="url"
                aria-label="Website URL"
                className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-mint"
              />
              <button
                type="submit"
                disabled={mutation.isPending || !url.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-accent px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Scanning…
                  </>
                ) : (
                  <>
                    <Radar className="size-4" /> Scan &amp; optimize
                  </>
                )}
              </button>
            </form>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand name (optional)"
                aria-label="Brand name"
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-mint"
              />
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Target location for local SEO (optional)"
                aria-label="Target location"
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-mint"
              />
            </div>
            {mutation.isError && (
              <p className="mt-3 text-sm text-rose-400">{mutation.error.message}</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              No signup. The agent audits technical, on-page, speed, content, links and AI
              visibility in one pass.
            </p>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Visualization of an SEO agent mapping a website's link graph"
              width={1600}
              height={1000}
              className="w-full rounded-2xl border border-border object-cover shadow-glow"
            />
          </div>
        </div>
      </section>

      {result && <Report result={result} brandName={brand} location={place} />}

      <section id="capabilities" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-bold md:text-4xl">What the agent handles</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every check runs against your live HTML and response headers — no guesswork, no generic
          advice.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-mint/50"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-mint">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold md:text-4xl">How the agent works</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["01", "Paste the URL", "The agent fetches the page and its robots.txt and sitemap."],
              ["02", "Score", "Six categories scored, issues ranked by severity and impact."],
              ["03", "Fix", "Rewritten metadata, headers, schema and speed remediation steps."],
              ["04", "Re-scan", "Ship the changes, scan again and watch the score climb."],
            ].map(([step, title, body]) => (
              <li key={step} className="rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-sm font-bold text-mint">{step}</span>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        SEO Agent — advanced SEO, executed by AI.
      </footer>
    </main>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const dash = `${score * 2.83} 283`;
  return (
    <div className="relative grid size-36 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute size-36 -rotate-90">
        <circle cx="50" cy="50" r="45" className="fill-none stroke-secondary" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-none stroke-mint transition-all duration-1000"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={dash}
        />
      </svg>
      <div className="text-center">
        <div className="font-display text-4xl font-bold text-mint">{score}</div>
        <div className="text-xs tracking-wide text-muted-foreground uppercase">Grade {grade}</div>
      </div>
    </div>
  );
}

function Report({
  result,
  brandName,
  location,
}: {
  result: AuditResult;
  brandName: string;
  location: string;
}) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const counts = (["critical", "warning", "notice", "passed"] as Severity[]).map(
    (s) => [s, result.issues.filter((i) => i.severity === s).length] as const,
  );
  const issues = result.issues.filter((i) => filter === "all" || i.severity === filter);
  const s = result.stats;

  return (
    <section id="report" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl space-y-14 px-5 py-16">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">SEO report</h2>
            <p className="mt-2 break-all text-muted-foreground">{result.finalUrl}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Scanned {new Date(result.fetchedAt).toLocaleString()} · TTFB {result.ttfbMs}ms ·{" "}
              {Math.round(result.htmlBytes / 1024)} KB HTML
            </p>
          </div>
          <ScoreRing score={result.score} grade={result.grade} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.categories.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.label}</h3>
                <span className="font-display font-bold text-mint">{c.score}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-accent transition-all duration-700"
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.passed}/{c.total} checks passing
              </p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-2 text-2xl font-bold">Issues &amp; fixes</h3>
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full border px-3 py-1 text-xs ${filter === "all" ? "border-mint text-mint" : "border-border text-muted-foreground"}`}
            >
              All {result.issues.length}
            </button>
            {counts.map(([sev, n]) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`rounded-full border px-3 py-1 text-xs ${filter === sev ? SEV_META[sev].cls : "border-border text-muted-foreground"}`}
              >
                {SEV_META[sev].label} {n}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {issues.map((issue) => {
              const meta = SEV_META[issue.severity];
              const Icon = meta.icon;
              return (
                <article key={issue.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}
                    >
                      <Icon className="size-3" />
                      {meta.label}
                    </span>
                    <h4 className="text-lg font-semibold">{issue.title}</h4>
                    <span className="ml-auto text-xs text-muted-foreground">{issue.impact}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{issue.detail}</p>
                  {issue.severity !== "passed" && (
                    <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
                      <span className="font-semibold text-mint">Fix: </span>
                      {issue.fix}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-xl font-bold">Page context</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            What the agent understood before writing anything — menus, buttons, carts and prices
            were stripped out first.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-secondary/60 p-4">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">
                What this page offers
              </span>
              <p className="mt-1 text-sm font-medium">{result.pageContext.business}</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">
                Search intent
              </span>
              <p className="mt-1 text-sm font-medium">{result.pageContext.intent}</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">
                Primary topic
              </span>
              <p className="mt-1 text-sm font-medium text-mint">
                {result.pageContext.primaryKeyword}
                {result.pageContext.secondaryKeyword
                  ? ` · ${result.pageContext.secondaryKeyword}`
                  : ""}
              </p>
            </div>
          </div>
          {(result.pageContext.evidence.length > 0 || result.pageContext.removed.length > 0) && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
              {result.pageContext.evidence.length > 0 && (
                <div>
                  <span className="text-xs tracking-wide text-muted-foreground uppercase">
                    Based on
                  </span>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {result.pageContext.evidence.map((e) => (
                      <li key={e}>· {e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.pageContext.removed.length > 0 && (
                <div>
                  <span className="text-xs tracking-wide text-muted-foreground uppercase">
                    Ignored as boilerplate
                  </span>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {result.pageContext.removed.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-xl font-bold">Cleaned content the writer used</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Navigation, carts, buttons, logins and price tags were removed before a single word was
            written.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {(
              [
                ["Brand", result.cleanedPage.brand],
                ["Page type", result.cleanedPage.pageType],
                ["Main subject", result.cleanedPage.primaryEntity || "—"],
                ["Clean words", String(result.cleanedPage.wordCountAfterCleaning)],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-secondary/60 p-4">
                <span className="text-xs tracking-wide text-muted-foreground uppercase">
                  {label}
                </span>
                <p className="mt-1 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
          {result.cleanedPage.specs.length > 0 && (
            <div className="mt-4">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">
                Details found
              </span>
              <ul className="mt-1 grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                {result.cleanedPage.specs.map((s) => (
                  <li key={s.label}>
                    · <span className="text-foreground">{s.label}:</span> {s.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            {result.querySignals.autocomplete.length > 0 ? (
              <>
                <span className="text-xs tracking-wide uppercase">Real searches used</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.querySignals.autocomplete.slice(0, 12).map((q) => (
                    <span key={q} className="rounded-full bg-secondary/60 px-3 py-1 text-xs">
                      {q}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p>
                No live search suggestions were available for this page, so questions were built
                from the page's own details.
              </p>
            )}
          </div>
        </div>

        {result.contentError && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
            <h3 className="text-lg font-bold">{result.contentError}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing was written for this page. Point the scan at a page with real descriptive
              copy — a product, service or article page — and run it again.
            </p>
          </div>
        )}


        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-bold">Optimized metadata</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Copy these straight into your page.
            </p>
            <div className="mt-5 space-y-4">
              {(
                [
                  ["Title tag", result.rewrites.title],
                  ["Meta description", result.rewrites.description],
                  ["H1", result.rewrites.h1],
                  ["URL slug", result.rewrites.slugTip],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs tracking-wide text-muted-foreground uppercase">
                      {label}
                    </span>
                    <CopyButton value={value} />
                  </div>
                  <p className="mt-1 rounded-xl bg-secondary/60 p-3 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-bold">Projected impact</h3>
            <p className="mt-1 text-sm text-muted-foreground">After shipping every fix above.</p>
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="pb-2">Metric</th>
                  <th className="pb-2">Now</th>
                  <th className="pb-2">After</th>
                </tr>
              </thead>
              <tbody>
                {result.projections.map((p) => (
                  <tr key={p.metric} className="border-t border-border/60">
                    <td className="py-2 pr-2">
                      {p.metric}
                      <span className="block text-xs text-muted-foreground">{p.note}</span>
                    </td>
                    <td className="py-2 pr-2 text-muted-foreground">{p.now}</td>
                    <td className="py-2 font-semibold text-mint">{p.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <FixAllBar siteUrl={result.finalUrl} brandName={brandName} location={location} />

        {result.generated && <KeywordMatrix g={result.generated} />}

        {!result.contentError && (
          <>
            <GenerativeStudio g={result.generative} />

            <CommandCenter l3={result.level3} g={result.generative} />

            <GrowthEngines
              finalUrl={result.finalUrl}
              brandName={brandName}
              location={location}
              business={result.pageContext.business}
              primary={result.pageContext.primaryKeyword}
              secondary={result.pageContext.secondaryKeyword ?? ""}
              keywords={
                result.generated
                  ? Object.values(result.generated.keywordMatrix).flat()
                  : [result.pageContext.primaryKeyword]
              }
            />

            <AnalyticsStudio
              finalUrl={result.finalUrl}
              primary={result.pageContext.primaryKeyword}
            />
          </>
        )}




        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-bold">Keywords found on page</h3>
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="pb-2">Term</th>
                  <th className="pb-2">Uses</th>
                  <th className="pb-2">Density</th>
                  <th className="pb-2">In title / H1</th>
                </tr>
              </thead>
              <tbody>
                {result.keywords.map((k) => (
                  <tr key={k.term} className="border-t border-border/60">
                    <td className="py-2 pr-2">{k.term}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{k.count}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{k.density.toFixed(2)}%</td>
                    <td className="py-2">
                      <span className={k.inTitle ? "text-mint" : "text-muted-foreground"}>
                        {k.inTitle ? "Title" : "—"}
                      </span>
                      {" / "}
                      <span className={k.inH1 ? "text-mint" : "text-muted-foreground"}>
                        {k.inH1 ? "H1" : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-bold">Backlink &amp; authority plan</h3>
            <ul className="mt-5 space-y-4">
              {result.backlinks.map((b) => (
                <li key={b.action} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet" />
                  <div>
                    <p className="font-semibold">{b.action}</p>
                    <p className="text-sm text-muted-foreground">{b.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-xl font-bold">Page vitals</h3>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ["Title length", `${s.titleLength} chars`],
              ["Description length", `${s.descriptionLength} chars`],
              ["Word count", `${s.wordCount}`],
              ["H1 count", `${s.h1.length}`],
              ["Images", `${s.images} (${s.imagesMissingAlt} missing alt)`],
              ["Internal links", `${s.internalLinks}`],
              ["External links", `${s.externalLinks} (${s.nofollowExternal} nofollow)`],
              ["Scripts", `${s.scripts} (${s.blockingScripts} blocking)`],
              ["Stylesheets", `${s.stylesheets}`],
              ["HTTPS", s.https ? "Yes" : "No"],
              ["Compression", s.compressed ? "Enabled" : "Missing"],
              ["Cache-Control", s.cacheControl ?? "Not set"],
              ["Canonical", s.canonical ?? "Missing"],
              ["Robots meta", s.robotsMeta ?? "Default"],
              ["robots.txt", s.robotsTxt],
              ["sitemap.xml", s.sitemap],
              ["Language", s.lang ?? "Not set"],
              ["Viewport", s.viewport ? "Set" : "Missing"],
              ["Open Graph tags", `${s.ogTags}`],
              ["Twitter tags", `${s.twitterTags}`],
              ["Structured data", s.jsonLdTypes.length ? s.jsonLdTypes.join(", ") : "None"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-secondary/50 p-3">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function CharBadge({ n, min, max }: { n: number; min: number; max: number }) {
  const ok = n >= min && n <= max;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        ok
          ? "border-mint/40 bg-mint/10 text-mint"
          : "border-amber-400/40 bg-amber-400/10 text-amber-400"
      }`}
    >
      {n} chars · target {min}–{max}
    </span>
  );
}

function GenerativeStudio({ g }: { g: GenerativeOutput }) {
  const [tab, setTab] = useState<"aeo" | "geo" | "schema" | "json">("aeo");
  const schemaJson = JSON.stringify(g.json_ld_schema, null, 2);
  const cleanJson = JSON.stringify(
    {
      seo_metadata: g.seo_metadata,
      aeo_content: {
        primary_question_heading: g.aeo_content.primary_question_heading,
        direct_answer_capsule: g.aeo_content.direct_answer_capsule,
      },
      geo_signals: {
        data_points_included: g.geo_signals.data_points_included,
        entity_associations: g.geo_signals.entity_associations,
      },
      json_ld_schema: g.json_ld_schema,
    },
    null,
    2,
  );
  const displayUrl = g.context.url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/").join(" › ");
  const tabs = [
    ["aeo", "AEO answers"],
    ["geo", "GEO signals"],
    ["schema", "JSON-LD @graph"],
    ["json", "Agent output"],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">SEO · AEO · GEO studio</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Unified metadata, answer capsules and machine-readable schema for Google and answer
            engines like ChatGPT Search, Gemini and Perplexity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            ["Page type", g.context.pageType],
            ["Brand entity", g.context.brandName],
            ["Primary keyword", g.context.primaryKeyword],
          ].map(([k, v]) => (
            <span key={k} className="rounded-full border border-border bg-card px-3 py-1">
              <span className="text-muted-foreground">{k}: </span>
              <span className="font-medium">{v}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-lg font-semibold">Google SERP snippet preview</h4>
        <div className="mt-4 rounded-xl bg-secondary/50 p-4">
          <p className="text-xs text-muted-foreground">{displayUrl}</p>
          <p className="mt-1 text-lg font-medium text-sky-400">{g.seo_metadata.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{g.seo_metadata.description}</p>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">
                Title tag
              </span>
              <div className="flex items-center gap-2">
                <CharBadge n={g.seo_metadata.title_char_count} min={50} max={60} />
                <CopyButton value={g.seo_metadata.title} />
              </div>
            </div>
            <p className="mt-1 rounded-xl bg-secondary/60 p-3 text-sm">{g.seo_metadata.title}</p>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">
                Meta description
              </span>
              <div className="flex items-center gap-2">
                <CharBadge n={g.seo_metadata.description_char_count} min={140} max={155} />
                <CopyButton value={g.seo_metadata.description} />
              </div>
            </div>
            <p className="mt-1 rounded-xl bg-secondary/60 p-3 text-sm">
              {g.seo_metadata.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === id ? "border-mint text-mint" : "border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "aeo" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-mint/40 bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold">Direct answer capsule</h4>
              <span className="rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 text-[11px] text-mint">
                {g.aeo_content.answer_word_count} words · target 40–60
              </span>
            </div>
            <p className="mt-3 text-sm font-medium">{g.aeo_content.primary_question_heading}</p>
            <p className="mt-2 rounded-xl bg-secondary/60 p-3 text-sm">
              {g.aeo_content.direct_answer_capsule}
            </p>
            <div className="mt-3">
              <CopyButton value={g.aeo_content.direct_answer_capsule} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Question-based heading rewrites</h4>
            {g.aeo_content.heading_rewrites.length ? (
              <ul className="mt-4 space-y-3 text-sm">
                {g.aeo_content.heading_rewrites.map((r) => (
                  <li key={r.from} className="rounded-xl bg-secondary/50 p-3">
                    <span className="text-muted-foreground line-through">{r.from}</span>
                    <span className="mt-1 block font-medium text-mint">{r.to}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Headings already read as questions — keep each one followed by a 40–60 word answer.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <h4 className="text-lg font-semibold">Q&amp;A set for FAQPage schema</h4>
            <ul className="mt-4 space-y-4">
              {g.aeo_content.faqs.map((f) => (
                <li key={f.question}>
                  <p className="font-medium">{f.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {g.aeo_content.structured_formats.map((s) => (
                <div key={s.label} className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-sm font-semibold text-mint">{s.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "geo" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Data &amp; statistics</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {g.geo_signals.data_points_included.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mint" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Entity grounding</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {g.geo_signals.entity_associations.map((e) => (
                <li key={e} className="rounded-lg bg-secondary/50 px-3 py-2">
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Citation hooks</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {g.geo_signals.citation_hooks.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-secondary/60 p-3 text-sm italic">
              {g.geo_signals.expert_quote}
            </p>
          </div>
        </div>
      )}

      {tab === "schema" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-semibold">
              Unified @graph — Organization · BreadcrumbList · Article · FAQPage
            </h4>
            <CopyButton value={schemaJson} />
          </div>
          <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-secondary/50 p-4 text-xs leading-relaxed">
            {schemaJson}
          </pre>
        </div>
      )}

      {tab === "json" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-semibold">Agent output (clean JSON)</h4>
            <CopyButton value={cleanJson} />
          </div>
          <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-secondary/50 p-4 text-xs leading-relaxed">
            {cleanJson}
          </pre>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ label, value, lang }: { label: string; value: string; lang: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-semibold">{label}</h4>
        <CopyButton value={value} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{lang}</p>
      <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-secondary/50 p-4 text-xs leading-relaxed whitespace-pre-wrap">
        {value}
      </pre>
    </div>
  );
}

function CommandCenter({ l3, g }: { l3: Level3Output; g: GenerativeOutput }) {
  const [tab, setTab] = useState<"exports" | "testing" | "monitor" | "agents">("exports");
  const [view, setView] = useState<"human" | "crawler">("human");
  const [deployed, setDeployed] = useState(false);
  const [autoPromote, setAutoPromote] = useState(true);
  const [refreshed, setRefreshed] = useState<string[]>([]);
  const [fixedHallucination, setFixedHallucination] = useState(false);
  const [swarmStep, setSwarmStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSwarmStep((s) => (s + 1) % 6), 900);
    return () => clearInterval(t);
  }, []);

  const agents = [
    { name: "Researcher", task: "Crawled page, extracted entities & keywords" },
    { name: "Strategist", task: "Mapped intent, picked 4-layer optimization plan" },
    { name: "Writer", task: "Drafted metadata, capsules & llms.txt block" },
    { name: "Coder", task: "Verified Writer's JSON-LD schema logic" },
  ];
  const tabs = [
    ["exports", "Code exports"],
    ["testing", "Testing & simulation"],
    ["monitor", "Monitoring"],
    ["agents", "Agent swarm"],
  ] as const;
  const displayUrl = g.context.url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/").join(" › ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Level-3 command center</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Autonomous discovery layer — llms.txt, voice markup, OpenAPI, multi-variant testing,
            content decay and trend intelligence.
          </p>
        </div>
        <button
          onClick={() => setDeployed(true)}
          disabled={deployed}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          <Rocket className="size-4" />
          {deployed ? "Deployed" : "Deploy to edge"}
        </button>
      </div>
      {deployed && (
        <p className="rounded-xl border border-mint/40 bg-mint/10 px-4 py-3 text-sm text-mint">
          Metadata and Schema injected at the Edge network. Live in 300ms.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === id ? "border-mint text-mint" : "border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "exports" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-lg font-semibold">Agent-routing preview</h4>
              <div className="flex gap-2">
                {(["human", "crawler"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                      view === v ? "border-mint text-mint" : "border-border text-muted-foreground"
                    }`}
                  >
                    <Eye className="size-3" />
                    {v === "human" ? "Human view" : "Crawler view"}
                  </button>
                ))}
              </div>
            </div>
            {view === "human" ? (
              <div className="mt-4 rounded-xl bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground">{displayUrl}</p>
                <p className="mt-1 text-lg font-medium text-sky-400">{g.seo_metadata.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{g.seo_metadata.description}</p>
              </div>
            ) : (
              <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-secondary/50 p-4 text-xs leading-relaxed whitespace-pre-wrap">
                {l3.llms_txt}
              </pre>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Crawler view shows the markdown served to OpenAIbot, PerplexityBot and other agentic
              crawlers.
            </p>
          </div>
          <CodeBlock label="llms.txt (AAO payload)" lang="text/markdown · publish at /llms.txt" value={l3.llms_txt} />
          <CodeBlock label="SSML voice markup" lang="application/ssml+xml · wraps the AEO answer capsule" value={l3.ssml} />
          <CodeBlock label="openapi.json (agentic API)" lang="application/json · lets autonomous agents query your inventory" value={l3.openapi_json} />
        </div>
      )}

      {tab === "testing" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold">Multi-variant testing</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Five title/description variants with simulated live traffic distribution.
                </p>
              </div>
              <button
                onClick={() => setAutoPromote((v) => !v)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  autoPromote ? "border-mint text-mint" : "border-border text-muted-foreground"
                }`}
              >
                Auto-promote winner: {autoPromote ? "on" : "off"}
              </button>
            </div>
            <ul className="mt-5 space-y-4">
              {l3.mvt_variants.map((v, i) => (
                <li key={v.title} className="rounded-xl bg-secondary/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      <span className="mr-2 text-xs text-muted-foreground">V{i + 1}</span>
                      {v.title}
                    </p>
                    <span
                      className={`text-xs font-semibold ${v.ctrDelta.startsWith("-") ? "text-rose-400" : "text-mint"}`}
                    >
                      CTR {v.ctrDelta.startsWith("-") ? "" : "+"}
                      {v.ctrDelta}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${v.trafficShare}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{v.trafficShare}% traffic</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-5 text-mint" />
              <h4 className="text-lg font-semibold">Simulation console</h4>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Generated content tested against {l3.retrieval_confidence.queriesSimulated.toLocaleString()} simulated AI queries.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-8">
              <div>
                <p className="font-display text-5xl font-bold text-mint">
                  {l3.retrieval_confidence.score}%
                </p>
                <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                  Retrieval confidence
                </p>
              </div>
              <ul className="flex-1 space-y-2">
                {l3.retrieval_confidence.breakdown.map((b) => (
                  <li key={b.engine} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0">{b.engine}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${b.likelihood}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs text-muted-foreground">{b.likelihood}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "monitor" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Self-healing sentinel</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Content decay alerts — URLs dropping &gt;20% clicks over 30 days (Search Console feed).
            </p>
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="pb-2">URL</th>
                  <th className="pb-2">Clicks (prev 30d)</th>
                  <th className="pb-2">Now</th>
                  <th className="pb-2">Change</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {l3.sentinel.map((s) => (
                  <tr key={s.url} className="border-t border-border/60">
                    <td className="max-w-40 truncate py-2 pr-2">{s.url}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{s.clicksBefore}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{s.clicksNow}</td>
                    <td className="py-2 pr-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          refreshed.includes(s.url) || s.status === "stable"
                            ? "border-mint/40 bg-mint/10 text-mint"
                            : "border-rose-400/40 bg-rose-400/10 text-rose-400"
                        }`}
                      >
                        {refreshed.includes(s.url) ? "refreshed" : s.status === "stable" ? `-${s.dropPct}% stable` : `-${s.dropPct}% decaying`}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      {s.status === "decaying" && !refreshed.includes(s.url) && (
                        <button
                          onClick={() => setRefreshed((r) => [...r, s.url])}
                          className="rounded-full border border-mint/40 px-3 py-1 text-xs text-mint"
                        >
                          Auto-refresh
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Competitor watchlist</h4>
            <ul className="mt-5 space-y-4">
              {l3.competitor_watch.map((c) => (
                <li key={c.url} className="rounded-xl bg-secondary/50 p-4 text-sm">
                  <p className="break-all text-xs text-muted-foreground">{c.url}</p>
                  <p className="mt-2">
                    <span className="text-muted-foreground line-through">{c.oldTitle}</span>
                    <span className="mt-1 block font-medium text-amber-400">NEW: {c.newTitle}</span>
                  </p>
                  <p className="mt-2 rounded-lg bg-secondary/70 p-2 text-xs">
                    <span className="font-semibold text-mint">Counter-strategy: </span>
                    {c.counter}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Trend predictions (zero-day oracle)</h4>
            <ul className="mt-5 space-y-4">
              {l3.trend_predictions.map((t) => (
                <li key={t.topic} className="flex flex-wrap items-center gap-4 rounded-xl bg-secondary/50 p-4">
                  <span className="font-display text-2xl font-bold text-mint">{t.opportunity}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.topic}</p>
                    <p className="text-xs text-muted-foreground">{t.source} · {t.angle}</p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    Opportunity score
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "agents" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Terminal className="size-5 text-mint" />
              <h4 className="font-sans text-lg font-semibold">Live agent activity</h4>
            </div>
            <ul className="mt-5 space-y-3">
              {agents.map((a, i) => {
                const state = swarmStep > i + 1 ? "done" : swarmStep === i + 1 ? "running" : "queued";
                return (
                  <li key={a.name} className="flex items-center gap-3">
                    <span
                      className={`size-2 rounded-full ${
                        state === "done" ? "bg-mint" : state === "running" ? "animate-pulse bg-amber-400" : "bg-secondary"
                      }`}
                    />
                    <span className="w-28 shrink-0 font-semibold">{a.name}</span>
                    <span className="text-muted-foreground">{a.task}</span>
                    <span className={`ml-auto text-xs ${state === "done" ? "text-mint" : state === "running" ? "text-amber-400" : "text-muted-foreground"}`}>
                      {state === "done" ? "✓ done" : state === "running" ? "running…" : "queued"}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-center gap-3 border-t border-border/60 pt-3">
                <span className={`size-2 rounded-full ${swarmStep >= 5 ? "bg-mint" : "bg-secondary"}`} />
                <span className="w-28 shrink-0 font-semibold">Verification</span>
                <span className="text-muted-foreground">Coder checked Writer's schema logic — @graph valid</span>
                <span className={`ml-auto text-xs ${swarmStep >= 5 ? "text-mint" : "text-muted-foreground"}`}>
                  {swarmStep >= 5 ? "✓ passed" : "pending"}
                </span>
              </li>
            </ul>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="text-lg font-semibold">Hallucination check</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Simulated LLM probe: “{l3.hallucination.prompt}”
              </p>
              <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm italic">
                {l3.hallucination.llmAnswer}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    l3.hallucination.verdict === "correct" || fixedHallucination
                      ? "border-mint/40 bg-mint/10 text-mint"
                      : "border-rose-400/40 bg-rose-400/10 text-rose-400"
                  }`}
                >
                  {fixedHallucination ? "corrected" : l3.hallucination.verdict}
                </span>
                {l3.hallucination.verdict === "hallucinated" && !fixedHallucination && (
                  <button
                    onClick={() => setFixedHallucination(true)}
                    className="rounded-full border border-mint/40 px-3 py-1 text-xs text-mint"
                  >
                    Fix hallucination
                  </button>
                )}
              </div>
              {(fixedHallucination || l3.hallucination.verdict === "correct") && (
                <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                  {l3.hallucination.correction}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h4 className="text-lg font-semibold">Information gain engine</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {l3.info_gaps.map((gap) => (
                  <li key={gap} className="rounded-xl bg-secondary/50 p-3 text-muted-foreground">{gap}</li>
                ))}
              </ul>
              <h4 className="mt-6 text-lg font-semibold">Knowledge graph linker</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {l3.knowledge_graph.sameAs.map((s) => (
                  <li key={s} className="break-all rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h4 className="text-lg font-semibold">Semantic internal linking</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Top vector matches from your page embeddings (pgvector similarity).
            </p>
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="pb-2">Target URL</th>
                  <th className="pb-2">Suggested anchor</th>
                  <th className="pb-2">Relevance</th>
                </tr>
              </thead>
              <tbody>
                {l3.internal_links.map((l) => (
                  <tr key={l.url} className="border-t border-border/60">
                    <td className="max-w-52 truncate py-2 pr-2">{l.url}</td>
                    <td className="py-2 pr-2 text-mint">{l.anchor}</td>
                    <td className="py-2 text-muted-foreground">{Math.round(l.relevance * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
