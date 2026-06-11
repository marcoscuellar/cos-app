import { COS_DATA } from "../data";
import { ChatBar } from "../components/shared";
import { Icon } from "../components/Icon";
import { greeting as getGreeting, foyerStamp, pickQuote } from "../brief";

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

// Quick links to the tools you live in — open in a new tab. Easy to edit/reorder.
const LINKS: { label: string; url: string }[] = [
  { label: "LinkedIn", url: "https://www.linkedin.com/feed/" },
  { label: "Sales Nav", url: "https://www.linkedin.com/sales/home" },
  { label: "Gmail", url: "https://mail.google.com" },
  { label: "Claude", url: "https://claude.ai" },
  { label: "ChatGPT", url: "https://chatgpt.com" },
  { label: "Gemini", url: "https://gemini.google.com/app" },
  { label: "Grok", url: "https://grok.com" },
  { label: "Discord", url: "https://discord.com/app" },
];

export function HomeScreen({ onProject, onNav, onContinue }: HomeProps) {
  const D = COS_DATA;
  const T = D.today;
  const projOf = (id: string) => D.projects.find((x) => x.id === id);
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
            <span className="cos-logo">COS</span>
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

        {/* LAUNCHPAD — quick links to the tools you live in */}
        <div className="arch-sec"><span className="chip">Launchpad</span></div>
        <div className="launchpad">
          {LINKS.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="launch-tile">
              <span className="lt-name">{l.label}</span>
              <Icon.arrow className="lt-arrow" />
            </a>
          ))}
        </div>

        <div className="spacer-l" />

        {/* TWO-UP: your day (calendar) + recently touched rooms */}
        <div className="home-split">
          {/* LEFT — the day */}
          <div className="home-col">
            <div className="arch-sec">
              <span className="chip">Today</span>
              <button className="more" onClick={() => onNav("today")}>Open <Icon.arrow style={{ width: 13, height: 13 }} /></button>
            </div>
            <div className="card ac-blue home-cal-card">
              <div className="home-cal-list">
                {T.blocks.map((b, idx) => {
                  const p = b.proj ? projOf(b.proj) : null;
                  const accent = p ? p.accent : "blue";
                  return (
                    <button key={idx} className={"home-cal-row ac-" + accent}
                      onClick={() => (p ? onProject(p.id) : onNav("today"))}>
                      <span className="hc-time">{b.start}</span>
                      <span className="hc-title">{b.title}{idx === 1 && <span className="hc-now">NOW</span>}</span>
                      {p ? <span className="hc-proj"><span className="pd" />{p.name}</span>
                         : <span className="hc-proj" style={{ color: "var(--ink-4)" }}>{b.kind}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — recently touched rooms */}
          <div className="home-col">
            <div className="arch-sec">
              <span className="chip">Recent</span>
            </div>
            {recent.map((p) => (
              <div key={p.id} className={"card click ac-" + p.accent} style={{ padding: "18px 20px" }} onClick={() => onContinue(p.id)}>
                <div className="arch-card-head" style={{ marginBottom: 12 }}>
                  <span className="mono-meta">Last touched · {p.lastActivity}</span>
                  <span className="recent-dot" style={{ width: 8, height: 8, background: "var(--ac)", flexShrink: 0 }} />
                </div>
                <div className="card-title" style={{ fontSize: 22 }}>{p.name}</div>
                <div className="card-body" style={{ marginTop: 6 }}>You were {p.lastVerb}.</div>
                <div className="mono-meta" style={{ marginTop: 14 }}>{STATUS_LABEL[p.status]} · {p.pct}%</div>
              </div>
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
