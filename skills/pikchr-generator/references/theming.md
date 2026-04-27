# Pikchr Theming Reference

How the `pikchr-generator` skill produces diagrams that follow light/dark mode
without re-rendering. See [`./syntax.md`](./syntax.md) for the pikchr language,
[`./renderers.md`](./renderers.md) for rendering pipeline, and
[`./stdlib-reference.md`](./stdlib-reference.md) for reusable macros.

## 1. The Two Layers

Pikchr theming splits into two layers because pikchr's maintainer explicitly
rejected arbitrary CSS-var support in source (pikchr needs a concrete RGB value
for its internal dark-mode inversion pass).

| Layer | Lives in | Controls | Runtime-switchable? |
|-------|----------|----------|---------------------|
| Pikchr source | `.pikchr` file | Semantic accent colors (error red, success green), line weight, dashes, radii, font weight/italic, layout | No — baked into SVG |
| CSS | Host page / [`../assets/css/*.css`](../assets/css/) | Foreground (lines + labels), background, wrapper box, anything keyed to `currentColor` | Yes — flips instantly |

**Rule of thumb:** let every structural stroke and label default to ambient
color. Only set `color`/`fill` in pikchr source for *semantic accents* you
want to keep their hue in both modes.

## 2. The `currentColor` Strategy

`currentColor` is a CSS keyword that resolves to the computed `color` property
of the nearest ancestor. When an SVG attribute (`stroke`, `fill`, `<text fill>`)
receives it, the value follows CSS cascade — no JS, no re-render.

**Pikchr v1.0 emits `rgb(0,0,0)` for every default-color element** (stroke,
fill, text). The CLI has **no** `-C` / `--x-current-color` flag — only
`--dont-stop` and `--svg-only` exist. This skill substitutes post-render with
a single sed:

```bash
# from bin/compile.sh
printf '%s' "$SRC" | "$LOCAL_BIN" --svg-only - \
  | sed 's/rgb(0,0,0)/currentColor/g'
```

The substitution is deterministic: pikchr only emits `rgb(0,0,0)` when the user
did not supply a color, so every match genuinely maps to "follow the theme."
Explicit colors like `fill 0x2563eb` pass through as `rgb(37,99,235)` and stay
constant across themes — the semantic-accent guarantee. See
[`../bin/compile.sh`](../bin/compile.sh) for the full pipeline, including the
Kroki HTTP fallback (which applies the identical sed).

## 3. Three-Layer CSS Cascade

The stylesheets in [`../assets/css/`](../assets/css/) layer defaults, OS
preference, and an explicit toggle. Each layer is independent; combined they
cover every user state. See [`../assets/html/wrapper.html`](../assets/html/wrapper.html)
for the reference HTML shell that consumes them.

**Layer 1 — `:root` light defaults.** Declared first. Provides the light-mode
palette so that initial paint (before OS query resolves, before JS toggles)
looks right.

```css
:root { --pikchr-fg: #1a1a1a; --pikchr-bg: #ffffff; }
.pikchr { color: var(--pikchr-fg); background: var(--pikchr-bg); }
```

**Layer 2 — `@media (prefers-color-scheme: dark)`.** Zero-JS auto-follow for
users whose OS is set to dark. This is the accessibility default — it respects
user intent without requiring site code.

```css
@media (prefers-color-scheme: dark) {
  :root { --pikchr-fg: #e5e7eb; --pikchr-bg: #0d1117; }
}
```

**Layer 3 — `[data-theme="dark"]` / `[data-theme="light"]` attribute.** Manual
override so a site's theme-toggle button can force a mode regardless of OS.
Must come *after* the media query so explicit user choice wins. Compatible
with Docusaurus, Mintlify, Starlight, VitePress, Next.js docs, GitHub Primer.

```css
[data-theme="dark"]  { --pikchr-fg: #e5e7eb; --pikchr-bg: #0d1117; }
[data-theme="light"] { --pikchr-fg: #1a1a1a; --pikchr-bg: #ffffff; }
```

The three layers chain via CSS variables, so `currentColor` on each SVG stroke
resolves through `.pikchr { color: var(--pikchr-fg) }` and flips on whichever
signal fires last.

## 4. Palette Catalog

All three palettes are verified for WCAG AA (3:1 non-text, 4.5:1 text) on
`#ffffff` and `#0d1117`. Pick one and include it alongside the diagram.

- **Neutral** — [`../assets/css/neutral.css`](../assets/css/neutral.css).
  Blue / green / amber / red accents. **Use when** the diagram is generic
  (flowchart, architecture, state machine) and should match most docs sites.
  This is the skill's default.
- **Blueprint** — [`../assets/css/blueprint.css`](../assets/css/blueprint.css).
  Slate + sky-blue, engineering-schematic feel. **Use when** the diagram is a
  technical schematic, system map, or network topology where restraint reads
  as precision.
- **Warm** — [`../assets/css/warm.css`](../assets/css/warm.css). Orange /
  violet / yellow. **Use when** the diagram is marketing or blog content that
  needs to feel friendly rather than utilitarian.

Each palette exposes `--pikchr-fg`, `--pikchr-bg`, `--pikchr-muted`, and four
`--pikchr-accent-*` variables. The `.pikchr` rule binds `color` to
`--pikchr-fg`, which is what `currentColor` inside the SVG picks up.

## 5. Hard Limitations

**CSS variables are not allowed in pikchr source.** You cannot write
`fill var(--primary)` in a `.pikchr` file — the pikchr maintainer rejected
arbitrary color strings because pikchr needs an actual RGB value to perform its
internal dark-mode inversion. Only hex (`0x2563eb`), named colors, and value 0
(default) are accepted. Workaround: pick an accent that reads acceptably on
both backgrounds, or override via CSS attribute selector on the rendered SVG.

**`<img src="diagram.svg">` does NOT inherit parent `color`.** `currentColor`
resolves to the SVG document's own `color`, which defaults to black when
loaded as an image. Theming only works when the SVG is *inlined* into the
host HTML. This is why [`../bin/render.sh`](../bin/render.sh) emits full inline
SVG markup inside the wrapper, not an `<img>` reference.

**`--dont-stop` is the only error-handling flag.** There is no way to ask
pikchr for structured error output or theme hints from the CLI. Syntax errors
land on stdout (yes, stdout) with a non-zero exit — `compile.sh` handles this.

**Named-black equivalents bake.** Writing `color black`, `color 0x000000`, or
`fill 0x000000` in pikchr source emits `rgb(0,0,0)` *textually identical* to
the default case — which means the sed substitutes them to `currentColor` too,
likely not what you wanted. Skill rule: never write explicit black in source.
For forced black, use `color 0x010101`.

## 6. Worked Example

A flowchart with one accent-colored "error" branch. Compare
[`../templates/flowchart.pikchr`](../templates/flowchart.pikchr) for the actual
template shipped with the skill.

**Pikchr source (`example.pikchr`):**

```pikchr
down
Start: oval "Start" fit
arrow
Check: diamond "Valid?" fit
arrow "yes" rjust
OK:    box "Process" fit
arrow
Done:  oval "Done" fit

# Error branch — explicit accent color (baked into SVG, same in both themes)
arrow from Check.e right 0.8in "no" above color 0xdc2626
Err:   box "Show error" fit color 0xdc2626
```

Compile with `../bin/compile.sh example.pikchr > example.svg`. After the
sed pass, the relevant SVG fragment becomes:

```html
<!-- Default-color structural elements: follow theme via currentColor -->
<path d="..." style="fill:none;stroke-width:2.16;stroke:currentColor;"/>
<text ... fill="currentColor">Start</text>
<text ... fill="currentColor">Process</text>

<!-- Error branch: rgb() baked, stays red in light AND dark mode -->
<path d="..." style="fill:none;stroke-width:2.16;stroke:rgb(220,38,38);"/>
<text ... fill="rgb(220,38,38)">Show error</text>
```

**Host CSS (imports neutral palette):**

```css
@import url("./neutral.css");

/* The wrapper used by bin/render.sh */
.pikchr { padding: 1rem; border-radius: 6px; overflow-x: auto; }
.pikchr svg { display: block; max-width: 100%; height: auto; }
.pikchr svg text { font-family: ui-sans-serif, system-ui, sans-serif; }
```

**Result.** In light mode `.pikchr` has `color: #1a1a1a`, so every
`currentColor` stroke/label paints near-black on white. Flip the OS to dark
(or set `data-theme="dark"` on `<html>`) and `--pikchr-fg` becomes `#e5e7eb`;
the same strokes repaint light-gray on `#0d1117` without re-rendering. The
red error branch stays red in both modes — exactly the semantic distinction
the pikchr author baked in.

## Quick Skill Checklist

- Compile with [`../bin/compile.sh`](../bin/compile.sh) (the sed pass is
  mandatory; never emit raw pikchr output).
- Render with [`../bin/render.sh`](../bin/render.sh) to get the
  [`../assets/html/wrapper.html`](../assets/html/wrapper.html) shell and
  inlined SVG.
- Ship exactly one of [`../assets/css/neutral.css`](../assets/css/neutral.css),
  [`../assets/css/blueprint.css`](../assets/css/blueprint.css), or
  [`../assets/css/warm.css`](../assets/css/warm.css) alongside.
- No `color black`, `color white`, `color 0x000000`, `color 0xffffff`,
  `fill 0x000000`, `fill 0xffffff` in pikchr source.
- Never use `<img src="...">` — theming requires inlined SVG.
- Accent colors baked in source should pass 3:1 contrast on both `#ffffff`
  and `#0d1117`.
