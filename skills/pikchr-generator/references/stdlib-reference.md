# Stdlib Macros

Prepend `../lib/stdlib.pikchr` to your source via `../bin/compile.sh --with-stdlib`.

Each macro takes one argument: the label.

| Macro | Shape | Semantic use | Example |
|-------|-------|--------------|---------|
| `db(X)` | cylinder | Relational/document database | `db("users")` |
| `cloud(X)` | wide ellipse | External / managed service | `cloud("S3")` |
| `actor(X)` | rounded box | Person / external user | `actor("Customer")` |
| `queue(X)` | oval | Message queue / buffer | `queue("orders")` |
| `lambda(X)` | rounded box (green) | Function / serverless / microservice | `lambda("AuthFn")` |
| `datastore(X)` | file shape | Object store / file storage | `datastore("WORM bucket")` |
| `decision(X)` | diamond | Branch / decision point | `decision("auth ok?")` |
| `note(X)` | dashed box | Sticky note / comment | `note("TODO")` |

## Color semantics

Each macro fills with a **sentinel hex** (`#202122` for accent, `#303132` for muted, `#404142` for surface) that `themeize.sh` rewrites to the theme's concrete hex at compile time. The shape's *role* (primary/secondary/passive) survives across all 16 themes — only the concrete colors swap. Strokes default to `rgb(0,0,0)` which becomes `currentColor`, so the entire diagram follows the chosen theme's foreground.

## Combining macros

```pikchr
right
actor("User"); arrow "request" above
lambda("API"); arrow
db("Postgres")
move; arrow from last lambda.s down
queue("Jobs"); arrow
cloud("Worker")
```

## How the argument substitution actually works

Pikchr tokenizes **before** lexical substitution, so `"$1"` inside a macro body is already a single string token when the lexer runs — substitution never fires inside quotes. The correct form is unquoted `$1` in the body; the caller supplies the quotes:

```pikchr
# WRONG: prints literal "$1" in the SVG
define db_bad { cylinder "$1" fit }

# RIGHT: caller's quotes travel with the substituted token
define db { cylinder $1 fit fill 0xeff6ff color 0x1e40af }
db("Postgres")   # expands to: cylinder "Postgres" fit fill 0xeff6ff color 0x1e40af
```

This is why every macro in `../lib/stdlib.pikchr` uses unquoted `$1`.

## Limitations

- Macro args are **lexical text substitution** — escape characters that would break pikchr syntax.
- A label cannot contain `)` since the macro invocation parser uses `)` as the terminator.
- The macros define shape names — reusing the macro name as a label (e.g., `db("db")`) is fine; reusing as a variable (`db = ...`) is not.
- There are exactly 8 macros and that's intentional. Add new ones to `../lib/stdlib.pikchr` and the corresponding test in `../test/test_stdlib.sh`.

## See also

- `./syntax.md` — core pikchr language
- `./theming.md` — why the macro fill colors don't change with theme
- `../templates/architecture.pikchr`, `../templates/data-pipeline.pikchr` — real uses of the stdlib
