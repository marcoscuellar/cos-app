import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// COS redesign — shared scaffolding (Rail · Header · Scaffold) used by every
// redesigned page except Calendar. Source of truth: COS Page Concepts.html
// <style> + cos-pages.jsx (Rail / Header / Scaffold). Styles live in index.css
// under the `.pg` namespace so they never collide with the legacy app skin.
// ─────────────────────────────────────────────────────────────────────────────

const P = {
  chevron: "M9 6l6 6-6 6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  home: "M4 11l8-7 8 7M6 10v9h12v-9",
  cal: "M4 6h16v15H4zM4 9h16M8 3v4M16 3v4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6L4.5 4.5M19.5 19.5L18 18M6 18l-1.5 1.5M19.5 4.5L18 6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
};

export const Ico = ({ d, s = 21, sw = 1.6 }: { d: string; s?: number; sw?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
export const ArrowR = ({ s = 18, sw = 2 }: { s?: number; sw?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Mic = ({ s = 19 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);

// Rail icon → app route. Interim mapping during the page-by-page redesign:
// sun/cal both land on the existing day planner ("today") until Calendar (04)
// and the gentle Today (05) are split out.
const RAIL: { key: string; d: string; route: string }[] = [
  { key: "sun", d: P.sun, route: "summary" },
  { key: "home", d: P.home, route: "home" },
  { key: "cal", d: P.cal, route: "today" },
  { key: "grid", d: P.grid, route: "projects" },
  { key: "bulb", d: P.bulb, route: "ideas" },
  { key: "flask", d: P.flask, route: "lab" },
];

export function Rail({ active, onNav, initial = "M" }: { active: string; onNav: (r: string) => void; initial?: string }) {
  return (
    <div className="rail">
      <button className="rail-mark" onClick={() => onNav("home")}>COS</button>
      <button className="rail-chev"><Ico d={P.chevron} s={16} sw={2.2} /></button>
      <button className="rail-search" onClick={() => onNav("search")} aria-label="Search"><Ico d={P.search} s={17} /></button>
      <div className="rail-group">
        {RAIL.map((it) => (
          <button key={it.key} className={"rail-i" + (active === it.key ? " is-active" : "")}
            onClick={() => onNav(it.route)} aria-label={it.key}>
            <Ico d={it.d} />
          </button>
        ))}
      </div>
      <div className="rail-spacer" />
      <button className="rail-av">{initial}</button>
    </div>
  );
}

export function Header({ eyebrow, date, label, title, quote, author, sub }: {
  eyebrow: string; date: string; label: string; title: string;
  quote?: string; author?: string; sub?: string;
}) {
  return (
    <div className="hd">
      <div className="hd-top">
        <span className="hd-eyebrow">{eyebrow}</span>
        <span className="hd-date">{date}</span>
      </div>
      <div className="hd-rule" />
      <div className="hd-body">
        {quote && (
          <div className="hd-quote">
            <p>“{quote}”</p>
            <span className="hd-author">— {author}</span>
          </div>
        )}
        <span className="hd-tick" />
        <span className="hd-label">{label}</span>
        <h1 className="hd-title">{title}</h1>
        <div className="hd-rule hd-rule-b" />
        {sub && <p className="hd-sub">{sub}</p>}
      </div>
    </div>
  );
}

export function Scaffold({ active, onNav, dark, initial, children }: {
  active: string; onNav: (r: string) => void; dark?: boolean; initial?: string; children: ReactNode;
}) {
  return (
    <div className={"pg " + (dark ? "pg-dark" : "pg-light")}>
      <Rail active={active} onNav={onNav} initial={initial} />
      <div className="pg-main">{children}</div>
    </div>
  );
}

// Live header date — "SUNDAY, JUNE 14 · 5:28 PM" in the home timezone.
export function headerDate(d: Date = new Date()): string {
  const TZ = "America/Chicago";
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(d);
  const t = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d);
  return `${day} · ${t}`.toUpperCase();
}
