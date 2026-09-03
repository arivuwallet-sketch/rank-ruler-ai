import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Check,
  Gauge,
  Link2,
  Radar,
  RefreshCw,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import heroImage from "@/assets/hero-agent.jpg";
import { SECTIONS, TOTAL_ITEMS } from "@/data/checklist";

const STORAGE_KEY = "seo-agent-checklist-v1";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEO Agent — The Only SEO Checklist You Need" },
      {
        name: "description",
        content:
          "An advanced SEO AI agent that audits, tracks and executes the full SEO checklist: technical, content, keywords, links and agentic search.",
      },
      { property: "og:title", content: "SEO Agent — The Only SEO Checklist You Need" },
      {
        property: "og:description",
        content:
          "Run the complete SEO checklist with an AI agent: technical fixes, keyword research, on-page, link building and AI visibility.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
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
            "Advanced SEO AI agent that runs the complete SEO checklist across technical, content, keyword, link and agentic search workstreams.",
        }),
      },
    ],
  }),
  component: Home,
});

const CAPABILITIES = [
  {
    icon: Radar,
    title: "Continuous crawl",
    body: "The agent re-crawls your site, diffs every change and opens tasks the moment something regresses.",
  },
  {
    icon: Search,
    title: "Keyword intelligence",
    body: "Intent clustering, competitor gaps, keyword maps and the AI prompts people actually ask.",
  },
  {
    icon: Gauge,
    title: "Technical autopilot",
    body: "Crawl errors, redirect chains, Core Web Vitals, indexability and structured data — triaged by impact.",
  },
  {
    icon: Link2,
    title: "Link & brand radar",
    body: "Backlink gaps, unlinked mentions and fresh link opportunities surfaced weekly.",
  },
  {
    icon: Bot,
    title: "Agentic search readiness",
    body: "Audits how LLMs read you, structures content for AI answers and drafts your LLMs.txt.",
  },
  {
    icon: RefreshCw,
    title: "Ships the fix",
    body: "Titles, metas, alt text, internal links — the agent writes the change, you approve it.",
  },
];

function Home() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  }, [done, hydrated]);

  const completed = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  const pct = Math.round((completed / TOTAL_ITEMS) * 100);

  const toggle = (key: string) => setDone((prev) => ({ ...prev, [key]: !prev[key] }));

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
            <a className="transition-colors hover:text-foreground" href="#capabilities">
              Capabilities
            </a>
            <a className="transition-colors hover:text-foreground" href="#checklist">
              Checklist
            </a>
            <a className="transition-colors hover:text-foreground" href="#workflow">
              Workflow
            </a>
          </nav>
          <a
            href="#checklist"
            className="rounded-full bg-gradient-accent px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Run the audit
          </a>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden bg-hero">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-mint" />
              Autonomous SEO, end to end
            </span>
            <h1 className="mt-6 text-5xl leading-[0.95] font-bold md:text-7xl">
              The only SEO checklist
              <br />
              <span className="text-gradient">you need</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              An AI agent that works the entire checklist for you — basics, keywords, technical,
              content, links and agentic search — then keeps it green forever.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#checklist"
                className="rounded-full bg-gradient-accent px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Start the checklist
              </a>
              <a
                href="#capabilities"
                className="rounded-full border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                See what it does
              </a>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                [`${TOTAL_ITEMS}`, "checklist actions"],
                [`${SECTIONS.length}`, "workstreams"],
                ["24/7", "monitoring"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-3xl font-bold text-mint">{value}</dt>
                  <dd className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Visualization of an SEO agent mapping a site's link graph"
              width={1600}
              height={1000}
              className="w-full rounded-2xl border border-border object-cover shadow-glow"
            />
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-bold md:text-4xl">What the agent handles</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every item below maps to a real task in the checklist. The agent detects it, prioritises
          it, and proposes the fix.
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

      <section id="checklist" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">The complete SEO checklist</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Tick items off as you go — progress is saved in your browser.
              </p>
            </div>
            <div className="min-w-64">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-display font-bold text-mint">
                  {completed}/{TOTAL_ITEMS}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <button
                onClick={() => setDone({})}
                className="mt-3 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Reset checklist
              </button>
            </div>
          </div>

          <div className="mt-12 space-y-12">
            {SECTIONS.map((section) => (
              <div key={section.id} className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                <div>
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold whitespace-nowrap">{section.title}</h3>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {section.items.map((item) => {
                      const key = `${section.id}:${item}`;
                      const checked = Boolean(done[key]);
                      return (
                        <li key={key}>
                          <button
                            onClick={() => toggle(key)}
                            aria-pressed={checked}
                            className="flex w-full items-start gap-3 rounded-xl border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-card"
                          >
                            <span
                              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-[5px] transition-colors ${
                                checked
                                  ? section.accent === "mint"
                                    ? "bg-mint text-primary-foreground"
                                    : "bg-violet text-accent-foreground"
                                  : section.accent === "mint"
                                    ? "bg-mint/25"
                                    : "bg-violet/25"
                              }`}
                            >
                              {checked && <Check className="size-3.5" strokeWidth={3} />}
                            </span>
                            <span
                              className={`text-[15px] ${checked ? "text-muted-foreground line-through" : ""}`}
                            >
                              {item}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h4 className="flex items-center gap-2 text-lg font-semibold">
                    <Wrench className="size-4 text-mint" />
                    Tools
                  </h4>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {section.tools.map((tool) => (
                      <li key={tool} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-violet" />
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-bold md:text-4xl">How the agent works</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ["01", "Connect", "Point the agent at your domain and search data sources."],
            ["02", "Crawl & score", "It audits every checklist item and scores impact vs effort."],
            ["03", "Fix", "It drafts the changes — copy, metadata, schema, internal links."],
            ["04", "Watch", "Continuous monitoring reopens anything that regresses."],
          ].map(([step, title, body]) => (
            <li key={step} className="rounded-2xl border border-border bg-card p-6">
              <span className="font-display text-sm font-bold text-mint">{step}</span>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 overflow-hidden rounded-3xl border border-border bg-hero p-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Put the checklist on autopilot</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Let the agent run all {TOTAL_ITEMS} actions across your site and report back with a
            ranked fix list.
          </p>
          <a
            href="#checklist"
            className="mt-8 inline-block rounded-full bg-gradient-accent px-7 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Run the audit
          </a>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        SEO Agent — advanced SEO, executed by AI.
      </footer>
    </main>
  );
}
