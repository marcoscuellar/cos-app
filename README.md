# COS — Cognitive Operating System

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
npm run dev        # Vite dev server (UI only; AI + KV fall back gracefully)
npm run vercel-dev # full stack incl. /api serverless functions (needs Vercel CLI + env)
npm run build      # type-check + production build
npm run preview    # preview the production build
```

## Backend (Vercel) — KV storage + server-side AI

This is a **single-user personal app** — there is no authentication. The app
loads straight to the dashboard. All secrets stay **server-side**; the client
bundle never sees an API key — it only calls the serverless functions under
[`api/`](./api):

- **`api/state.ts`** — persists UI position (route, selected project, theme,
  sidebar state) in **Vercel KV** via its REST API (native `fetch`, no SDK
  dependency), keyed by an opaque per-browser id. Reads `KV_REST_API_URL` /
  `KV_REST_API_TOKEN` from the environment.
- **`api/brainstorm.ts`** and **`api/ask.ts`** — power the Brainstorm panel and
  Ask COS by calling Claude (`claude-opus-4-8`) through the official
  `@anthropic-ai/sdk`, using `ANTHROPIC_API_KEY`. The key is read from
  `process.env` on the server only.

The frontend talks to these via `src/storage.ts` (state) and a `fetch` in
`src/overlays/Brainstorm.tsx` (AI). Both degrade gracefully: if the API is
unavailable (e.g. plain `vite` dev without KV), state falls back to a
`localStorage` cache and Brainstorm falls back to a canned, project-aware reply.

### Environment variables

These are configured on the Vercel project and consumed only by `api/`:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | `api/brainstorm.ts`, `api/ask.ts` | Authenticates the Claude call |
| `KV_REST_API_URL` | `api/state.ts` | Vercel KV REST endpoint |
| `KV_REST_API_TOKEN` | `api/state.ts` | Vercel KV REST token |

None are prefixed with `VITE_`, so Vite never inlines them into the browser
bundle. For local full-stack dev, pull them from the linked Vercel project:

```bash
vercel link        # once
npm run pull-env   # writes .env.local (gitignored) from the project's env vars
npm run vercel-dev
```

See [`.env.example`](./.env.example) for the full list.

## Structure

```
api/
  state.ts             Serverless: persist UI state in Vercel KV
  brainstorm.ts        Serverless: Claude-powered Brainstorm (server-side key)
  ask.ts               Serverless: Ask COS context engine (server-side key)
lib/server/ai/         Context engine: context renderer, action registry, provider adapter
src/
  index.css            Design system — the :root token block is the source of truth
  types.ts             Entity types (Project, Idea, Today, …)
  data.ts              Typed sample data (replaces window.COS_DATA)
  storage.ts           Client → /api/state, with localStorage fallback
  askContext.ts        buildWorkspaceContext() — the client-side context packager
  App.tsx              Root: string router, theme + persistence (no auth)
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
- **Brainstorm** calls the `api/brainstorm.ts` serverless function (Claude via
  `@anthropic-ai/sdk`, server-side key), with a project-aware canned fallback
  when the endpoint is unavailable.
- **Persistence** is backed by Vercel KV via `api/state.ts`, with a localStorage
  cache fallback. Replace `src/data.ts` (the projects/ideas content) with a real
  data model when wiring up a backend.
- The prototype's `localStorage` router/state is intentionally kept; migrate to a
  real router when adding deep-linking.

Fonts (DM Sans, Inter, Newsreader) load from Google Fonts in `index.html`.
Brand assets live in `public/brand/` — `cos_brand_system.svg` is the identity
source of truth.
