import type { EngineDef } from "./types";

// The 7 engines, in pipeline order. The server holds each engine's full director
// prompt; this catalog drives the picker and the intake form only.
export const ENGINES: EngineDef[] = [
  {
    id: "orchestrator",
    num: 0,
    name: "Orchestrator",
    tagline: "The conductor — routes a request through the whole system.",
    accent: "indigo",
    stages: ["Route", "Coordinate", "Synthesize"],
    inputs: [
      { key: "request", label: "What do you want to hunt, research, or build?", type: "textarea", required: true,
        placeholder: "e.g. full pipeline on Chicago activewear brands, or 'just run Engine 4 on Acme Corp'" },
    ],
  },
  {
    id: "role-validation",
    num: 1,
    name: "Role Validation",
    tagline: "Validate real, active, legitimate hiring before anything else.",
    accent: "blue",
    stages: ["Discover", "Validate", "Report"],
    inputs: [
      { key: "company", label: "Company / companies", type: "textarea", required: true,
        placeholder: "One company or a list (one per line)" },
      { key: "scope", label: "Target roles / geography (optional)", type: "text",
        placeholder: "defaults: Tech, AI/ML, Security, Marketing, Creative · US" },
    ],
  },
  {
    id: "buying-signals",
    num: 2,
    name: "Buying Signals",
    tagline: "Find verified buying signals worth acting on right now.",
    accent: "violet",
    stages: ["Search", "Categorize", "Verify ×2", "Score"],
    inputs: [
      { key: "target", label: "Company, industry, segment, or geography", type: "textarea", required: true,
        placeholder: "e.g. Chicago retail mid-market, or 3PLs with warehouse automation" },
      { key: "variant", label: "Variant (optional)", type: "text",
        placeholder: "RT apparel · DT logistics · MFG manufacturing · CM-MT martech/AI" },
    ],
  },
  {
    id: "signal-audit",
    num: 3,
    name: "Signal Audit",
    tagline: "Independently re-verify signals before they reach outreach.",
    accent: "amber",
    stages: ["Re-search", "Cross-check", "Timeline", "Recommend"],
    inputs: [
      { key: "signals", label: "Company + the original signal & pillar to audit", type: "textarea", required: true,
        placeholder: "e.g. Acme Corp — Series C funding (Pillar 1), reported 3 weeks ago" },
    ],
  },
  {
    id: "intelligence-hub",
    num: 4,
    name: "Intelligence Hub",
    tagline: "Full 8-pillar operational deep-dive on a company.",
    accent: "teal",
    stages: ["Profile", "8 Pillars", "Nearshore fit"],
    inputs: [
      { key: "company", label: "Company name", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { key: "context", label: "Anything we already know (optional)", type: "textarea",
        placeholder: "signals, roles, contacts — paste anything useful" },
    ],
  },
  {
    id: "outreach",
    num: 5,
    name: "Outreach",
    tagline: "A high-conversion three-touch campaign from the intel.",
    accent: "green",
    stages: ["Contact", "3 touches", "Branch"],
    inputs: [
      { key: "company", label: "Company", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { key: "intel", label: "Intel from Engine 4 (or a summary) + who to reach", type: "textarea", required: true,
        placeholder: "paste the intelligence file or key hooks, and the target contact/title" },
    ],
  },
  {
    id: "seasonal-timing",
    num: 6,
    name: "Seasonal Timing",
    tagline: "What should we hunt right now? Ranked, timely segments.",
    accent: "rose",
    stages: ["Macro scan", "Rank", "Hand-off"],
    inputs: [
      { key: "focus", label: "Geography, industry, or just “what’s hot right now?”", type: "textarea", required: true,
        placeholder: "e.g. Chicago · logistics · or leave it open" },
    ],
  },
];

export function getEngineDef(id: string): EngineDef | undefined {
  return ENGINES.find((e) => e.id === id);
}

/** Assemble the human-readable run prompt the engine receives. */
export function assemblePrompt(def: EngineDef, values: Record<string, string>): string {
  const parts: string[] = [];
  for (const f of def.inputs) {
    const v = (values[f.key] ?? "").trim();
    if (v) parts.push(`${f.label.replace(/\s*\(optional\)/i, "")}:\n${v}`);
  }
  return parts.join("\n\n");
}
