import type { Accent, DocRef } from "../types";
import { Icon } from "../components/Icon";

// Maps a doc kind to where the original actually lives.
const DOC_SOURCE: Record<string, string> = {
  Draft: "Google Docs", Doc: "Google Docs", Spec: "Google Docs", List: "Apple Notes",
  Decision: "COS · Decisions", Wireframe: "Figma", Note: "Apple Notes", Idea: "COS · Ideas",
  Rubric: "Google Sheets", Research: "Saved research",
};

interface DocViewerProps {
  doc: DocRef;
  accent: Accent;
  onClose: () => void;
}

export function DocViewer({ doc, accent, onClose }: DocViewerProps) {
  const src = doc.source || DOC_SOURCE[doc.kind] || "your tools";
  return (
    <div className="bs-overlay" onClick={onClose}>
      <div className={"bs-drawer ac-" + accent} onClick={(e) => e.stopPropagation()}>
        <div className="bs-head">
          <div>
            <div className="bs-eye"><span className="d" />{doc.kind}</div>
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
