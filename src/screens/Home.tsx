import { COS_DATA } from "../data";
import { ChatBar } from "../components/shared";
import { Icon } from "../components/Icon";
import { greeting as getGreeting, foyerStamp, pickQuote } from "../brief";

interface HomeProps {
  onProject: (id: string) => void;
  onNav: (route: string) => void;
  onContinue: (id: string, fromInside?: boolean) => void;
}

export function HomeScreen({ onProject, onNav, onContinue }: HomeProps) {
  const D = COS_DATA;
  const T = D.today;
  // Greeting, datestamp + quote follow the user's home timezone (Central) and a
  // daily seed, so the doorway is correct from any device and rotates day to day.
  const greeting = getGreeting();
  const stamp = foyerStamp();
  const DW = D.doorway;
  const quote = pickQuote(DW.quotes);
  const door = D.projects.find((p) => p.id === "cos") || D.projects[0]; // the warm room
  const recent = [D.projects[1], D.projects[4]]; // COS, Personal Brand — two most recently touched
  const inMotion = D.projects.filter((p) => p.status !== "dormant");
  const dormant = D.projects.filter((p) => p.status === "dormant");
  const projOf = (id: string) => D.projects.find((x) => x.id === id);
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
    <div className="wrap">
      <div className="stagger">
        {/* FOYER + DOORWAY — the architectural entrance to Home */}
        <div className="home-arch">
          <div className="foyer">
            <div className="foyer-mark">
              <span className="cos-logo">COS</span>
              <span className="mono-meta">FOYER</span>
            </div>
            <span className="mono-meta q">{stamp}</span>
          </div>

          <h1 className="arch-hero">{greeting}.</h1>
          <p className="arch-sub">Five rooms. One is still warm — step back in, or look around the floor first.</p>

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
        </div>

        <div className="spacer-m" />

        <ChatBar big placeholder="Ask COS, or capture a thought…" onFocusNav={() => onNav("search")} />

        <div className="spacer-l" />

        {/* TWO-UP: your day (calendar) + most recent */}
        <div className="home-split">
          {/* LEFT — the day */}
          <div className="home-col">
            <div className="section-head">
              <span className="lbl" style={{ whiteSpace: "nowrap" }}>Today · your day</span>
              <button className="more" onClick={() => onNav("today")} style={{ whiteSpace: "nowrap" }}>Open <Icon.arrow style={{ width: 13, height: 13 }} /></button>
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
                      <span className="hc-title">{b.title}{idx === 1 && <span className="hc-now">now</span>}</span>
                      {p ? <span className="hc-proj"><span className="pd" />{p.name}</span>
                         : <span className="hc-proj" style={{ color: "var(--ink-4)" }}>{b.kind}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — most recent, stacked */}
          <div className="home-col">
            <div className="section-head">
              <span className="lbl">Most recent</span>
            </div>
            {recent.map((p) => (
              <div key={p.id} className={"card click ac-" + p.accent} style={{ padding: "18px 20px" }} onClick={() => onContinue(p.id)}>
                <div className="card-eyebrow" style={{ marginBottom: 8 }}>Last touched · {p.lastActivity}</div>
                <div className="card-title" style={{ fontSize: 22 }}>{p.name}</div>
                <div className="card-body" style={{ marginTop: 6 }}>You were {p.lastVerb}.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <span className="btn btn-accent" style={{ padding: "9px 13px", fontSize: 12.5 }}>Continue <Icon.arrow /></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="spacer-m" />

        <div className="section-head">
          <span className="lbl">At a glance</span>
        </div>
        {/* FOUR PANELS — styled like the "Last touched" cards */}
        <div className="grid-2">
          {/* Projects in motion */}
          <div className="card ac-violet">
            <div className="card-eyebrow">{inMotion.length} active · {dormant.length} dormant</div>
            <div className="card-title">Projects in motion</div>
            <div className="panel-body" style={{ padding: "8px 0 0" }}>
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
            <div className="card-eyebrow">{attention.length} {attention.length === 1 ? "item" : "items"}</div>
            <div className="card-title">Needs attention</div>
            <div className="panel-body" style={{ padding: "6px 0 0" }}>
              {attention.map((a, idx) => (
                <button key={idx} className={"prow ac-" + a.accent} onClick={() => onContinue(a.proj)}>
                  <span className="pdot" />
                  <span>
                    <span className="ptitle" style={{ color: "var(--ac)" }}>{a.t}</span>
                    <span className="psub">{a.d}</span>
                  </span>
                  <Icon.arrow className="arrow-ic" />
                </button>
              ))}
            </div>
          </div>

          {/* Ideas brewing */}
          <div className="card ac-amber">
            <div className="card-eyebrow">{D.ideas.length} active</div>
            <div className="card-title">Ideas brewing</div>
            <div className="panel-body" style={{ padding: "6px 0 0" }}>
              {D.ideas.map((i) => (
                <button key={i.id} className="prow ac-amber" onClick={() => onNav("ideas")}>
                  <span className="pdot" />
                  <span>
                    <span className="ptitle" style={{ color: "var(--a-amber)" }}>{i.name}</span>
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
            <div className="card-eyebrow">This week</div>
            <div className="card-title">Recent activity</div>
            <div className="panel-body" style={{ padding: "6px 0 0" }}>
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
