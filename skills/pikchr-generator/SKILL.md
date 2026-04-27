---
name: pikchr-generator
description: |
  Generate, theme, and render technical diagrams across four engines (Pikchr,
  GraphViz, D2, Mermaid) with a shared 16-theme palette. Use whenever the user
  asks for a diagram, flowchart, sequence diagram, system architecture,
  state machine, data pipeline, swim lane, network topology, ER diagram,
  class diagram, or any boxes-and-arrows technical illustration AND mentions
  pikchr, graphviz, dot, d2, or mermaid OR has indicated a preference for
  text-defined diagrams (over excalidraw/figma). Also use when the user says
  "draw the architecture", "diagram this flow", "make a chart of X", "show
  the states", "graph this topology", or asks for any visual these engines
  are suited for. Outputs themed SVG (any of 16 themes via --theme NAME).
  Do NOT use for freeform sketches that need curves and pen strokes (use
  excalidraw), real Gantt/pie charts (use a chart library), or rich data viz.
allowed-tools:
  - Bash
  - Read
  - Write
version: 0.2.0
type: skill
targets:
  - claude-code
  - apm
category:
  primary: tooling
---

# Pikchr Generator (multi-engine)

Author technical diagrams in any of four text-defined engines — **Pikchr**, **GraphViz `dot`**, **D2**, or **Mermaid** — compile them to themed SVG via a shared 16-theme palette, then inline or commit the result.

## Resolving the skill directory

Every command below uses `$SKILL_DIR`. Set it once per session. The resolver finds the skill regardless of where it was installed (global, project-local, APM-deployed, symlinked):

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

## When to use this skill

Trigger when the user wants a **technical diagram** — flowchart, sequence, system architecture, state machine, data pipeline, swim lane, ER, class, network topology — and either explicitly mentions one of the supported engines (pikchr, graphviz/dot, d2, mermaid) OR has expressed a preference for text-defined diagrams.

Engine selection (see `docs/engine-matrix.md` for the full table):

| Diagram type | Best engine | Fallback |
|---|---|---|
| System architecture (boxes + arrows) | **pikchr** or **d2** | — |
| Flowchart | **mermaid** or **pikchr** | — |
| Sequence diagram | **d2** (native) or **mermaid** | pikchr (hand-rolled lifelines) |
| State machine | **mermaid** `stateDiagram-v2` | d2 |
| Network topology / graph layout | **dot** | — |
| ER diagram | **mermaid** `erDiagram` | — |
| Class diagram | **mermaid** `classDiagram` | — |
| BPMN / swim lanes | **pikchr** (hand-rolled) | d2 |

**Do NOT use** for: freeform sketches (excalidraw), real Gantt/pie charts (charting libs), or rich data viz.

## First-run check: install the engine(s)

The four engines are independent — install only what you need.

| Engine | Installer | Binary path | Runtime dep |
|---|---|---|---|
| pikchr | `bash $SKILL_DIR/bin/install-pikchr.sh` | `$SKILL_DIR/bin/pikchr` | C compiler |
| dot (GraphViz) | `bash $SKILL_DIR/bin/install-dot.sh` | `$SKILL_DIR/bin/dot` (symlink) | brew / apt |
| d2 | `bash $SKILL_DIR/bin/install-d2.sh` | `$SKILL_DIR/bin/d2` | — (tarball) or brew |
| mermaid | `bash $SKILL_DIR/bin/install-mermaid.sh` | `$SKILL_DIR/bin/node_modules/` | Node 18+ |

Quick probe:

```bash
ls "$SKILL_DIR/bin/pikchr" "$SKILL_DIR/bin/d2" 2>/dev/null
command -v dot node
ls "$SKILL_DIR/bin/node_modules/beautiful-mermaid" 2>/dev/null
```

## Workflow

```
authoring (.pikchr / .dot / .d2 / .mmd) → compile → themed SVG
```

1. **Author** the source in whichever engine syntax fits the diagram type.
2. **Compile** with the universal dispatcher (auto-detects engine from extension) or the engine-specific compiler.
3. **Display** by reading the SVG with the multimodal `Read` tool (to show inline in this conversation) or committing it to the repo for README embedding.

## Common commands

### Universal dispatcher

```bash
# Auto-detect engine from extension, apply theme, emit SVG on stdout
"$SKILL_DIR/bin/render.sh" --theme tokyo-night path/to/diagram.pikchr > diagram.svg
"$SKILL_DIR/bin/render.sh" --theme cursor-dark path/to/topology.dot > topology.svg
"$SKILL_DIR/bin/render.sh" --theme dracula path/to/flow.d2 > flow.svg
"$SKILL_DIR/bin/render.sh" --theme github path/to/state.mmd > state.svg

# Explicit engine override (required for stdin)
echo 'box "x"' | "$SKILL_DIR/bin/render.sh" --engine pikchr --theme solar-dark -

# Stdlib macros (pikchr + dot only)
"$SKILL_DIR/bin/render.sh" --with-stdlib path/to/diagram.pikchr > diagram.svg
```

### Engine-specific compilers (bypass dispatcher)

```bash
# pikchr
"$SKILL_DIR/bin/compile.sh"         [--theme NAME] [--with-stdlib] file.pikchr > file.svg

# GraphViz dot
"$SKILL_DIR/bin/compile-dot.sh"     [--theme NAME] [--with-stdlib] file.dot     > file.svg

# D2
"$SKILL_DIR/bin/compile-d2.sh"      [--theme NAME]                 file.d2      > file.svg

# Mermaid
"$SKILL_DIR/bin/compile-mermaid.sh" [--theme NAME]                 file.mmd     > file.svg
```

## Themes

Sixteen shared themes work across all four engines. Every SVG output includes a `<style>` block defining CSS custom properties (`--bg`, `--fg`, `--line`, `--accent`, `--muted`, `--surface`, `--border`) — the body references these via `var(--token)` so the same source renders different colors per theme.

Available themes: `default`, `zinc-light`, `zinc-dark`, `tokyo-night`, `tokyo-storm`, `tokyo-light`, `catppuccin`, `latte`, `nord`, `nord-light`, `dracula`, `github`, `github-dark`, `solarized`, `solar-dark`, `one-dark`, `cursor-dark`.

`default` is an alias for `zinc-dark`.

## How the theming works

The per-engine compile wrappers all pipe their raw SVG through `$SKILL_DIR/lib/themeize.sh`, which:

1. Replaces sentinel hex values (`#010203`, `#0a0b0c`, `#101112`, `#202122`, `#303132`, `#404142`, `#505152`) with `var(--bg)`, `var(--fg)`, `var(--line)`, `var(--accent)`, `var(--muted)`, `var(--surface)`, `var(--border)` respectively.
2. Injects a `<style>` block that assigns the selected theme's concrete hex values to those custom properties.
3. Ensures `text` elements inherit `currentColor` so foreground copy follows the theme.

Engine-specific stdlibs (`lib/stdlib.pikchr`, `lib/stdlib.dot`) use sentinel colors in their shape macros. D2 and Mermaid handle defaults natively via `--theme=0` / beautiful-mermaid's theme map, but sentinel colors in user sources still get themed.

## Reference materials

- `references/syntax.md` — pikchr language reference (primitives, attributes, layout, cheatsheet)
- `references/theming.md` — theming guide (palette structure, gotchas, adding new themes)
- `references/renderers.md` — which engines render where (GitHub, VS Code, mdBook, agent harnesses)
- `references/stdlib-reference.md` — pikchr macro stdlib docs
- `../../docs/engine-matrix.md` — full engine decision table

## Authoring tips

**Pikchr:** single-pass (define before reference). Use relative positioning (`at A.e + (0.5, 0)`). Macro args: write `$1` **unquoted** in macro bodies — pikchr tokenises before substitution.

**Dot:** let the layout engine do the work. Use `rankdir=LR` / `TB` and subgraph clusters; prefer attribute defaults (`node [shape=box,...]`) at the top.

**D2:** use named shapes (`shape: sequence_diagram`, `shape: cylinder`) when they match your intent; apply per-node style for sequence diagrams (wildcards don't work inside `shape: sequence_diagram`).

**Mermaid:** `graph TD;`, `sequenceDiagram`, `stateDiagram-v2`, `erDiagram`, `classDiagram`. One statement per line (semicolons work in classic `graph`/`flowchart` but not everywhere).

## Quick start: produce a diagram for the user, right now

```bash
# 1. Write the source (picking the right engine for the job)
cat > /tmp/diagram.d2 <<'EOF'
shape: sequence_diagram
Browser: "Browser"
Server: "Server"
Browser -> Server: GET /api
Server -> Browser: 200 OK
EOF

# 2. Compile + theme
"$SKILL_DIR/bin/render.sh" --theme tokyo-night /tmp/diagram.d2 > /tmp/diagram.svg

# 3. Show the user via multimodal Read
# (call the Read tool on /tmp/diagram.svg)
```

## Decision tree: delivering the diagram to the user

```
Did the user ask to see the diagram NOW in this conversation?
├── YES → render.sh → Read the SVG (multimodal display)
└── NO  → Where will it eventually live?
         ├── GitHub README / generic markdown → render.sh → commit the .svg
         ├── Fossil / mdBook (with pikchr plugin)
         │   → leave as `.pikchr` source in a fenced code block
         └── Custom site → render.sh → embed the <svg> inline
```
