# Conventions

Cross-cutting rules that apply to every component in this repo. Skills, hooks, and
adapters all live by them. New components must follow the conventions in this file
unless they document a deliberate, narrow exception.

## Fail-safe hook scripts

Every hook script in this repo MUST be fail-safe. Hooks run inside the user's
session lifecycle (PreToolUse, PostToolUse, SessionStart, Stop, etc.); a hook
that errors out, hangs, or writes to stderr in panic mode will block the user.
That is unacceptable, regardless of how legitimate the failure is.

The rule:

- Do NOT use `set -e`. A hook that exits non-zero on the first command failure
  blocks the host session and surfaces noisy errors.
- DO wrap the body so any failure is swallowed: `||  true` on individual
  commands that may fail, and `exit 0` at the very end no matter what.
- DO log unrecoverable errors to stderr (or a quiet log file) — never fail loudly.
- When the hook protocol allows it, output a JSON envelope `{"continue": true,
  "suppressOutput": true}` on errors so the host harness keeps moving.

Reference implementation: [`hooks/_lib/fail-safe.sh`](hooks/_lib/fail-safe.sh).
Hook scripts can `source` it to import the wrapper helpers.

Skeleton:

```bash
#!/usr/bin/env bash
# shellcheck shell=bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_lib/fail-safe.sh
source "${SCRIPT_DIR}/../_lib/fail-safe.sh" 2>/dev/null || true

failsafe::trap_errors

# ... your hook body here. Failures here are caught, logged, and ignored. ...

exit 0
```

If `_lib/fail-safe.sh` is unavailable (e.g., the hook ships standalone in a
plugin bundle), inline the critical bits:

```bash
#!/usr/bin/env bash
set +e
trap 'echo "hook error at line $LINENO" >&2; exit 0' ERR
# ... body ...
exit 0
```

## Markdown flat-line format

Append-only changelogs and ledger files (`EVOLUTION.md`, future audit logs,
session digests) use a flat-line format optimized for scanning and grep — not
GitHub-rendered tables.

Shape:

```markdown
## 2026-04-27
**F-001** 09:23 [stale-memory] | `feedback_old.md` deleted | dead branch ref
**F-002** 14:55 [permission] | `settings.json` | added `npm test` (×7)

## 2026-04-26
**F-003** 11:02 [trigger-mismatch] | `skills/reflect/SKILL.md` | added "retro this"
```

The fields, in order:

1. Bold finding ID (`**F-NNN**`) — sortable, greppable, one per row.
2. Time (`HH:MM`) — local time, optional.
3. Signal type — bracketed identifier (`[stale-memory]`, `[permission]`, etc.).
   Optional: prefix with one icon (`🔧`, `🔒`, `🎯`) for at-a-glance scanning. The
   icon variant is allowed but not required; the bracketed text is the source
   of truth.
4. The artifact path or short subject — a single backtick-wrapped path.
5. A one-line description.

Why flat-line vs Markdown tables:

- `grep` works against the raw line; tables fragment information across columns.
- New columns can be added without rewriting history.
- Diff-friendly: each finding is exactly one line.
- LLM-friendly: each line is a complete record without table-header context.

## Per-project state directory

Hooks, skills, and adapters that need scratch space write to `.agent-config/`
at the repo root. Examples: `.agent-config/trace/<session-id>.jsonl`,
`.agent-config/recall.disabled`, `.agent-config/exclude.json`. The directory
is gitignored; nothing in it should be committed.

## Cross-harness contract

Every hook ships through an adapter (adapter source lives in the [suit repo](https://github.com/danmestas/suit)).
A hook script reads its input from stdin, writes JSON output to stdout, and
exits 0. The adapter library normalizes the per-harness envelope so the same
hook body works under Claude Code, Codex, Gemini, Copilot, and Pi when those
adapters mature.
