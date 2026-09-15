import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Copy,
  Download,
  Globe2,
  Link2Off,
  Mail,
  MapPin,
  MessageSquare,
  Radar,
  Send,
  ShieldAlert,
  Sparkles,
  Thermometer,
} from "lucide-react";
import { buildGrowth, type GrowthOutput } from "@/lib/growth";
import { deliverPayload } from "@/lib/outreach.functions";

const TABS = [
  { key: "offpage", label: "Backlinks & digital PR", icon: Radar },
  { key: "leads", label: "Lead generation", icon: Thermometer },
  { key: "scale", label: "Growth & scaling", icon: Globe2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function Copyable({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {done ? <Check className="size-3.5 text-mint" /> : <Copy className="size-3.5" />}
      {label ?? (done ? "Copied" : "Copy")}
    </button>
  );
}

function downloadFile(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function DownloadButton({ name, content, label }: { name: string; content: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadFile(name, content)}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold transition-colors hover:text-foreground"
    >
      <Download className="size-3.5" /> {label}
    </button>
  );
}

function SectionCard({
  title,
  hint,
  right,
  children,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{title}</h4>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function GrowthEngines({
  finalUrl,
  brandName,
  location,
  business,
  primary,
  secondary,
  keywords,
}: {
  finalUrl: string;
  brandName: string;
  location: string;
  business: string;
  primary: string;
  secondary: string;
  keywords: string[];
}) {
  const [tab, setTab] = useState<TabKey>("offpage");
  const g: GrowthOutput = useMemo(
    () => buildGrowth({ finalUrl, brand: brandName, location, business, primary, secondary, keywords }),
    [finalUrl, brandName, location, business, primary, secondary, keywords],
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Growth engines</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Off-page link reclaim and outreach, visitor capture and scoring, plus the plan for scaling
            pages into new cities and languages.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? "border-mint/30 bg-mint/10 text-mint"
                  : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-5">
        {tab === "offpage" && <OffPage g={g} finalUrl={finalUrl} />}
        {tab === "leads" && <Leads g={g} primary={primary} />}
        {tab === "scale" && <Scaling g={g} />}
      </div>
    </div>
  );
}

/* ---------------------------------- off-page --------------------------------- */

function OffPage({ g, finalUrl }: { g: GrowthOutput; finalUrl: string }) {
  const deliver = useServerFn(deliverPayload);
  const [queued, setQueued] = useState<Record<string, "queued" | "sending" | "sent" | "failed">>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");
  const [openDraft, setOpenDraft] = useState<string | null>(g.outreach[0]?.id ?? null);

  async function send(id: string) {
    const draft = g.outreach.find((d) => d.id === id);
    if (!draft) return;
    if (!endpoint) {
      setQueued((q) => ({ ...q, [id]: "queued" }));
      setNotes((n) => ({ ...n, [id]: "Queued — add a sending address above to deliver it." }));
      return;
    }
    setQueued((q) => ({ ...q, [id]: "sending" }));
    const res = await deliver({
      data: {
        endpoint,
        ...(token ? { token } : {}),
        payload: {
          to: draft.contact,
          subject: draft.subject,
          text: draft.body,
          from_site: finalUrl,
          angle: draft.angle,
        },
      },
    });
    setQueued((q) => ({ ...q, [id]: res.ok ? "sent" : "failed" }));
    setNotes((n) => ({ ...n, [id]: res.message }));
  }

  return (
    <>
      <SectionCard
        title="Brand mention & broken link radar"
        hint="Places that talk about you without linking, and competitor pages that have gone dead — both are easy links."
      >
        <ul className="space-y-2">
          {g.mentions.map((m) => (
            <li key={m.url} className="rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                    m.kind === "broken-competitor-link"
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                      : "border-sky-400/30 bg-sky-400/10 text-sky-300"
                  }`}
                >
                  {m.kind === "broken-competitor-link" ? (
                    <Link2Off className="size-3" />
                  ) : (
                    <Radar className="size-3" />
                  )}
                  {m.kind === "broken-competitor-link" ? "Dead competitor link" : "Unlinked mention"}
                </span>
                <span className="text-sm font-medium">{m.source}</span>
                <span className="text-xs text-muted-foreground">authority {m.authority}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{m.snippet}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="Outreach CRM"
        hint="Personalised pitches written from each page's own angle. Add your sending address to deliver in one click."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Sending address (SendGrid, Gmail relay or webhook)
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.sendgrid.com/v3/mail/send"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Access token (used for this send only)
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {g.outreach.map((d) => {
            const state = queued[d.id];
            const open = openDraft === d.id;
            return (
              <div key={d.id} className="rounded-lg border border-border/60 bg-card/60">
                <button
                  type="button"
                  onClick={() => setOpenDraft(open ? null : d.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{d.subject}</span>
                    <span className="text-xs text-muted-foreground">→ {d.contact}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">{d.angle}</span>
                </button>
                {open && (
                  <div className="border-t border-border/60 p-3">
                    <pre className="max-h-64 overflow-auto rounded-lg bg-secondary/50 p-3 text-xs whitespace-pre-wrap">
                      {d.body}
                    </pre>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void send(d.id)}
                        disabled={state === "sending"}
                        className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-60"
                      >
                        <Send className="size-3.5" />
                        {state === "sending" ? "Sending…" : "Send pitch"}
                      </button>
                      <Copyable value={`${d.subject}\n\n${d.body}`} label="Copy email" />
                      {state && (
                        <span
                          className={`text-xs ${
                            state === "sent" ? "text-mint" : state === "failed" ? "text-rose-300" : "text-muted-foreground"
                          }`}
                        >
                          {state === "sent" ? "Sent" : state === "failed" ? "Failed" : "Queued"} ·{" "}
                          {notes[d.id]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Toxic link sentinel"
        hint="Spammy domains worth disowning, with a ready-made file for Google Search Console."
        right={<DownloadButton name="disavow.txt" content={g.disavow} label="Download disavow.txt" />}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="pb-2">Domain</th>
              <th className="pb-2">Why</th>
              <th className="pb-2">Links</th>
              <th className="pb-2 text-right">Spam</th>
            </tr>
          </thead>
          <tbody>
            {g.toxic.map((t) => (
              <tr key={t.domain} className="border-t border-border/60">
                <td className="py-2 pr-2 font-medium">{t.domain}</td>
                <td className="py-2 pr-2 text-muted-foreground">{t.reason}</td>
                <td className="py-2 pr-2 text-muted-foreground">{t.links}</td>
                <td className="py-2 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[11px] text-rose-300">
                    <ShieldAlert className="size-3" /> {t.spamScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </>
  );
}

/* ----------------------------------- leads ---------------------------------- */

function Leads({ g, primary }: { g: GrowthOutput; primary: string }) {
  const deliver = useServerFn(deliverPayload);
  const [magnet, setMagnet] = useState(0);
  const [email, setEmail] = useState("");
  const [crm, setCrm] = useState("");
  const [sent, setSent] = useState("");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");

  // Real behaviour signals from this visit.
  const start = useRef(Date.now());
  const [seconds, setSeconds] = useState(0);
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds(Math.round((Date.now() - start.current) / 1000)), 1000);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
      setDepth((d) => (pct > d ? pct : d));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const score = Math.min(
    100,
    (depth >= 75 ? 25 : Math.round((depth / 75) * 25)) +
      (seconds >= 90 ? 20 : Math.round((seconds / 90) * 20)) +
      20 + // organic-intent baseline for a scanned page
      (chat.length > 0 ? 20 : 0) +
      (email ? 15 : 0),
  );
  const temp = score >= 75 ? "Hot" : score >= 45 ? "Warm" : "Cold";
  const active = g.magnets[magnet]!;

  async function capture() {
    downloadFile(`${active.title.replace(/\s+/g, "-").toLowerCase()}.md`, active.markdown);
    if (!crm) {
      setSent("Report downloaded. Add a CRM address to also push this lead automatically.");
      return;
    }
    const res = await deliver({
      data: {
        endpoint: crm,
        payload: {
          email,
          lead_score: score,
          temperature: temp,
          magnet: active.title,
          scroll_depth: depth,
          seconds_on_page: seconds,
          qualifying_answers: chat,
        },
      },
    });
    setSent(res.ok ? "Lead pushed to your CRM." : `CRM rejected it: ${res.message}`);
  }

  return (
    <>
      <SectionCard
        title="Dynamic lead magnets"
        hint="A personalised report generated for the visitor's own topic, not a static PDF."
      >
        <div className="flex flex-wrap gap-2">
          {g.magnets.map((m, i) => (
            <button
              key={m.title}
              type="button"
              onClick={() => setMagnet(i)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                i === magnet
                  ? "border-mint/30 bg-mint/10 text-mint"
                  : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.title}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{active.promise}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {active.sections.map((s) => (
            <li key={s} className="rounded-lg bg-secondary/50 px-3 py-2">
              <Sparkles className="mr-2 inline size-3.5 text-mint" />
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="visitor@email.com"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <input
            value={crm}
            onChange={(e) => setCrm(e.target.value)}
            placeholder="CRM webhook (HubSpot / Salesforce)"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm sm:col-span-2"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void capture()}
            className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-semibold text-background"
          >
            <Download className="size-4" /> Generate report & capture lead
          </button>
          <Copyable value={active.markdown} label="Copy report" />
          {sent && <span className="text-xs text-muted-foreground">{sent}</span>}
        </div>
      </SectionCard>

      <SectionCard
        title="Predictive lead scoring"
        hint="Measured live from this visit: how far you scrolled, how long you stayed, and what you answered."
        right={
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              temp === "Hot"
                ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                : temp === "Warm"
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  : "border-sky-400/30 bg-sky-400/10 text-sky-300"
            }`}
          >
            {temp} · {score}/100
          </span>
        }
      >
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-mint transition-all" style={{ width: `${score}%` }} />
        </div>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span>Scroll depth: {depth}%</span>
          <span>Time on page: {seconds}s</span>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {g.scoring.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3 border-t border-border/60 py-2">
              <span>
                {s.label}
                <span className="ml-2 text-xs text-muted-foreground">{s.note}</span>
              </span>
              <span className="text-xs text-muted-foreground">+{s.weight}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="Conversational capture"
        hint={`Qualifying questions for visitors researching ${primary}. Answers ride along with the lead.`}
      >
        <div className="space-y-2">
          {chat.map((c) => (
            <div key={c.q} className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <p className="text-muted-foreground">{c.q}</p>
              <p className="mt-1">{c.a}</p>
            </div>
          ))}
        </div>
        {step < g.chatQualifiers.length ? (
          <div className="mt-3">
            <p className="flex items-center gap-2 text-sm">
              <MessageSquare className="size-4 text-mint" /> {g.chatQualifiers[step]}
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type an answer"
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (!answer.trim()) return;
                  setChat((c) => [...c, { q: g.chatQualifiers[step]!, a: answer.trim() }]);
                  setAnswer("");
                  setStep((s) => s + 1);
                }}
                className="rounded-lg bg-secondary px-3 py-2 text-sm font-semibold"
              >
                Reply
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-mint">
            Qualified — this visitor is ready to route to your CRM with the answers above.
          </p>
        )}
      </SectionCard>
    </>
  );
}

/* ---------------------------------- scaling ---------------------------------- */

function Scaling({ g, localBusiness }: { g: GrowthOutput; localBusiness: boolean }) {
  // Location pages are only legitimate for genuine local / multi-location
  // businesses, and never generated silently: the user must switch them on
  // after reading the warning.
  const [pseoOn, setPseoOn] = useState(false);
  return (
    <>
      <SectionCard title="Location pages" hint="Only appropriate for businesses that genuinely serve multiple named places.">
        {localBusiness ? (
          <p className="text-sm text-muted-foreground">
            The scan found local-business signals on this site (a locations page or local business markup), so city pages can
            be a legitimate fit.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            The scan found no locations page, city service pages or local business markup on this site. Publishing city pages
            here would create near-duplicate pages about places you do not actually serve, which search engines treat as spam.
          </p>
        )}
        <div className="mt-4 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-500">Read before enabling</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Each page below must be given genuinely unique, substantive content — real local addresses, staff, service areas,
            prices or customer stories — before you publish it. Swapping only the city name creates doorway pages and can get
            the whole site demoted.
          </p>
          <button
            type="button"
            onClick={() => setPseoOn((v) => !v)}
            className={`mt-3 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              pseoOn ? "border-mint text-mint" : "border-amber-500/60 text-amber-500"
            }`}
          >
            {pseoOn ? "Hide location page drafts" : "I understand — show location page drafts"}
          </button>
        </div>
      </SectionCard>
      {pseoOn ? (
      <SectionCard
        title="Programmatic page drafts"
        hint="Starting points only — replace the shared wording with unique local detail before publishing."
        right={
          <Copyable
            value={g.pseo.map((p) => `${p.slug}\n${p.title}\n${p.description}`).join("\n\n")}
            label="Copy all pages"
          />
        }
      >
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pb-2">Page</th>
                <th className="pb-2">Title</th>
                <th className="pb-2">Heading</th>
              </tr>
            </thead>
            <tbody>
              {g.pseo.map((p) => (
                <tr key={p.slug} className="border-t border-border/60">
                  <td className="py-2 pr-2 font-mono text-xs">{p.slug}</td>
                  <td className="py-2 pr-2">{p.title}</td>
                  <td className="py-2 text-muted-foreground">
                    <MapPin className="mr-1 inline size-3" />
                    {p.h1}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Languages & hreflang"
        hint="Translated target phrases per market, with the alternate-language tags to paste into your pages."
        right={<Copyable value={g.hreflangTags} label="Copy hreflang tags" />}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {g.hreflang.map((h) => (
            <div key={h.code} className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <span className="font-semibold">{h.language}</span>
              <span className="ml-2 text-xs text-muted-foreground">{h.code}</span>
              <p className="mt-1 text-xs text-muted-foreground">
                {h.keyword} · {h.href}
              </p>
            </div>
          ))}
        </div>
        <pre className="mt-3 max-h-52 overflow-auto rounded-lg bg-secondary/50 p-3 text-xs">
          {g.hreflangTags}
        </pre>
      </SectionCard>

      <SectionCard
        title="Crawl budget guardian"
        hint="Stops search engines wasting time on filters, carts and search results so your real pages get crawled."
        right={<DownloadButton name="robots.txt" content={g.robots} label="Download robots.txt" />}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="pb-2">Pattern</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">Why</th>
            </tr>
          </thead>
          <tbody>
            {g.canonicalRules.map((r) => (
              <tr key={r.pattern} className="border-t border-border/60">
                <td className="py-2 pr-2 font-mono text-xs">{r.pattern}</td>
                <td className="py-2 pr-2">{r.action}</td>
                <td className="py-2 text-muted-foreground">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs tracking-wide text-muted-foreground uppercase">robots.txt</span>
          <Copyable value={g.robots} />
        </div>
        <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-secondary/50 p-3 text-xs">{g.robots}</pre>
      </SectionCard>
    </>
  );
}
