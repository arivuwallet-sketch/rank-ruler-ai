import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Download, Loader2, Plug, Rocket, X } from "lucide-react";
import { listSitePages, optimizePage, pushFixes, type PageFix } from "@/lib/fixall.functions";

type CmsKind = "none" | "webhook" | "wordpress" | "shopify" | "webflow";

const CMS_LABELS: Record<CmsKind, string> = {
  none: "Not connected (generate only)",
  webhook: "Custom webhook",
  wordpress: "WordPress REST API",
  shopify: "Shopify Admin API",
  webflow: "Webflow API",
};

export default function FixAllBar({
  siteUrl,
  brandName,
  location,
}: {
  siteUrl: string;
  brandName: string;
  location: string;
}) {
  const list = useServerFn(listSitePages);
  const optimize = useServerFn(optimizePage);
  const push = useServerFn(pushFixes);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CmsKind>("none");
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");
  const [limit, setLimit] = useState(10);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [fixes, setFixes] = useState<PageFix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewFirst, setReviewFirst] = useState(true);
  const [pushing, setPushing] = useState(false);

  async function approveAndPush() {
    if (kind === "none" || !endpoint.trim()) {
      setError("Connect your site first (choose a platform and paste the update endpoint).");
      return;
    }
    setPushing(true);
    setError(null);
    setStatus(`Pushing ${fixes.filter((f) => f.ok).length} approved pages to your site…`);
    try {
      const res = (await push({
        data: {
          cms: { kind, endpoint: endpoint.trim(), token: token.trim() || undefined },
          fixes: fixes
            .filter((f) => f.ok)
            .map((f) => ({
              url: f.url,
              title: f.title,
              description: f.description,
              h1: f.h1,
              slug: f.slug,
              tags: f.tags,
              altTags: f.altTags,
              llmsTxt: f.llmsTxt,
              jsonLd: f.jsonLd,
            })),
        },
      })) as { results: { url: string; synced: PageFix["synced"]; note?: string }[] };
      const map = new Map(res.results.map((r) => [r.url, r]));
      setFixes((current) =>
        current.map((f) => {
          const r = map.get(f.url);
          return r ? { ...f, synced: r.synced, syncNote: r.note } : f;
        }),
      );
      setStatus("Approved fixes pushed. Live pages are marked below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The push to your site failed.");
    } finally {
      setPushing(false);
    }
  }

  async function run() {
    setRunning(true);
    setError(null);
    setFixes([]);
    setDone(0);
    setTotal(0);
    setStatus("Finding every page on the site…");
    try {
      const found = (await list({ data: { url: siteUrl, limit } })) as {
        pages: string[];
        source: string;
      };
      const pages = found.pages;
      setTotal(pages.length);
      setStatus(`Found ${pages.length} pages from ${found.source}.`);
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]!;
        setStatus(`Optimizing ${i + 1}/${pages.length} — ${new URL(page).pathname || "/"}`);
        const fix = (await optimize({
          data: {
            url: page,
            brandName: brandName || undefined,
            location: location || undefined,
            cms:
              kind === "none" || reviewFirst
                ? { kind: "none" as const }
                : { kind, endpoint: endpoint.trim(), token: token.trim() || undefined },
          },
        })) as PageFix;
        setFixes((f) => [...f, fix]);
        setDone(i + 1);
      }
      setStatus(
        kind === "none"
          ? "Done. Every page has fresh titles, descriptions, tags, ALT text and schema ready to copy or download."
          : reviewFirst
            ? "Done. Review the fixes below, then approve to push them to your site."
            : "Done. Fixes were written to your site where the connection accepted them.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong during the batch run.");
    } finally {
      setRunning(false);
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify({ site: siteUrl, fixes }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `seo-fixes-${new URL(siteUrl).hostname}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const pct = total ? Math.round((done / total) * 100) : running ? 5 : 0;
  const written = fixes.filter((f) => f.synced === "written").length;

  return (
    <div className="rounded-2xl border border-mint/40 bg-gradient-to-br from-mint/10 to-transparent p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Fix all &amp; deploy to site</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Runs the whole site: cleans each page, builds keywords, writes titles, descriptions,
            tags, ALT text and schema — and pushes them live when your site is connected.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold"
          >
            <Plug className="size-4" /> {kind === "none" ? "Connect site" : CMS_LABELS[kind]}
          </button>
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            {running ? "Fixing…" : "Fix all"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
          <label className="text-sm">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">Platform</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as CmsKind)}
              className="mt-1 w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-mint"
            >
              {(Object.keys(CMS_LABELS) as CmsKind[]).map((k) => (
                <option key={k} value={k}>
                  {CMS_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              Update endpoint / webhook URL
            </span>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              disabled={kind === "none"}
              placeholder="https://yoursite.com/wp-json/seo-agent/v1/update"
              className="mt-1 w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-mint disabled:opacity-50"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              Access token
            </span>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              disabled={kind === "none"}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-mint disabled:opacity-50"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              Pages per run
            </span>
            <input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm outline-none focus:border-mint"
            />
          </label>
          <label className="flex items-start gap-2 text-xs text-muted-foreground md:col-span-4">
            <input
              type="checkbox"
              checked={reviewFirst}
              onChange={(e) => setReviewFirst(e.target.checked)}
              className="mt-0.5 size-4 accent-mint"
            />
            <span>
              Ask me before changing my site — the agent prepares every fix, shows it below, and only
              publishes after you press approve. Untick to publish straight away.
            </span>
          </label>
          <p className="text-xs text-muted-foreground md:col-span-4">
            Without a connection the agent still fixes everything and hands you the finished text and
            schema for each page. Tokens are used for this run only and never stored.
          </p>
        </div>
      )}

      {(running || fixes.length > 0 || error) && (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{status}</span>
            <span className="font-semibold">
              {done}/{total || "?"}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-accent transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

          {fixes.length > 0 && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-mint">{fixes.filter((f) => f.ok).length} pages optimized</span>
                {written > 0 && <span className="text-mint">{written} written to your site</span>}
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
                >
                  <Download className="size-3.5" /> Download all fixes
                </button>
              </div>
              <div className="mt-3 max-h-96 overflow-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                      <th className="p-3">Page</th>
                      <th className="p-3">New title</th>
                      <th className="p-3">Tags</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixes.map((f) => (
                      <tr key={f.url} className="border-t border-border/60 align-top">
                        <td className="p-3 text-muted-foreground">
                          {new URL(f.url).pathname || "/"}
                        </td>
                        <td className="p-3">
                          {f.title ?? <span className="text-muted-foreground">{f.message}</span>}
                          {f.description && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {f.description}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {(f.tags ?? []).slice(0, 4).join(", ")}
                        </td>
                        <td className="p-3">
                          {f.ok ? (
                            <span className="inline-flex items-center gap-1 text-mint">
                              <Check className="size-3.5" />
                              {f.synced === "written"
                                ? "Live"
                                : f.synced === "failed"
                                  ? "Ready (sync failed)"
                                  : "Ready"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <X className="size-3.5" /> Skipped
                            </span>
                          )}
                          {f.syncNote && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {f.syncNote}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
