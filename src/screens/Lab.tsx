import { useEffect, useState } from "react";
import { Scaffold, Header, ArrowR, headerDate } from "../components/CosScaffold";
import { Icon } from "../components/Icon";
import type { EngineDef, EngineRun } from "../types";
import { ENGINES, getEngineDef, assemblePrompt } from "../engines";
import { loadRuns, loadAllRuns, runEngine, patchRun } from "../enginesApi";
import { renderMarkdown } from "../lib/markdown";
import { runToMarkdown, runFilename, copyText, downloadFile } from "../lib/exportRun";

/* THE ENGINE ROOM — your sales-intelligence pipeline. Pick an engine, give it
   inputs, it researches live and returns a structured report. Every run is
   saved to Redis; the Saved Runs tab is the cross-engine library + export. */
export function LabScreen({ onNav }: { onNav: (route: string) => void }) {
  const [tab, setTab] = useState<"engines" | "saved">("engines");
  const [activeId, setActiveId] = useState<string | null>(null);
  const def = activeId ? getEngineDef(activeId) : null;

  if (def) return <EngineRunner def={def} onBack={() => setActiveId(null)} />;

  return (
    <Scaffold active="flask" onNav={onNav}>
      <Header
        eyebrow="GO DEEPER"
        date={headerDate()}
        label="RESEARCH"
        title="Research."
        quote="The best way to predict the future is to invent it."
        author="ALAN KAY"
        sub={`${ENGINES.length} ENGINES · EVERY RUN SAVED`}
      />
      <div className="ctx-tabs lab-tabs">
        <button className={"tab" + (tab === "engines" ? " is-on" : "")} onClick={() => setTab("engines")}>Engines</button>
        <button className={"tab" + (tab === "saved" ? " is-on" : "")} onClick={() => setTab("saved")}>Saved runs</button>
      </div>
      {tab === "engines" ? (
        <div className="pj-grid">
          {ENGINES.map((e) => (
            <button key={e.id} className="card" onClick={() => setActiveId(e.id)}>
              <div className="card-top">
                <span className="card-num">{String(e.num).padStart(2, "0")}</span>
                <span className="badge st-motion"><i className="bdot" />ENGINE</span>
              </div>
              <div className="idea-name">{e.name}</div>
              <div className="eng-line">{e.tagline}</div>
              <div className="eng-stage-row">
                {e.stages.map((s, i) => (
                  <span key={s} className="eng-stage-chip">{s}{i < e.stages.length - 1 && <i className="eng-arrow">→</i>}</span>
                ))}
              </div>
              <div className="card-foot">
                <span className="foot-time">{e.stages.length} STAGES</span>
                <span className="open">Open engine <ArrowR s={15} /></span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <SavedRunsView />
      )}
    </Scaffold>
  );
}

// ── Saved Runs — every run across all engines, filterable + searchable ──
function SavedRunsView() {
  const [runs, setRuns] = useState<EngineRun[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    loadAllRuns().then(setRuns);
  }, []);

  // Optimistic local update after a notes/star edit (runs span many engines).
  const apply = (id: string, patch: Partial<EngineRun>) =>
    setRuns((rs) => (rs ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const onStar = async (r: EngineRun) => {
    apply(r.id, { starred: !r.starred });
    await patchRun(r.engineId, r.id, { starred: !r.starred });
  };
  const onNotes = async (r: EngineRun, notes: string) => {
    if (notes === (r.notes ?? "")) return;
    apply(r.id, { notes });
    await patchRun(r.engineId, r.id, { notes });
  };

  if (runs === null) return <div className="eng-empty">Loading your runs…</div>;

  const needle = q.trim().toLowerCase();
  const filtered = runs.filter((r) => {
    if (filter !== "all" && r.engineId !== filter) return false;
    if (!needle) return true;
    return (
      Object.values(r.inputs).join(" ").toLowerCase().includes(needle) ||
      (r.output || "").toLowerCase().includes(needle) ||
      (r.notes || "").toLowerCase().includes(needle)
    );
  });

  return (
    <div className="fade-in">
      <div className="runs-toolbar">
        <select className="runs-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All engines ({runs.length})</option>
          {ENGINES.map((e) => {
            const n = runs.filter((r) => r.engineId === e.id).length;
            return <option key={e.id} value={e.id} disabled={n === 0}>{String(e.num).padStart(2, "0")} · {e.name} ({n})</option>;
          })}
        </select>
        <div className="runs-search">
          <Icon.search style={{ width: 15, height: 15 }} />
          <input placeholder="Search inputs, output, notes…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="eng-empty">{runs.length === 0 ? "No runs yet — run an engine and it'll show up here." : "No runs match."}</div>
      ) : (
        filtered.map((r) => (
          <RunCard key={r.id} run={r} def={getEngineDef(r.engineId)} showEngine open={openId === r.id}
            onToggle={() => setOpenId(openId === r.id ? null : r.id)}
            onStar={() => onStar(r)} onNotes={(n) => onNotes(r, n)} />
        ))
      )}
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
    setRuns((rs) => rs.map((x) => (x.id === r.id ? { ...x, starred: !x.starred } : x)));
    await patchRun(def.id, r.id, { starred: !r.starred });
  };
  const saveNotes = async (r: EngineRun, notes: string) => {
    if (notes === (r.notes ?? "")) return;
    setRuns((rs) => rs.map((x) => (x.id === r.id ? { ...x, notes } : x)));
    await patchRun(def.id, r.id, { notes });
  };

  return (
    <div className={"wrap ac-" + def.accent}>
      <div className="fade-in">
        <button className="eng-back" onClick={onBack}>
          <Icon.arrow style={{ transform: "rotate(180deg)", width: 14, height: 14 }} /> All engines
        </button>

        <div className="eng-head">
          <span className="gold-rule" />
          <span className="eng-head-num">ENGINE {String(def.num).padStart(2, "0")}</span>
          <h1 className="disp" style={{ margin: "8px 0 8px", color: "var(--ac)" }}>{def.name}</h1>
          <p className="dim" style={{ fontSize: 16, maxWidth: "52ch" }}>{def.tagline}</p>
          <div className="eng-stages on-head">
            {def.stages.map((s, i) => (
              <span key={s} className="eng-stage">{s}{i < def.stages.length - 1 && <i className="eng-arrow">→</i>}</span>
            ))}
          </div>
        </div>

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

function RunCard({ run, def, open, showEngine, onToggle, onStar, onNotes }: {
  run: EngineRun; def?: EngineDef; open: boolean; showEngine?: boolean;
  onToggle: () => void; onStar: () => void; onNotes: (n: string) => void;
}) {
  const [notes, setNotes] = useState(run.notes ?? "");
  const [copied, setCopied] = useState(false);
  const when = new Date(run.createdAt).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const summary = Object.values(run.inputs).join(" · ").slice(0, 90) || "—";
  const engineLabel = def ? `${String(def.num).padStart(2, "0")} · ${def.name}` : run.engineId;

  const copy = async () => {
    if (await copyText(runToMarkdown(run, def))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className={"card run-card" + (run.starred ? " starred" : "")}>
      <div className="run-top" onClick={onToggle}>
        <button className={"run-star" + (run.starred ? " on" : "")}
          onClick={(e) => { e.stopPropagation(); onStar(); }} title={run.starred ? "Best result" : "Mark best"}>
          {run.starred ? "★" : "☆"}
        </button>
        <div className="run-meta">
          <div className="run-when">
            {showEngine && <span className="run-engine">{engineLabel}</span>}
            {when}
            {run.starred && <span className="run-best">Best</span>}
            {run.draft && <span className="run-draft">Draft</span>}
          </div>
          <div className="run-sum">{summary}</div>
        </div>
        <div className="run-model">{run.model.replace("claude-", "")}</div>
        <Icon.chevron className="run-chev" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </div>

      {open && (
        <div className="run-body">
          <div className="run-vmeta">
            Engine v{run.version} · {run.model.replace("claude-", "")}{run.draft ? " · draft (no web search)" : ""}
          </div>

          <div className="run-export">
            <button onClick={copy}>{copied ? "Copied ✓" : "Copy Markdown"}</button>
            <button onClick={() => downloadFile(runFilename(run, def, "md"), runToMarkdown(run, def), "text/markdown")}>Download .md</button>
            <button onClick={() => downloadFile(runFilename(run, def, "json"), JSON.stringify(run, null, 2), "application/json")}>Download .json</button>
          </div>

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
            {def
              ? def.inputs.map((f) => run.inputs[f.key] && (
                  <div key={f.key} className="run-input-row"><b>{f.label.replace(/\s*\(optional\)/i, "")}:</b> {run.inputs[f.key]}</div>
                ))
              : Object.entries(run.inputs).map(([k, v]) => (
                  <div key={k} className="run-input-row"><b>{k}:</b> {v}</div>
                ))}
          </details>
        </div>
      )}
    </div>
  );
}
