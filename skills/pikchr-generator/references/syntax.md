# Pikchr Syntax Reference

## Mental Model

Pikchr is a small, text-based diagram DSL, a modernized descendant of Brian Kernighan's **PIC** (Bell Labs, 1980s). Source compiles deterministically to a self-contained SVG snippet. Its niche is source-controlled technical figures (flowcharts, architecture, state machines, railroad diagrams) — NOT charts, CAD, or marketing art.

The script is processed in a **single top-to-bottom pass**. Each drawn object becomes "the current position"; a global **direction** (`right`, `down`, `left`, `up`) controls where the next object lands. Positions should be expressed **relatively** (`0.3cm right of A.e`, `with .n at B.s`), not as absolute coordinates — that way sizing changes don't break layout. You cannot forward-reference: objects must exist before you name them.

Macros are **token-level lexical substitution** done BEFORE parsing. The tokenizer runs first, so `"$1"` inside a macro body is already a single string literal — substitution never fires inside it. The caller supplies quoting. Colors are always RGB literals (names map to fixed hex values, or use `0xRRGGBB`); there are NO CSS variables or `currentColor`. If you need theme-able output, post-process the SVG — e.g. `sed 's/rgb(0,0,0)/currentColor/g'`.

## Primitives

| Primitive | Class | Example |
|-----------|-------|---------|
| `box`      | block | `box "Label" rad 5px fit` |
| `circle`   | block | `circle "C" rad 0.3in` |
| `ellipse`  | block | `ellipse "E" wid 1in ht 0.5in` |
| `oval`     | block | `oval "pill" fit` |
| `cylinder` | block | `cylinder "DB" thick` |
| `diamond`  | block | `diamond "yes/no?" fit` |
| `file`     | block | `file "report.pdf" fit` |
| `dot`      | block | `dot color red at A.e` |
| `text`     | block | `text "label" big bold at (1in, 0.5in)` |
| `line`     | path  | `line from A.e to B.w` |
| `arrow`    | path  | `arrow <-> from A to B chop` |
| `spline`   | path  | `spline from A.e right 0.5in then to B.w` |
| `arc`      | path  | `arc cw from A.n to B.n` |
| `move`     | path  | `move 1cm` (invisible cursor advance) |

Block objects accept `at`/`with`; path objects accept `from`/`to`/`then`/`go`/`heading`/`close`. A single object may carry up to **5 string literals** as labels.

## Attributes by Category

### Sizing

| Attr | Alias | Applies to |
|------|-------|-----------|
| `width`     | `wid` | any block |
| `height`    | `ht`  | any block |
| `radius`    | `rad` | box (round corners), circle, cylinder, file, line (round bends) |
| `diameter`  | —     | circle |
| `thickness` | —     | any (stroke width) |

Values: absolute (`2.3cm`, `0.5in`, `30px`, `12pt`, `2pc`, `1mm`), percent of default (`wid 150%`), or expressions (`wid A.width + 0.5in`). `fit` auto-sizes to text — it must appear AFTER all strings. `thick`/`thin` are shorthands.

### Positioning

| Attr | Meaning |
|------|---------|
| `at <pos>`                  | center at pos |
| `with .<edge> at <pos>`     | edge at pos |
| `from <pos>` (lines)        | start |
| `to <pos>` (lines)          | end |
| `then ...`                  | new path segment |
| `go <dist> heading <deg>`   | polar segment |
| `<dir> until even with <p>` | Manhattan-align |
| `close`                     | close polygon |
| `chop`                      | clip line endpoint from center to edge |

Default (omitted) placement: `with .start at previous.end` in the current direction.

### Styling

| Attr | Meaning |
|------|---------|
| `color <c>`        | stroke color |
| `fill <c>`         | interior (use `None` or `Off` for transparent) |
| `thickness <dim>`  | stroke width |
| `thick` / `thin`   | shorthands |
| `invisible` / `invis` | no stroke, still occupies space |
| `solid`            | cancel invisible |
| `dashed [<len>]`   | dashed stroke |
| `dotted [<gap>]`   | dotted stroke |
| `behind <obj>`     | render before obj (z-order; for backgrounds) |
| `same [as <obj>]`  | inherit style/size from prior or named object |

Colors: 140 HTML names (case-insensitive: `red`, `Bisque`, `CadetBlue`), hex `0xffe4c4`, integer RGB `16770244`, or `None`/`Off`. No CSS vars.

### Text

Each string may be followed by any of these (applies to that string only):

| Attr | Meaning |
|------|---------|
| `above` / `below`       | stack above/below center |
| `ljust` / `rjust`       | left/right justify |
| `center`                | cancel above/below/ljust/rjust |
| `bold` / `italic`       | weight/style |
| `mono` / `monospace`    | monospace font |
| `big [big]`             | larger (stack up to 2x) |
| `small [small]`         | smaller (stack up to 2x) |
| `aligned` (lines)       | rotate text to line's slope |

Arrowheads (last wins): `->` (end, default for `arrow`), `<-` (start), `<->` (both).

## Layout & Positioning

**Compass anchors** every block has: `.n .s .e .w .ne .nw .se .sw .c` (plus aliases `.north`, `.top`, `.t`, `.bottom`, `.bot`, `.left`, `.right`, `.start`, `.end`, `.center`). `A` alone means `A.c`. Line objects also expose `1st vertex of A`, `2nd vertex of A`, etc.

**Position forms:**

| Form | Meaning |
|------|---------|
| `(expr, expr)`                       | literal coordinates |
| `A.ne` or `ne of A`                  | place on object |
| `A.c + (dx, dy)`                     | offset from place |
| `(posA, posB)`                       | X from posA, Y from posB |
| `frac of the way between A and B`    | interpolate |
| `frac way between A and B`           | same |
| `frac between A and B`               | same |
| `frac <A.ne, B.sw>`                  | compact interpolate |
| `dist heading <deg> from <pos>`      | polar offset |

**Relative keywords:** `<dist> right|left|above|below of <place>`, `<dist> <compass> of <place>` (e.g. `0.5in above A.s`).

**Direction statements** (`right`, `down`, `left`, `up`) change how the next object auto-attaches. `right` is the initial default.

**Compass degrees** (`heading`): N=0, E=90, S=180, W=270, clockwise. Don't confuse with `sin`/`cos` which take **radians**.

**Containers:** `[ ... ]` groups objects into a single unit. Interior direction changes do NOT leak out. `{ ... }` is ONLY for macro bodies, never for grouping.

**References:** `previous`, `last`, `last box`, `1st circle`, `2nd arrow`, `3rd line`, `<Label>` (must start uppercase).

## Macros

Syntax:

```
define NAME { body referencing $1 $2 ... $9 }
NAME(arg1, arg2, ...)     # no space before paren
```

Substitution happens at the **lexer** level, before parsing. This has sharp edges:

- `$1` is an unquoted token stand-in. To get a quoted string inside the macro body, **the caller quotes the argument** and the quotes travel with it.
  - CORRECT: `define node { box $1 fit }` then `node("Start")` — expands to `box "Start" fit`.
  - WRONG: `define node { box "$1" fit }` — the tokenizer sees `"$1"` as one literal string token, substitution never runs. You get a literal `$1` label.
- Multi-word arguments work because the caller quotes them: `node("Two words")` expands to `box "Two words" fit`.
- Max nesting depth: 10. Nested args must be purely `$N` OR purely literal, not a mix.
- Macros **cannot be redefined** — a second `define` with the same name breaks parsing.

## Top Gotchas

1. **Single-pass only.** No forward references. Labels must be defined before use.
2. **No control flow.** `if`, `for`, `while`, `sprintf` are intentionally absent (security). Use parameterized macros, or template the source in the host language.
3. **No `copy` / `sh`.** No file inclusion, no shell execution (security). Pikchr only sees what you feed it.
4. **`{}` vs `[]`.** Curly braces are ONLY for `define` bodies. Use square brackets `[ ... ]` for grouping. Mixing these is a common first-time error.
5. **Macro args are unquoted.** Write `box $1 fit`, not `box "$1" fit`. Callers provide quotes. Tokenization happens before substitution.
6. **`heading` uses degrees; `sin`/`cos` use radians.** N=0, clockwise for `heading`.
7. **`fit` must come AFTER all strings.** And `boxwid = 0; boxht = 0` triggers auto-fit everywhere, but empty boxes collapse.
8. **`#` and `//` comments end the current statement.** Use `/* ... */` for mid-statement comments. Use `\` at line end to continue across newlines.
9. **No `currentColor` flag.** Pikchr emits RGB literals. If you need theme-responsive colors, post-process the SVG (e.g. `sed 's/rgb(0,0,0)/currentColor/g'`). The CLI has only `--dont-stop` and `--svg-only`.
10. **5-string max per object.** For more lines, use multiple objects or `text` primitives.

## Examples

Simple flowchart:

```pikchr
down
box "Start" rad 10px fill lightgreen fit
arrow
diamond "Valid?" fit
arrow " yes" ljust
box "Process" fit
arrow
box "End" rad 10px fill pink fit
```

Left-to-right pipeline:

```pikchr
right
box "Input" fit; arrow
box "Transform" fit fill lightyellow; arrow
box "Output" fit
```

Architecture with labeled edges:

```pikchr
Client: box "Browser" fit fill lightcyan
Server: box "API" fit fill lightyellow at 2in right of Client
DB: cylinder "Postgres" fit fill lightgrey at 2in right of Server
arrow <-> from Client.e to Server.w "HTTPS" above
arrow <-> from Server.e to DB.w "SQL" above
```

Manhattan routing with line continuation:

```pikchr
A: box "A"
B: box "B" at 2in right of A + (0, -1in)
arrow from A.s down 0.3in \
  then right until even with B \
  then to B.n
```

Parameterized node (correct macro form — unquoted `$1`):

```pikchr
define step { box $1 fit fill $2 rad 5px }
down
step("Fetch", lightcyan); arrow
step("Parse", lightyellow); arrow
step("Emit", lightpink)
```

Background region with `behind`:

```pikchr
$margin = 0.2in
down
A: box "Front" fit fill white
arrow
B: box "Back" fit fill white
box ht (A.n.y - B.s.y) + $margin wid A.wid + $margin \
    at 0.5 between A and B fill 0xd8ecd0 behind A
```

## Cheatsheet

| Pattern | Snippet |
|---------|---------|
| Set direction     | `right` / `down` / `left` / `up` |
| Auto-fit box      | `box "Text" fit` |
| Rounded box       | `box "X" rad 5px` |
| Center at place   | `box at A.e + (0.5in, 0)` |
| Align edge        | `box with .nw at A.ne` |
| Bi-arrow          | `arrow <-> from A to B` |
| Clip to shape     | `arrow from A to B chop` |
| Manhattan bend    | `line ... then right until even with B then to B.w` |
| Polar placement   | `circle at dist(C1,C2) heading 30 from C2` |
| Interpolate       | `dot at 0.5 between A and B` |
| Mixed coords      | `text at (A, B.n)` (A's x, B.n's y) |
| Inherit style     | `box same "next"` / `box same as A` |
| Invisible scaffold| `box invis "caption"` |
| Rotated label     | `line invis from A to B "label" aligned above` |
| Theme globals     | `scale = 0.9`, `boxwid = 1in`, `fill = white` |
| Closed polygon    | `line from (0,0) right 1in then up 1in ... close fill blue` |
| User variable     | `$margin = 0.25in` (use `$`/`@` to avoid keywords) |
| Increment         | `boxwid *= 1.2` |
| Comment           | `# hash` / `// c++` / `/* block */` |
| Line continuation | `\` at end of line |
| Macro (no quotes) | `define n { box $1 fit }` then `n("Label")` |

### Key built-in variables (set at top of script to theme globally)

`boxwid`, `boxht`, `boxrad`, `circlerad`, `ellipsewid`, `ellipseht`, `ovalwid`, `ovalht`, `cylwid`, `cylht`, `cylrad`, `filewid`, `fileht`, `linewid`, `lineht`, `linerad`, `arrowht`, `arrowwid`, `thickness`, `scale`, `fontscale`, `margin`, `fgcolor`, `bgcolor`, `color`, `fill`, `layer`, `charwid`, `charht`.

### Units

`in` (default), `cm`, `mm`, `pt` (1/72 in), `pc` (12 pt), `px` (1/96 in).

### Built-in math

`abs(x)`, `int(x)`, `max(x,y)`, `min(x,y)`, `sqrt(x)`, `sin(x)`, `cos(x)` (radians), `dist(A,B)`.

### Assignment

`=`, `+=`, `-=`, `*=`, `/=`.

See also: `./theming.md` for color and theming patterns, `./stdlib-reference.md` for reusable macros, `./renderers.md` for CLI and rendering options.
