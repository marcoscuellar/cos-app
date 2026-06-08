import { COS_DATA } from "../data";
import { Eyebrow } from "../components/shared";

const STATUS_LABEL: Record<string, string> = {
  field: "In the field",
  reporting: "Reporting back",
  idle: "Resting",
};
const STATE_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  done: "Done",
};

export function LabScreen() {
  const { lab } = COS_DATA;
  return (
    <div className="wrap">
      <div className="stagger">
        <Eyebrow accent="indigo">Research department</Eyebrow>
        <h1 className="disp" style={{ margin: "16px 0 8px" }}>
          The <span className="em ac-indigo">Lab.</span>
        </h1>
        <p className="dim" style={{ fontSize: 16, maxWidth: "54ch", marginBottom: 40 }}>
          A quiet research department working on your behalf. Agents watch the field, experiments
          test the product, and findings land here like mail on a desk.
        </p>

        {/* AGENTS */}
        <div className="section-head"><span className="lbl">Agents · running against your context</span></div>
        <div className="grid-3" style={{ marginBottom: 56 }}>
          {lab.agents.map((a) => (
            <div key={a.initials} className={"card lab-agent ac-" + a.accent}>
              <div className="ag-head">
                <div className="ag-av">{a.initials}</div>
                <div>
                  <div className="ag-name">{a.name}</div>
                  <span className={"ag-status " + a.status}><span className="d" />{STATUS_LABEL[a.status]}</span>
                </div>
              </div>
              <div className="ag-assign">{a.assignment}</div>
              <div className="ag-finding">
                <span className="fl">Latest finding</span>
                {a.finding}
              </div>
              <div className="ag-last">Reported {a.last}</div>
            </div>
          ))}
        </div>

        {/* EXPERIMENTS */}
        <div className="section-head"><span className="lbl">Experiments · things you're testing</span></div>
        <div className="grid-3" style={{ marginBottom: 56 }}>
          {lab.experiments.map((e) => (
            <div key={e.name} className={"card exp-card ac-" + e.accent}>
              <span className="exp-state">{STATE_LABEL[e.state]}</span>
              <div className="exp-q">{e.q}</div>
              <div className="card-eyebrow" style={{ margin: "0 0 6px" }}>{e.name}</div>
              <div className="exp-note">{e.note}</div>
            </div>
          ))}
        </div>

        {/* KNOWLEDGE BASE */}
        <div className="section-head"><span className="lbl">Knowledge base · a library, not a database</span></div>
        <div className="card" style={{ padding: "8px 24px", marginBottom: 56 }}>
          {lab.shelves.map((s) => (
            <div key={s.name} className={"shelf-row ac-" + s.accent}>
              <span className="shelf-spine" />
              <span className="shelf-name">{s.name}</span>
              <span className="shelf-sample">{s.sample}</span>
              <span className="shelf-count">{s.count}<span>notes</span></span>
            </div>
          ))}
        </div>

        {/* REPORTS */}
        <div className="section-head"><span className="lbl">Reports · generated automatically</span></div>
        <div className="card" style={{ padding: "8px 24px" }}>
          {lab.reports.map((r) => (
            <div key={r.t} className="report-row">
              <div className="report-main">
                <div className="report-kind">{r.kind}</div>
                <div className="report-title">
                  {r.t}
                  {r.fresh && <span className="report-new">New</span>}
                </div>
                <div className="report-d">{r.d}</div>
              </div>
              <div className="report-when">{r.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
