// COS — sample data. Real project names from the brief.
// Ported from the prototype's window.COS_DATA mock; replace with a real
// data model + persistence when wiring up the backend.
import type { COSData } from "./types";
import { IS_DEMO } from "./session";
import { DEMO_DATA } from "./data.demo";

const REAL_COS_DATA: COSData = {
  user: { name: "Founder", initials: "F", greetingName: "Marcos" },
  // The architectural doorway. A date-seeded quote rotates daily (see brief.ts);
  // the motto is the standing line. Both are easy to edit.
  doorway: {
    motto: "Outwork. Outperform. Always be a fucking gentleman.",
    quotes: [
      { t: "The best way to predict the future is to invent it.", who: "Alan Kay", role: "Computer scientist" },
      { t: "Make something people want.", who: "Paul Graham", role: "Y Combinator" },
      { t: "If you are not embarrassed by the first version of your product, you've launched too late.", who: "Reid Hoffman", role: "LinkedIn" },
      { t: "Ideas are easy. Execution is everything.", who: "John Doerr", role: "Kleiner Perkins" },
      { t: "Your margin is my opportunity.", who: "Jeff Bezos", role: "Amazon" },
      { t: "Done is better than perfect.", who: "Sheryl Sandberg", role: "Operator" },
      { t: "Real artists ship.", who: "Steve Jobs", role: "Apple" },
      { t: "Move with urgency and focus.", who: "Brian Chesky", role: "Airbnb" },
    ],
  },
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
  // COS — RESEARCH LAB: a quiet research department working on your behalf.
  lab: {
    // AGENTS — ongoing observations running against your context.
    // status: "field" (out now) | "reporting" (back with something) | "idle" (resting)
    agents: [
      { initials: "MS", name: "Market Scout", accent: "indigo", status: "field",
        assignment: "Watching the field — AI recruiting, staffing tech, HR tech, GTM trends.",
        finding: "Three recruiting startups announced autonomous sourcing features this week.",
        last: "2h ago" },
      { initials: "TK", name: "Thread Keeper", accent: "green", status: "reporting",
        assignment: "Watching relationships, quiet conversations, open loops.",
        finding: "Matt hasn't heard from you in 8 days.",
        last: "this morning" },
      { initials: "AR", name: "Archivist", accent: "amber", status: "field",
        assignment: "Tracking decisions, pivots, project history.",
        finding: "COS became chat-first on June 7.",
        last: "yesterday" },
      { initials: "IG", name: "Idea Gardener", accent: "rose", status: "field",
        assignment: "Watching recurring thoughts and unfinished ideas.",
        finding: "You've mentioned Context Alarms five times this month.",
        last: "3 days ago" },
      { initials: "FB", name: "Founder Briefing", accent: "violet", status: "reporting",
        assignment: "Preparing daily context for the start of your day.",
        finding: "Recruiting OS is waiting on candidate exports. COS homepage direction is still active. Matt follow-up remains open.",
        last: "just now" },
      { initials: "CC", name: "Context Cartographer", accent: "teal", status: "field",
        assignment: "Mapping connections between projects, ideas, and decisions.",
        finding: "Context Alarms appears in COS, Personal Systems, and Research Lab discussions.",
        last: "4h ago" },
    ],
    // EXPERIMENTS — real things you're testing. state: "active" | "paused" | "done"
    experiments: [
      { name: "Context Alarms", accent: "rose", state: "active",
        q: "Can COS gently bring people back before projects go dormant?",
        note: "Watching for projects drifting quiet, testing the right nudge." },
      { name: "Project Recovery", accent: "amber", state: "active",
        q: "Can COS reconstruct project context after weeks away?",
        note: "Re-entry panel pulls the last state so you walk back in cold-proof." },
      { name: "Morning Briefing", accent: "indigo", state: "active",
        q: "Can COS generate a daily briefing actually worth reading?",
        note: "Derived daily — founder quote, lab currents, what's next." },
    ],
    // KNOWLEDGE BASE — a library, not a database. Shelves emerge from your work.
    shelves: [
      { name: "AI", accent: "indigo", count: 31, sample: "Latest: context-engineering over prompt-engineering" },
      { name: "Recruiting", accent: "green", count: 42, sample: "Latest: autonomous sourcing is going mainstream" },
      { name: "Sales", accent: "blue", count: 23, sample: "Latest: 6Engines outbound patterns" },
      { name: "Operations", accent: "amber", count: 18, sample: "Latest: single-user workstation reframe" },
      { name: "Branding", accent: "rose", count: 27, sample: "Latest: architectural face over editorial" },
      { name: "Product Design", accent: "violet", count: 19, sample: "Latest: rooms-in-a-house IA" },
      { name: "Personal Systems", accent: "teal", count: 12, sample: "Latest: continue-where-you-left-off" },
      { name: "Relationships", accent: "green", count: 9, sample: "Latest: quiet threads worth reviving" },
    ],
    // REPORTS — generated automatically, land here like mail on a desk.
    reports: [
      { t: "What Has Your Attention?", kind: "Attention Audit", when: "today", fresh: true,
        d: "The people, projects, and ideas consuming most of your mental bandwidth." },
      { t: "What Changed This Week?", kind: "Change Log", when: "Friday", fresh: true,
        d: "Decisions, pivots, completed work, and new directions." },
      { t: "Things You Keep Coming Back To", kind: "Recurrence Analysis", when: "weekly", fresh: true,
        d: "Ideas, concerns, and opportunities repeatedly appearing across your work." },
      { t: "Connections You May Be Missing", kind: "Context Mapping", when: "weekly", fresh: true,
        d: "Projects, ideas, and people that appear unrelated but keep intersecting." },
      { t: "This Week in the Lab", kind: "Weekly Findings", when: "Mon 8am", fresh: true,
        d: "Everything the agents brought back this week, in one read." },
      { t: "Patterns Across Your Work", kind: "Pattern Scan", when: "2 days ago", fresh: true,
        d: "Themes showing up across projects, notes, and ideas." },
      { t: "Projects Losing Momentum", kind: "Momentum Check", when: "3 days ago", fresh: false,
        d: "What's drifting toward dormant — before it goes quiet." },
      { t: "Ideas Mentioned Most Often", kind: "Idea Frequency", when: "this week", fresh: false,
        d: "Recurring concepts you keep circling back to." },
      { t: "People You Keep Talking About", kind: "Relationship Map", when: "last week", fresh: false,
        d: "Who's recurring in your context — and who's gone quiet." },
      { t: "AI News Worth Paying Attention To", kind: "Field Watch", when: "last week", fresh: false,
        d: "Signal from the field, filtered to what matters to your work." },
      { t: "Decisions Made This Month", kind: "Decision Log", when: "Jun 1", fresh: false,
        d: "The calls you made, captured before they fade." },
    ],
  },
};

// The active workspace. The public demo (session.ts) swaps in a fictional,
// read-only dataset; everything downstream imports COS_DATA and is none the wiser.
export const COS_DATA: COSData = IS_DEMO ? DEMO_DATA : REAL_COS_DATA;
