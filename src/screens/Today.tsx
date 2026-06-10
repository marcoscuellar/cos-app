import { COS_DATA } from "../data";
import { Icon } from "../components/Icon";

/* TODAY — the calendar / day layer, given the black-box branding treatment. */
export function TodayScreen({ onProject }: { onProject: (id: string) => void }) {
  const D = COS_DATA;
  const T = D.today;
  const tied = T.blocks.filter((b) => b.proj).length;
  const projOf = (id: string) => D.projects.find((p) => p.id === id);

  // Live date in the user's home timezone, so the black box is always correct.
  const TZ = "America/Chicago";
  const now = new Date();
  const weekday = new Intl.DateTimeFormat(undefined, { timeZone: TZ, weekday: "long" }).format(now);
  const monthDay = new Intl.DateTimeFormat(undefined, { timeZone: TZ, month: "long", day: "numeric", year: "numeric" }).format(now);

  return (
    <div className="wrap today-arch">
      <div className="stagger">
        {/* FOYER — same architectural header as Home */}
        <div className="foyer">
          <div className="foyer-mark">
            <span className="cos-logo">COS</span>
            <span className="mono-meta">CALENDAR</span>
          </div>
          <span className="mono-meta q">{monthDay}</span>
        </div>

        {/* THE BLACK BOX — the branded calendar hero */}
        <div className="cal-hero">
          <div className="ch-body">
            <div className="ch-left">
              <div className="dw-rule" />
              <span className="chip">Today</span>
              <div className="ch-day">{weekday}.</div>
              <div className="ch-date">{monthDay}</div>
            </div>
            <div className="ch-right">
              <div className="ch-stat">
                <span className="ch-num">{T.blocks.length}</span>
                <span className="ch-lbl">Blocks</span>
              </div>
              <div className="ch-stat">
                <span className="ch-num">{tied}</span>
                <span className="ch-lbl">Tied to a room</span>
              </div>
            </div>
          </div>
          <div className="ch-foot">
            <span className="ch-syncline"><span className="cdot" />Synced with {T.calendar} · COS attaches context to every block</span>
            <button className="ch-manage">Manage <Icon.arrow /></button>
          </div>
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
                <div className="tspine"><span className="tnode" /></div>
                <div className={"tcard" + (linked ? "" : " nolink")}
                  onClick={() => linked && p && onProject(p.id)}>
                  <div className="tc-top">
                    <span className={"kind " + (b.kind === "meeting" ? "meeting" : b.kind === "focus" ? "focus" : "")}>{b.kind}</span>
                    {b.who && <span style={{ fontSize: 12.5, color: "var(--ink-4)", fontWeight: 500 }}>with {b.who}</span>}
                    {p && <span className="tproj"><span className="pd" />{p.name}</span>}
                  </div>
                  <div className="ttitle">{b.title}</div>
                  <div className="twalk">
                    <span className="wlabel">{linked ? "Walk in with" : "COS"}</span>
                    {b.walkIn}
                  </div>
                  {linked && p && (
                    <div className="tenter">Enter {p.name} <Icon.arrow /></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="spacer-m" />
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
