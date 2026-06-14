# COS — Design Spec (source of truth)

Pulled directly from `src/index.css` + `index.html`. Hand this to any tool/agent
building in the COS look. Palette is **"Nordic Shoreline"**: warm‑white canvas,
navy‑charcoal ink, a single olive accent, straight edges, editorial typography.

---

## 1. Brand essence
- **Product:** COS — *"An external brain for context, not storage — so you never start over."*
- **Voice:** calm, architectural, editorial. Confident, not loud. A quiet operator's tool.
- **Metaphor:** *rooms in a house.* You enter a **foyer**, then walk into **rooms** (projects).
- **Signature tics:**
  - Big display headlines that end in a **trailing period** — `Sunday.` `Projects.` `Good morning, Marcos.`
  - **Mono uppercase** metadata/eyebrows with a short **olive rule** above the title.
  - A dark **"chip"** pill label, and a dark **doorway banner** carrying a CEO quote on the right.

---

## 2. Color tokens

```
/* Canvas & paper */
--paper:    #ffffff
--paper-2:  #efe9de
--paper-3:  #e6dfd6
--canvas:   #ffffff   /* page background */

/* Ink (text) — navy-charcoal, never pure black */
--ink:      #2c343b   /* primary text, dark panels */
--ink-2:    #3c4651
--ink-3:    #6c7682
--ink-4:    #9aa2ac   /* mono meta, muted labels */
--ink-5:    #c3c8ce

/* Hairlines — warm greige */
--line:     #e1dacc
--line-2:   #ece6da
--line-3:   #d4ccbd

/* SIGNATURE ACCENT — olive (use sparingly; this is THE accent) */
--gold:     #b5a642
--gold-bg:  #efead4

/* Muted editorial accents — per-room color, never neon */
--a-violet:#615ab0  --a-mint:#2f8a62  --a-coral:#c85f52
--a-amber: #aa7c33  --a-blue:#4f76ab
/* Lab extends: indigo #4e57a6, green #4a8a45, rose #bb567f, teal #2f8a86 */
```

**Rule:** olive (`--gold`) = the **brand layer** (foyer, greeting, primary CTA). The
muted editorial colors belong to **rooms/projects**, one accent per room. Dark
panels use `--ink` (#2c343b), text on them is `#fff` / `#e8e8ec`.

---

## 3. Typography

Fonts (Google Fonts — already the project's load):
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..800&family=DM+Mono:wght@400;500&family=Inter:wght@400..700&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&display=swap" rel="stylesheet">
```

| Role | Family | Usage |
|---|---|---|
| **Display / brand** | `DM Sans` | headlines, hero, titles, buttons |
| **UI / body** | `Inter` | body copy, inputs (15px / line‑height 1.55) |
| **Mono** | `DM Mono` | eyebrows, metadata, datestamps — UPPERCASE, letter‑spacing .07em |
| **Serif accent** | `Newsreader` *italic* | a single emphasized word inside a headline (`.em`) |

**Scale (real values):**
```
Hero (doorway/day):  font: 800 clamp(76px, 11.5vw, 156px)/.82 DM Sans; letter-spacing:-.05em
Greeting hero:       font: 900 clamp(52px, 7vw, 92px)/.92 DM Sans;  letter-spacing:-.04em
Section display:     font: 800 ~clamp(34–48px) DM Sans;            letter-spacing:-.038em
Card title:          font: 700 27px DM Sans;                        letter-spacing:-.02em
Body:                font: 400 15px Inter; line-height:1.55
Mono eyebrow:        font: 500 11px DM Mono; UPPERCASE; letter-spacing:.07em; color:--ink-4 (or --gold)
```

---

## 4. Shape & depth
```
--radius: 0px        /* STRAIGHT EDGES everywhere — squares, not rounded (dots stay round) */
--shadow:      0 1px 2px rgba(16,16,20,.04), 0 8px 30px -16px rgba(16,16,20,.10)
--shadow-lift: 0 2px 4px rgba(16,16,20,.05), 0 24px 60px -24px rgba(16,16,20,.18)
borders: 1px solid var(--line)   /* thin, warm */
```

---

## 5. Layout
```
.wrap  max-width: 1080px; margin: 0 auto; padding: 46px 56px 120px
       (≤1100px → padding 40px 36px 100px)
sidebar width: 248px
```
Generous whitespace; left‑aligned editorial columns; 2‑up card grids.

---

## 6. Signature components (recipes)

**Header row (every screen):** a left mono tag + an olive rule, with a live mono
datestamp on the right (`SUNDAY, JUNE 14 · 12:48 AM`).

**Chip:** `background:#2c343b; color:#fff; padding:5px 12px; font: 700 11px mono; uppercase`.

**Doorway banner (dark):** `background:#2c343b`, white text; left column = olive rule
→ chip → giant `DM Sans 800` name; right column = a serif/display quote + mono citation;
foot = a mono motto on the left, a link with a ↓ arrow on the right. A `.light` variant
renders the same layout on white (dark text, no box) for room pages.

**Card (2‑up):** numbered mono eyebrow (`01`, `02`) + status dot, big marker title,
one‑line description, a mono meta row (`70% done · 18 updates · 3 days ago`),
and an `Open →` affordance at the foot.

**Buttons/CTA:** square; primary = `#2c343b` fill / white text or olive (`--gold`)
fill for the brand action. Hover lifts with `--shadow-lift`.

---

## 7. Do / Don't
- ✅ Trailing periods on big headlines. ✅ One olive accent. ✅ Mono uppercase meta.
  ✅ Straight corners. ✅ Warm‑white canvas, navy‑charcoal ink.
- ❌ No rounded cards. ❌ No pure black (#000) — use `#2c343b`. ❌ No neon/saturated color.
  ❌ No gradients. ❌ No generic system‑font / Inter‑everywhere look — DM Sans carries the brand.
