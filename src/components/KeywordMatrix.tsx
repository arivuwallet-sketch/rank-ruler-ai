import { useState } from "react";
import { Check, Copy, Tags } from "lucide-react";
import type { GeneratedLayers } from "@/lib/cleaned-page";

const TABS = [
  { key: "shortTail", label: "Short-tail", intent: "Broad · high volume", cls: "bg-sky-400/10 text-sky-300 border-sky-400/30" },
  { key: "longTail", label: "Long-tail", intent: "Specific · high conversion", cls: "bg-mint/10 text-mint border-mint/30" },
  { key: "informational", label: "Informational", intent: "Learning intent", cls: "bg-violet-400/10 text-violet-300 border-violet-400/30" },
  { key: "transactional", label: "Transactional", intent: "Buying intent", cls: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  { key: "local", label: "Local", intent: "Geo intent", cls: "bg-rose-400/10 text-rose-300 border-rose-400/30" },
] as const;

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

export default function KeywordMatrix({ g }: { g: GeneratedLayers }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("shortTail");
  const active = TABS.find((t) => t.key === tab)!;
  const list = g.keywordMatrix[tab] ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Keyword matrix</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked search phrases for this page's actual subject, grouped by what the searcher wants.
          </p>
        </div>
        <Copyable
          value={Object.values(g.keywordMatrix).flat().join("\n")}
          label="Copy all keywords"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? t.cls
                : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="ml-2 opacity-70">{(g.keywordMatrix[t.key] ?? []).length}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${active.cls}`}>
          {active.intent}
        </span>
        {list.length ? (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pb-2">Keyword</th>
                <th className="pb-2">Words</th>
                <th className="pb-2 text-right">Copy</th>
              </tr>
            </thead>
            <tbody>
              {list.map((k) => (
                <tr key={k} className="border-t border-border/60">
                  <td className="py-2 pr-2">{k}</td>
                  <td className="py-2 pr-2 text-muted-foreground">
                    {k.split(/\s+/).filter(Boolean).length}
                  </td>
                  <td className="py-2 text-right">
                    <Copyable value={k} label="" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {tab === "local"
              ? "No location was given, so local phrases were skipped. Add a target city or country before scanning to get them."
              : "Nothing in this group for this page."}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
              <Tags className="size-3.5" /> Page & product tags
            </span>
            <Copyable value={g.tags.join(", ")} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.tags.map((t) => (
              <span key={t} className="rounded-full bg-secondary/60 px-3 py-1 text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              Image ALT text
            </span>
            <Copyable value={g.altTags.join("\n")} />
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {g.altTags.map((a) => (
              <li key={a} className="rounded-lg bg-secondary/60 px-3 py-2">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
