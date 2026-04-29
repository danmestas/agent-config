# Pikchr Theming Reference

How `pikchr-generator` produces themed SVG. See [`./syntax.md`](./syntax.md)
for the language, [`./renderers.md`](./renderers.md) for delivery surfaces,
and [`./stdlib-reference.md`](./stdlib-reference.md) for the macro library.

## 1. The model in one paragraph

Pikchr emits raw RGB hex into the SVG it produces — there's no `currentColor`
flag and no CSS-variable support in the language. To make the same source
render across 16 themes, the skill defines a **7-token sentinel palette** of
fixed hex values that the post-render [`../lib/themeize.sh`](../lib/themeize.sh)
script rewrites to the chosen theme's concrete hex values. It also prefixes
the SVG with a `<style>` block (so text inherits theme color via
`currentColor`) and a full-viewport `<rect>` painted with the theme's
background. Result: a single self-contained SVG that renders identically in
browsers, librsvg, ImageMagick, kitten icat, GitHub preview, and every other
SVG consumer — no `var()` refs, no `color-mix()`, just baked hex.

## 2. The 7-token sentinel palette

Author your source using only these 7 hex values for fills/strokes that
should follow the theme:

| Sentinel  | Token name | Role                                           |
|-----------|------------|------------------------------------------------|
| `#010203` | `bg`       | Background; inverted text on accent fills      |
| `#0a0b0c` | `fg`       | Foreground / primary text                      |
| `#101112` | `line`     | Connector / lane separator                     |
| `#202122` | `accent`   | Primary actors, services, decisions            |
| `#303132` | `muted`    | Secondary infra, queues, annotations           |
| `#404142` | `surface`  | Passive data stores, files                     |
| `#505152` | `border`   | Borders / outlines (rarely needed directly)    |

Each sentinel is rewritten by `themeize.sh` to the theme's concrete hex.
Tokens missing from a theme (most themes only define `bg`, `fg`, `line`,
`accent`, `muted`) are derived via sRGB mix against `fg` and `bg` at
compile time, also yielding concrete hex.

Plus one bonus: `rgb(0,0,0)` (pikchr's default for un-colored elements) is
rewritten to `currentColor`. So if you set NO `color`/`fill` on a shape, it
will paint with `var(--fg)` automatically — that's why minimalist diagrams
just work.

## 3. Inline form vs. macro form

```
# Inline sentinel — full control
box "Custom" fit fill 0x202122 color 0x010203 thickness 1.5px rad 5px

# Stdlib macro — same effect, semantic name
actor("Custom")
```

Prefer macros (`actor`, `lambda`, `db`, `queue`, `decision`, `note`,
`datastore`, `cloud`) for visual consistency across diagrams. See
[`./stdlib-reference.md`](./stdlib-reference.md). Drop to inline sentinels
only when no macro fits.

**Never use raw RGB or color names** for theme-tracked elements — `fill 0x4a90e2`
or `fill lightcyan` will pass through unchanged and look wrong in 15 of 16
themes. The only exception is **semantic accent colors** you intentionally
want to keep (a hard-coded red for "error" branches, etc.); those are
recognized as user intent and left alone.

## 4. Themes (16)

Defined in [`../lib/themes.json`](../lib/themes.json). Each theme is a JSON
object mapping the 7 token names to concrete hex values:

```json
"tokyo-night": {
  "bg":      "#1a1b26",
  "fg":      "#a9b1d6",
  "line":    "#3d59a1",
  "accent":  "#7aa2f7",
  "muted":   "#565f89",
  "surface": "...",
  "border":  "..."
}
```

Available: `default` (= `zinc-dark`), `zinc-light`, `zinc-dark`, `tokyo-night`,
`tokyo-storm`, `tokyo-light`, `catppuccin`, `latte`, `nord`, `nord-light`,
`dracula`, `github`, `github-dark`, `solarized`, `solar-dark`, `one-dark`,
`cursor-dark`.

Missing tokens fall back to `color-mix()` derivations against `--fg` and
`--bg`, so a minimal theme defining only `bg` + `fg` still works.

## 5. The full pipeline

```
.pikchr source
    ↓  (compile.sh)
pikchr binary --svg-only
    ↓
raw SVG with sentinel hexes (#010203 … #505152)
    ↓  (themeize.sh)
1. Resolve theme tokens; derive missing surface/border via sRGB mix(fg,bg,pct)
2. Replace each sentinel hex with the theme's concrete hex
3. Replace rgb(0,0,0) with currentColor (so default-colored shapes follow theme)
4. Inject inside <svg ...>:
     <style>:where(svg) { color:#FG; background:#BG; }
            :where(svg) text { font-family:system-ui,…; fill:currentColor; }</style>
     <rect width="100%" height="100%" fill="#BG"/>
    ↓
themed self-contained SVG (stdout) — every color is concrete hex
```

Read [`../lib/themeize.sh`](../lib/themeize.sh) — it's the entire theming
engine in one file.

## 6. Adding a new theme

1. Open [`../lib/themes.json`](../lib/themes.json).
2. Add an entry with at minimum `bg` + `fg`. Add `line`, `accent`, `muted`,
   `surface`, `border` for full control; otherwise they derive via
   `color-mix(in srgb, var(--fg) X%, var(--bg))`.
3. Verify WCAG AA contrast: ≥ 4.5:1 for text (fg on bg, bg on accent) and
   ≥ 3:1 for non-text (line on bg).
4. Run `bash test/run.sh` — the theme test enumerates all themes and ensures
   every template renders cleanly under each.

## 7. Hard limitations

- **No CSS variables in pikchr source.** `fill var(--accent)` will not parse.
  Pikchr requires concrete RGB to perform its internal layout pass. Use the
  sentinel hex (`fill 0x202122`) and let `themeize.sh` rewrite it.
- **`<img src="diagram.svg">` does NOT inherit parent `color`.** When the
  SVG is loaded as an image, its `currentColor` resolves against the SVG's
  own `color` (set by the injected `<style>` block to the theme's `fg` hex).
  This is intentional: the SVG carries its theme with it. To follow the
  host page's theme dynamically, inline the SVG — but for committed-to-repo
  SVGs that's almost never what you want.
- **`color black` / `color 0x000000` baking.** Pikchr emits these as
  `rgb(0,0,0)`, which `themeize.sh` rewrites to `currentColor`. If you
  genuinely need forced-black, use `color 0x010101` — close enough to read
  as black, sentinel-distinct.
- **5 strings per object max.** For more, use a `text` primitive at the
  desired position.

## 8. Worked example

A flowchart with one "error" branch that stays red across all themes.

**Source (`example.pikchr`):**

```pikchr
down
Start: oval "Start" fit
arrow
Check: decision("Valid?")            # decision macro → sentinel accent
arrow "yes" rjust
OK:    lambda("Process")
arrow
Done:  oval "Done" fit

# Error branch — explicit semantic red, baked into every theme
arrow from Check.e right 0.8in "no" above color 0xdc2626
Err:   box "Show error" fit color 0xdc2626 fill 0xfecaca
```

**Compile:**

```bash
bin/compile.sh --with-stdlib --theme tokyo-night example.pikchr > example.svg
```

**Result.** Default-color shapes follow the tokyo-night palette. The decision
diamond and process box use accent fill from the theme. The error branch
stays red on every theme, a deliberate semantic accent.

## 9. Skill checklist

- Compile with [`../bin/compile.sh`](../bin/compile.sh) — never invoke
  `bin/pikchr` directly; you'd skip themeize and emit non-themed output.
- Author with sentinel hex (`0x202122`, etc.) or stdlib macros — never raw
  RGB except for intentional semantic accents.
- Forced-black: `0x010101`. Forced-white: `0xfefefe`. Avoid `0x000000` /
  `0xffffff`.
- Themes are runtime-pickable per render. Same source can ship 16 different
  SVGs with `for t in $(jq -r 'keys[]' lib/themes.json); do …; done`.
