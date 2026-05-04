---
name: spy-on-bones-session
version: 0.1.0
description: >-
  Audit how bones behaves on a target project by fingerprinting <project>
  before and after `bones up`, capturing `bones status` plus any other state
  bones leaves behind, then watching a live operator's Claude Code session in
  real time to find patterns where bones is not running properly. Produces a
  structured findings report (bugs, inconveniences, improvements). Use whenever
  the user wants to spy on a bones session, audit bones on a project, watch a
  Claude session running with bones to surface rough edges, run `bones up` on
  something and report what's broken, or generally "find what bones gets wrong
  on <X>" — even if they don't say the word "spy" explicitly.
type: skill
targets:
  - claude-code
category:
  primary: evolution
  secondary:
    - tooling
    - backpressure
---

# Spy on Bones Session

## Why this skill exists

Bones hooks deeply into a project's `.claude/`, `.bones/`, hooks, and a
running hub. The only reliable way to find what's broken or annoying
is to (a) capture what bones changes when it touches a project, then
(b) watch a real operator drive a Claude session through it and
record every divergence between expectation and reality.

This skill produces a structured findings report ready to hand off to
`superpowers:systematic-debugging` and `to-issues`.

## When NOT to use

- The session already ran and there is no live operator to watch →
  use `investigating-agent-sessions` (cold-read counterpart) instead.
- The user wants to debug a specific bones bug they already know
  about → use `superpowers:systematic-debugging` directly.

## Inputs

- **`<project>`** — absolute path to the target project. Must exist.
- **An operator** — the user (or someone) will actually run `claude`
  inside `<project>` while you watch. The skill is hollow without a
  live session to observe.

If `<project>` is ambiguous, ask once before starting.

## Workspace

Use `/tmp/spy-<project-basename>-<UTC-timestamp>/` as the workspace.
Subdirs: `before/`, `after/`, `live/`, `findings.md`. Tell the user
the path so they can inspect.

## Phase 1 — Fingerprint BEFORE `bones up`

The point is to know what bones added/changed/created so you can
attribute findings correctly. Capture into `before/`:

- File tree: `find <project> -maxdepth 5 -type f -not -path '*/.git/*' -not -path '*/node_modules/*' -not -path '*/.worktrees/*' | sort`
- Git: `git -C <project> status --porcelain`, `git -C <project> rev-parse HEAD` (skip if not a repo)
- Bones-relevant directories — record presence + `ls -la`:
  `<project>/.claude/`, `<project>/.bones/`, `<project>/.orchestrator/`, `<project>/.fossil/`, `<project>/.worktrees/`
- Hash key config files if they exist: `<project>/.claude/settings.json`, `<project>/.claude/settings.local.json`, `<project>/CLAUDE.md`
- Process list: `ps -eo pid,etime,command | grep -E 'bones|hub|fossil|orchestrator' | grep -v grep`
- Bones binary: `which bones`, `bones --version`
- Transcript dir: `ls -la ~/.claude/projects/$(echo "<project>" | tr / -)/ 2>/dev/null` — note which sessions already exist so you can identify the *new* one in Phase 4

Use `mcp__plugin_context-mode_context-mode__ctx_batch_execute` so the
raw output stays out of your context window. Pull only summaries +
hashes into chat.

## Phase 2 — Run `bones up`

Tell the user what you're about to do, then run it from inside the
project:

```
cd <project> && bones up 2>&1 | tee /tmp/spy-.../bones-up.log
```

Capture:
- Exit code
- Wall-clock duration
- Any prompts the operator had to answer interactively (those are
  friction findings on their own)
- Anything written to stderr that isn't an obvious progress line

If `bones up` fails outright, that's a P0 — record and stop the
fingerprint flow; ask the user how to proceed.

## Phase 3 — Fingerprint AFTER

Same captures as Phase 1, into `after/`. Plus bones-specific state:

- `bones status` (full output, not abbreviated)
- `bones tasks prime --json` if the subcommand exists in this version
- `bones swarm status` if available
- `<project>/.bones/` — `find ... -type f -exec stat ... \;` for every file
- Tail (last 50 lines) of every `<project>/.bones/*.log` and `<project>/.orchestrator/*.log`
- Hub socket / pid file presence
- New entries in `<project>/.claude/settings.json` — especially
  `hooks` — diffed against `before/`
- `ps` again to see new bones-related processes
- New transcript files in `~/.claude/projects/-...<project encoded>/`

Compute diffs into `after/diffs/`:
- `diff before/files.txt after/files.txt` → files added/removed
- `diff before/settings.json after/settings.json` → config bones rewrote

## Phase 4 — Spy the live session

Tell the operator (verbatim or close):

> "Open a new terminal, `cd <project>`, run `claude`, and start the
> workflow you want to test. I'll watch in real time. Tell me when
> you're done, or if you hit something that feels wrong — I want to
> hear about it as it happens, not after."

Find the new transcript JSONL the moment it appears. The encoded
path replaces `/` with `-` and prefixes with `-`:

```
TX_DIR=~/.claude/projects/$(echo "<project>" | tr / -)
ls -t "$TX_DIR"/*.jsonl | head -1
```

Watch live. Use the harness `Monitor` tool on the new JSONL — each
new event arrives as a notification. In parallel, also Monitor:
- `<project>/.bones/*.log` (hub log, swarm log, anything appending)
- `<project>/.orchestrator/*.log` if present

For every event observed, classify into one of three buckets and
write to `findings.md` immediately (don't batch — memory rots fast):

- **Bug** — bones did something wrong: error, crash, wrong output,
  data loss, hook misfire, stale status, race, hang, command exits
  non-zero when it shouldn't
- **Inconvenience** — bones worked but the operator had to do extra
  work, wait without feedback, guess what to do next, retry, or
  copy-paste around something
- **Improvement** — bones could plausibly do this better even if it
  isn't strictly broken

Each finding gets:
- ID (sequential), severity guess (P0–P3), one-line title
- Source pointer: `<file>:<line>` or `<jsonl-uuid>` or
  `bones-up.log:<line>`
- Observed (what bones actually did)
- Expected (what should have happened)
- Repro hint (minimal steps if obvious)

## Phase 5 — Quiescence sanity check

When the operator pauses or finishes, run `bones status` again and
compare to Phase 3. Anything that drifted unexpectedly (orphan
processes, leftover holds, stale tasks, missing artifacts) is a
finding. Also `lsof` any long-lived bones processes — held files in
`~/.Trash/` or in deleted state dirs are a known orphan pattern.

## Phase 6 — Report

Deliver inline (the user prefers chat-rendered audits over auto-saved
docs). Save the long version to `findings.md` in the workspace and
link to it; only inline the highlights:

```
# Bones spy report — <project> — <UTC date>

## Environment
bones <version> · <OS> · project type · git HEAD <sha>

## Fingerprint diff
- N files added by bones up (categorized: state / hooks / config / artifact)
- M settings keys changed (list keys only)
- K new processes (with etime)

## Findings
### Bugs (P0–P1 first, then P2–P3)
- [B-1] [P0] <title>
  Source: <pointer>
  Observed: …
  Expected: …
  Repro: …

### Inconveniences
…

### Improvements
…

## Hand-off
Next: `superpowers:systematic-debugging` on the P0/P1 bugs, then
`to-issues` to file. Workspace at /tmp/spy-…/ for raw evidence.
```

## Discipline

This skill inherits the read-only mindset and verification rules from
`investigating-agent-sessions`. Before writing the report:

- **Replicate to verify.** If a finding cites a log line, re-tail
  the log and confirm. If it cites a JSONL event, re-`jq` it.
  Subagents and your own first read both abbreviate.
- **Upstream over user-visible.** When the operator's visible error
  and the bones log disagree, the log's earlier error is usually the
  real cause. Name the upstream as the root cause and the
  user-visible as the symptom.
- **Don't run mutating commands during the spy phase.** No
  `bones down`, no `kill`, no `rm` of state files. The session is
  evidence. If something is genuinely broken and the operator needs
  to recover, surface it as a finding and ask before nuking.
- **Operator-nuke-instinct is itself a finding.** If the operator
  reaches for a "blow it all away" recovery, the underlying tool is
  missing a recovery affordance. File that as an improvement.

## Common mistakes

| Mistake | Fix |
|---|---|
| Fingerprinting only `.bones/` | Also check `.claude/`, `.orchestrator/`, `.fossil/`, `.worktrees/`, project root, transcript dir |
| Watching only the JSONL | Tail bones-side logs in parallel — sometimes the bug is hub-side, never surfaces in the session |
| Reporting "operator got confused" without a root cause | Trace to a specific bones output / missing prompt / unclear status — that's the real finding |
| Forgetting to pin bones version | Capture `bones --version` in Phase 1 *and* Phase 3 — version may change mid-session if `bones up` self-updates |
| Letting the operator finish before opening `findings.md` | Capture live; details fade in minutes |
| Confusing existing repo state with bones-added state | The Phase-1 fingerprint is what disambiguates — don't skip it because the project "looks clean" |
