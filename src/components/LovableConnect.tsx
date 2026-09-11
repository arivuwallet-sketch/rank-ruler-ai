import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Globe, Loader2, Radar, X } from "lucide-react";
import { checkLovableSite, type LovableSiteCheck } from "@/lib/lovable-site.functions";

const OWN_SITE = "rank-ruler-ai.lovable.app";

export default function LovableConnect({ onScan }: { onScan: (url: string) => void }) {
  const check = useServerFn(checkLovableSite);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<LovableSiteCheck | null>(null);

  async function verify(value: string) {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    setSite(null);
    try {
      setSite((await check({ data: { input: value.trim() } })) as LovableSiteCheck);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That address could not be checked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="connect" className="mx-auto max-w-6xl px-5 py-16">
      <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Globe className="size-5 text-mint" /> Connect a published Lovable site
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Type just the project name, the full address, or your own custom domain. The agent
              confirms the site is live, reads its title, robots and sitemap, then scans and
              optimizes every page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setInput(OWN_SITE);
              void verify(OWN_SITE);
            }}
            className="rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm font-semibold"
          >
            Use my site ({OWN_SITE})
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify(input);
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="my-app  ·  my-app.lovable.app  ·  https://mydomain.com"
            aria-label="Lovable site address"
            className="flex-1 rounded-full border border-border bg-secondary/60 px-5 py-3 text-base outline-none focus:border-mint"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-mint/50 bg-mint/10 px-6 py-3 font-semibold text-mint disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {busy ? "Checking…" : "Check site"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        {site && (
          <div className="mt-6 grid gap-4 rounded-xl border border-border bg-secondary/40 p-5 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                {site.live ? (
                  <Check className="size-4 text-mint" />
                ) : (
                  <X className="size-4 text-rose-400" />
                )}
                {site.url}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{site.note}</p>
              {site.title && (
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Current title: </span>
                  {site.title}
                </p>
              )}
              {site.live && (
                <button
                  type="button"
                  onClick={() => onScan(site.url)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  <Radar className="size-4" /> Scan &amp; optimize this site
                </button>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Status", site.status ? String(site.status) : "unreachable"],
                ["Lovable site", site.isLovable ? "Yes" : "Not detected"],
                ["robots.txt", site.hasRobots ? "Found" : "Missing"],
                ["Sitemap", site.hasSitemap ? "Found" : "Missing"],
                ["Pages listed", site.pageCount ? String(site.pageCount) : "—"],
                ["Project", site.slug],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-card p-3">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">{k}</dt>
                  <dd className="mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
