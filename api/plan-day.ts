import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kvConfigured, kvGet, kvSet } from "../lib/server/kv.js";
import { getProvider, providerConfigured, ProviderError } from "../lib/server/ai/provider.js";

// ─────────────────────────────────────────────────────────────────────────────
// Brain-dump → smart calendar.
//
// You dump your day messy; Claude turns it into a realistic, GENTLE schedule —
// built for severe ADHD: focused sprints, real breaks, transition buffers, and
// it defers overflow instead of cramming. The plan is saved per day in KV.
//
// SCALING SEAM: namespaced under a single OWNER (one private user). Swap for the
// authed user id when multi-user auth returns — the key shape already carries it.
// ─────────────────────────────────────────────────────────────────────────────

const OWNER = "me";
const PACING = new Set(["breathing-room", "tight", "deep-work"]);

interface PlannedBlock {
  start: string;
  end: string;
  title: string;
  kind: string;
  proj: string | null;
  walkIn?: string;
}
interface DayPlan {
  dump: string;
  blocks: PlannedBlock[];
  deferred: string[];
  intention?: string;
  note?: string;
  createdAt: number;
}

function dateKey(): string {
  // YYYY-MM-DD in the user's home timezone, so "today" is correct everywhere.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}
const planKey = () => `plan:${OWNER}:${dateKey()}`;

function buildPrompt(
  dump: string,
  rooms: { id: string; name: string }[],
  hours: string,
  pacing: string,
): { system: string; user: string } {
  const roomList = rooms.length
    ? rooms.map((r) => `- ${r.id} ("${r.name}")`).join("\n")
    : "(no rooms defined)";

  const pacingLine =
    pacing === "tight"
      ? "Pack blocks fairly tightly, but never fully wall-to-wall."
      : pacing === "deep-work"
        ? "Favor fewer, longer deep-work blocks; minimize context-switching."
        : "Leave generous breathing room — short blocks, frequent breaks, lots of white space.";

  const system = [
    "You are COS, a calm day-planner for someone with SEVERE ADHD.",
    "Turn their messy brain-dump into a realistic, forgiving schedule for TODAY.",
    "",
    "Non-negotiable rules:",
    "- This person has severe ADHD. Do NOT overschedule. A half-full day they can actually follow beats a perfect day they can't.",
    "- Break work into focused sprints (25–90 min). Put a real break (10–25 min) after demanding blocks, and a short transition buffer between different kinds of tasks.",
    "- Respect any explicit fixed time (\"before noon\", \"3pm\", \"after lunch\"). Anchor those first, then arrange the flexible items around them.",
    "- Prioritize. If there is more than fits comfortably, schedule what matters most and put the rest in `deferred` — do NOT cram everything in.",
    "- Protect basics: if implied, include meals and a little downtime.",
    `- ${pacingLine}`,
    `- Schedule within roughly these hours: ${hours}. You don't need to fill them.`,
    "- Tie a block to a room id ONLY when it clearly relates; otherwise proj = null.",
    "- Titles short and concrete. `walkIn` is an optional ≤8-word gentle cue to start the block.",
    "- `kind` is one of: ritual, focus, meeting, break, admin, errand, meal.",
    "- `intention` is the ONE directive line for the day, in the user's own voice — short, punchy, specific to their dump (≤14 words). Example: \"Protect the GLVE morning. Everything else can wait.\" Name what matters most; make it motivating, not generic.",
    "- `note` is ONE warm, encouraging sentence about the day (no lists).",
    "",
    "Rooms you may tie blocks to (use the id):",
    roomList,
    "",
    "Respond with ONLY valid JSON, no prose, no code fences, in exactly this shape:",
    '{"intention":"...","blocks":[{"start":"7:00 AM","end":"7:45 AM","title":"...","kind":"focus","proj":"glve","walkIn":"..."}],"deferred":["..."],"note":"..."}',
  ].join("\n");

  const user = `Here is my brain-dump for today:\n\n${dump}`;
  return { system, user };
}

function parsePlanJSON(text: string): { blocks?: unknown; deferred?: unknown; intention?: unknown; note?: unknown } {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t) as { blocks?: unknown; deferred?: unknown; intention?: unknown; note?: unknown };
}

function normalize(
  parsed: { blocks?: unknown; deferred?: unknown; intention?: unknown; note?: unknown },
  roomIds: Set<string>,
): { blocks: PlannedBlock[]; deferred: string[]; intention?: string; note?: string } {
  const rawBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  const blocks: PlannedBlock[] = rawBlocks
    .slice(0, 40)
    .map((b): PlannedBlock => {
      const o = (b ?? {}) as Record<string, unknown>;
      const proj = typeof o.proj === "string" && roomIds.has(o.proj) ? o.proj : null;
      const walkIn = typeof o.walkIn === "string" && o.walkIn.trim() ? o.walkIn.trim().slice(0, 140) : undefined;
      return {
        start: String(o.start ?? "").slice(0, 12),
        end: String(o.end ?? "").slice(0, 12),
        title: String(o.title ?? "").slice(0, 140),
        kind: String(o.kind ?? "focus").toLowerCase().slice(0, 16),
        proj,
        walkIn,
      };
    })
    .filter((b) => b.title && b.start);
  const deferred = Array.isArray(parsed.deferred)
    ? parsed.deferred.slice(0, 25).map((d) => String(d).slice(0, 160)).filter(Boolean)
    : [];
  const note = typeof parsed.note === "string" && parsed.note.trim() ? parsed.note.trim().slice(0, 300) : undefined;
  const intention =
    typeof parsed.intention === "string" && parsed.intention.trim() ? parsed.intention.trim().slice(0, 200) : undefined;
  return { blocks, deferred, intention, note };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!kvConfigured()) return res.status(503).json({ error: "Storage is not configured." });

  try {
    if (req.method === "GET") {
      const plan = await kvGet<DayPlan>(planKey());
      return res.status(200).json({ plan: plan ?? null });
    }

    if (req.method === "DELETE") {
      await kvSet(planKey(), null);
      return res.status(200).json({ plan: null });
    }

    if (req.method === "POST") {
      const body = (req.body ?? {}) as {
        dump?: string;
        rooms?: { id?: unknown; name?: unknown }[];
        hours?: string;
        pacing?: string;
        intention?: string;
      };

      // Edit just the intention on the existing plan — no AI needed.
      if (typeof body.intention === "string" && !body.dump) {
        const existing = await kvGet<DayPlan>(planKey());
        if (!existing) return res.status(404).json({ error: "No plan to update." });
        const updated: DayPlan = { ...existing, intention: body.intention.trim().slice(0, 200) || undefined };
        await kvSet(planKey(), updated);
        return res.status(200).json({ plan: updated });
      }

      if (!providerConfigured()) return res.status(503).json({ error: "AI is not configured." });

      const dump = typeof body.dump === "string" ? body.dump.trim() : "";
      if (!dump) return res.status(400).json({ error: "Empty brain-dump." });
      if (dump.length > 6000) return res.status(413).json({ error: "Brain-dump too long." });

      const rooms = (Array.isArray(body.rooms) ? body.rooms : [])
        .slice(0, 30)
        .map((r) => ({ id: String(r.id ?? ""), name: String(r.name ?? "") }))
        .filter((r) => /^[a-z0-9_-]{1,40}$/.test(r.id));
      const roomIds = new Set(rooms.map((r) => r.id));
      const hours = typeof body.hours === "string" && body.hours.slice(0, 40) ? body.hours.slice(0, 40) : "7:00 AM – 10:00 PM";
      const pacing = typeof body.pacing === "string" && PACING.has(body.pacing) ? body.pacing : "breathing-room";

      const { system, user } = buildPrompt(dump, rooms, hours, pacing);
      const answer = await getProvider().generate({ system, user, maxTokens: 1800 });

      let plan: DayPlan;
      try {
        const { blocks, deferred, intention, note } = normalize(parsePlanJSON(answer), roomIds);
        if (!blocks.length) throw new Error("no blocks");
        plan = { dump, blocks, deferred, intention, note, createdAt: Date.now() };
      } catch {
        return res.status(502).json({ error: "Couldn't build a clean schedule from that — try again." });
      }

      await kvSet(planKey(), plan);
      return res.status(200).json({ plan });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    if (err instanceof ProviderError) return res.status(err.status).json({ error: err.message });
    console.error("api/plan-day failure", err);
    return res.status(502).json({ error: "Storage or AI is unavailable right now." });
  }
}
