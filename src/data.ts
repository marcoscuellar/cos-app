// COS — sample data. Real project names from the brief.
// Ported from the prototype's window.COS_DATA mock; replace with a real
// data model + persistence when wiring up the backend.
import type { COSData } from "./types";

export const COS_DATA: COSData = {
  user: { name: "Founder", initials: "F", greetingName: "" },
  // today's plan — calendar blocks tied to projects (the "Day" layer over "Now")
  today: {
    date: "Saturday, June 7",
    calendar: "Work · Google Calendar",
    blocks: [
      { start: "9:00", end: "9:30", title: "Morning re-entry", kind: "ritual", proj: null,
        walkIn: "Plan the day. COS lays out where you left off across every project." },
      { start: "9:30", end: "11:00", title: "Draft engine #5", kind: "focus", proj: "glve",
        walkIn: "Pick up the routing logic — the spec is open at engine #5." },
      { start: "11:00", end: "11:30", title: "Sync with Dana — pricing", kind: "meeting", proj: "glve", who: "Dana Whitfield",
        walkIn: "You need the pricing input to unblock the spec. Bring the one-pager." },
      { start: "1:00", end: "2:00", title: "Write the continuity essay", kind: "focus", proj: "brand",
        walkIn: "Opening essay on continuity — the outline's done, just write." },
      { start: "3:00", end: "3:30", title: "Review candidate rubric", kind: "focus", proj: "recruiting",
        walkIn: "Finish the five-signal rubric once the ATS export lands." },
      { start: "4:00", end: "4:30", title: "Decide homepage structure", kind: "focus", proj: "cos",
        walkIn: "Lock the homepage hierarchy, then move to visual design." },
    ],
  },
  // accent palette keys map to CSS vars --a-violet etc.
  projects: [
    {
      id: "glve", name: "GLVE", accent: "violet", status: "in-motion",
      why: "A go-to-market engine that turns enterprise sales into a repeatable system.",
      focus: "Finishing the six-engine spec before the pricing review.",
      lastActivity: "3 days ago", lastVerb: "drafting the six-engine spec", away: "3 days",
      progress: [
        "Mapped all six engines end to end",
        "Validated the stakeholder engine against 4 past deals",
        "Wrote the intake + scoring logic",
      ],
      blockers: ["Waiting on pricing input from finance"],
      openQuestions: ["Does engine #5 own routing, or just scoring?", "One spec doc or six?"],
      openDecisions: ["Whether GLVE ships as a template or a service"],
      nextAction: "Draft engine #5, then send the spec to pricing.",
      due: "Jun 20", lastMovement: "Wrote the intake + scoring logic",
      notes: ["Pricing review is the hard gate — everything routes around it.", "Keep the spec to one doc, not six."],
      research: [
        { t: "Buying committee sizes", d: "Enterprise deals average 3–5 stakeholders. Target all of them." },
        { t: "Competitor onboarding flows", d: "Most front-load setup — we can win on time-to-value." },
      ],
      ideasFlow: [
        { name: "Self-serve GLVE template", stage: "Spark" },
        { name: "GLVE scoring API", stage: "Brewing" },
      ],
      pct: 70,
      resume: [
        { kind: "Spec", t: "Engine #5 — routing logic", when: "3 days ago" },
        { kind: "Doc", t: "Pricing one-pager for Dana", when: "3 days ago" },
      ],
      counts: { ideas: 2, research: 7, knowledge: 5, files: 12, people: 4, decisions: 3, timeline: 18 },
      decisionsList: [
        { t: "GLVE uses six engines", d: "Not four. Routing earns its own engine.", when: "1 week ago" },
        { t: "Matrix is the source of truth", d: "The scoring matrix overrides gut calls.", when: "2 weeks ago" },
      ],
      knowledgeList: [
        { t: "Stakeholder Engine", d: "Buying committees average 3–5 people. Target all of them, not the champion alone.", used: "GLVE" },
        { t: "Pricing is positioning", d: "Where you price signals who you're for.", used: "GLVE · Personal Brand" },
      ],
      peopleList: [
        { n: "Dana Whitfield", r: "Finance lead · owns pricing input", initials: "DW" },
        { n: "Marcus Lee", r: "Design partner · enterprise", initials: "ML" },
      ],
    },
    {
      id: "cos", name: "COS", accent: "mint", status: "in-motion",
      why: "An external brain for context, not storage — so you never start over.",
      focus: "Deciding the homepage information hierarchy.",
      lastActivity: "yesterday", lastVerb: "deciding COS is chat-first", away: "1 day",
      progress: [
        "Locked the re-entry model (tiered by absence)",
        "Decided projects stay the primary user-facing object",
        "Wireframed the six core surfaces",
      ],
      blockers: [],
      openQuestions: ["Is the chat box command-bar, capture, or both?"],
      openDecisions: ["Name the homepage 'Now' or 'Home'?"],
      nextAction: "Approve the homepage structure, then start visual design.",
      due: null, lastMovement: "Decided COS is chat-first",
      notes: ["Continuity over everything else.", "Don't let the internal model leak into the UI."],
      research: [
        { t: "PIM re-finding studies", d: "The hard problem is reconnecting information to a future need." },
      ],
      ideasFlow: [
        { name: "Relationship OS", stage: "Brewing" },
      ],
      pct: 55,
      resume: [
        { kind: "Decision", t: "Homepage: 'Now' vs 'Home'", when: "yesterday" },
        { kind: "Wireframe", t: "Re-entry overlay tiers", when: "2 days ago" },
      ],
      counts: { ideas: 1, research: 4, knowledge: 6, files: 5, people: 1, decisions: 4, timeline: 22 },
      decisionsList: [
        { t: "COS is chat-first", d: "One calm input, always present. Ask and capture in one place.", when: "yesterday" },
        { t: "Continue where you left off is the north star", d: "Re-entry over everything else.", when: "4 days ago" },
      ],
      knowledgeList: [
        { t: "Context is computed, not stored", d: "If users maintain it by hand, it goes stale and lies.", used: "COS" },
        { t: "Forgetting is a feature", d: "Re-entry must also let things die gracefully.", used: "COS" },
      ],
      peopleList: [
        { n: "You", r: "Founder · principal designer", initials: "F" },
      ],
    },
    {
      id: "ollin", name: "Ōllin", accent: "amber", status: "dormant",
      why: "A personal operating ritual — daily movement, reflection, and intent.",
      focus: "Deciding whether Ōllin needs its own brand and identity.",
      lastActivity: "3 weeks ago", lastVerb: "deciding whether Ōllin needs its own brand", away: "3 weeks",
      progress: [
        "Sketched the morning ritual sequence",
        "Tested it for 9 days straight",
      ],
      blockers: [],
      openQuestions: ["Is this a product, or just my personal practice?"],
      openDecisions: ["Own brand, or a mode inside COS?"],
      nextAction: "Decide: standalone brand, or a ritual inside COS.",
      due: null, lastMovement: "Tested the ritual for 9 days straight",
      notes: ["Decide brand vs. mode before building anything."],
      research: [
        { t: "Habit-streak retention", d: "Daily anchors hold far better than weekly cadences." },
      ],
      ideasFlow: [],
      pct: 20,
      resume: [
        { kind: "Note", t: "Brand vs. mode — pros and cons", when: "3 weeks ago" },
      ],
      counts: { ideas: 0, research: 2, knowledge: 3, files: 3, people: 0, decisions: 1, timeline: 7 },
      decisionsList: [
        { t: "Ōllin is daily, not weekly", d: "The ritual only works as a daily anchor.", when: "3 weeks ago" },
      ],
      knowledgeList: [
        { t: "Rituals beat goals", d: "A repeatable practice outperforms a target you chase.", used: "Ōllin" },
      ],
      peopleList: [],
    },
    {
      id: "recruiting", name: "Recruiting OS", accent: "blue", status: "blocked",
      why: "Systematizing how I source, evaluate, and close candidates.",
      focus: "Building the candidate scoring rubric.",
      lastActivity: "5 days ago", lastVerb: "building the scoring rubric", away: "5 days",
      progress: [
        "Defined the five signals that predict a great hire",
        "Drafted the outreach sequence",
      ],
      blockers: ["Waiting on candidate data export from the ATS"],
      openQuestions: ["Weight culture or competence higher?"],
      openDecisions: [],
      nextAction: "Chase the ATS export, then finish the rubric.",
      due: "Jun 14", lastMovement: "Drafted the outreach sequence",
      notes: ["Rubric must be defensible to the team.", "Blocked until the ATS export lands."],
      research: [
        { t: "Signals that predict tenure", d: "Rate of improvement beats current level." },
      ],
      ideasFlow: [
        { name: "Auto-sourced shortlist", stage: "Spark" },
      ],
      pct: 40,
      resume: [
        { kind: "Rubric", t: "Five-signal scoring sheet", when: "5 days ago" },
        { kind: "Doc", t: "Outreach sequence v2", when: "5 days ago" },
      ],
      counts: { ideas: 1, research: 5, knowledge: 4, files: 8, people: 9, decisions: 2, timeline: 14 },
      decisionsList: [
        { t: "Score on five signals", d: "Slope, ownership, taste, speed, integrity.", when: "1 week ago" },
      ],
      knowledgeList: [
        { t: "Hire for slope, not position", d: "Rate of improvement predicts more than current level.", used: "Recruiting OS" },
      ],
      peopleList: [
        { n: "Priya Nair", r: "Candidate · staff engineer", initials: "PN" },
        { n: "Tom Alvarez", r: "Candidate · design lead", initials: "TA" },
      ],
    },
    {
      id: "brand", name: "Personal Brand", accent: "coral", status: "in-motion",
      why: "Building a public voice around systems thinking and calm software.",
      focus: "Outlining the first essay series.",
      lastActivity: "2 days ago", lastVerb: "outlining the essay series", away: "2 days",
      progress: [
        "Picked three pillars: systems, calm, continuity",
        "Drafted the first essay outline",
      ],
      blockers: [],
      openQuestions: ["Essays first, or short posts to build the muscle?"],
      openDecisions: [],
      nextAction: "Write the opening essay on continuity.",
      due: "Jun 30", lastMovement: "Drafted the first essay outline",
      notes: ["Three pillars only — systems, calm, continuity.", "Ship the first essay before adding more."],
      research: [
        { t: "Cadence vs. depth", d: "Consistency compounds faster than length." },
      ],
      ideasFlow: [],
      pct: 35,
      resume: [
        { kind: "Draft", t: "Essay — “Calm isn't the absence of work”", when: "2 days ago" },
        { kind: "List", t: "12 hooks for the continuity post", when: "2 days ago" },
        { kind: "Idea", t: "Turn the essay into a 5-part thread", when: "4 days ago" },
      ],
      counts: { ideas: 0, research: 3, knowledge: 2, files: 4, people: 2, decisions: 1, timeline: 9 },
      decisionsList: [
        { t: "Three pillars only", d: "Systems, calm, continuity. Everything ladders to these.", when: "2 days ago" },
      ],
      knowledgeList: [
        { t: "Voice is repetition", d: "A brand is what you say over and over until it's yours.", used: "Personal Brand" },
      ],
      peopleList: [],
    },
  ],
  ideas: [
    { id: "relos", name: "Relationship OS", stage: "Brewing", why: "Keep relationships warm at scale without it feeling transactional.",
      heat: "Warm", heatNote: "3 touches in 2 weeks — momentum is building.",
      questions: ["Is this part of COS or its own thing?", "Who is it for first — friends, or clients?"],
      related: ["COS"], lastActivity: "4 days ago", lastMove: "Sketched the 'warm list' concept",
      spark: "Noticed I keep losing touch with people I genuinely care about — not for lack of caring, but lack of a system.",
      nextMove: "Define the one ritual that keeps a relationship warm." },
    { id: "icecream", name: "Ice Cream Shop", stage: "Exploring", why: "A tangible, offline counterweight to a life made of software.",
      heat: "Cooling", heatNote: "No activity in 11 days — it's drifting.",
      questions: ["Real, or a daydream?", "Would I actually run it, or just romanticize it?"],
      related: [], lastActivity: "11 days ago", lastMove: "Priced out a small storefront",
      spark: "A craving for something I can touch — a counterweight to a life that lives entirely on screens.",
      nextMove: "Decide if this is a business or a daydream, honestly." },
    { id: "agent", name: "New Agent Concept", stage: "Brewing", why: "COS's assistant, productized for other people's context.",
      heat: "Hot", heatNote: "5 notes this week — this one wants out.",
      questions: ["Does it compete with COS or extend it?", "Is it a feature or a company?"],
      related: ["COS", "GLVE"], lastActivity: "yesterday", lastMove: "Wrote 5 notes on the agent's job",
      spark: "If COS can hold my context, it can hold anyone's — and the assistant that reads it is the real product.",
      nextMove: "Write the one-paragraph pitch and pressure-test it." },
  ],
  sparks: ["Voice-first journaling", "Family archive", "COS for teams", "Newsletter engine", "A book on continuity"],
  activity: [
    { proj: "COS", accent: "mint", verb: "Decided", what: "COS is chat-first", when: "yesterday" },
    { proj: "Personal Brand", accent: "coral", verb: "Drafted", what: "the opening essay outline", when: "2 days ago" },
    { proj: "GLVE", accent: "violet", verb: "Wrote", what: "the intake + scoring logic", when: "3 days ago" },
    { proj: "Recruiting OS", accent: "blue", verb: "Defined", what: "the five hiring signals", when: "5 days ago" },
    { proj: "GLVE", accent: "violet", verb: "Captured", what: "a note on pricing as positioning", when: "1 week ago" },
  ],
  // flattened searchable index
  searchPeople: [
    { n: "Dana Whitfield", r: "Finance lead", proj: "GLVE", initials: "DW" },
    { n: "Marcus Lee", r: "Design partner", proj: "GLVE", initials: "ML" },
    { n: "Priya Nair", r: "Candidate · staff engineer", proj: "Recruiting OS", initials: "PN" },
    { n: "Tom Alvarez", r: "Candidate · design lead", proj: "Recruiting OS", initials: "TA" },
  ],
  searchKnowledge: [
    { t: "Stakeholder Engine", d: "Buying committees average 3–5 people.", used: "GLVE" },
    { t: "Context is computed, not stored", d: "Maintain it by hand and it goes stale.", used: "COS" },
    { t: "Hire for slope, not position", d: "Rate of improvement predicts most.", used: "Recruiting OS" },
    { t: "Rituals beat goals", d: "A repeatable practice beats a target.", used: "Ōllin" },
  ],
  searchDecisions: [
    { t: "Matrix is source of truth", used: "GLVE" },
    { t: "COS is chat-first", used: "COS" },
    { t: "GLVE uses six engines", used: "GLVE" },
    { t: "Score on five signals", used: "Recruiting OS" },
  ],
};
