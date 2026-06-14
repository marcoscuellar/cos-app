// COS — Home Briefing engine (a lean port of the prototype's cos-brief.js).
// Date-seeded so the doorway quote is stable within a day but differs day to
// day. No AI dependency; the seeded rotation is the whole story here.
import type { CeoQuote } from "./types";

const TZ = "America/Chicago";

// Day-of-year in the home timezone, so the seed flips at local midnight.
function dayOfYear(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const y = get("year"), m = get("month"), day = get("day");
  const start = Date.UTC(y, 0, 0);
  const today = Date.UTC(y, m - 1, day);
  return Math.floor((today - start) / 86400000);
}

// Stable within a day, different every day.
export function daySeed(d: Date = new Date()): number {
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric" }).format(d),
  );
  return year * 1000 + dayOfYear(d);
}

export function pickQuote(quotes: CeoQuote[], d: Date = new Date()): CeoQuote {
  if (!quotes.length) return { t: "", who: "", role: "" };
  return quotes[daySeed(d) % quotes.length];
}

// "GOOD MORNING" etc., by home-timezone hour.
export function greeting(d: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(d),
  );
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

// Foyer doorway greeting — personalized, by home-timezone hour. The wee hours
// and late night (10pm–5am) ask what's keeping them up; the rest are the
// standard salutations. Returns the full line incl. punctuation (the late one
// is a question), so the caller renders it as-is. Drops the name gracefully
// when it's blank.
export function foyerGreeting(name: string, d: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(d),
  );
  const who = name ? `, ${name}` : "";
  if (hour < 5 || hour >= 22) return `What's got you up late${who}?`;
  if (hour < 12) return `Good morning${who}.`;
  if (hour < 18) return `Good afternoon${who}.`;
  return `Good evening${who}.`;
}

// "MONDAY, JUNE 8 · 3:07 PM" — the blueprint datestamp in the foyer header.
export function foyerStamp(d: Date = new Date()): string {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, weekday: "long", month: "long", day: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour: "numeric", minute: "2-digit",
  }).format(d);
  return (date + " · " + time).toUpperCase();
}
