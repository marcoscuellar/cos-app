import { COS_DATA } from "../data";
import { Scaffold, Header, ArrowR, headerDate } from "../components/CosScaffold";

// Ideas (redesign) — the incubator, on the shared Projects main look: editorial
// Header + re-entry cards (Last move / Next move), with a quiet sparks shelf.
const HEAT_PCT: Record<string, number> = { Hot: 85, Warm: 55, Cooling: 25 };

interface Props {
  onIdea: (id: string) => void;
  onNav: (route: string) => void;
}

export function IdeasScreen({ onIdea, onNav }: Props) {
  const D = COS_DATA;
  return (
    <Scaffold active="bulb" onNav={onNav} initial={(D.user.greetingName || "M")[0]}>
      <Header
        eyebrow="DREAM BIGGER"
        date={headerDate()}
        label="IDEAS"
        title="Ideas."
        quote="If at first the idea is not absurd, then there is no hope for it."
        author="ALBERT EINSTEIN"
        sub={`${D.ideas.length} IN THE INCUBATOR · THE REST WAIT AS SPARKS`}
      />
      <div className="pj-grid">
        {D.ideas.map((idea, i) => {
          const cooling = idea.heat === "Cooling";
          return (
            <button className="card" key={idea.id} onClick={() => onIdea(idea.id)}>
              <div className="card-top">
                <span className="card-num">{String(i + 1).padStart(2, "0")}</span>
                <span className={"badge " + (cooling ? "st-dormant" : "st-motion")}><i className="bdot" />{idea.stage.toUpperCase()}</span>
              </div>
              <div className="idea-name">{idea.name}</div>
              <div className="reentry">
                <div className="re-row"><span className="re-k">LAST</span><span className="re-v">{idea.lastMove}</span></div>
                <div className="re-row"><span className="re-k re-k-next">NEXT</span><span className="re-v re-bold">{idea.nextMove}</span></div>
              </div>
              <div className="hairline"><span style={{ width: (HEAT_PCT[idea.heat] ?? 40) + "%" }} /></div>
              <div className="card-foot">
                <span className="foot-time">{idea.lastActivity}</span>
                <span className="open">Open idea <ArrowR s={15} /></span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="sparks">
        <span className="sparks-k">SPARKS · WAITING, UNCAPPED</span>
        <div className="sparks-row">
          {D.sparks.map((s, i) => (
            <span className="spark-pill" key={i}><i className="bdot" style={{ background: "var(--gold-bright)" }} />{s}</span>
          ))}
        </div>
      </div>
    </Scaffold>
  );
}
