import { COS_DATA } from "../data";
import { Eyebrow } from "../components/shared";
import { Icon } from "../components/Icon";

/* TODAY — the calendar / day layer over Now */
export function TodayScreen({ onProject }: { onProject: (id: string) => void }) {
  const D = COS_DATA;
  const T = D.today;
  const tied = T.blocks.filter((b) => b.proj).length;
  const projOf = (id: string) => D.projects.find((p) => p.id === id);

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
          <span className="cdot" />
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
