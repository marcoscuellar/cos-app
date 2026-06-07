# COS — Context Operating System

A calm, editorial personal-continuity app. Its single job is **re-entry**: letting
you return to any project, idea, or day after any gap and resume in seconds —
without reconstructing where you were. North star: *"continue where you left off."*

This is a **Vite + React + TypeScript** port of the design handoff prototype in
[`design_handoff_cos/`](./design_handoff_cos). The prototype's single-file CSS,
in-browser Babel transform, and `window.COS_DATA` mock have been lifted into a
real app: tokenized stylesheet, ES-module components with TypeScript types, and a
typed data module (`src/data.ts`).

## Run

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Structure

```
src/
  index.css            Design system — the :root token block is the source of truth
  types.ts             Entity types (Project, Idea, Today, …)
  data.ts              Typed sample data (replaces window.COS_DATA)
  App.tsx              Root: auth gate, string router, theme + persistence
  Login.tsx            The calm threshold
  components/
    Icon.tsx           Inline SVG icon set
    Sidebar.tsx        Collapsible nav (Now / Today / Projects / Ideas / Memory)
    shared.tsx         Eyebrow, Status, ChatBar primitives
  screens/
    Home.tsx           "Now" — hero, day two-up, at-a-glance
    Today.tsx          Calendar timeline tied to projects
    Projects.tsx       Project index
    ProjectDetail.tsx  Work hub: Current Context, Overview, Research, Ideas
    Ideas.tsx          Idea incubator (heat on demand)
    IdeaDetail.tsx     Stage track, spark, graceful shelving
    Search.tsx         Memory — find by meaning, time, or person
  overlays/
    Reentry.tsx        Re-entry overlay (depth tiers by absence)
    Brainstorm.tsx     Invited, project-scoped AI drawer (with graceful fallback)
    DocViewer.tsx      "What COS remembers" doc bridge
```

## Themes

Three themes toggle from the sidebar footer and persist to `localStorage`
(`data-theme` on `<html>`):

- **Bold** — pure white canvas, full muted editorial accents (default)
- **Mono** — Chalk White canvas, accents flattened to graphite
- **Slate** — Night Slate dark mode with brighter accents

## Notes for production

- The **due-date** state is unified: setting a date in Current Context now
  propagates to the Overview tab (the prototype had these as separate local
  state — fixed here by lifting `due` into `ProjectScreen`).
- **Brainstorm** uses an optional `window.claude.complete` bridge when present and
  otherwise falls back to a project-aware canned response. Swap in your own LLM
  endpoint, preserving the project-scoped framing.
- Replace `src/data.ts` with a real data model + persistence layer.
- The prototype's `localStorage` router/state is intentionally kept; migrate to a
  real router when adding deep-linking.

Fonts (DM Sans, Inter, Newsreader) load from Google Fonts in `index.html`.
Brand assets live in `public/brand/` — `cos_brand_system.svg` is the identity
source of truth.
