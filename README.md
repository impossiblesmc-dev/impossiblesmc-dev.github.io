# Impossibles

Personal site. Static HTML, CSS and one script. No framework, no build step, no
dependencies to install. What is in this repository is exactly what the browser
receives.

```
index.html          the whole page
tokens.css          the design system: colour, type, space, motion
assets/site.css     page styles, every value drawn from tokens.css
assets/site.js      builds the 3D figure, drag to turn, copy button
assets/skin.png     the Minecraft skin of Impossibles, 64x64
assets/favicon.svg  site icon
.hallmark/log.json  which designs have been used, so a later pass picks another
.nojekyll           serve the files as-is, skip Jekyll
```

## Before this goes live

The GitHub account does not exist yet, and `impossibles` is already taken on
GitHub. Pick a free handle, then do three things:

1. Rename this folder to `<handle>.github.io`. A GitHub user site only publishes
   from a repository named exactly that.
2. Uncomment the GitHub row near the bottom of `index.html` and replace `HANDLE`
   in both places.
3. Create the repository, then push.

```bash
git remote add origin git@github.com:<handle>/<handle>.github.io.git
```

```bash
git push -u origin main
```

The site is then served at `https://<handle>.github.io`.

## The 3D figure

The figure in the fold is the real Minecraft skin, rebuilt as CSS 3D boxes. No
canvas, no WebGL, no library.

A skin is a 64x64 atlas. Every body part is a rectangular prism whose six faces
are laid out around one origin in a fixed cross pattern, so a single function in
`site.js` can slice any part out of the sheet given that origin and the box size
in model units. Twelve boxes, seventy-two faces, each one a `div` with a
`background-position` into `skin.png`.

Two things are easy to get wrong here:

- **Both nesting levels need `transform-style: preserve-3d`.** Miss it on the
  inner box and the browser flattens the six faces onto one plane, so the figure
  renders as a stack of overlapping rectangles instead of a solid.
- **The second skin layer must be a slightly larger box, not the same one.** At
  identical size the two surfaces z-fight and the figure flickers as it turns.

The idle turn and the drag angle are two separate nested rotations on purpose. A
single transform carrying both would have the keyframe overwrite the drag every
frame, so the figure would snap back the moment it was released.

`--skin-unit` in `tokens.css` is one model pixel in CSS pixels, and it is the
only number controlling the figure's size. `site.css` steps it up at wider
viewports; `site.js` rebuilds the boxes when that step changes, because face
sizes are baked into inline styles at build time.

### Changing the skin

Replace `assets/skin.png` with any 64x64 skin and the figure follows. The
palette will not: it was sampled from this skin and is hard-coded in
`tokens.css`. Re-sample it if the new skin has a different signal colour.

## The design

Built with the Hallmark design skill. The stamp at the top of `assets/site.css`
records the choices so a later pass does not repeat them.

| Choice | Value |
| --- | --- |
| Genre | atmospheric |
| Macrostructure | Marquee Hero |
| Theme | custom, sampled from the skin |
| Navigation | N5 floating pill |
| Footer | Ft5 statement |
| Type | Geist for display and body, JetBrains Mono for machine-facing facts |
| Motion | three primitives: figure turn, one load fade, card hover lift |

The accent is `#FF7A00`, taken from the skin, where 376 pixels of it sit against
near-black greys. Colour lives only in `tokens.css`; nothing in `assets/site.css`
contains a raw hex, `oklch()` or `rgb()` value.

Every lightness value was solved against WCAG ratios rather than chosen by eye.
Body text clears 4.5:1 on the lightest surface it ever sits on, headings clear
7:1, and both control boundaries clear 3:1.

## Editing

Each project is one `<article class="card">`: a heading, a tag, a monospace meta
line, then prose. Copy an existing one to add another. `tag--own` is the orange
variant used for work he owns rather than works on.

## Previewing

```bash
python -m http.server 8788
```

Then open <http://localhost:8788>. Opening `index.html` through `file://` also
renders, but the copy button falls back to its legacy path because the page is
not a secure context.
