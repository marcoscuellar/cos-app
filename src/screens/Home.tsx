import { useEffect, useState } from "react";
import { COS_DATA } from "../data";
import { ChatBar } from "../components/shared";
import { Icon } from "../components/Icon";
import { greeting as getGreeting, foyerStamp, pickQuote } from "../brief";
import type { DayPlan } from "../types";
import { loadPlan } from "../dayPlanApi";

type GlanceBlock = { start: string; end: string; title: string; kind: string; proj: string | null; id?: string; done?: boolean; walkIn?: string };

// Which block is happening right now (Chicago time)? Mirrors the Calendar screen.
function currentIndex(blocks: GlanceBlock[]): number {
  const TZ = "America/Chicago";
  const now = new Date();
  const nm =
    Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(now)) * 60 +
    Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, minute: "2-digit" }).format(now));
  const toMin = (t: string) => {
    const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return null;
    let h = +m[1];
    const mn = m[2] ? +m[2] : 0;
    const ap = m[3]?.toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + mn;
  };
  return blocks.findIndex((b) => {
    const s = toMin(b.start);
    const e = toMin(b.end);
    return s !== null && s <= nm && (e === null || nm < e);
  });
}

interface HomeProps {
  onProject: (id: string) => void;
  onNav: (route: string) => void;
  onContinue: (id: string, fromInside?: boolean) => void;
}

const STATUS_LABEL: Record<string, string> = {
  "in-motion": "In motion",
  blocked: "Blocked",
  dormant: "Dormant",
};

// Quick links to the tools you live in — open in a new tab. icon = lucide line-art slug.
const LINKS: { label: string; url: string; icon: string }[] = [
  { label: "LinkedIn", url: "https://www.linkedin.com/feed/", icon: "briefcase" },
  { label: "Sales Nav", url: "https://www.linkedin.com/sales/home", icon: "target" },
  { label: "Gmail", url: "https://mail.google.com", icon: "mail" },
  { label: "Claude", url: "https://claude.ai", icon: "sparkles" },
  { label: "ChatGPT", url: "https://chatgpt.com", icon: "message-circle" },
  { label: "Gemini", url: "https://gemini.google.com/app", icon: "gem" },
  { label: "Grok", url: "https://grok.com", icon: "bot" },
  { label: "Discord", url: "https://discord.com/app", icon: "messages-square" },
];

export function HomeScreen({ onProject, onNav, onContinue }: HomeProps) {
  const D = COS_DATA;
  const T = D.today;
  const projOf = (id: string) => D.projects.find((x) => x.id === id);
  // The foyer's "Today" card shows the SAME real plan as the Calendar screen
  // (falling back to the sample day until one is built), so they never disagree.
  const [plan, setPlan] = useState<DayPlan | null>(null);
  useEffect(() => {
    loadPlan().then((p) => p && setPlan(p));
  }, []);
  const todayBlocks: GlanceBlock[] = plan ? plan.blocks : (T.blocks as GlanceBlock[]);
  const nowIdx = plan ? currentIndex(todayBlocks) : 1;
  // Greeting, datestamp + quote follow the user's home timezone (Central) and a
  // daily seed, so the doorway is correct from any device and rotates day to day.
  const greeting = getGreeting();
  const stamp = foyerStamp();
  const DW = D.doorway;
  const quote = pickQuote(DW.quotes);
  const door = projOf("cos") || D.projects[0]; // the warm room
  const recent = [projOf("cos"), projOf("brand"), projOf("glve")].filter(
    Boolean,
  ) as NonNullable<ReturnType<typeof projOf>>[]; // recently touched rooms
  const inMotion = D.projects.filter((p) => p.status !== "dormant");
  const dormant = D.projects.filter((p) => p.status === "dormant");
  const attention = [
    { t: "GLVE is blocked", d: "Waiting on pricing input from finance.", proj: "glve", accent: "violet" },
    { t: "Ōllin has gone quiet", d: "Untouched for 3 weeks — pick up or let rest.", proj: "ollin", accent: "amber" },
  ];
  // The doorway is a brand + motivation moment that drops you into the day — it
  // doesn't navigate; it smooth-scrolls down to reveal the rest of the floor.
  const enterFoyer = () => {
    const m = document.querySelector(".main");
    if (m) m.scrollBy({ top: Math.round((window.innerHeight || 700) * 0.9), behavior: "smooth" });
  };

  return (
    <div className="wrap home-arch">
      <div className="stagger">
        {/* FOYER — the place you enter before a room */}
        <div className="foyer">
          <div className="foyer-mark">
            <span className="mono-meta">FOYER</span>
          </div>
          <span className="mono-meta q">{stamp}</span>
        </div>

        {/* DOORWAY — architectural briefing: CEO quote · motto · enter */}
        <h1 className="arch-hero">{greeting}.</h1>

        <button className={"doorway ac-" + door.accent} onClick={enterFoyer}>
          <div className="dw-body">
            <div className="dw-left">
              <div className="dw-rule" />
              <span className="chip">Let's keep going</span>
              <div className="dw-name">{door.name}</div>
            </div>
            <div className="dw-quotewrap">
              <div className="dw-quote">“{quote.t}”</div>
              <div className="dw-cite">— {quote.who} · {quote.role}</div>
            </div>
          </div>
          <div className="dw-foot">
            <span className="dw-mono">{DW.motto}</span>
            <span className="dw-closer">Enter the foyer <Icon.arrow style={{ transform: "rotate(90deg)" }} /></span>
          </div>
        </button>

        <div className="spacer-m" />

        <ChatBar big placeholder="Ask COS, or capture a thought…" onFocusNav={() => onNav("search")} />

        <div className="spacer-l" />

        {/* DASHBOARD — what's next + launchpad on the left, recent rooms on the right.
            (No calendar here — the day lives on its own page; "See full day" links to it.) */}
        <div className="home-dash">
          {/* LEFT — what's next, then the launchpad */}
          <div className="home-dash-l">
            {(() => {
              const wnIdx = nowIdx >= 0 ? nowIdx : 0;
              const b = todayBlocks[wnIdx];
              if (!b) return null;
              const bp = b.proj ? projOf(b.proj) : null;
              const isNow = wnIdx === nowIdx;
              return (
                <>
                  <div className="dash-head">
                    <span className="mono-tag">What's next</span>
                    <button className="dash-link" onClick={() => onNav("today")}>See full day</button>
                  </div>
                  <button className="whatsnext" onClick={() => (bp ? onProject(bp.id) : onNav("today"))}>
                    <div className="wn-top">
                      <span className="wn-time">{b.start}–{b.end}{isNow && <span className="wn-now">NOW</span>}</span>
                      {bp && <span className="wn-proj"><span className="wn-dot" />{bp.name}</span>}
                    </div>
                    <div className="wn-title">{b.title}</div>
                    {b.walkIn && <div className="wn-walk"><span className="wn-wlbl">Walk in with</span>{b.walkIn}</div>}
                  </button>
                </>
              );
            })()}

            <div className="dash-head sec"><span className="mono-tag">Launchpad</span></div>
            <div className="launch-grid">
              {LINKS.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="launch-tile">
                  <span className="lt-ic">
                    <img src={`https://cdn.jsdelivr.net/npm/lucide-static/icons/${l.icon}.svg`} alt=""
                      loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </span>
                  <span className="lt-name">{l.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT — recently touched rooms */}
          <div className="home-dash-r">
            <div className="dash-head"><span className="mono-tag">Recent</span></div>
            {recent.map((p) => (
              <button key={p.id} className="recent-card" onClick={() => onContinue(p.id)}>
                <div className="rc-top">
                  <span className="rc-meta">Last touched · {p.lastActivity}</span>
                  <span className="rc-dot" />
                </div>
                <div className="rc-name">{p.name}</div>
                <div className="rc-body">You were {p.lastVerb}.</div>
                <div className="rc-foot">{STATUS_LABEL[p.status]} · {p.pct}%</div>
              </button>
            ))}
          </div>
        </div>

        <div className="spacer-l" />

        {/* THE FLOOR — wings of the building */}
        <div className="arch-sec">
          <span className="chip">The Floor</span>
          <span className="mono-meta q">{D.projects.length} ROOMS · {inMotion.length} IN MOTION</span>
        </div>
        <div className="grid-2">
          {/* Projects in motion */}
          <div className="card ac-violet">
            <div className="arch-card-head">
              <span className="chip">In motion</span>
              <span className="mono-meta">{inMotion.length} ACTIVE · {dormant.length} DORMANT</span>
            </div>
            <div className="panel-body" style={{ padding: "2px 0 0" }}>
              {inMotion.map((p) => (
                <button key={p.id} className={"prog-row ac-" + p.accent} onClick={() => onProject(p.id)}>
                  <span className="pr-dot" />
                  <span className="pr-name">{p.name}</span>
                  <span className="pbar"><i style={{ width: (p.pct || 0) + "%" }} /></span>
                  <span className="pr-pct">{p.pct || 0}%</span>
                </button>
              ))}
              {dormant.map((p) => (
                <button key={p.id} className="prog-row" onClick={() => onContinue(p.id)} style={{ opacity: 0.65 }}>
                  <span className="pr-dot" />
                  <span className="pr-name dim">{p.name}</span>
                  <span className="pbar"><i style={{ width: (p.pct || 0) + "%", background: "var(--ink-4)" }} /></span>
                  <span className="pr-pct">{p.pct || 0}%</span>
                </button>
              ))}
            </div>
            <button className="card-link" onClick={() => onNav("projects")}>All projects <Icon.arrow style={{ width: 13, height: 13 }} /></button>
          </div>

          {/* Needs attention */}
          <div className="card ac-coral">
            <div className="arch-card-head">
              <span className="chip">Attention</span>
              <span className="mono-meta">{attention.length} {attention.length === 1 ? "ITEM" : "ITEMS"}</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {attention.map((a, idx) => (
                <button key={idx} className={"prow ac-" + a.accent} onClick={() => onContinue(a.proj)}>
                  <span className="pdot" />
                  <span>
                    <span className="ptitle">{a.t}</span>
                    <span className="psub">{a.d}</span>
                  </span>
                  <Icon.arrow className="arrow-ic" />
                </button>
              ))}
            </div>
          </div>

          {/* Ideas brewing */}
          <div className="card ac-amber">
            <div className="arch-card-head">
              <span className="chip">Brewing</span>
              <span className="mono-meta">{D.ideas.length} ACTIVE</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {D.ideas.map((i) => (
                <button key={i.id} className="prow ac-amber" onClick={() => onNav("ideas")}>
                  <span className="pdot" />
                  <span>
                    <span className="ptitle">{i.name}</span>
                    <span className="psub">{i.stage} · {i.why}</span>
                  </span>
                  <Icon.arrow className="arrow-ic" />
                </button>
              ))}
            </div>
            <button className="card-link" onClick={() => onNav("ideas")}>Open incubator <Icon.arrow style={{ width: 13, height: 13 }} /></button>
          </div>

          {/* Recent activity */}
          <div className="card ac-mint">
            <div className="arch-card-head">
              <span className="chip">Activity</span>
              <span className="mono-meta">THIS WEEK</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {D.activity.map((a, idx) => (
                <div key={idx} className={"act ac-" + a.accent} style={{ borderColor: "var(--line-2)" }}>
                  <span className="ad" />
                  <span className="atx"><span className="ap">{a.proj}</span> — {a.verb.toLowerCase()} <b>{a.what}</b></span>
                  <span className="aw">{a.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
