import { useState } from "react";
import { Scaffold, Header, ArrowR, headerDate } from "../components/CosScaffold";
import { COS_DATA } from "../data";

// ─────────────────────────────────────────────────────────────────────────────
// Today (redesign · page 05) — the gentle ease-in summary. The "deep breath"
// version of the day: 3 things, nothing urgent. Distinct from the Calendar grid.
// Source: TodayPage.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = [
  { when: "LATE MORNING", task: "Reply to Maya about the deck", hint: "2 min — she just needs a yes/no" },
  { when: "AFTERNOON", task: "20 minutes on GLVE pricing", hint: "pick up where you left off" },
  { when: "WHENEVER", task: "Call mom — her birthday's Thursday", hint: "she'd love to hear your voice" },
];

interface Props {
  onNav: (route: string) => void;
}

export function TodaySummary({ onNav }: Props) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [lighter, setLighter] = useState(false);
  const visible = lighter ? ITEMS.slice(0, 2) : ITEMS;
  const initial = (COS_DATA.user.greetingName || "M")[0];

  return (
    <Scaffold active="sun" onNav={onNav} initial={initial}>
      <Header
        eyebrow="EASE IN"
        date={headerDate()}
        label="TODAY"
        title="Today."
        quote="You don't have to do it all. Just the next true thing."
        author="Ollin"
        sub="THREE THINGS · NOTHING URGENT"
      />
      <div className="td-line"><span className="cos-serif">Here's a lighter version of today.</span></div>
      <div className="td-list">
        {visible.map((it, i) => (
          <div className="td-item" key={i}>
            <button
              className={"td-check" + (done[i] ? " is-done" : "")}
              onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
              aria-label="Mark done"
            />
            <div className="td-body">
              <span className="td-when">{it.when}</span>
              <span className="td-task" style={done[i] ? { textDecoration: "line-through", color: "var(--faint)" } : undefined}>{it.task}</span>
              <span className="td-hint">{it.hint}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="td-foot">
        <button className="td-soft" onClick={() => setLighter((l) => !l)}>
          {lighter ? "Show the full three" : "Feels like too much? Make it lighter"} <ArrowR s={15} />
        </button>
        <span className="td-more">{lighter ? "1 tucked away" : "2 more, tucked away"}</span>
      </div>
    </Scaffold>
  );
}
