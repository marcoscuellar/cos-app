import { useState } from "react";
import type { CustomEngine, EngineField, LabAccent } from "../types";
import { assistEngine } from "../enginesApi";
import { slug } from "../projectsApi";

// ─────────────────────────────────────────────────────────────────────────────
// Engine editor — build your own engine. Name it, describe it (and let COS draft
// the director prompt + inputs), or write it by hand. Saved to the account and
// runnable through the same machinery as the built-in engines.
// ─────────────────────────────────────────────────────────────────────────────

const ACCENTS: LabAccent[] = ["indigo", "green", "blue", "violet", "amber", "rose", "teal"];

interface Props {
  engine?: CustomEngine; // undefined = creating new
  onSave: (e: CustomEngine) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function EngineEditor({ engine, onSave, onClose, onDelete }: Props) {
  const isNew = !engine;
  const [name, setName] = useState(engine?.name ?? "");
  const [desc, setDesc] = useState("");
  const [tagline, setTagline] = useState(engine?.tagline ?? "");
  const [accent, setAccent] = useState<LabAccent>(engine?.accent ?? "indigo");
  const [stagesText, setStagesText] = useState((engine?.stages ?? []).join(", "));
  const [inputs, setInputs] = useState<EngineField[]>(
    engine?.inputs ?? [{ key: "input", label: "What should this engine run on?", type: "textarea", required: true, placeholder: "" }],
  );
  const [system, setSystem] = useState(engine?.system ?? "");
  const [drafting, setDrafting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setInput = (i: number, patch: Partial<EngineField>) =>
    setInputs((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const addInput = () => setInputs((prev) => [...prev, { key: "", label: "", type: "text", required: false, placeholder: "" }]);
  const removeInput = (i: number) => setInputs((prev) => prev.filter((_, j) => j !== i));

  const draft = async () => {
    const d = desc.trim();
    if (!d || drafting) return;
    setDrafting(true);
    setErr(null);
    const { draft: dr, error } = await assistEngine(name, d);
    setDrafting(false);
    if (error) return setErr(error);
    if (dr) {
      if (dr.tagline) setTagline(dr.tagline);
      if (dr.stages.length) setStagesText(dr.stages.join(", "));
      if (dr.inputs.length) setInputs(dr.inputs);
      if (dr.system) setSystem(dr.system);
    }
  };

  const save = () => {
    if (!name.trim()) return setErr("Give the engine a name.");
    if (!system.trim()) return setErr("Give the engine its instructions — or use “Draft this engine for me”.");
    const id = engine?.id || slug(name) || `eng-${Date.now().toString(36)}`;
    const stages = stagesText.split(",").map((s) => s.trim()).filter(Boolean);
    const cleanInputs = inputs
      .map((f) => ({ ...f, label: f.label.trim(), key: f.key || slug(f.label) || "input" }))
      .filter((f) => f.label);
    const saved: CustomEngine = {
      id,
      name: name.trim(),
      tagline: tagline.trim() || "A custom engine.",
      accent,
      stages: stages.length ? stages : ["Run"],
      inputs: cleanInputs.length
        ? cleanInputs
        : [{ key: "input", label: "What should this engine run on?", type: "textarea", required: true, placeholder: "" }],
      system: system.trim(),
      version: engine?.version ?? 1,
      createdAt: engine?.createdAt ?? Date.now(),
    };
    onSave(saved);
    onClose();
  };

  return (
    <div className="ed-scrim" onClick={onClose}>
      <div className="ed-panel ed-panel-wide" onClick={(e) => e.stopPropagation()}>
        <div className="ed-head">
          <span className="ed-eyebrow">{isNew ? "NEW ENGINE" : "EDIT ENGINE"}</span>
          <button className="ed-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <label className="ed-k">Name</label>
        <input className="ed-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Competitor Watch" />

        <div className="ed-assist">
          <label className="ed-k">Describe what it should do — Ollin drafts the rest</label>
          <textarea
            className="ed-area"
            rows={2}
            value={desc}
            disabled={drafting}
            placeholder="e.g. Track a competitor's hiring, funding, and product launches, and tell me what it means for us."
            onChange={(e) => setDesc(e.target.value)}
          />
          <button className="ed-think" onClick={draft} disabled={drafting || !desc.trim()}>
            {drafting ? "Drafting the engine…" : "✨ Draft this engine for me"}
          </button>
        </div>

        <label className="ed-k">Tagline</label>
        <input className="ed-input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line on what it does" />

        <label className="ed-k">Accent</label>
        <div className="ed-status ed-accents">
          {ACCENTS.map((a) => (
            <button key={a} className={"ed-acc ac-" + a + (accent === a ? " on" : "")} onClick={() => setAccent(a)} aria-label={a} />
          ))}
        </div>

        <label className="ed-k">Stages (comma-separated)</label>
        <input className="ed-input" value={stagesText} onChange={(e) => setStagesText(e.target.value)} placeholder="Search, Verify, Score" />

        <label className="ed-k">Inputs it asks for</label>
        <div className="ed-rows">
          {inputs.map((f, i) => (
            <div className="ed-row" key={i}>
              <input className="ed-input ed-row-label" value={f.label} placeholder="Field label"
                onChange={(e) => setInput(i, { label: e.target.value })} />
              <select className="ed-row-type" value={f.type} onChange={(e) => setInput(i, { type: e.target.value as "text" | "textarea" })}>
                <option value="text">short</option>
                <option value="textarea">long</option>
              </select>
              <label className="ed-row-req">
                <input type="checkbox" checked={!!f.required} onChange={(e) => setInput(i, { required: e.target.checked })} /> req
              </label>
              <button className="ed-row-x" onClick={() => removeInput(i)} aria-label="Remove field">×</button>
            </div>
          ))}
          <button className="ed-add" onClick={addInput}>+ Add input</button>
        </div>

        <label className="ed-k">Instructions — the engine's brain (director prompt)</label>
        <textarea className="ed-area ed-system" rows={8} value={system} onChange={(e) => setSystem(e.target.value)}
          placeholder="How should this engine think, research, and what exactly should it produce? Use {{DATE}} for today's date." />

        {err && <div className="ed-err">{err}</div>}

        <div className="ed-foot">
          <div className="ed-foot-l">
            {!isNew && onDelete && (
              <button className="ed-del" onClick={() => { onDelete(engine!.id); onClose(); }}>Delete</button>
            )}
          </div>
          <div className="ed-foot-r">
            <button className="ed-cancel" onClick={onClose}>Cancel</button>
            <button className="ed-save" onClick={save}>{isNew ? "Create engine" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
