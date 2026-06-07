/* global React, Icon, ChatBar, Eyebrow, Status */
const { useState: useStateS, useEffect: useEffectS } = React;

/* ============================================================
   HOME — "Now"
   ============================================================ */
function HomeScreen({ onProject, onNav, onContinue }) {
  const D = window.COS_DATA;
  const T = D.today;
  const recent = [D.projects[1], D.projects[4]]; // COS, Personal Brand — two most recently touched
  const inMotion = D.projects.filter((p) => p.status !== "dormant");
  const dormant = D.projects.filter((p) => p.status === "dormant");
  const projOf = (id) => D.projects.find((x) => x.id === id);
  const attention = [
    { t: "GLVE is blocked", d: "Waiting on pricing input from finance.", proj: "glve", accent: "violet" },
    { t: "Ōllin has gone quiet", d: "Untouched for 3 weeks — pick up or let rest.", proj: "ollin", accent: "amber" },
  ];

  return (
    <div className="wrap">
      <div className="stagger">
        <div className="kicker">Good morning. It's Sunday, June 7.</div>
        <h1 className="disp" style={{ fontSize: "clamp(50px,8vw,98px)", lineHeight: .96, margin: "18px 0 44px", maxWidth: "15ch" }}>
          You're allowed to rest — <span className="em ac-coral">you're not allowed to quit.</span>
        </h1>

        <ChatBar big placeholder="Ask COS, or capture a thought…" onFocusNav={() => onNav("search")} />

        <div className="spacer-l"></div>

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
                      onClick={() => p ? onProject(p.id) : onNav("today")}>
                      <span className="hc-time">{b.start}</span>
                      <span className="hc-title">{b.title}{idx === 1 && <span className="hc-now">now</span>}</span>
                      {p ? <span className="hc-proj"><span className="pd"></span>{p.name}</span>
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

        <div className="spacer-m"></div>

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
                  <span className="pr-dot"></span>
                  <span className="pr-name">{p.name}</span>
                  <span className="pbar"><i style={{ width: (p.pct || 0) + "%" }}></i></span>
                  <span className="pr-pct">{p.pct || 0}%</span>
                </button>
              ))}
              {dormant.map((p) => (
                <button key={p.id} className="prog-row" onClick={() => onContinue(p.id)} style={{ opacity: .65 }}>
                  <span className="pr-dot"></span>
                  <span className="pr-name dim">{p.name}</span>
                  <span className="pbar"><i style={{ width: (p.pct || 0) + "%", background: "var(--ink-4)" }}></i></span>
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
                  <span className="pdot"></span>
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
                  <span className="pdot"></span>
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
                  <span className="ad"></span>
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

/* ============================================================
   PROJECTS — index
   ============================================================ */
function ProjectsScreen({ onProject, onContinue }) {
  const D = window.COS_DATA;
  return (
    <div className="wrap">
      <div className="stagger">
        <Eyebrow accent="violet">The work</Eyebrow>
        <h1 className="disp" style={{ margin: "16px 0 8px" }}>Projects</h1>
        <p className="dim" style={{ fontSize: 16, maxWidth: "48ch", marginBottom: 36 }}>
          Five context containers. Everything related to each lives inside it — open one to land on where you left off.
        </p>
        <div className="grid-2">
          {D.projects.map((p) => (
            <div key={p.id} className={"card click ac-" + p.accent}
              onClick={() => p.status === "dormant" ? onContinue(p.id) : onProject(p.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div className="card-eyebrow" style={{ margin: 0 }}>{p.counts.timeline} updates · {p.lastActivity}</div>
                <Status status={p.status} />
              </div>
              <div className="card-title">{p.name}</div>
              <div className="card-body" style={{ maxWidth: "40ch" }}>{p.why}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 18 }}>
                <span className="pbar"><i style={{ width: (p.pct || 0) + "%", background: p.status === "dormant" ? "var(--ink-4)" : "var(--ac)" }}></i></span>
                <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 13, color: "var(--ink-3)", flexShrink: 0 }}>{p.pct || 0}%</span>
              </div>
              <div style={{ borderTop: "1px solid var(--line-2)", marginTop: 16, paddingTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 700 }}>Focus</span>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{p.focus}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROJECT DETAIL
   ============================================================ */
function ProjectScreen({ project, onContinue, onBrainstorm, onOpenDoc }) {
  const p = project;
  const tabs = [
    ["context", "Current Context", null],
    ["overview", "Overview", null],
    ["research", "Research", p.research ? p.research.length : 0],
    ["ideas", "Ideas", p.ideasFlow ? p.ideasFlow.length : 0],
  ];
  const [tab, setTab] = useStateS("context");
  useEffectS(() => { setTab("context"); }, [p.id]);

  return (
    <div className={"wrap ac-" + p.accent}>
      <div className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <Eyebrow accent={p.accent}>{p.name}</Eyebrow>
            <h1 className="disp" style={{ margin: "16px 0 10px", fontSize: "clamp(38px,5vw,60px)", color: "var(--ac)" }}>{p.name}</h1>
            <p style={{ fontSize: 17, color: "var(--ink-3)", maxWidth: "46ch", lineHeight: 1.45 }}>{p.why}</p>
            <button className="btn btn-accent" style={{ marginTop: 18 }} onClick={onBrainstorm}>
              <Icon.spark style={{ width: 15, height: 15 }} /> Brainstorm with COS
            </button>
          </div>
          <Status status={p.status} />
        </div>

        <div className="tabs">
          {tabs.map(([k, label, n]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
              {label}{n ? <span className="tn">{n}</span> : null}
            </button>
          ))}
        </div>

        {tab === "context" && <CurrentContext p={p} onContinue={onContinue} onOpenDoc={onOpenDoc} />}
        {tab === "overview" && <FacetOverview p={p} />}
        {tab === "research" && <FacetResearch p={p} onOpenDoc={onOpenDoc} />}
        {tab === "ideas" && <FacetIdeasFlow p={p} />}
      </div>
    </div>
  );
}

function StatusBar({ p }) {
  const [due, setDue] = useStateS(p.due);
  useEffectS(() => { setDue(p.due); }, [p.id]);
  const dotColor = p.status === "in-motion" ? "var(--a-mint)" : p.status === "blocked" ? "var(--a-amber)" : "var(--ink-4)";
  const statusLabel = p.status === "in-motion" ? "In motion" : p.status === "blocked" ? "Blocked" : "Dormant";
  return (
    <div className="statusbar">
      <div className="seg">
        <span className="sl">Status</span>
        <span className="sv"><span className="sd" style={{ background: dotColor }}></span>{statusLabel}</span>
      </div>
      <div className={"seg" + (!due ? " warn" : "")}>
        <span className="sl">Due date</span>
        {due ? (
          <span className="sv">{due}</span>
        ) : (
          <button className="due-set" onClick={() => setDue("Jun 21")}>
            <Icon.flag /> Set a due date
          </button>
        )}
      </div>
      <div className="seg">
        <span className="sl">Last movement</span>
        <span className="sv" style={{ fontSize: 14, fontWeight: 600 }}>{p.lastActivity}</span>
        <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 500, marginTop: 1 }}>{p.lastMovement}</span>
      </div>
      <div className="seg">
        <span className="sl">Progress</span>
        <span className="sv" style={{ gap: 10 }}>
          <span className="pbar" style={{ maxWidth: 90 }}><i style={{ width: (p.pct || 0) + "%" }}></i></span>
          <span>{(p.pct || 0) + "%"}</span>
        </span>
      </div>
    </div>
  );
}

function CurrentContext({ p, onContinue, onOpenDoc }) {
  return (
    <div className="fade-in">
      <StatusBar p={p} />

      <div className="card">
        <div className="card-eyebrow">Current focus</div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 24, letterSpacing: "-.02em", lineHeight: 1.15, color: "var(--ink)", maxWidth: "26ch" }}>{p.focus}</div>
        {(p.blockers.length > 0 || p.openQuestions.length > 0) && (
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {p.blockers.map((b, i) => (
              <span key={"b" + i} className="pill" style={{ color: "var(--a-amber)", borderColor: "transparent", background: "var(--a-amber-bg)" }}>
                <span className="d" style={{ background: "var(--a-amber)" }}></span>{b}
              </span>
            ))}
            {p.openQuestions.length > 0 && (
              <span className="pill"><span className="d"></span>{p.openQuestions.length} open question{p.openQuestions.length > 1 ? "s" : ""}</span>
            )}
          </div>
        )}
      </div>

      {p.resume && p.resume.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-eyebrow">Pick up where you left off</div>
          {p.resume.map((r, i) => (
            <button key={i} className={"resume-row ac-" + p.accent}
              onClick={() => onOpenDoc && onOpenDoc({ t: r.t, kind: r.kind, when: r.when, summary: "You were working on this when you last stepped away. Open it to keep going — COS held the thread so you don't have to rebuild it." }, p.accent)}>
              <span className="resume-kind">{r.kind}</span>
              <span className="rt">{r.t}</span>
              <span className="rw">{r.when}</span>
              <Icon.arrow className="ro" />
            </button>
          ))}
        </div>
      )}

      <div className="next">
        <div>
          <div className="nlbl">Next recommended action</div>
          <div className="ntx">{p.nextAction}</div>
        </div>
        <button className="btn btn-solid" onClick={() => onContinue && onContinue(p.id, true)}>Start <Icon.arrow /></button>
      </div>
    </div>
  );
}

function FacetOverview({ p }) {
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div className="card-eyebrow">The goal — why we're doing this</div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1.18, maxWidth: "24ch", color: "var(--ink)" }}>{p.why}</div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-eyebrow">Deadline</div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 30, letterSpacing: "-.02em", color: p.due ? "var(--ac)" : "var(--a-coral)" }}>
            {p.due || "Not set yet"}
          </div>
          {!p.due && <div style={{ fontSize: 12.5, color: "var(--a-coral)", marginTop: 6, fontWeight: 500 }}>Set one, or this will sit.</div>}
        </div>
        <div className="card">
          <div className="card-eyebrow">Notes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
            {p.notes.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 9, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.45 }}>
                <span style={{ color: "var(--ac)", fontWeight: 700 }}>—</span>{n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FacetResearch({ p, onOpenDoc }) {
  if (!p.research || !p.research.length) return <EmptyFacet label="research" name={p.name} />;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 13.5, color: "var(--ink-4)", marginBottom: 4 }}>Tap any item to open the source — COS keeps the summary, the doc lives in your tools.</p>
      {p.research.map((r, i) => (
        <div key={i} className={"card click ac-" + p.accent} style={{ padding: "18px 20px" }}
          onClick={() => onOpenDoc && onOpenDoc({ t: r.t, kind: "Research", summary: r.d }, p.accent)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div className="card-eyebrow" style={{ margin: 0 }}>Research</div>
            <span style={{ fontSize: 11.5, color: "var(--ac)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>Open <Icon.arrow style={{ width: 13, height: 13, stroke: "var(--ac)" }} /></span>
          </div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, letterSpacing: "-.015em", color: "var(--ink)", marginTop: 8 }}>{r.t}</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.5 }}>{r.d}</div>
        </div>
      ))}
    </div>
  );
}

function FacetIdeasFlow({ p }) {
  if (!p.ideasFlow || !p.ideasFlow.length) return <EmptyFacet label="ideas flowing from this project" name={p.name} />;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 13.5, color: "var(--ink-4)", marginBottom: 4 }}>Ideas that grew out of {p.name}. Promote one to the incubator when it's ready.</p>
      {p.ideasFlow.map((idea, i) => (
        <div key={i} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--ac)", flexShrink: 0 }}></span>
          <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, letterSpacing: "-.01em", color: "var(--ink)" }}>{idea.name}</span>
          <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: "var(--ink-4)" }}>{idea.stage}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyFacet({ label, name }) {
  return (
    <div className="fade-in card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 20, color: "var(--ink-3)", letterSpacing: "-.01em" }}>No {label} yet</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-4)", marginTop: 8, maxWidth: "38ch", marginInline: "auto" }}>
        When you add {label} to {name}, it shows up here — kept one tab away so Current Context stays first.
      </div>
    </div>
  );
}
function FacetDecisions({ p }) {
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {p.decisionsList.map((d, i) => (
        <div key={i} className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, letterSpacing: "-.015em", color: "var(--ac)" }}>{d.t}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{d.when}</div>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 6 }}>{d.d}</div>
        </div>
      ))}
    </div>
  );
}
function FacetKnowledge({ p }) {
  return (
    <div className="fade-in grid-2">
      {p.knowledgeList.map((k, i) => (
        <div key={i} className="card">
          <div className="card-eyebrow">Knowledge</div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 19, letterSpacing: "-.015em", color: "var(--ink)" }}>{k.t}</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 7, lineHeight: 1.5 }}>{k.d}</div>
          <div style={{ marginTop: 12, fontSize: 11, color: "var(--ink-4)", fontWeight: 600 }}>USED BY · {k.used}</div>
        </div>
      ))}
    </div>
  );
}
function FacetPeople({ p }) {
  if (!p.peopleList.length) return <FacetGeneric p={p} tab="people" />;
  return (
    <div className="fade-in grid-2">
      {p.peopleList.map((person, i) => (
        <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--ac-bg)", color: "var(--ac)", display: "grid", placeItems: "center", fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{person.initials}</div>
          <div><div style={{ fontWeight: 600, fontSize: 15 }}>{person.n}</div><div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>{person.r}</div></div>
        </div>
      ))}
    </div>
  );
}
function FacetGeneric({ p, tab }) {
  const labels = { ideas: "ideas attached to this project", research: "research findings", files: "source files", timeline: "moments on the timeline", activity: "logged events", people: "people" };
  return (
    <div className="fade-in card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 20, color: "var(--ink-3)", letterSpacing: "-.01em" }}>
        {p.counts[tab] || "A few"} {labels[tab]}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--ink-4)", marginTop: 8, maxWidth: "40ch", marginInline: "auto" }}>
        This facet holds the {tab} for {p.name}. In the full product it lists each item with its own context — kept one quiet tab away so Current Context stays first.
      </div>
    </div>
  );
}

/* ============================================================
   IDEAS BREWING
   ============================================================ */
function IdeasScreen({ onIdea }) {
  const D = window.COS_DATA;
  const [analyzed, setAnalyzed] = useStateS({});
  const stages = ["Spark", "Brewing", "Exploring", "Testing", "Ready"];
  return (
    <div className="wrap">
      <div className="stagger">
        <Eyebrow accent="amber">Incubation</Eyebrow>
        <h1 className="disp" style={{ margin: "16px 0 8px" }}>Ideas <span className="em ac-amber">brewing.</span></h1>
        <p className="dim" style={{ fontSize: 16, maxWidth: "50ch", marginBottom: 34 }}>
          Three ideas get your real attention at a time. Everything else waits as a spark. Focus is the point.
        </p>

        <div className="grid-3">
          {D.ideas.map((i) => {
            const onIdx = stages.indexOf(i.stage);
            const isOn = analyzed[i.id];
            return (
              <div key={i.id} className="card click ac-amber" style={{ display: "flex", flexDirection: "column" }} onClick={() => onIdea(i.id)}>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, letterSpacing: "-.02em", color: "var(--a-amber)" }}>{i.name}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5, minHeight: 58 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink-4)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Why it matters</span>
                  {i.why}
                </div>
                <div className="track" style={{ margin: "14px 0 4px" }}>
                  {stages.map((s, idx) => (
                    <span key={s} className={"s" + (idx <= onIdx ? " on" : "")}><span className="pd"></span>{s}</span>
                  ))}
                </div>
                {isOn ? (
                  <div className="heat">
                    <div className="hl">Heat · analyzed</div>
                    <div className="hv">{i.heat}
                      <span className="hbars">{[0,1,2,3].map((b) => <i key={b} style={{ background: b < (i.heat==="Hot"?4:i.heat==="Warm"?3:2) ? "var(--a-amber)" : "var(--line-3)" }}></i>)}</span>
                    </div>
                    <div className="hnote">{i.heatNote}</div>
                  </div>
                ) : (
                  <button className="btn btn-ghost" style={{ marginTop: 14, alignSelf: "flex-start" }} onClick={(e) => { e.stopPropagation(); setAnalyzed({ ...analyzed, [i.id]: true }); }}>
                    <Icon.spark style={{ width: 14, height: 14 }} /> Analyze heat
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="spacer-l"></div>
        <div className="section-head"><span className="lbl">Sparks · waiting, uncapped</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {D.sparks.map((s, i) => <span key={i} className="pill" style={{ opacity: .7 }}><span className="d"></span>{s}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   IDEA DETAIL
   ============================================================ */
function IdeaDetail({ idea, onProject, onBack }) {
  const i = idea;
  const stages = ["Spark", "Brewing", "Exploring", "Testing", "Ready"];
  const [stageIdx, setStageIdx] = useStateS(stages.indexOf(i.stage));
  const [analyzed, setAnalyzed] = useStateS(false);
  const [shelved, setShelved] = useStateS(false);
  useEffectS(() => { setStageIdx(stages.indexOf(i.stage)); setAnalyzed(false); setShelved(false); }, [i.id]);
  const D = window.COS_DATA;
  const heatFill = i.heat === "Hot" ? 4 : i.heat === "Warm" ? 3 : 2;
  const isReady = stageIdx >= stages.length - 1;

  return (
    <div className="wrap ac-amber">
      <div className="fade-in">
        <button className="back-link" onClick={onBack}><Icon.chevron style={{ width: 15, height: 15 }} /> Ideas</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginTop: 14 }}>
          <div>
            <Eyebrow accent="amber">Idea · {stages[stageIdx]}</Eyebrow>
            <h1 className="disp" style={{ margin: "16px 0 10px", fontSize: "clamp(38px,5vw,60px)", color: "var(--a-amber)" }}>{i.name}</h1>
            <p style={{ fontSize: 17, color: "var(--ink-3)", maxWidth: "46ch", lineHeight: 1.45 }}>{i.why}</p>
          </div>
        </div>

        {/* status bar */}
        <div className="statusbar" style={{ marginTop: 24 }}>
          <div className="seg">
            <span className="sl">Stage</span>
            <span className="sv"><span className="sd" style={{ background: "var(--a-amber)" }}></span>{stages[stageIdx]}</span>
          </div>
          <div className="seg">
            <span className="sl">Heat</span>
            {analyzed ? (
              <span className="sv" style={{ gap: 9 }}>{i.heat}
                <span className="hbars" style={{ display: "flex", gap: 3 }}>{[0,1,2,3].map((b) => <i key={b} style={{ width: 5, height: 13, borderRadius: 2, background: b < heatFill ? "var(--a-amber)" : "var(--line-3)" }}></i>)}</span>
              </span>
            ) : (
              <button className="due-set" onClick={() => setAnalyzed(true)}><Icon.spark style={{ width: 14, height: 14 }} /> Analyze</button>
            )}
          </div>
          <div className="seg">
            <span className="sl">Last activity</span>
            <span className="sv" style={{ fontSize: 14 }}>{i.lastActivity}</span>
            <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 500, marginTop: 1 }}>{i.lastMove}</span>
          </div>
        </div>

        {/* stage track + promote */}
        <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div className="track" style={{ flex: 1 }}>
            {stages.map((s, idx) => (
              <span key={s} className={"s" + (idx <= stageIdx ? " on" : "")}><span className="pd"></span>{s}</span>
            ))}
          </div>
          {!isReady ? (
            <button className="btn btn-accent" onClick={() => setStageIdx((x) => Math.min(x + 1, stages.length - 1))}>
              Move to {stages[stageIdx + 1]} <Icon.arrow />
            </button>
          ) : (
            <button className="btn btn-accent" onClick={() => onProject && D.projects[0] && onProject(D.projects[0].id)}>
              Graduate to project <Icon.arrow />
            </button>
          )}
        </div>

        {analyzed && (
          <div className="card ac-amber" style={{ marginBottom: 16, background: "var(--a-amber-bg)", borderColor: "transparent" }}>
            <div className="card-eyebrow" style={{ color: "var(--a-amber)" }}>Heat analysis</div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, letterSpacing: "-.01em", color: "var(--ink)" }}>{i.heat} — {i.heatNote}</div>
          </div>
        )}

        <div className="grid-2" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card-eyebrow">The spark — where it came from</div>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 19, color: "var(--ink-2)", lineHeight: 1.4 }}>"{i.spark}"</div>
            </div>
            <div className="card">
              <div className="card-eyebrow">Open questions · {i.questions.length}</div>
              {i.questions.map((q, idx) => <div key={idx} className="qrow"><span className="qm">?</span>{q}</div>)}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card-eyebrow">Related projects</div>
              {i.related.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {i.related.map((r) => {
                    const proj = D.projects.find((p) => p.name === r);
                    return (
                      <button key={r} className={"pill solid ac-" + (proj ? proj.accent : "amber")} style={{ cursor: "pointer", fontWeight: 600 }}
                        onClick={() => proj && onProject(proj.id)}>
                        <span className="d"></span>{r}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13.5, color: "var(--ink-4)" }}>Not linked to a project yet — it's still its own thing.</div>
              )}
            </div>
            <div className="card">
              <div className="card-eyebrow">Next move</div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 18, letterSpacing: "-.015em", color: "var(--ink)", lineHeight: 1.25 }}>{i.nextMove}</div>
            </div>
          </div>
        </div>

        {/* graceful exit */}
        <div className="card" style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          {!shelved ? (
            <>
              <div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, letterSpacing: "-.01em" }}>Not every idea should survive.</div>
                <div style={{ fontSize: 13, color: "var(--ink-4)", marginTop: 3 }}>Shelving keeps the takeaway as Knowledge, then clears the incubator.</div>
              </div>
              <button className="btn btn-ghost" onClick={() => setShelved(true)}>Shelve with a takeaway</button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="status in-motion"><span className="d"></span>Shelved</span>
              <span style={{ fontSize: 13.5, color: "var(--ink-3)" }}>Saved the lesson to Knowledge. The incubator has room again.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SEARCH / MEMORY
   ============================================================ */
function SearchScreen({ onProject, initialQuery }) {
  const D = window.COS_DATA;
  const [q, setQ] = useStateS(initialQuery || "");
  const [axis, setAxis] = useStateS("all");
  const ql = q.trim().toLowerCase();
  const match = (s) => !ql || s.toLowerCase().includes(ql);

  const projHits = D.projects.filter((p) => match(p.name) || match(p.why) || match(p.focus));
  const peopleHits = D.searchPeople.filter((p) => match(p.n) || match(p.r) || match(p.proj));
  const knowHits = D.searchKnowledge.filter((k) => match(k.t) || match(k.d) || match(k.used));
  const decHits = D.searchDecisions.filter((d) => match(d.t) || match(d.used));

  const show = (type) => axis === "all" || axis === type;
  const total = (show("projects") ? projHits.length : 0) + (show("people") ? peopleHits.length : 0) + (show("knowledge") ? knowHits.length : 0) + (show("decisions") ? decHits.length : 0);

  return (
    <div className="wrap">
      <div className="fade-in">
        <h1 className="disp" style={{ marginBottom: 22, fontSize: "clamp(32px,4vw,48px)" }}>
          {ql ? <>Memory — <span className="em ac-violet">"{q}"</span></> : <>What are you looking <span className="em ac-violet">for?</span></>}
        </h1>
        <div className="search-big">
          <Icon.search />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="my GLVE stuff, a person, a decision…" />
        </div>
        <div className="axes">
          {[["all", "Everything"], ["projects", "Projects"], ["people", "People"], ["knowledge", "Knowledge"], ["decisions", "Decisions"]].map(([k, l]) => (
            <button key={k} className={"axis" + (axis === k ? " on" : "")} onClick={() => setAxis(k)}>{l}</button>
          ))}
        </div>

        {ql && <div style={{ fontSize: 12.5, color: "var(--ink-4)", marginTop: 18 }}>{total} result{total !== 1 ? "s" : ""}</div>}

        {show("projects") && projHits.length > 0 && (
          <div className="res-group">
            <div className="rgl">Projects <span className="rgc">{projHits.length}</span></div>
            <div className="grid-2">
              {projHits.map((p) => (
                <div key={p.id} className={"rescard ac-" + p.accent} onClick={() => onProject(p.id)}>
                  <div className="rc-top">
                    <div className="ri">{p.name[0]}</div>
                    <div className="rt">{p.name}</div>
                    <div className="rmeta">{p.lastActivity}</div>
                  </div>
                  <div className="rd">{p.focus}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {show("people") && peopleHits.length > 0 && (
          <div className="res-group">
            <div className="rgl">People <span className="rgc">{peopleHits.length}</span></div>
            <div className="grid-2">
              {peopleHits.map((p, i) => (
                <div key={i} className="rescard">
                  <div className="rc-top">
                    <div className="ri">{p.initials}</div>
                    <div className="rt plain">{p.n}</div>
                    <div className="rmeta">{p.proj}</div>
                  </div>
                  <div className="rd">{p.r}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {show("knowledge") && knowHits.length > 0 && (
          <div className="res-group">
            <div className="rgl">Knowledge <span className="rgc">{knowHits.length}</span></div>
            <div className="grid-2">
              {knowHits.map((k, i) => (
                <div key={i} className="rescard">
                  <div className="rc-top">
                    <div className="ri">K</div>
                    <div className="rt plain">{k.t}</div>
                  </div>
                  <div className="rd">{k.d}</div>
                  <div className="rused">Used by · {k.used}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {show("decisions") && decHits.length > 0 && (
          <div className="res-group">
            <div className="rgl">Decisions <span className="rgc">{decHits.length}</span></div>
            <div className="grid-2">
              {decHits.map((d, i) => (
                <div key={i} className="rescard">
                  <div className="rc-top">
                    <div className="ri">D</div>
                    <div className="rt plain">{d.t}</div>
                    <div className="rmeta">{d.used}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ql && total === 0 && (
          <div className="card" style={{ marginTop: 26, textAlign: "center", padding: "40px 20px", color: "var(--ink-4)" }}>
            Nothing matches "{q}" yet. Try a project name, a person, or a decision.
          </div>
        )}

        {!ql && (
          <div style={{ marginTop: 30 }}>
            <div className="rgl" style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 700, marginBottom: 12 }}>You usually look by</div>
            <div className="grid-3">
              {[["By meaning", "\u201cmy GLVE stuff\u201d"], ["By time", "\u201cwhat did I do last week?\u201d"], ["By person", "\u201cwhat\u2019s up with this client?\u201d"]].map(([t, d]) => (
                <div key={t} className="card"><div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 17, letterSpacing: "-.01em" }}>{t}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-4)", marginTop: 6, fontFamily: "var(--serif)", fontStyle: "italic" }}>{d}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DOC VIEWER — open the actual doc (the bridge: shows what + where)
   ============================================================ */
const DOC_SOURCE = {
  Draft: "Google Docs", Doc: "Google Docs", Spec: "Google Docs", List: "Apple Notes",
  Decision: "COS · Decisions", Wireframe: "Figma", Note: "Apple Notes", Idea: "COS · Ideas",
  Rubric: "Google Sheets", Research: "Saved research",
};
function DocViewer({ doc, accent, onClose }) {
  const src = doc.source || DOC_SOURCE[doc.kind] || "your tools";
  return (
    <div className="bs-overlay" onClick={onClose}>
      <div className={"bs-drawer ac-" + accent} onClick={(e) => e.stopPropagation()}>
        <div className="bs-head">
          <div>
            <div className="bs-eye"><span className="d"></span>{doc.kind}</div>
            <div className="bs-title">{doc.t}</div>
          </div>
          <button className="bs-x" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="bs-body">
          <div className="doc-meta">
            <span>Lives in <b style={{ color: "var(--ink-2)" }}>{src}</b></span>
            {doc.when && <span>· last edited {doc.when}</span>}
          </div>
          <a className="doc-open" href="#" onClick={(e) => e.preventDefault()}>Open original <Icon.arrow /></a>
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-eyebrow">What COS remembers</div>
            <div style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6 }}>{doc.summary}</div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--ink-4)", lineHeight: 1.6 }}>
            The full document lives in {src}. COS keeps the thread — what it is, why it matters, and where you left it — so you can find and reopen it in one move, even months later.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BRAINSTORM DRAWER — invited AI, scoped to a project
   ============================================================ */
const BS_CHIPS = {
  brand: ["Draft a LinkedIn post on continuity", "Give me 10 hooks for a post", "Turn my notes into a thread", "What should I post this week?"],
  glve: ["Pressure-test the six-engine spec", "Draft the pricing one-pager", "What am I missing?"],
  cos: ["Name the homepage: Now or Home?", "Poke holes in chat-first", "What's the riskiest assumption?"],
  _default: ["Help me think this through", "What should I do next?", "Play devil's advocate", "Summarize where I am"],
};

function bsFallback(project, text) {
  const t = text.toLowerCase();
  const name = project.name;
  if (t.includes("hook")) {
    return "Here are a few hooks to pull from — punchy, first-line tested:\n\n1. \"Most productivity tools help you store. None help you return.\"\n2. \"I don't have a memory problem. I have a re-entry problem.\"\n3. \"The expensive moment isn't losing the file. It's the morning after a week away.\"\n4. \"Systems beat willpower. Here's the one I rebuilt this month.\"\n\nWant me to expand any of these into a full post?";
  }
  if (t.includes("linkedin") || t.includes("post") || t.includes("draft")) {
    return "Here's a draft built on your three pillars — systems, calm, continuity:\n\n———\nWe treat forgetting as failure. It isn't.\n\nThe real cost was never losing information — it's the cost of *returning* to it. Rebuilding the thread every time you come back.\n\nSo I stopped optimizing for storage and started optimizing for re-entry. One question every project has to answer before I ask: where was I?\n\nCalm isn't the absence of work. It's the absence of reconstruction.\n———\n\nWant it punchier, longer, or with a softer open?";
  }
  if (t.includes("thread")) {
    return "I'd shape it as a 5-tweet thread:\n\n1. The hook — the re-entry problem in one line\n2. Why storage tools miss it\n3. The reframe: continuity over storage\n4. The one concrete practice you use\n5. The takeaway + a question to drive replies\n\nWant me to write each one out?";
  }
  if (t.includes("week") || t.includes("next")) {
    return `For ${name} this week, I'd pick ONE: ship the opening essay on continuity. It's your strongest pillar and everything else can ladder to it. Want me to outline it?`;
  }
  return `Let's think it through for ${name}. Give me the rough shape — the angle, the audience, or just the mess in your head — and I'll throw a few directions back. No wrong answers here; this is the sandbox.`;
}

function BrainstormPanel({ project, onClose }) {
  const p = project;
  const chips = BS_CHIPS[p.id] || BS_CHIPS._default;
  const greeting = p.id === "brand"
    ? `Let's throw ideas around for ${p.name}. LinkedIn posts, hooks, a thread — what are we riffing on?`
    : `Let's think out loud about ${p.name}. I'll brainstorm, poke holes, and draft — you stay the author. Where do you want to start?`;
  const [messages, setMessages] = useStateS([{ role: "ai", text: greeting }]);
  const [input, setInput] = useStateS("");
  const [busy, setBusy] = useStateS(false);
  const bodyRef = React.useRef(null);
  useEffectS(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, busy]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "me", text: msg }]);
    setBusy(true);
    let reply = null;
    try {
      if (window.claude && window.claude.complete) {
        const prompt = `You are COS, a calm, sharp thinking partner. You are helping the user brainstorm inside their project "${p.name}" — ${p.why}. Notes: ${(p.notes || []).join(" ")}. Keep replies warm, concrete, and brief (under 130 words). Offer concrete drafts, hooks, or angles. The user is riffing, not asking for a lecture.\n\nUser: ${msg}\n\nCOS:`;
        reply = await window.claude.complete(prompt);
      }
    } catch (e) { reply = null; }
    if (!reply) { await new Promise((r) => setTimeout(r, 650)); reply = bsFallback(p, msg); }
    setMessages((m) => [...m, { role: "ai", text: reply.trim() }]);
    setBusy(false);
  };

  return (
    <div className="bs-overlay" onClick={onClose}>
      <div className={"bs-drawer ac-" + p.accent} onClick={(e) => e.stopPropagation()}>
        <div className="bs-head">
          <div>
            <div className="bs-eye"><span className="d"></span>Brainstorm · {p.name}</div>
            <div className="bs-title">Throw ideas around</div>
            <div className="bs-sub">Invited, off the record. Nothing is saved unless you keep it.</div>
          </div>
          <button className="bs-x" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="bs-body" ref={bodyRef}>
          {messages.map((m, i) => <div key={i} className={"bs-msg " + m.role}>{m.text}</div>)}
          {busy && <div className="bs-typing"><i></i><i></i><i></i></div>}
        </div>

        {messages.length <= 1 && (
          <div className="bs-chips">
            {chips.map((c, i) => <button key={i} className="bs-chip" onClick={() => send(c)}>{c}</button>)}
          </div>
        )}

        <div className="bs-foot">
          <div className="chatbar" style={{ padding: "12px 14px", boxShadow: "none" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={"Riff with COS about " + p.name + "…"} />
            <button className="mic" title="Voice"><Icon.mic /></button>
            <button className="send" title="Send" onClick={() => send()}><Icon.send /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RE-ENTRY OVERLAY
   ============================================================ */
function Reentry({ project, onClose, onResume }) {
  const p = project;
  const tier = p.away === "3 weeks" ? "Briefing" : p.away === "3 days" || p.away === "1 day" || p.away === "2 days" || p.away === "5 days" ? "Nudge" : "Reconstruction";
  const changed = [
    "No new activity while you were away — the thread is exactly as you left it.",
    "2 related notes from other projects mention this.",
  ];
  return (
    <div className="overlay" onClick={onClose}>
      <div className={"reentry ac-" + p.accent} onClick={(e) => e.stopPropagation()}>
        <div className="rtop">
          <span className="away">Away {p.away}</span>
          <button className="rx" onClick={onClose}><Icon.x /></button>
        </div>
        <h2>Welcome back to {p.name}.</h2>
        <div className="tier"><span className="d"></span>{tier} · depth scales with time away</div>

        {tier !== "Nudge" && (
          <div className="rsec">
            <div className="rl">What changed while you were away</div>
            {changed.map((c, i) => <div key={i} className="changed"><span className="cd"></span>{c}</div>)}
          </div>
        )}
        {tier === "Reconstruction" && (
          <div className="rsec">
            <div className="rl">Why this mattered</div>
            <div className="rv">{p.why}</div>
          </div>
        )}
        <div className="rsec">
          <div className="rl">Where you stopped</div>
          <div className="rv"><b>{p.focus}</b> You were {p.lastVerb}.</div>
        </div>
        <div className="rsec">
          <div className="rl">Pick up with</div>
          <div className="rv"><b>{p.nextAction}</b></div>
        </div>

        <div className="ractions">
          <button className="btn btn-accent" onClick={() => onResume(p.id)}>Pick up where you left off <Icon.arrow /></button>
          <button className="btn btn-ghost" onClick={() => onResume(p.id)}>Just browsing</button>
          {p.status === "dormant" && <button className="btn btn-ghost" onClick={onClose}>Let it rest</button>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, ProjectsScreen, ProjectScreen, IdeasScreen, IdeaDetail, SearchScreen, Reentry, BrainstormPanel, DocViewer, TodayScreen });

/* ============================================================
   TODAY — the calendar / day layer over Now
   ============================================================ */
function TodayScreen({ onProject }) {
  const D = window.COS_DATA;
  const T = D.today;
  const tied = T.blocks.filter((b) => b.proj).length;
  const projOf = (id) => D.projects.find((p) => p.id === id);

  return (
    <div className="wrap">
      <div className="stagger">
        <Eyebrow accent="blue">Your day</Eyebrow>
        <h1 className="disp" style={{ margin: "16px 0 8px", maxWidth: "18ch" }}>
          Today, tied to <span className="em ac-blue">your work.</span>
        </h1>
        <p className="dim" style={{ fontSize: 16, maxWidth: "52ch", marginBottom: 26 }}>
          {T.date} · {T.blocks.length} blocks, {tied} connected to a project. Each one opens where you left off — you walk in already oriented.
        </p>

        <div className="cal-banner">
          <span className="cdot"></span>
          <span className="ct-txt">Synced with <b>{T.calendar}</b> · COS reads your blocks and attaches context</span>
          <button className="ct-link">Manage <Icon.arrow style={{ width: 13, height: 13 }} /></button>
        </div>

        <div className="timeline">
          {T.blocks.map((b, idx) => {
            const p = b.proj ? projOf(b.proj) : null;
            const accent = p ? p.accent : "blue";
            const linked = !!p;
            return (
              <div key={idx} className={"tblock ac-" + accent}>
                <div className="ttime">
                  <span className="ts">{b.start}</span>
                  <span className="te">{b.end}</span>
                </div>
                <div className="tspine"><span className="tnode"></span></div>
                <div className={"tcard" + (linked ? "" : " nolink")}
                  onClick={() => linked && onProject(p.id)}>
                  <div className="tc-top">
                    <span className={"kind " + (b.kind === "meeting" ? "meeting" : b.kind === "focus" ? "focus" : "")}>{b.kind}</span>
                    {b.who && <span style={{ fontSize: 12.5, color: "var(--ink-4)", fontWeight: 500 }}>with {b.who}</span>}
                    {p && <span className="tproj"><span className="pd"></span>{p.name}</span>}
                  </div>
                  <div className="ttitle">{b.title}</div>
                  <div className="twalk">
                    <span className="wlabel">{linked ? "Walk in with" : "COS"}</span>
                    {b.walkIn}
                  </div>
                  {linked && (
                    <div className="tenter">Enter {p.name} <Icon.arrow /></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="spacer-m"></div>
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, letterSpacing: "-.01em" }}>Plan tomorrow before you leave.</div>
            <div style={{ fontSize: 13, color: "var(--ink-4)", marginTop: 3 }}>Drag a project onto a free block and COS pre-loads its context for the morning.</div>
          </div>
          <button className="btn btn-ghost">Plan tomorrow <Icon.arrow /></button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TodayScreen });