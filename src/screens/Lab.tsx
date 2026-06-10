import { useEffect, useState } from "react";
import { Eyebrow } from "../components/shared";
import { Icon } from "../components/Icon";
import type { EngineDef, EngineRun } from "../types";
import { ENGINES, getEngineDef, assemblePrompt } from "../engines";
import { loadRuns, runEngine, patchRun } from "../enginesApi";
import { renderMarkdown } from "../lib/markdown";

/* THE ENGINE ROOM — your sales-intelligence pipeline. Each engine is a
   repeatable workflow: pick it, give it inputs, it researches live and returns
   a structured report. Every run is saved. */
export function LabScreen() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const def = activeId ? getEngineDef(activeId) : null;

  if (def) return <EngineRunner def={def} onBack={() => setActiveId(null)} />;

  return (
    <div className="wrap">
      <div className="stagger">
        <Eyebrow accent="indigo">Engine room</Eyebrow>
        <h1 className="disp" style={{ margin: "16px 0 8px" }}>
          Your <span className="em ac-indigo">engines.</span>
        </h1>
        <p className="dim" style={{ fontSize: 16, maxWidth: "58ch", marginBottom: 36 }}>
          Repeatable operating systems that turn a messy input into useful work. Pick an engine, give it
          what it needs, and it researches live and reports back. Every run is saved.
        </p>

        <div className="grid-3">
          {ENGINES.map((e) => (
            <button key={e.id} className={"card engine-card ac-" + e.accent} onClick={() => setActiveId(e.id)}>
              <div className="eng-num">{String(e.num).padStart(2, "0")}</div>
              <div className="eng-name">{e.name}</div>
              <div className="eng-tag">{e.tagline}</div>
              <div className="eng-stages">
                {e.stages.map((s, i) => (
                  <span key={s} className="eng-stage">{s}{i < e.stages.length - 1 && <i className="eng-arrow">→</i>}</span>
                ))}
              </div>
              <div className="eng-open">Open engine <Icon.arrow style={{ width: 13, height: 13 }} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EngineRunner({ def, onBack }: { def: EngineDef; onBack: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [draft, setDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<EngineRun[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadRuns(def.id).then((rs) => {
      setRuns(rs);
      if (rs[0]) setOpenId(rs[0].id);
      setLoaded(true);
    });
  }, [def.id]);

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const run = async () => {
    const missing = def.inputs.find((f) => f.required && !(values[f.key] ?? "").trim());
    if (missing) {
      setError(`${missing.label.replace(/\s*\(optional\)/i, "")} is required.`);
      return;
    }
    const prompt = assemblePrompt(def, values);
    setRunning(true);
    setError(null);
    const { run: newRun, runs: nextRuns, error: err } = await runEngine(def.id, values, prompt, draft);
    setRunning(false);
    if (newRun) {
      setRuns(nextRuns ?? [newRun, ...runs]);
      setOpenId(newRun.id);
    } else {
      setError(err || "The engine hit a snag — try again.");
    }
  };

  const toggleStar = async (r: EngineRun) => {
    const next = await patchRun(def.id, r.id, { starred: !r.starred });
    if (next.length) setRuns(next);
  };
  const saveNotes = async (r: EngineRun, notes: string) => {
    if (notes === (r.notes ?? "")) return;
    const next = await patchRun(def.id, r.id, { notes });
    if (next.length) setRuns(next);
  };

  return (
    <div className={"wrap ac-" + def.accent}>
      <div className="fade-in">
        <button className="eng-back" onClick={onBack}>
          <Icon.arrow style={{ transform: "rotate(180deg)", width: 14, height: 14 }} /> All engines
        </button>

        <div className="eng-head">
          <span className="eng-head-num">ENGINE {String(def.num).padStart(2, "0")}</span>
          <h1 className="disp" style={{ margin: "8px 0 8px", color: "var(--ac)" }}>{def.name}</h1>
          <p className="dim" style={{ fontSize: 16, maxWidth: "52ch" }}>{def.tagline}</p>
          <div className="eng-stages on-head">
            {def.stages.map((s, i) => (
              <span key={s} className="eng-stage">{s}{i < def.stages.length - 1 && <i className="eng-arrow">→</i>}</span>
            ))}
          </div>
        </div>

        {/* INTAKE */}
        <div className="card eng-intake">
          <div className="card-eyebrow">Run the engine</div>
          {def.inputs.map((f) => (
            <div key={f.key} className="eng-field">
              <label>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea className="notes-input" rows={3} value={values[f.key] ?? ""}
                  placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} disabled={running} />
              ) : (
                <input className="eng-input" value={values[f.key] ?? ""} placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value)} disabled={running} />
              )}
            </div>
          ))}
          {error && <div className="notes-failed" style={{ marginTop: 4 }}>{error}</div>}
          <div className="eng-run-row">
            <button className="btn btn-solid" onClick={run} disabled={running}>
              {running ? "Running…" : draft ? "Run draft" : "Run engine"} <Icon.spark style={{ width: 15, height: 15 }} />
            </button>
            <label className="eng-draft">
              <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} disabled={running} />
              Fast draft — skip web search
            </label>
          </div>
          {!running && (
            <div className="eng-run-note">
              {draft
                ? "Draft mode: no web search — fast & cheap, from the model's own knowledge. Good for tuning the engine."
                : "Researches live on the web and cites sources — a run can take a minute."}
            </div>
          )}
          {running && (
            <div className="eng-working">
              <span className="spin" />
              {draft ? "Drafting from the model's knowledge…" : "Searching the web, verifying sources, writing the report… hang tight."}
            </div>
          )}
        </div>

        {/* RUNS */}
        {loaded && runs.length === 0 && !running && (
          <div className="eng-empty">No runs yet. Give the engine an input above and run it.</div>
        )}
        {runs.map((r) => (
          <RunCard key={r.id} run={r} def={def} open={openId === r.id}
            onToggle={() => setOpenId(openId === r.id ? null : r.id)}
            onStar={() => toggleStar(r)} onNotes={(n) => saveNotes(r, n)} />
        ))}
      </div>
    </div>
  );
}

function RunCard({ run, def, open, onToggle, onStar, onNotes }: {
  run: EngineRun; def: EngineDef; open: boolean;
  onToggle: () => void; onStar: () => void; onNotes: (n: string) => void;
}) {
  const [notes, setNotes] = useState(run.notes ?? "");
  const when = new Date(run.createdAt).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const summary = Object.values(run.inputs).join(" · ").slice(0, 90) || "—";

  return (
    <div className={"card run-card" + (run.starred ? " starred" : "")}>
      <div className="run-top" onClick={onToggle}>
        <button className={"run-star" + (run.starred ? " on" : "")}
          onClick={(e) => { e.stopPropagation(); onStar(); }} title={run.starred ? "Best result" : "Mark best"}>
          {run.starred ? "★" : "☆"}
        </button>
        <div className="run-meta">
          <div className="run-when">{when}{run.starred && <span className="run-best">Best</span>}{run.draft && <span className="run-draft">Draft</span>}</div>
          <div className="run-sum">{summary}</div>
        </div>
        <div className="run-model">{run.model.replace("claude-", "")}</div>
        <Icon.chevron className="run-chev" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </div>

      {open && (
        <div className="run-body">
          <div className="run-report" dangerouslySetInnerHTML={{ __html: renderMarkdown(run.output) }} />

          {run.sources.length > 0 && (
            <div className="run-sources">
              <div className="card-eyebrow" style={{ margin: "0 0 8px" }}>Sources · {run.sources.length}</div>
              {run.sources.map((s, i) => (
                <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="run-source">{s}</a>
              ))}
            </div>
          )}

          <div className="run-notes">
            <label>Your notes after this run</label>
            <textarea className="notes-input" rows={2} value={notes}
              placeholder="What worked, what to change next time…"
              onChange={(e) => setNotes(e.target.value)} onBlur={() => onNotes(notes)} />
          </div>

          <details className="run-inputs">
            <summary>Inputs used</summary>
            {def.inputs.map((f) => run.inputs[f.key] && (
              <div key={f.key} className="run-input-row"><b>{f.label.replace(/\s*\(optional\)/i, "")}:</b> {run.inputs[f.key]}</div>
            ))}
          </details>
        </div>
      )}
    </div>
  );
}
