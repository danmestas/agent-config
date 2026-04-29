# Pikchr Theming Reference

How `pikchr-generator` produces themed SVG. See [`./syntax.md`](./syntax.md)
for the language, [`./renderers.md`](./renderers.md) for delivery surfaces,
and [`./stdlib-reference.md`](./stdlib-reference.md) for the macro library.

## 1. The model in one paragraph

Pikchr emits raw RGB hex into the SVG it produces — there's no `currentColor`
flag and no CSS-variable support in the language. To make the same source
render across 16 themes, the skill defines a **7-token sentinel palette** of
fixed hex values that the post-render [`../lib/themeize.sh`](../lib/themeize.sh)
script rewrites to CSS custom properties (`var(--bg)`, `var(--fg)`,
`var(--line)`, `var(--accent)`, `var(--muted)`, `var(--surface)`,
`var(--border)`) and prefixes with a `<style>` block that assigns those
properties to the chosen theme's hex values. Result: a single self-contained
SVG that looks correct on dark, light, or any custom background.

## 2. The 7-token sentinel palette

Author your source using only these 7 hex values for fills/strokes that
should follow the theme:

| Sentinel  | CSS variable    | Role                                           |
|-----------|-----------------|------------------------------------------------|
| `#010203` | `var(--bg)`     | Background; inverted text on accent fills      |
| `#0a0b0c` | `var(--fg)`     | Foreground / primary text                      |
| `#101112` | `var(--line)`   | Connector / lane separator                     |
| `#202122` | `var(--accent)` | Primary actors, services, decisions            |
| `#303132` | `var(--muted)`  | Secondary infra, queues, annotations           |
| `#404142` | `var(--surface)`| Passive data stores, files                     |
| `#505152` | `var(--border)` | Borders / outlines (rarely needed directly)    |

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
    ↓  (themeize.sh, single awk pass)
1. Replace each sentinel hex with var(--token)
2. Replace rgb(0,0,0) with currentColor
3. Inject <style> block:
     :where(svg) { --bg:…; --fg:…; --line:…; … color:var(--fg); background:var(--bg); }
     :where(svg) text { font-family:system-ui,…; fill:currentColor; }
    ↓
themed self-contained SVG (stdout)
```

Read [`../lib/themeize.sh`](../lib/themeize.sh) — it's 160 lines and is the
entire theming engine.

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
  own document (which defaults to black). The injected `<style>` block makes
  the SVG self-theming, so this still works *within* the SVG — but a host
  page that wants the diagram to follow page theme must inline the SVG
  instead of using `<img>`.
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
