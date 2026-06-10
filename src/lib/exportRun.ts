import type { EngineRun, EngineDef } from "../types";

// Portable copies of a run, outside Redis: a self-contained markdown document,
// or the raw JSON record. Redis stays the source of truth; these are exports.

export function runToMarkdown(run: EngineRun, def?: EngineDef): string {
  const name = def ? `Engine ${String(def.num).padStart(2, "0")} — ${def.name}` : run.engineId;
  const lines: string[] = [
    `# ${name}`,
    "",
    `- **Date:** ${new Date(run.createdAt).toLocaleString()}`,
    `- **Model:** ${run.model}`,
    `- **Version:** v${run.version}${run.draft ? " · Draft (no web search)" : ""}`,
    "",
    "## Inputs",
  ];
  for (const [k, v] of Object.entries(run.inputs)) {
    const label = def?.inputs.find((f) => f.key === k)?.label?.replace(/\s*\(optional\)/i, "") ?? k;
    lines.push(`- **${label}:** ${v}`);
  }
  lines.push("", "## Report", "", run.output);
  if (run.sources.length) {
    lines.push("", "## Sources");
    for (const s of run.sources) lines.push(`- ${s}`);
  }
  if (run.notes) lines.push("", "## Notes", run.notes);
  return lines.join("\n");
}

export function runFilename(run: EngineRun, def: EngineDef | undefined, ext: string): string {
  const base = (def?.name ?? run.engineId).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const d = new Date(run.createdAt);
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  return `${base}-${stamp}.${ext}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
