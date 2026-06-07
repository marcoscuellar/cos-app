import type { VercelRequest, VercelResponse } from "@vercel/node";

// Server-side login check. The test account's password and 48h expiry window are
// enforced here (never in the client bundle). The first-use timestamp lives in
// Vercel KV via the REST API. Demo (non-test) emails keep the open behavior.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const TEST_EMAIL = "test@costhread.app";
// Override in the Vercel env if you want; defaults to the provisioned password.
const TEST_PASSWORD = process.env.TEST_LOGIN_PASSWORD || "costhread2026";
const WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
const FIRST_USE_KEY = "login:test@costhread.app:first-use";

async function kvCommand(command: (string | number)[]): Promise<unknown> {
  const r = await fetch(KV_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`KV request failed: ${r.status}`);
  const data = (await r.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result ?? null;
}

function normEmail(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Read-only status probe — used to re-validate a restored test session on load.
  // Never records a first-use timestamp.
  if (req.method === "GET") {
    const email = normEmail(req.query.email);
    if (email !== TEST_EMAIL) return res.status(200).json({ ok: true, expired: false });
    if (!KV_URL || !KV_TOKEN) return res.status(503).json({ error: "Storage not configured." });
    try {
      const stored = await kvCommand(["GET", FIRST_USE_KEY]);
      const firstUse = stored != null ? Number(stored) : null;
      const expired = firstUse != null && Date.now() >= firstUse + WINDOW_MS;
      return res.status(200).json({ ok: !expired, expired, expiresAt: firstUse ? firstUse + WINDOW_MS : null });
    } catch {
      return res.status(502).json({ error: "Storage unavailable." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email: rawEmail, password } = (req.body ?? {}) as { email?: string; password?: string };
  const email = normEmail(rawEmail);
  if (!email) return res.status(400).json({ ok: false, error: "Enter your email." });

  // Non-test accounts keep the existing open demo behavior.
  if (email !== TEST_EMAIL) {
    return res.status(200).json({ ok: true, email });
  }

  // Test account: require the password, then enforce the 48h window.
  if (password !== TEST_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Incorrect email or password." });
  }
  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({ ok: false, error: "Login is temporarily unavailable." });
  }
  try {
    const now = Date.now();
    // Record first use exactly once (NX = set only if absent), then read back the
    // canonical value so concurrent first logins agree on the same start time.
    await kvCommand(["SET", FIRST_USE_KEY, String(now), "NX"]);
    const stored = await kvCommand(["GET", FIRST_USE_KEY]);
    const firstUse = Number(stored) || now;
    const expiresAt = firstUse + WINDOW_MS;

    if (now >= expiresAt) {
      return res.status(403).json({
        ok: false,
        expired: true,
        error: "This test login has expired — it was valid for 48 hours after first use.",
      });
    }
    return res.status(200).json({ ok: true, email: TEST_EMAIL, expiresAt });
  } catch {
    return res.status(502).json({ ok: false, error: "Login is temporarily unavailable." });
  }
}
