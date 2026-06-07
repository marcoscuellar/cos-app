# Handoff: COS — Context Operating System

## Overview
COS ("Context Operating System") is a calm, editorial personal-continuity app. Its single job is **re-entry**: letting someone return to any project, idea, or day after any gap and resume in seconds — without reconstructing where they were. The north star is *"continue where you left off."* It is **not** a task manager, wiki, or note pile; it is a continuity layer that holds the state of your work between sessions.

The product is built around six user-facing surfaces: **Now (Home)**, **Today (calendar)**, **Projects + Project detail**, **Ideas Brewing + Idea detail**, **Memory (search)**, plus a **Re-entry overlay**, a per-project **Brainstorm with COS** drawer (live AI), and a **Login**.

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — a working prototype that demonstrates the intended look, layout, and behavior. **They are not production code to ship directly.** The in-browser Babel transform, the single-file CSS, and the `window.COS_DATA` mock are prototype conveniences.

Your task is to **recreate these designs in the target codebase's environment** using its established patterns. If there is no environment yet, the prototype is already idiomatic React — a Vite + React + TypeScript app with CSS modules (or Tailwind mapped to the tokens below) is the recommended target. Port the components, lift the CSS into a real stylesheet/token system, and replace the mock data layer with real state/persistence.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and interactions are all specified and should be reproduced faithfully. Exact values are in **Design Tokens** below; the source of truth is the `:root` block and component CSS inside `COS.html`.

---

## Tech shape of the prototype (what you're porting)
- **Entry:** `COS.html` — contains the entire design system as one `<style>` block in `:root`, plus the HTML shell, font links, and script tags.
- **`cos-data.js`** — `window.COS_DATA`, the mock dataset (projects, ideas, sparks, activity, today's schedule, search indexes). Replace with your real data model.
- **`cos-ui.jsx`** — shared primitives: `Icon` (inline SVG set), `Sidebar`, `ChatBar`, `Eyebrow`, `Status`.
- **`cos-screens.jsx`** — all screen components (Home, Today, Projects, ProjectScreen + facets, Ideas, IdeaDetail, Search, Reentry, BrainstormPanel, DocViewer).
- **`cos-app.jsx`** — `App` root: auth gate (Login), a string-based router (`route` state), theme + sidebar-collapse state, and localStorage persistence under key `cos-state`.
- Components share scope via `Object.assign(window, {...})` (a Babel-multi-file workaround). In a real build, use real ES module imports/exports instead.
- Fonts: **Neue Haas Grotesk Display Pro** (display, via cdnfonts), **Inter** (UI, Google Fonts), **Newsreader** italic (the serif accent used for emphasis). License Neue Haas properly for production, or substitute a comparable grotesk.

---

## Routing & Navigation
String router in `App` (`cos-app.jsx`). `route` ∈ `home | today | projects | project | ideas | idea | search`. Plus overlay state: `reentry` (project), `brainstorm` (project), `doc` (resume doc). Selected entity held in `projectId` / `ideaId`.

- **Sidebar nav (always present):** Now, Today, Projects (count badge), Ideas (count badge), Memory. Below a "Projects" section listing all projects with an accent dot; dormant projects are dimmed and labeled. Footer: Bold/Mono theme toggle + user chip. Sidebar is **collapsible** to a 66px icon rail (toggle persists).
- **Persistence:** `authed`, `route`, `projectId`, `theme`, `collapsed` saved to `localStorage["cos-state"]` on change and restored on load.
- **Re-entry rule:** clicking a **dormant** project (sidebar or index) or a long-absence project opens the **Re-entry overlay** instead of navigating straight in. Active projects open directly.

---

## Screens / Views

### 1. Login (`Login` in cos-app.jsx)
- **Purpose:** calm threshold. Email + password (prefilled placeholders), "Continue →".
- **Layout:** centered column, max 420px. Wordmark (rounded-square "C" logo + "COS"). Headline "Welcome back." in display font 52px. Subcopy. Two `.lfield` inputs, full-width dark `.lbtn`. Soft radial glow top-right (violet at 7% in Bold; near-black at 4% in Mono).
- **Behavior:** Continue sets `authed=true`, route `home`.

### 2. Now / Home (`HomeScreen`)
- **Purpose:** "what matters right now" + continue where you left off. The default landing.
- **Layout (top-to-bottom), max content width 1080px, padding 46px 56px:**
  1. **Kicker** — "Good morning. It's Sunday, June 7." (13px, ink-4).
  2. **Hero quote** — display font, `clamp(50px,8vw,98px)`, line-height .96, max-width 15ch. Two-tone: first clause in ink; emphasis clause in **Newsreader italic, coral** (`.em.ac-coral`). Current copy: *"You're allowed to rest — you're not allowed to quit."*
  3. **ChatBar** (big) — see Components.
  4. spacer 56px.
  5. **Two-up grid** `.home-split`: `grid-template-columns: 1.5fr 1fr; gap:18px; align-items:stretch`. Collapses to 1 col under 920px.
     - **Left — "Today · your day":** section header (label + "Open →" linking to Today) + a `.card.ac-blue.home-cal-card` that **flex-stretches** to match the right column. Inside, `.home-cal-list` (flex:1, `justify-content:space-between` so rows fill evenly). Each row `.home-cal-row` is a 3-col grid `58px 1fr auto`: start time (display 12.5px), title (display 15px, ellipsis), and right-aligned project name in its accent (or block kind if no project). The 9:30 row shows a green "now" pill. Clicking a row with a project opens that project; otherwise opens Today.
     - **Right — "Most recent":** section header + **two** stacked `.card.click` (COS, Personal Brand — the two most recently touched). Each: eyebrow "Last touched · {when}", title in accent (22px), body "You were {lastVerb}.", and an accent **Continue →** button. Clicking the card calls the continue handler.
     - ⚠️ **Critical alignment:** both columns must bottom-align. Achieved by `align-items:stretch` on the grid + `.home-cal-card{flex:1}` + the list using `justify-content:space-between`. (This was a real bug; keep the stretch.)
  6. spacer 38px.
  7. **"At a glance"** label, then a `.grid-2` of four cards styled like the recent cards (small eyebrow + large colored display title):
     - **Projects in motion** (violet) — rows of `.prog-row`: dot + name + **progress bar** + percent. Dormant rows dimmed with gray bar. "All projects →" link.
     - **Needs attention** (coral) — `.prow` rows: dot + stacked title(in accent)/subtitle + arrow. Click → continue handler.
     - **Ideas brewing** (amber) — `.prow` rows: idea name (amber) + "{stage} · {why}". "Open incubator →".
     - **Recent activity** (mint) — `.act` rows: project name (accent) — verb **what** — when.

### 3. Today (`TodayScreen`)
- **Purpose:** the day layer over Now — calendar blocks tied to projects, so each is a warm re-entry.
- **Layout:** Eyebrow "Your day" (blue) → display headline "Today, tied to *your work.*" → subcopy "{date} · N blocks, M connected to a project." → a `.cal-banner` ("Synced with Work · Google Calendar · COS reads your blocks and attaches context", + "Manage →"). Then a vertical **timeline**.
- **Timeline (`.timeline` / `.tblock`):** each block is a 2-col grid `78px 1fr`: left = start time (display 15px) over end time (11.5px ink-4); a vertical **spine** with a ringed **node** colored to the block's accent; right = a `.tcard`. Card shows: a **kind** pill (`focus` tinted in accent, `meeting` tinted blue, `ritual` neutral), optional "with {who}", project name (accent, right), title (display 19px), a "Walk in with" context line (accent label + text), and an **Enter {project} →** affordance. Project-linked cards navigate to the project on click; the ritual block has no link. Below the timeline, a "Plan tomorrow" prompt card.

### 4. Projects index (`ProjectsScreen`)
- **Purpose:** all containers. Eyebrow + "Projects" headline + subcopy, then `.grid-2` of project cards.
- **Card:** eyebrow "{timeline} updates · {lastActivity}" + Status pill; colored display title; "why" body; a **progress bar + %**; a divider then "Focus" label + focus text. Active → open project; dormant → re-entry overlay.

### 5. Project detail (`ProjectScreen` + facets)
- **Purpose:** the work hub. Opens on **Current Context** first.
- **Header:** Eyebrow (project name) + large **accent-colored** title + "why" subcopy + Status pill.
- **Tabs (lean):** `Current Context`, `Overview`, `Research` (count), `Ideas` (count). Counts hide when zero.
- **Current Context (`CurrentContext` + `StatusBar`):**
  - **Status bar** — a bordered row of segments: **Status** (dot + label), **Due date** (or a coral **"Set a due date"** forcing-function button with a flag icon; the segment is tinted coral while empty), **Last movement** ({lastActivity} + {lastMovement}), **Progress** (mini bar + %).
  - A **Current focus** card (display 24px) with inline blocker chips (amber) + "N open questions" pill.
  - A **resume strip** ("Pick up where you left off") of `.resume-row`s — each opens the **DocViewer** with that doc's context.
  - A dark **Next recommended action** band with a "Start →" button.
- **Overview facet:** "The goal — why we're doing this" card (display 26px) + a `.grid-2` of **Deadline** (accent, or coral "Not set yet") and **Notes** (dashed list).
- **Research facet:** list of cards (title + detail). Empty-state component if none.
- **Ideas facet:** ideas that flow from this project (dot + name + stage). Empty-state if none.
- **Brainstorm with COS:** a button opens `BrainstormPanel` — a right-side **drawer** with a live AI chat scoped to the project (uses `window.claude.complete`; see AI section). Falls back gracefully if unavailable.

### 6. Ideas Brewing (`IdeasScreen`) + Idea detail (`IdeaDetail`)
- **Index:** Eyebrow "Incubation" + "Ideas *brewing.*" + subcopy ("Three ideas get your real attention at a time…"). `.grid-3` of **clickable** idea cards: name (amber), "Why it matters", a **stage track** (Spark→Brewing→Exploring→Testing→Ready with filled dots), and an **Analyze heat** button that reveals heat bars + note (heat is shown **only on demand**, never ambient). Below: "Sparks · waiting, uncapped" pills.
- **Detail:** back-link; eyebrow "Idea · {stage}"; large amber title; status bar (**Stage**, **Heat** with Analyze button, **Last activity**); a stage-track card with a **"Move to {next}"** button that advances stage (becomes **"Graduate to project"** at Ready); on Analyze, a heat-analysis card; a 2-up of **The spark** (Newsreader italic quote) + **Open questions**, and **Related projects** (accent pills → navigate) + **Next move**; a graceful **"Shelve with a takeaway"** exit that swaps to a "Shelved" confirmation (saves the lesson as Knowledge).

### 7. Memory / Search (`SearchScreen`)
- **Purpose:** find anything by meaning, time, or person.
- **Layout:** big display headline (echoes the query in coral italic), a large `.search-big` input (display 22px), and **axis chips** (Everything / Projects / People / Knowledge / Decisions). Live-filters as you type. Results render as **cards in a `.grid-2`** per group (`.rescard`): icon tile + title (project titles in accent) + meta + detail. Empty query shows three "You usually look by" cards (meaning / time / person, with Newsreader italic examples). No-results state included.

### 8. Re-entry overlay (`Reentry`)
- **Purpose:** never a cold start. A modal that meets you on return.
- **Layout:** dim backdrop + blur; centered 560px card (accent-tinted) with pop-in animation. "Away {n}" pill + close. "Welcome back to {project}." (display 32px). A **tier** label — **Nudge / Briefing / Reconstruction** — chosen by how long you've been away. Sections: "What changed while you were away" (hidden for Nudge), "Why this mattered" (Reconstruction only), "Where you stopped", "Pick up with". Actions: **"Pick up where you left off →"**, "Just browsing", and for dormant: "Let it rest".

---

## Interactions & Behavior
- **Continue handler:** active project → navigate; dormant/long-absence → Re-entry overlay.
- **Sidebar collapse:** instant width swap 248px ↔ 66px (NOT animated — the live engine wouldn't interpolate the width transition reliably; keep it instant). Labels hidden, icons remain clickable, persists.
- **Theme toggle:** Bold ↔ Mono sets `data-theme="mono"` on `<html>`; Mono flattens all accents to graphite and removes the colored emphasis. Persisted.
- **Due-date forcing function:** projects with no due date surface a coral "Set a due date" prompt (in the status bar and echoed in Overview as "Not set yet — set one, or this will sit."). Clicking sets a date locally and clears the coral warning.
- **Heat on demand:** never show idea heat ambiently; only after the user clicks Analyze.
- **Animations:** entrance uses **transform-only** fade-up (`@keyframes fadeUp{from{transform:translateY(10px)}}`) — *do not animate opacity from 0*, because a backgrounded tab pauses the timeline and would leave content invisible. `.stagger > *` applies incremental delays. Cards lift on hover (`translateY(-2px)` + shadow). Overlay pops with `cubic-bezier(.2,.9,.3,1.2)`. All gated by `prefers-reduced-motion`.
- **Scroll reset** on route/entity change.

## State Management
Prototype uses local React state + localStorage. For production:
- `auth` (session), `route`/navigation (use a real router), `theme`, `sidebarCollapsed`.
- Per-entity selection (`projectId`, `ideaId`), overlay state (`reentry`, `brainstorm`, `doc`).
- **Idea detail** holds local `stageIdx`, `analyzed`, `shelved`. **StatusBar** holds local `due`. These should become real mutations against your data model. ⚠️ Known prototype gap: setting a due date in Current Context does not propagate to the Overview tab (separate local state) — wire both to one source of truth.
- Replace `window.COS_DATA` with your model. Entity shapes are documented by example in `cos-data.js`; key project fields: `id, name, accent, status (in-motion|blocked|dormant), why, focus, lastActivity, lastVerb, away, progress[], blockers[], openQuestions[], openDecisions[], nextAction, due, lastMovement, notes[], research[], ideasFlow[], pct, resume[], counts{}, decisionsList[], knowledgeList[], peopleList[]`. Idea fields: `id, name, stage, why, heat, heatNote, questions[], related[], lastActivity, lastMove, spark, nextMove`. Plus top-level `today{date, calendar, blocks[]}`, `ideas[]`, `sparks[]`, `activity[]`, and search indexes.

## AI Interaction Model (Brainstorm)
AI is a **supporting character**, scoped and invited — never dominant. `BrainstormPanel` calls `window.claude.complete(prompt)` (the prototype's bridge) with a system framing that includes the project's name/why/focus, so replies are project-aware. In production, swap for your LLM endpoint. Rules to preserve: AI summarizes/surfaces/suggests and may brainstorm **only when invited**; it must never silently author Knowledge/Decisions or make decisions; keep outputs clearly the machine's draft. Always provide a graceful fallback when the model is unavailable.

---

## Design Tokens
**Themes (three).** Toggle in the sidebar footer; persists; sets `data-theme` on `<html>`.
- **Bold** (default) — pure white canvas (`--canvas:#ffffff`), full muted accents.
- **Mono** — **Chalk White** canvas (`--canvas:#f4f3f0`), all accents flattened to graphite `#1a1a1e`.
- **Slate** — brand **Night Slate** dark mode: canvas `#191926`, card surfaces `#232234`, chalk text `#f4f3f0`, brighter accents (periwinkle `#afa9ec`, mint `#9fe1cb`, terracotta `#ec9c8f`, ochre `#e3c07c`, slate-blue `#93b4e6`). Logo chip inverts to chalk; dark-surface inversions handled via `[data-theme="slate"]` overrides.

**Canvas vs cards:** body uses `--canvas`; cards/sidebar use `--paper` (white in light themes, elevated dark in Slate) so cards sit above the canvas.

**Neutrals**
- `--paper:#ffffff` · `--paper-2:#fafafa` · `--paper-3:#f5f5f6`
- `--ink:#0c0c0e` · `--ink-2:#36363b` · `--ink-3:#6a6a72` · `--ink-4:#9a9aa2` · `--ink-5:#c0c0c6`
- `--line:#e8e8ea` · `--line-2:#f0f0f1` · `--line-3:#dadadd`

**Accents (muted/editorial — intentionally not neon)**
- violet `#615ab0` (bg `#eeedf6`) · mint `#2f8a62` (bg `#e7f1ec`) · coral `#c85f52` (bg `#f7ece9`) · amber `#aa7c33` (bg `#f4efe2`) · blue `#4f76ab` (bg `#ebf0f6`)
- Each project carries one accent: GLVE=violet, COS=mint, Ōllin=amber, Recruiting OS=blue, Personal Brand=coral.

**Status colors** — in-motion=mint, blocked=amber, dormant=ink-4 (gray).

**Typography**
- Display + brand wordmark: **DM Sans** (`--display` and `--brand`). Headlines weight 700 (tight tracking -.02 to -.035em); the COS logo/wordmark is DM Sans **800** at -.04em. (Earlier drafts used Neue Haas Grotesk; the brand is DM Sans — use DM Sans.)
- UI: `'Inter'`. Base 15px / line-height 1.55.
- Serif accent: `'Newsreader'` italic 400/500 — used only for the coral emphasis clauses and pull-quotes.
- Scale highlights: hero `clamp(50px,8vw,98px)`; section display titles `clamp(30–46px)`; card titles 22–27px; eyebrows 10–12px uppercase, letter-spacing .12–.14em.

**Radius** — `--radius:18px` (cards), `--radius-sm:12px`, pills 30px, buttons 11px, inputs 13–16px.

**Shadow**
- `--shadow:0 1px 2px rgba(16,16,20,.04), 0 8px 30px -16px rgba(16,16,20,.10)`
- `--shadow-lift:0 2px 4px rgba(16,16,20,.05), 0 24px 60px -24px rgba(16,16,20,.18)`

**Spacing** — content max-width 1080px; page padding 46px 56px (40px 36px under 1100px). Spacers: l=56px, m=38px, s=24px. Sidebar 248px / collapsed 66px.

## Assets
- **Brand system:** `brand/cos_brand_system.svg` — the full identity sheet (color variants, app icon, lockups, recommended DM Sans 800 pairing, tagline “Resume where you left off.”). **Source of truth for the brand.**
- **Logos:** `brand/cos-app-icon.svg` (black `#0a0a0a` rounded square, white stacked “CO/S”) and `brand/cos-wordmark.svg` (DM Sans 800 “COS” + subtitle). A matching SVG favicon is inlined in `COS.html`.
- **In-app logo:** the sidebar + login render the wordmark as the brand **black block lockup** — a `#0a0a0a` rounded block with white DM Sans 800 “COS” inside (`.cos-logo`). It stays pinned (does NOT hide) when the sidebar collapses, and inverts to chalk-on-dark (`#f4f3f0` block) in the Slate theme.
- **Brand colors:** Black `#0a0a0a` · Chalk White `#F4F3F0` · Deep Orbit Green `#2A5343` (mint `#9FE1CB`) · Night Slate `#1C1C2E` (periwinkle `#AFA9EC`).
- **Icons:** inline SVG set in `cos-ui.jsx` (`Icon.*`). Reuse or map to your icon library.
- **Fonts:** DM Sans, Inter, Newsreader — all Google Fonts (free).
- No photos are used — the aesthetic is pure type + color + space.

## Files in this bundle
- `COS.html` — shell + full design-system CSS (`:root` is the token source of truth).
- `cos-app.jsx` — App root, Login, router, theme/persistence.
- `cos-ui.jsx` — Icon set, Sidebar, ChatBar, Eyebrow, Status.
- `cos-screens.jsx` — all screens, facets, overlays, Brainstorm, DocViewer.
- `cos-data.js` — `window.COS_DATA` mock (entity shapes by example).
- `reference/Architecture.html` — Phase 1 strategy doc (product thesis, object model, context & re-entry models, lifecycles, AI behavior, risks). Read for **intent**.
- `reference/Experience.html` — Phase 2 experience-architecture wireframes (what the user sees/clicks per surface). Read for **structure**.

## Suggested implementation order
1. Tokens + theme switch (Bold/Mono) + fonts. 2. App shell: Sidebar (collapsible) + router. 3. Home (nail the two-up bottom-alignment). 4. Project detail + Current Context + status bar. 5. Today timeline. 6. Ideas index + detail. 7. Memory search. 8. Re-entry overlay. 9. Brainstorm (wire to your LLM). 10. Replace mock data with real model + persistence; unify due-date state.
