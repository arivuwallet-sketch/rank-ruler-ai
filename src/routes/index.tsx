import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Bot,
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
import { auditSite, type AuditResult, type Severity } from "@/lib/audit.functions";

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
  const scan = useServerFn(auditSite);
  const mutation = useMutation<AuditResult, Error, string>({
    mutationFn: (value) => scan({ data: { url: value } }),
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

      {result && <Report result={result} />}

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

function Report({ result }: { result: AuditResult }) {
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

        <GenerativeStudio g={result.generative} />



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
