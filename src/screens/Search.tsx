import { useState } from "react";
import { COS_DATA } from "../data";
import { Scaffold, Header, headerDate } from "../components/CosScaffold";

// Search (redesign) — memory recall, on the shared Projects main look: editorial
// Header + a search field + results as .pg cards, filterable by axis.
type Axis = "all" | "projects" | "people" | "knowledge" | "decisions";

interface Props {
  onProject: (id: string) => void;
  onNav: (route: string) => void;
  initialQuery: string;
}

function ResultCard({ tag, title, sub, onClick }: { tag: string; title: string; sub?: string; onClick?: () => void }) {
  const inner = (
    <>
      <div className="card-top"><span className="card-num">{tag}</span></div>
      <div className="idea-name" style={{ fontSize: 22, marginTop: 18 }}>{title}</div>
      {sub && <div className="eng-line">{sub}</div>}
    </>
  );
  return onClick
    ? <button className="card" onClick={onClick}>{inner}</button>
    : <div className="card sx-static">{inner}</div>;
}

export function SearchScreen({ onProject, onNav, initialQuery }: Props) {
  const D = COS_DATA;
  const [q, setQ] = useState(initialQuery || "");
  const [axis, setAxis] = useState<Axis>("all");
  const ql = q.trim().toLowerCase();
  const match = (s: string) => !ql || s.toLowerCase().includes(ql);

  const projHits = D.projects.filter((p) => match(p.name) || match(p.why) || match(p.focus));
  const peopleHits = D.searchPeople.filter((p) => match(p.n) || match(p.r) || match(p.proj));
  const knowHits = D.searchKnowledge.filter((k) => match(k.t) || match(k.d) || match(k.used));
  const decHits = D.searchDecisions.filter((d) => match(d.t) || match(d.used));

  const show = (t: Axis) => axis === "all" || axis === t;
  const total =
    (show("projects") ? projHits.length : 0) +
    (show("people") ? peopleHits.length : 0) +
    (show("knowledge") ? knowHits.length : 0) +
    (show("decisions") ? decHits.length : 0);

  const axisOptions: [Axis, string][] = [
    ["all", "Everything"], ["projects", "Projects"], ["people", "People"], ["knowledge", "Knowledge"], ["decisions", "Decisions"],
  ];

  return (
    <Scaffold active="search" onNav={onNav} initial={(D.user.greetingName || "M")[0]}>
      <Header
        eyebrow="RECALL"
        date={headerDate()}
        label="MEMORY"
        title="Search."
        quote="The palest ink is better than the best memory."
        author="CHINESE PROVERB"
        sub="NOTHING IS LOST · COS REMEMBERS SO YOU DON'T HAVE TO"
      />
      <div className="sx-field">
        <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="my GLVE stuff, a person, a decision…" />
      </div>

      {ql && (
        <>
          <div className="sx-axes">
            {axisOptions.map(([k, l]) => (
              <button key={k} className={"sx-axis" + (axis === k ? " on" : "")} onClick={() => setAxis(k)}>{l}</button>
            ))}
          </div>
          <div className="sx-count">{total} result{total !== 1 ? "s" : ""}</div>

          {show("projects") && projHits.length > 0 && (
            <div className="sx-group">
              <div className="sx-gl">Projects <span>{projHits.length}</span></div>
              <div className="pj-grid">
                {projHits.map((p) => <ResultCard key={p.id} tag="PROJECT" title={p.name} sub={p.focus} onClick={() => onProject(p.id)} />)}
              </div>
            </div>
          )}
          {show("people") && peopleHits.length > 0 && (
            <div className="sx-group">
              <div className="sx-gl">People <span>{peopleHits.length}</span></div>
              <div className="pj-grid">
                {peopleHits.map((p, i) => <ResultCard key={i} tag={p.proj.toUpperCase()} title={p.n} sub={p.r} />)}
              </div>
            </div>
          )}
          {show("knowledge") && knowHits.length > 0 && (
            <div className="sx-group">
              <div className="sx-gl">Knowledge <span>{knowHits.length}</span></div>
              <div className="pj-grid">
                {knowHits.map((k, i) => <ResultCard key={i} tag="KNOWLEDGE" title={k.t} sub={k.d} />)}
              </div>
            </div>
          )}
          {show("decisions") && decHits.length > 0 && (
            <div className="sx-group">
              <div className="sx-gl">Decisions <span>{decHits.length}</span></div>
              <div className="pj-grid">
                {decHits.map((d, i) => <ResultCard key={i} tag="DECISION" title={d.t} sub={`Used by · ${d.used}`} />)}
              </div>
            </div>
          )}

          {total === 0 && <div className="sx-empty">Nothing matches “{q}” yet. Try a project name, a person, or a decision.</div>}
        </>
      )}
    </Scaffold>
  );
}
