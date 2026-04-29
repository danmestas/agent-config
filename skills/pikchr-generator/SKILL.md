---
name: pikchr-generator
version: 0.3.0
description: |
  Author production-grade technical diagrams in Pikchr — a deterministic,
  text-defined diagram DSL that compiles to a single self-contained SVG.
  Use whenever the user asks for a flowchart, sequence diagram, system
  architecture, state machine, data pipeline, swim lane, or any
  boxes-and-arrows technical illustration AND has expressed a preference
  for text-defined / source-controlled diagrams (over excalidraw, figma,
  or hand-drawn art). Also use when the user says "draw the architecture",
  "diagram this flow", "show the states", "graph this topology", or
  mentions pikchr by name. Output is themed SVG (16 themes via --theme NAME)
  that renders inline in any Markdown surface that accepts SVG (GitHub,
  GitLab, Obsidian, mdBook, agent multimodal Read, etc.). Do NOT use for
  freeform sketches with curves and pen strokes (excalidraw), real
  Gantt/pie charts (a chart library), or rich data viz.
type: skill
targets:
  - claude-code
  - apm
category:
  primary: tooling
---

# Pikchr Generator

Author technical diagrams in **Pikchr** — Brian Kernighan's PIC, modernized
for the web — and compile them to themed SVG. One engine. One workflow.
Every shape, line, and label flows through the 16-theme palette so the same
source renders cleanly in dark mode, light mode, or any other theme.

## Why Pikchr

- **Deterministic.** Same source → same SVG, byte-for-byte. No layout engine roulette.
- **Self-contained.** Output is a single `<svg>` block — no external fonts, scripts, or assets.
- **Source-controlled.** Diff-friendly text. Commit `.pikchr` next to `.svg` so reviewers see both intent and result.
- **Native rendering** in Fossil, mdBook (with `mdbook-pikchr`), Sphinx (`sphinxcontrib-kroki`), AsciiDoctor, and Obsidian (`Adamantine Pick`). Pre-render to SVG for everywhere else.

## Resolving the skill directory

Every command below uses `$SKILL_DIR`. Set it once per session:

```bash
SKILL_DIR="$(
  for c in \
    "$HOME/.claude/skills/pikchr-generator" \
    "$PWD/.claude/skills/pikchr-generator" \
    "$PWD/.apm/skills/pikchr-generator"; do
    [[ -f "$c/SKILL.md" ]] && echo "$c" && break
  done
)"
[[ -n "$SKILL_DIR" ]] || { echo "pikchr-generator skill not found"; exit 1; }
```

## First-run check: install the binary

```bash
ls "$SKILL_DIR/bin/pikchr" 2>/dev/null || bash "$SKILL_DIR/bin/install-pikchr.sh"
```

The installer compiles `pikchr.c` (single-file C source) and drops the binary at `$SKILL_DIR/bin/pikchr`. Needs a C compiler (`cc`).

## The one workflow

```
.pikchr (source)  →  bin/compile.sh --theme NAME  →  themed .svg
```

```bash
# File input, themed output to stdout
"$SKILL_DIR/bin/compile.sh" --theme tokyo-night diagram.pikchr > diagram.svg

# Stdin
echo 'box "hi"' | "$SKILL_DIR/bin/compile.sh" --theme dracula -

# Prepend stdlib macros (db, actor, lambda, queue, decision, note, ...)
"$SKILL_DIR/bin/compile.sh" --theme nord --with-stdlib diagram.pikchr > diagram.svg

# Offline build offline? Fall back to Kroki HTTP
"$SKILL_DIR/bin/compile.sh" --theme github-dark --kroki diagram.pikchr > diagram.svg
```

That's the entire interface. No dispatcher, no engine selection, no per-format compiler — `compile.sh` is the only entry point.

## Themes (16)

`default` (= `zinc-dark`), `zinc-light`, `zinc-dark`, `tokyo-night`, `tokyo-storm`, `tokyo-light`, `catppuccin`, `latte`, `nord`, `nord-light`, `dracula`, `github`, `github-dark`, `solarized`, `solar-dark`, `one-dark`, `cursor-dark`.

Themes work via **sentinel-color substitution**: the SVG body uses 7 fixed hex sentinels (`#010203` … `#505152`), `lib/themeize.sh` rewrites them to `var(--bg)`, `var(--fg)`, `var(--line)`, `var(--accent)`, `var(--muted)`, `var(--surface)`, `var(--border)`, then injects a `<style>` block setting those custom properties to the chosen theme's hex values. Templates and the stdlib already use sentinels — your sources should too.

See `references/theming.md` for the palette structure and how to add a theme.

## Templates: start here

The fastest path to a high-quality diagram is to copy a template and adapt it. Every template uses stdlib macros + sentinel colors so themes apply uniformly.

| Template | Use for |
|---|---|
| `templates/architecture.pikchr` | System architecture (web → API → service → DB, with cache + queue side-branches) |
| `templates/flowchart.pikchr` | Top-down decision flow with a yes/no branch |
| `templates/sequence.pikchr` | Sequence-ish (actors + dashed lifelines + horizontal messages — pikchr has no native sequence type) |
| `templates/state-machine.pikchr` | States + labelled transitions, with backedges |
| `templates/data-pipeline.pikchr` | Source → transform → sink chain with a side-monitoring branch |
| `templates/swim-lane.pikchr` | 3-lane process diagram with cross-lane arrows |

## Authoring discipline

Pikchr rewards a small number of strong habits. Follow these for diagrams that read cleanly and re-theme cleanly.

### 1. Use the stdlib macros for visual hierarchy

`--with-stdlib` prepends `lib/stdlib.pikchr`, which defines pseudo-primitives that map to **roles**, not shapes:

| Macro | Role | Visual |
|---|---|---|
| `actor("X")` | primary actors / entry points | accent fill, inverted text |
| `lambda("X")` | services / functions | accent fill, rounded |
| `decision("X")` | branches | accent fill, diamond |
| `db("X")` | persistent stores | surface fill, cylinder |
| `datastore("X")` | passive files / artifacts | surface fill, file shape |
| `queue("X")` | queues / streams | muted fill, oval |
| `cloud("X")` | external services | surface fill, ellipse |
| `note("X")` | annotations | muted fill, dashed |

When you need a custom shape, use sentinel colors directly (`fill 0x202122`, `color 0x0a0b0c`, etc.) — never raw RGB. Raw colors will not theme.

### 2. Position relatively, not absolutely

Anchor every node off another node's edge. Use compass anchors (`A.e`, `B.s`, `C.ne`) and offsets (`A.e + (0.5, 0)`) instead of absolute coordinates. When you change a label and a node grows, the rest of the diagram still lines up.

```
# Good
API: lambda("Service") at Web.e + (1.5, 0)

# Brittle
API: lambda("Service") at (3.5, 0)
```

### 3. Single pass — define before reference

Pikchr parses top-to-bottom in a single pass. Forward references break. Put labels (capitalized: `Web`, `API`, `DB`) in the order the reader's eye will travel.

### 4. Macro args are unquoted

Token-level lexical substitution runs **before** the parser. `"$1"` inside a macro body is one literal string token — substitution never fires inside it.

```
# Correct — caller supplies quotes
define step { box $1 fit fill 0x202122 color 0x010203 }
step("Validate")     # → box "Validate" fit ...

# Wrong — $1 is literal
define step { box "$1" fit }
step("Validate")     # → box "$1" fit  (literal label)
```

### 5. Manhattan routing for arrows that turn

`arrow from A.s down 0.3in then right until even with B then to B.n` produces a clean L-shape. Use `\` for line continuation when the path gets long.

### 6. Five strings max per object

Each object can carry up to 5 string labels (multi-line). For more, use a separate `text` primitive at the desired position.

### 7. Containers, not curly braces

`[ ... ]` groups objects. `{ ... }` is **only** for `define` macro bodies. Mixing them is a common first-time error.

### 8. One diagram, one direction

Set `right` / `down` / `left` / `up` once at the top. Containers (`[ ... ]`) get their own local direction that doesn't leak out.

## Anti-patterns

| Don't | Why |
|---|---|
| Hard-coded RGB (`fill 0x4a90e2`) | Bypasses the theme pipeline; renders the same in every theme |
| Color names (`fill lightcyan`) | Same problem — pikchr maps these to fixed hex |
| Absolute coordinates (`at (3, -2)`) | Breaks when any upstream label resizes |
| Forward references | Single-pass parser; the second pass doesn't exist |
| `{ ... }` for grouping | That's macro-body syntax. Use `[ ... ]` |
| Quoted `$1` in a macro body | Caller supplies quotes — `"$1"` is a literal token |
| 6+ strings on one shape | Hard limit of 5; use a `text` primitive for the rest |

## Delivering the diagram

```
Did the user ask to see the diagram NOW?
├── YES  → compile.sh → Read the SVG (multimodal display)
└── NO   → Where will it live?
          ├── GitHub README / generic markdown → compile.sh → commit the .svg
          ├── Fossil / mdBook+pikchr-plugin / Obsidian+Adamantine
          │     → leave as `.pikchr` source in a fenced code block
          └── Custom site → compile.sh → embed the <svg> inline
```

For the full surface-by-surface compatibility matrix and gotchas (GitHub strips `<script>`, `<img src>` doesn't inherit `currentColor`, etc.), see `references/renderers.md`.

## Quick start

```bash
# 1. Copy a template
cp "$SKILL_DIR/templates/architecture.pikchr" /tmp/diagram.pikchr

# 2. Edit it (labels, structure)

# 3. Compile + theme
"$SKILL_DIR/bin/compile.sh" --with-stdlib --theme tokyo-night /tmp/diagram.pikchr > /tmp/diagram.svg

# 4. Display via multimodal Read (or commit /tmp/diagram.svg into the repo)
```

## Reference materials

- `references/syntax.md` — pikchr language reference (primitives, attributes, layout, cheatsheet)
- `references/theming.md` — palette structure, sentinel mapping, adding new themes
- `references/renderers.md` — where pikchr renders natively vs. needs pre-render
- `references/stdlib-reference.md` — the macro stdlib, every role explained
- `lib/stdlib.pikchr` — read the source; it's 30 lines and shows every macro

## Layout

```
SKILL.md                 — this file
bin/
  pikchr                 — compiled binary
  install-pikchr.sh      — builds pikchr.c → bin/pikchr
  compile.sh             — only entry point: source → themed SVG
lib/
  stdlib.pikchr          — pseudo-primitive macros (actor, lambda, db, …)
  themeize.sh            — SVG post-processor: sentinel hex → var(--token) + <style>
  themes.json            — 16 themes × 7 tokens
templates/               — 6 starting points (all use stdlib + sentinels)
references/              — language, theming, renderers, stdlib docs
test/                    — bash smoke tests (run.sh runs all)
```
