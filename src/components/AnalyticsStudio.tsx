import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Download,
  Globe2,
  MousePointerClick,
  Plug,
  Radio,
  ShoppingCart,
  Users,
} from "lucide-react";
import { buildAnalytics, comparePrevious, daysBetween, toCsv, type AnalyticsData, type BusinessModel, type RangeKey, type Row } from "@/lib/analytics";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "ytd", label: "YTD" },
  { key: "custom", label: "Custom" },
];

function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

function Card({ title, icon, children, className = "" }: { title?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      {title ? (
        <h4 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {icon}
          {title}
        </h4>
      ) : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

function Sparkline({ values, stroke = "var(--mint)" }: { values: number[]; stroke?: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const pts = values
    .map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${28 - ((v - min) / Math.max(max - min, 1)) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function LineChart({ data, compare }: { data: AnalyticsData; compare: AnalyticsData | null }) {
  const [metric, setMetric] = useState<"users" | "clicks" | "revenue">("users");
  const vals = data.series.map((p) => p[metric]);
  const cmp = compare ? compare.series.map((p) => p[metric]) : null;
  const max = Math.max(...vals, ...(cmp ?? [0]), 1);
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / Math.max(arr.length - 1, 1)) * 100} ${100 - (v / max) * 96}`).join(" ");
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          <BarChart3 className="size-4" /> Traffic & revenue over time
        </h4>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["users", "clicks", "revenue"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded px-2.5 py-1 text-xs capitalize ${metric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-56 w-full">
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--border)" strokeWidth="0.4" />
        ))}
        {cmp ? <path d={path(cmp)} fill="none" stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" /> : null}
        <path d={path(vals)} fill="none" stroke="var(--mint)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{data.series[0]?.label}</span>
        <span>{data.series[data.series.length - 1]?.label}</span>
      </div>
      {compare ? (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="text-violet">— — previous period</span> vs <span className="text-mint">current</span>
        </p>
      ) : null}
    </div>
  );
}

function Bars({ items }: { items: { label: string; value: number; caption?: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between text-sm">
            <span>{i.label}</span>
            <span className="text-muted-foreground">{i.caption ?? i.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Donut({ items }: { items: { label: string; share: number }[] }) {
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  let offset = 0;
  const c = 2 * Math.PI * 38;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-32 shrink-0 -rotate-90">
        {items.map((it, i) => {
          const len = (it.share / 100) * c;
          const el = (
            <circle
              key={it.label}
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
            {it.label}
            <span className="text-muted-foreground">{it.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorldMap({ data }: { data: AnalyticsData }) {
  const max = Math.max(...data.geo.map((g) => g.users), 1);
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/40" style={{ aspectRatio: "2 / 1" }}>
        <svg viewBox="0 0 100 50" className="absolute inset-0 size-full">
          {Array.from({ length: 26 }, (_, i) => (
            <line key={`v${i}`} x1={i * 4} x2={i * 4} y1="0" y2="50" stroke="var(--border)" strokeWidth="0.15" />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`h${i}`} x1="0" x2="100" y1={i * 4} y2="50" stroke="var(--border)" strokeWidth="0.15" />
          ))}
        </svg>
        {data.live.pins.map((p) => (
          <span
            key={p.city}
            title={`${p.city}, ${p.country} · ${p.users} live`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${8 + (p.users / Math.max(data.live.users, 1)) * 20}px`,
              height: `${8 + (p.users / Math.max(data.live.users, 1)) * 20}px`,
              boxShadow: "0 0 0 4px color-mix(in oklab, var(--mint) 25%, transparent)",
            }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {data.geo.map((g) => (
          <li key={g.country}>
            <div className="flex justify-between text-sm">
              <span>
                {g.country} <span className="text-xs text-muted-foreground">({g.cities.map((c) => c.city).join(", ")})</span>
              </span>
              <span className="text-muted-foreground">
                {g.users.toLocaleString()} · {g.share}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-violet" style={{ width: `${(g.users / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataTable({ title, rows, filename }: { title: string; rows: Row[]; filename: string }) {
  const headers = Object.keys(rows[0] ?? {});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: headers[1] ?? headers[0] ?? "", dir: -1 });
  const [q, setQ] = useState("");
  const view = useMemo(() => {
    const num = (v: string | number) => (typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.-]/g, "")));
    return rows
      .filter((r) => (q ? Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase())) : true))
      .slice()
      .sort((a, b) => {
        const av = a[sort.key]!;
        const bv = b[sort.key]!;
        const an = num(av);
        const bn = num(bv);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) return (an - bn) * sort.dir;
        return String(av).localeCompare(String(bv)) * sort.dir;
      });
  }, [rows, q, sort]);

  const download = () => {
    const blob = new Blob([toCsv(view)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h4>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            aria-label={`Search ${title}`}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button onClick={download} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary">
            <Download className="size-3.5" /> CSV
          </button>
          <button onClick={() => window.print()} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary">
            PDF
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
              {headers.map((h) => (
                <th key={h} className="pb-2 pr-3">
                  <button
                    onClick={() => setSort((s) => ({ key: h, dir: s.key === h && s.dir === -1 ? 1 : -1 }))}
                    className="hover:text-foreground"
                  >
                    {h}
                    {sort.key === h ? (sort.dir === -1 ? " ↓" : " ↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => (
              <tr key={i} className="border-t border-border/60">
                {headers.map((h) => (
                  <td key={h} className="py-2 pr-3">
                    {r[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, sample }: { label: string; value: string; sample?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {sample ? <SampleTag /> : null}
    </div>
  );
}

/** Persistent, unmissable label on any value that is not measured from a live source. */
function SampleTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`mt-1 inline-block rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-500 uppercase ${className}`}
    >
      Sample data
    </span>
  );
}

export default function AnalyticsStudio({
  finalUrl,
  primary,
  businessModel = "unknown",
  sitePaths = [],
}: {
  finalUrl: string;
  primary: string;
  businessModel?: BusinessModel;
  sitePaths?: string[];
}) {
  const [range, setRange] = useState<RangeKey>("7d");
  const [compareOn, setCompareOn] = useState(false);
  const [tick, setTick] = useState(0);
  const [from, setFrom] = useState(() => isoDaysAgo(14));
  const [to, setTo] = useState(() => isoDaysAgo(0));
  const customDays = daysBetween(from, to);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const data = useMemo(
    () => buildAnalytics(finalUrl, range, primary, tick, customDays, { businessModel, sitePaths }),
    [finalUrl, range, primary, tick, customDays, businessModel, sitePaths],
  );
  const prev = useMemo(() => (compareOn ? comparePrevious(data) : null), [compareOn, data]);
  const feed = data.live.feed.slice(tick % data.live.feed.length).concat(data.live.feed.slice(0, tick % data.live.feed.length));

  const MODEL_LABEL: Record<BusinessModel, string> = {
    ecommerce: "Online store (cart / checkout found)",
    subscription: "Subscription product (pricing and billing found)",
    marketplace: "Marketplace (vendor / seller signals found)",
    leadgen: "Lead generation (enquiry form found)",
    content: "Content publisher (article sections found)",
    unknown: "Not determined — showing traffic, engagement and search only",
  };

  return (
    <section className="space-y-6">
      {data.sample ? (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-500">
            No analytics source is connected — every number below is sample data
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Google Analytics or Search Console to replace these figures with your real measured visitors, clicks and
            revenue. Business model detected from the scan: {MODEL_LABEL[data.businessModel]}.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-bold">Omnipotent Analytics Studio</h3>
          <p className="text-sm text-muted-foreground">
            Live and historical performance for {data.host} — search, traffic, audience, revenue and behaviour in one command view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded px-2.5 py-1 text-xs font-medium ${range === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {range === "custom" ? (
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="Start date"
                className="bg-transparent text-foreground outline-none"
              />
              <span className="text-muted-foreground">→</span>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                aria-label="End date"
                className="bg-transparent text-foreground outline-none"
              />
              <span className="text-muted-foreground">{customDays}d</span>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
            <input type="checkbox" checked={compareOn} onChange={(e) => setCompareOn(e.target.checked)} className="accent-[var(--mint)]" />
            Compare to previous period
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-mint uppercase">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-mint" />
            </span>
            <Radio className="size-3.5" /> Live right now
          </div>
          <p className="font-display mt-3 text-5xl font-black tabular-nums">{data.live.users}</p>
          <p className="text-sm text-muted-foreground">active users on site (refreshes every 3s)</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {data.live.pages.map((p) => (
              <li key={p.path} className="flex justify-between">
                <span className="truncate text-muted-foreground">{p.path}</span>
                <span className="font-semibold tabular-nums">{p.users}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            {feed.slice(0, 4).map((f, i) => (
              <p key={f + i} className="truncate">
                <Activity className="mr-1 inline size-3 text-mint" />
                {f}
              </p>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {data.kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{k.label}</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="font-display text-2xl font-bold">{k.value}</p>
                <span className={`text-sm font-semibold ${k.delta >= 0 ? "text-mint" : "text-destructive"}`}>
                  {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}%
                </span>
              </div>
              <Sparkline values={k.spark} stroke={k.delta >= 0 ? "var(--mint)" : "var(--destructive)"} />
            </div>
          ))}
        </div>
      </div>

      <Card>
        <LineChart data={data} compare={prev} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Organic search performance" icon={<Globe2 className="size-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Clicks" value={data.gsc.clicks.toLocaleString()} />
            <Stat label="Impressions" value={data.gsc.impressions.toLocaleString()} />
            <Stat label="Average CTR" value={`${data.gsc.ctr}%`} />
            <Stat label="Average position" value={String(data.gsc.position)} />
          </div>
        </Card>
        <Card title="Traffic & engagement" icon={<Users className="size-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Users" value={data.engagement.users.toLocaleString()} />
            <Stat label="Sessions" value={data.engagement.sessions.toLocaleString()} />
            <Stat label="Pageviews" value={data.engagement.pageviews.toLocaleString()} />
            <Stat label="Engagement rate" value={`${data.engagement.engagementRate}%`} />
            <Stat label="Avg. session" value={`${Math.floor(data.engagement.avgDuration / 60)}m ${data.engagement.avgDuration % 60}s`} />
            <Stat label="Bounce rate" value={`${data.engagement.bounceRate}%`} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Traffic acquisition" icon={<BarChart3 className="size-4" />}>
          <Bars items={data.acquisition.map((a) => ({ label: a.channel, value: a.sessions, caption: `${a.sessions.toLocaleString()} · ${a.share}%` }))} />
        </Card>
        <Card title="New vs returning" icon={<Users className="size-4" />}>
          <Donut
            items={[
              { label: "New users", share: Math.round((data.engagement.newUsers / data.engagement.users) * 1000) / 10 },
              { label: "Returning", share: Math.round((data.engagement.returning / data.engagement.users) * 1000) / 10 },
            ]}
          />
        </Card>
      </div>

      <Card title="Users by region & live traffic map" icon={<Globe2 className="size-4" />}>
        <WorldMap data={data} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Age distribution">
          <Bars items={data.age.map((a) => ({ label: a.bracket, value: a.users }))} />
        </Card>
        <Card title="Gender & language">
          <Donut items={data.gender} />
          <div className="mt-5">
            <Bars items={data.languages.map((l) => ({ label: l.label, value: l.share, caption: `${l.share}%` }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Device breakdown">
          <Donut items={data.devices} />
        </Card>
        <Card title="Browsers, OS & screens">
          <div className="grid gap-5 sm:grid-cols-3">
            <Bars items={data.browsers.map((b) => ({ label: b.label, value: b.share, caption: `${b.share}%` }))} />
            <Bars items={data.os.map((b) => ({ label: b.label, value: b.share, caption: `${b.share}%` }))} />
            <Bars items={data.resolutions.map((b) => ({ label: b.label, value: b.share, caption: `${b.share}%` }))} />
          </div>
        </Card>
      </div>

      {data.metricGroups.commerce || data.metricGroups.subscription ? (
        <Card
          title={data.metricGroups.commerce ? "E-commerce & financial metrics" : "Subscription & revenue metrics"}
          icon={<ShoppingCart className="size-4" />}
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total revenue" value={`$${data.ecommerce.revenue.toLocaleString()}`} sample={data.sample} />
            <Stat label={data.metricGroups.commerce ? "Orders" : "New subscriptions"} value={data.ecommerce.orders.toLocaleString()} sample={data.sample} />
            <Stat label="Conversion rate" value={`${data.ecommerce.conversionRate}%`} sample={data.sample} />
            <Stat label={data.metricGroups.commerce ? "Average order value" : "Average plan value"} value={`$${data.ecommerce.aov}`} sample={data.sample} />
            <Stat label="Customer lifetime value" value={`$${data.ecommerce.clv}`} sample={data.sample} />
            <Stat label="Revenue per user" value={`$${data.ecommerce.revenuePerUser}`} sample={data.sample} />
            {data.metricGroups.commerce ? (
              <Stat label="Cart abandonment" value={`${data.ecommerce.cartAbandonment}%`} sample={data.sample} />
            ) : null}
            <Stat label="Range" value={RANGES.find((r) => r.key === range)!.label} />
          </div>
        </Card>
      ) : null}

      <Card title="Conversion path & reading depth">
        <div className="grid gap-5 lg:grid-cols-2">

          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Conversion funnel</p>
            {data.sample ? <SampleTag /> : null}
            <ul className="mt-3 space-y-2">
              {data.funnel.map((f, i) => {
                const pct = (f.users / data.funnel[0]!.users) * 100;
                const drop = i === 0 ? 0 : Math.round((1 - f.users / data.funnel[i - 1]!.users) * 1000) / 10;
                return (
                  <li key={f.step}>
                    <div className="flex justify-between text-sm">
                      <span>{f.step}</span>
                      <span className="text-muted-foreground">
                        {f.users.toLocaleString()}
                        {i > 0 ? ` · −${drop}%` : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Scroll depth</p>
            <div className="mt-3">
              <Bars items={data.scroll.map((s) => ({ label: s.depth, value: s.share, caption: `${s.share}%` }))} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="High-click elements" icon={<MousePointerClick className="size-4" />}>
          <Bars items={data.clickMap.map((c) => ({ label: c.element, value: c.clicks, caption: `${c.clicks.toLocaleString()} · ${c.share}%` }))} />
        </Card>
        <Card title="Exit pages & bounce rate">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pb-2">Page</th>
                <th className="pb-2">Exits</th>
                <th className="pb-2">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {data.exitPages.map((e) => (
                <tr key={e.path} className="border-t border-border/60">
                  <td className="py-2 pr-2">{e.path}</td>
                  <td className="py-2 pr-2 tabular-nums">{e.exits.toLocaleString()}</td>
                  <td className="py-2 tabular-nums">{e.bounceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <DataTable title="Top keywords" rows={data.keywords} filename={`${data.host}-keywords`} />
      <DataTable title="Top landing pages" rows={data.pages} filename={`${data.host}-pages`} />
      <DataTable title="Top selling products" rows={data.products} filename={`${data.host}-products`} />

      <Card title="Data sources" icon={<Plug className="size-4" />}>
        <ul className="grid gap-3 md:grid-cols-2">
          {data.sources.map((s) => (
            <li key={s.name} className="rounded-xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{s.name}</p>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {s.connected ? "Connected" : "Simulated"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Numbers shown are a deterministic modelled forecast for {data.host}. Connect Analytics, Search Console or your store to replace every
          figure with your real measured data.
        </p>
      </Card>
    </section>
  );
}
