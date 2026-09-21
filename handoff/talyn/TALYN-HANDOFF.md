# TALYN — brand & UI handoff

Everything needed to rebuild the TALYNT visual system under the name **TALYN**, in
another project or another AI session.

> **Scope note.** This describes the TALYNT LABS site in this repository. It is
> not derived from the Lovable app — that URL is blocked by this environment's
> network policy and was never opened.

---

## 1. What changes, and what doesn't

| | Change |
|---|---|
| Wordmark | `TALYNT` → `TALYN` — regenerated as vector outlines |
| Mark (the "T" in the rounded square) | **No change.** TALYN still starts with T |
| Submark / favicon | **No change.** They contain no wordmark |
| Colours | **No change.** Identical hex values |
| Type, spacing, motion, components | **No change** |

Only the lockups that contain the word are new artwork.

---

## 2. Logo files

In `handoff/talyn/logo/`. All vector outlines — no live text — so nothing can
font-substitute or reflow.

**With the `LABS` descriptor**
```
talyn-primary-{light,dark,mono}.svg     default lockup
talyn-tagline-{light,dark,mono}.svg     endorsed lockup, with tagline
talyn-stacked-{light,dark,mono}.svg     square and narrow spaces
```

**Wordmark only, no descriptor** — use if the product is just "Talyn"
```
talyn-solo-primary-{light,dark,mono}.svg
talyn-solo-stacked-{light,dark,mono}.svg
talyn-solo-tagline-{light,dark,mono}.svg
```

**Mark only** — identical for either naming
```
talyn-submark-{light,dark,mono}.svg     avatars, app icons, stamps
talyn-favicon.svg                       16px: heavier strokes, stem stops at the node
```

Colourway meaning:
- **light** — for placing *on* a light background (dark frame)
- **dark** — for placing *on* a dark background (light frame)
- **mono** — one colour via `currentColor`; the T is knocked out so the ground
  shows through, with a halo around the node so it doesn't merge into the frame

**Minimum sizes:** primary 120px wide · tagline 180px wide · stacked 72px wide ·
submark 24px · favicon 16px.
**Clear space:** a quarter of the mark's height on every side.

---

## 3. Colour — exact values, unchanged

```css
/* Ink — warm near-black. The system. */
--ink-950: #08080a;
--ink-900: #0b0b0d;   /* page background */
--ink-850: #101013;   /* raised panels */
--ink-800: #16161a;
--ink-700: #1e1e23;
--ink-600: #2a2a31;
--ink-500: #3b3b44;
--ink-400: #585863;
--ink-300: #82828f;
--ink-200: #aeaeba;
--ink-100: #d5d5dd;

/* Paper — warm off-white. The human. */
--paper-50:  #fbf9f5;
--paper-100: #f5f2ea;  /* light background, and body text on ink */
--paper-200: #ece7db;
--paper-300: #ddd6c6;
--paper-400: #c3bbaa;

/* Signal — the single accent. */
--signal-300: #ff9370;
--signal-400: #ff6b3d;
--signal:     #ff4d1c;  /* the one that matters */
--signal-600: #e03d10;
--signal-700: #b52f08;
```

**Rule:** signal is for interaction, highlights, selected data and emphasis only.
Never decoration, never large fills, never a gradient. On the mark it appears
exactly once — on the node.

---

## 4. Typography

| Role | Face | Where |
|---|---|---|
| Display | **Newsreader** (serif, 200–800, real italic) | Headlines, pull quotes, manifesto |
| Interface / body | **Geist** | Everything functional |
| Mono | **Geist Mono** | Labels, signals, coordinates, indices, candidate refs |

All three are on Google Fonts. The split is deliberate: **serif = the human
voice, mono = the machine, grotesk = the interface where they meet.**

```css
--font-display: Newsreader, "Times New Roman", serif;
--font-sans:    Geist, ui-sans-serif, system-ui, sans-serif;
--font-mono:    "Geist Mono", ui-monospace, "SFMono-Regular", monospace;
```

### Scale (fluid)

```css
--text-micro: 0.6875rem;
--text-label: 0.75rem;
--text-body:  1.0625rem;                                   /* 17px */
--text-lede:  clamp(1.15rem, 0.95rem + 0.85vw, 1.6rem);
--text-h3:    clamp(1.35rem, 1.1rem  + 1.1vw,  2rem);
--text-h2:    clamp(2.1rem,  1.35rem + 3.2vw,  4.4rem);
--text-h1:    clamp(2.6rem,  1.3rem  + 5.6vw,  7rem);
--text-mega:  clamp(3rem,    0.8rem  + 9vw,    10.5rem);
```

### Display setting
```css
font-family: var(--font-display);
font-weight: 400;
line-height: 0.98;
letter-spacing: -0.028em;
```

### Mono label setting
```css
font-family: var(--font-mono);
font-size: 0.75rem;
font-weight: 450;
letter-spacing: 0.14em;
text-transform: uppercase;
```

---

## 5. Crisp text — the part most builds get wrong

This is the single highest-impact rule in the whole system.

**Never dim text with `opacity`.** Element opacity composites an
already-antialiased glyph, so stems thin and edges wash out. It is the usual
cause of soft, muddy body text on dark backgrounds.

Instead, give each tone a **solid foreground scale** whose values are the exact
colour the opacity would have produced:

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-optical-sizing: auto;
  font-synthesis-weight: none;
  letter-spacing: -0.006em;
  /* Do NOT set text-rendering: optimizeLegibility — it buys nothing here
     and is a known source of soft rendering. */
}

/* On ink backgrounds (paper text over #0b0b0d) */
.tone-ink {
  --fg-30: #51504f;  --fg-35: #5d5c5a;  --fg-40: #696765;
  --fg-45: #747370;  --fg-50: #807e7c;  --fg-55: #8c8a87;
  --fg-60: #979692;  --fg-65: #a3a19d;  --fg-70: #afada8;
  --fg-75: #bab8b3;  --fg-80: #c6c4be;  --fg-85: #d2cfc9;
  background: #0b0b0d;
  color: #f5f2ea;
}

/* On paper backgrounds (ink text over #f5f2ea) */
.tone-paper {
  --fg-30: #afada8;  --fg-35: #a3a19d;  --fg-40: #979692;
  --fg-45: #8c8a87;  --fg-50: #807e7c;  --fg-55: #747370;
  --fg-60: #696765;  --fg-65: #5d5c5a;  --fg-70: #51504f;
  --fg-75: #464544;  --fg-80: #3a3939;  --fg-85: #2e2e2e;
  background: #f5f2ea;
  color: #0b0b0d;
}
```

Then `color: var(--fg-65)` wherever you would have written `opacity: 0.65`.
Identical colour, full-strength glyphs, no compositing layer.

Body copy sits at `--fg-60`/`--fg-65`; mono labels at `--fg-35`/`--fg-45`;
footnotes at `--fg-30`/`--fg-35`.

Opacity is still fine for **non-text**: dots, rules, hairlines, hover
transitions, disabled states.

---

## 6. Layout, motion, components

```css
--gutter:  clamp(1.25rem, 4vw, 4rem);   /* horizontal page padding */
--section: clamp(6rem, 12vh, 11rem);    /* vertical section rhythm  */
max-width: 88rem;                        /* content container        */

--ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out-quint: cubic-bezier(0.83, 0, 0.17, 1);
```

- **Two tones alternate.** `tone-ink` = the system at work (product UI, data,
  diagrams). `tone-paper` = the human argument (philosophy, talent, the close).
- **Hairlines, not boxes.** Borders are `currentColor` at 10–15% alpha. Cards
  use `border-radius: 0.5rem`; the product panel uses `0.75rem`; buttons are
  full pills.
- **Motion:** one rule — content rises 22px and settles, once, then stays still.
  `duration: 0.75s`, `ease-out-expo`. No bouncing, no looping, no idle movement.
  Every scroll-driven visual needs a composed static end-state under
  `prefers-reduced-motion: reduce`.
- **Numbers are mono and tabular.** `font-variant-numeric: tabular-nums`.
- **Focus rings** are 2px solid signal, 3px offset. Never removed.

---

## 7. Open question for you

The files ship in two versions because I don't know which is right:

- **`talyn-*`** keeps the `LABS` descriptor — use if the entity is "Talyn Labs"
- **`talyn-solo-*`** is the wordmark alone — use if it is simply "Talyn"

The tagline *"Talent intelligence, built for hiring."* carried over from TALYNT.
Replace it if Talyn's positioning differs.

---

## 8. Prompt for the other tab

Copy everything between the lines into the session building Talyn. Attach the
SVGs from `handoff/talyn/logo/` alongside it.

---

Use this exact brand and UI system. Do not invent alternative colours, fonts or
spacing — these values are fixed.

**Brand:** TALYN. The mark is a rounded square containing a "T" with a single
accent-coloured node on its stem. I am attaching the logo as SVG files — use
them as-is, do not redraw them. Files ending `-light` go on light backgrounds,
`-dark` on dark backgrounds, `-mono` is single-colour via currentColor.

**Colours — use these exact hex values and no others:**
- Background (dark): `#0b0b0d`. Raised panels: `#101013`.
- Background (light): `#f5f2ea`.
- Accent: `#ff4d1c`. Hover/pressed: `#e03d10`.
- The accent is for interaction, highlights, selected data and emphasis only.
  Never a gradient, never a large fill, never decoration.

**Fonts — all from Google Fonts:**
- Headlines: **Newsreader**, weight 400, `line-height: 0.98`,
  `letter-spacing: -0.028em`. Use its real italic for emphasis.
- Body and UI: **Geist**, 17px base, `line-height: 1.55`.
- Labels, data, numbers: **Geist Mono**, 12px, `letter-spacing: 0.14em`,
  uppercase, `tabular-nums`.

**Critical text-rendering rule — this is what makes the type look crisp:**
Never use `opacity` to dim text. Use solid colours instead. On the dark
background use `#a3a19d` for body copy, `#8c8a87` for secondary text and
`#5d5c5a` for faint labels. On the light background use `#5d5c5a`, `#747370`
and `#a3a19d` respectively. Set `-webkit-font-smoothing: antialiased` and
`letter-spacing: -0.006em` on the body, and do **not** set
`text-rendering: optimizeLegibility`.

**Layout:**
- Content max-width `88rem`, horizontal padding `clamp(1.25rem, 4vw, 4rem)`,
  vertical section rhythm `clamp(6rem, 12vh, 11rem)`.
- Alternate dark and light sections: dark for product UI, data and diagrams;
  light for the written argument.
- Separate things with 1px hairlines at 10–15% alpha, not boxes or shadows.
- Cards `border-radius: 0.5rem`. Buttons are full pills.

**Motion:** content rises 22px and settles once, `0.75s`,
`cubic-bezier(0.16, 1, 0.3, 1)`. Nothing loops, bounces or idles. Provide a
static end-state for `prefers-reduced-motion: reduce`.

**Accessibility:** semantic HTML, one `h1`, visible focus rings (2px solid
`#ff4d1c`, 3px offset), and real alt text.

**Tone of voice:** confident, concise, human, slightly provocative, never
corporate. Short sentences. Strong statements. Plenty of whitespace. Avoid
"end-to-end solutions", "cutting-edge AI", "best-in-class", "seamless" and
similar filler.

---
