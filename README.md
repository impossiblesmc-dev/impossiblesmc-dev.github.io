# Impossibles

Personal site. Static HTML, CSS and one small script. No framework, no build
step, no dependencies to install. What is in this repository is exactly what the
browser receives.

```
index.html          the whole page
tokens.css          the design system: colour, type, space, motion
assets/site.css     page styles, every value drawn from tokens.css
assets/site.js      rail position indicator, copy button
assets/favicon.svg  site icon
.hallmark/log.json  which design was used, so a later pass picks a different one
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

## The design

Built with the Hallmark design skill. The stamp at the top of `assets/site.css`
records the choices so a later pass does not repeat them:

| Choice | Value |
| --- | --- |
| Genre | editorial |
| Macrostructure | Long Document |
| Theme | Almanac: warm oat paper, roman serif display, vermilion accent |
| Navigation | N3 side rail |
| Footer | Ft4 dense colophon |
| Type | Newsreader display, IBM Plex Sans body, JetBrains Mono for machine-facing facts |
| Motion | none beyond link, button and focus states |

Colour lives only in `tokens.css`. Nothing in `assets/site.css` contains a raw
hex, `oklch()` or `rgb()` value, so the palette can be changed in one file. The
neutral and rule lightness values were solved against WCAG ratios rather than
chosen by eye: every text pair clears 4.5:1 and every control boundary clears
3:1.

## Editing

Each project is one `<section class="entry">`: a heading, a monospace meta line,
then prose. Copy an existing one to add another.

The side rail is driven by the `id` on the elements its links point at. Adding a
rail entry means adding an `id`, adding a matching `<li>` in the rail, and
nothing else. The rail hides below 960px, where the document needs no navigation.

## Previewing

```bash
python -m http.server 8788
```

Then open <http://localhost:8788>. Opening `index.html` through `file://` also
renders, but the copy button falls back to its legacy path because the page is
not a secure context.
