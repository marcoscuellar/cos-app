import { useState } from "react";
import { COS_DATA } from "../data";
import { foyerStamp } from "../brief";

type Axis = "all" | "projects" | "people" | "knowledge" | "decisions";

interface SearchProps {
  onProject: (id: string) => void;
  initialQuery: string;
}

export function SearchScreen({ onProject, initialQuery }: SearchProps) {
  const D = COS_DATA;
  const [q, setQ] = useState(initialQuery || "");
  const [axis, setAxis] = useState<Axis>("all");
  const ql = q.trim().toLowerCase();
  const match = (s: string) => !ql || s.toLowerCase().includes(ql);

  const projHits = D.projects.filter((p) => match(p.name) || match(p.why) || match(p.focus));
  const peopleHits = D.searchPeople.filter((p) => match(p.n) || match(p.r) || match(p.proj));
  const knowHits = D.searchKnowledge.filter((k) => match(k.t) || match(k.d) || match(k.used));
  const decHits = D.searchDecisions.filter((d) => match(d.t) || match(d.used));

  const show = (type: Axis) => axis === "all" || axis === type;
  const total =
    (show("projects") ? projHits.length : 0) +
    (show("people") ? peopleHits.length : 0) +
    (show("knowledge") ? knowHits.length : 0) +
    (show("decisions") ? decHits.length : 0);

  const axisOptions: [Axis, string][] = [
    ["all", "Everything"],
    ["projects", "Projects"],
    ["people", "People"],
    ["knowledge", "Knowledge"],
    ["decisions", "Decisions"],
  ];

  return (
    <div className="wrap room-arch">
      <div className="fade-in">
        {/* same calm header as the foyer — a motivational tag + the live stamp */}
        <div className="foyer">
          <div className="foyer-mark"><span className="mono-meta">We got you</span></div>
          <span className="mono-meta q">{foyerStamp()}</span>
        </div>

        {/* black banner — same shape as the foyer's doorway */}
        <div className="doorway room-door ac-violet">
          <div className="dw-body">
            <div className="dw-left">
              <div className="dw-rule" />
              <span className="chip">Recall</span>
              <div className="dw-name">Memory.</div>
            </div>
            <div className="dw-quotewrap">
              <div className="dw-quote">“The palest ink is better than the best memory.”</div>
              <div className="dw-cite">— Chinese proverb</div>
            </div>
          </div>
          <div className="dw-foot">
            <span className="dw-mono">Nothing is lost. COS remembers, so you don't have to.</span>
          </div>
        </div>

        <div className="search-big">
          {/* search icon inline — matches .search-big svg styling */}
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="my GLVE stuff, a person, a decision…" />
        </div>
        <div className="axes">
          {axisOptions.map(([k, l]) => (
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
              {([["By meaning", "“my GLVE stuff”"], ["By time", "“what did I do last week?”"], ["By person", "“what’s up with this client?”"]] as [string, string][]).map(([t, d]) => (
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
