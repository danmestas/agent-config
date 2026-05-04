---
name: investigating-agent-sessions
version: 0.2.0
description: Use when debugging or auditing another Claude Code session, investigating what a prior agent did or left behind, reconstructing a failure that hit an earlier session, finding the cause of mystery state in a project (orphan processes, dirty files, broken hooks), or building context before continuing someone else's work
type: skill
targets:
  - claude-code
category:
  primary: evolution
  secondary:
    - tooling
    - backpressure
---

# Investigating Agent Sessions

## Overview

You have been asked to figure out what another agent (or your earlier
self) did in a different session. The session is over; only its
*artifacts* remain — transcripts on disk, files in the project, running
processes, log entries, dirty git state. Your job is to reconstruct
what happened from those artifacts well enough to debug, audit, or
continue the work.

**Core principle:** Past agents lie by accident. Their conclusions in
notes/PRs/commits may be wrong, falsified later, or written before
they had complete information. Verify every claim against current
evidence; never inherit a prior agent's root cause without re-deriving
it yourself.

## When to Use

- "Another session crashed / hit error X — figure out why."
- "What did the previous agent change / try / decide?"
- "I'm continuing work from yesterday's session — get me up to speed."
- "There's mystery state in this project (running process, orphan
  files, dirty index) — where did it come from?"
- Auditing an autonomous agent run after the fact.

**Don't use** for debugging your own *current* session — you have the
conversation context. This skill is for cold-reading sessions you were
not in.

## Quick Reference: Where to Look

Priority order. Stop early if the question is answered.

| Source | Path | What it tells you |
|---|---|---|
| Claude Code session transcripts | `~/.claude/projects/<encoded-cwd>/<uuid>.jsonl` | Per-event JSONL: prompts, tool calls, tool results, errors. The most authoritative source for what an agent saw and did. |
| Project working tree | `<repo>/` | Current files, dirty git state, untracked artifacts (logs, lockfiles, scratch). |
| Tool-specific runtime state | `<repo>/.bones/`, `.orchestrator/`, `.fossil/`, `node_modules/.cache/`, etc. | Logs (`*.log`), pid files, sockets, sidecar DBs (SQLite `-wal`/`-shm`). |
| Project hooks | `<repo>/.claude/settings.json`, `~/.claude/settings.json` | What fires on SessionStart/PreCompact/etc. — explains "where did this error come from?". |
| Running processes | `ps -o pid,etime,command` + `lsof -p <pid>` | Long-lived orphans, processes whose `cwd` or held files belong to the workspace, processes from prior sessions. |
| Trash | `~/.Trash/` (macOS), `~/.local/share/Trash/files/` (Linux) | Manually-deleted state that processes may still hold open. |
| Git history | `git log --oneline -30`, `git log -p -- <path>`, `git reflog` | What was done, when, by whom. Reflog catches branch checkouts/resets the log doesn't. |
| Tool source | the tool's repo | Pin the exact code path that produced an error message; don't guess from the error string. |
| In-session subagent reports / Agent tool outputs | Parent JSONL (`jq` for `tool_use` with `name: "Agent"` and matching `tool_result`); subagent outputs at `/private/tmp/claude-*/tasks/<id>.output` | What subagents the prior agent dispatched, what they reported, where their work landed. **Subagents lie too** — verify their claims before acting on them. |
| Prior agent notes | scratch markdown, observation files, PR descriptions, ADRs | **Use as leads, not conclusions.** See "Critical reading" below. |

## Encoding the project path for `~/.claude/projects/`

Claude Code encodes the absolute working directory by replacing `/`
with `-` and prefixing with `-`:

```
/Users/dan/projects/serverdom  →  -Users-dan-projects-serverdom
```

```sh
ls "$HOME/.claude/projects/$(pwd | tr / -)"
```

Each `<uuid>.jsonl` is one session. Use `jq` (or `grep` for blunt
scans) — never read the whole file into your context window:

```sh
# Sessions in chronological order:
ls -lt ~/.claude/projects/-Users-dan-projects-serverdom/*.jsonl

# What tools the agent called:
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name' \
  ~/.claude/projects/-Users-dan-projects-serverdom/<uuid>.jsonl | sort | uniq -c

# Errors the agent hit:
jq -r 'select(.type=="user") | .message.content[]? | select(.type=="tool_result" and .is_error==true) | .content' \
  ~/.claude/projects/-Users-dan-projects-serverdom/<uuid>.jsonl
```

## Critical reading of prior agent artifacts and in-session subagent reports

The same discipline applies to two kinds of prior claim:

1. **Notes left by past agents** (markdown observation files, PR
   descriptions, ADRs, scratch docs).
2. **Reports returned by subagents you delegated in the current
   session.**

Both can be wrong, abbreviated, falsified later, or written before
the agent had complete information.

For prior notes:

- Read them **in full**, not just the introduction.
- Look for "falsified", "actually", "update:", "correction",
  "wrong", "scratch that", or new sections appended later.
- Check the file's `git log` / mtime to see whether the conclusion
  was amended after the original analysis.

For your own subagent reports:

- The subagent only saw the slice you asked them to see. Counts,
  dates, and "no X observed" claims are bounded by the subagent's
  query — not by reality.
- Re-derive every load-bearing claim against direct evidence
  before acting on it (filing an issue, writing a final report,
  proposing a fix). Especially: numeric counts, time-ordering
  claims, and "X never happened" negatives.

In both cases: **a prior claim's wrong conclusion is worse than no
prior context** — it steers you away from the true cause. If you
cannot independently re-derive a claim from current evidence, mark
it `unverified` in your report and keep investigating.

## Replicate to verify

When a claim cites tool output (a log line, a JSON payload, a
process listing, a file's contents), **re-run the underlying
command yourself** to confirm. Tools change state. Subagents
abbreviate output. Logs rotate. Files get rewritten.

Examples:

- A subagent reports `bones tasks prime --json` returns an empty
  payload — re-run `bones tasks prime --json` to confirm the live
  shape (tasks may have been filed since).
- A note quotes a log line — `tail`/`grep` the log directly to
  confirm the line still exists and the file's mtime matches the
  note's timestamp.
- A claim names a file path — `ls -la` the path; check size, mode,
  whether it's a symlink, whether it's tracked.

Cheap to do, catches a class of stale-claim bugs that cause wrong
issues to be filed.

## Detecting orphan processes (high-value pattern)

`ps aux | grep` is not enough. Use `lsof` to find processes holding
files from the workspace — including files that no longer exist on
disk.

```sh
# Long-running tool processes:
ps -eo pid,etime,command | grep -E '<tool-name>' | sort -k2

# What does each process hold?
lsof -p <PID> | grep -E 'cwd|<workspace-path>|<state-dir>'

# Anything holding files in the workspace state dir, even unlinked?
lsof | grep '/path/to/workspace/<state-dir>'
```

Tells:

- `etime` ≫ session age → orphan from a prior session.
- `cwd` is the workspace but held files are in `~/.Trash/...` →
  orphan whose backing dir was moved/deleted out from under it.
- `lsof` reports a held inode that `ls` does not show in the
  directory → the file was unlinked but the FD is alive.

## Timeline reconstruction

When current disk state ≠ failure-window state, reconstruct order
from independent timestamps:

- `stat -f '%Sm %N' <path>` (macOS) / `stat -c '%y %n' <path>` (Linux)
  — file mtime.
- Log files — text timestamps (or, if absent, mtime of the log file
  bounds the last write).
- `ps -o pid,etime,lstart` — when each process started.
- `git log --since=<failure-time>` — commits since the failure.
- Claude Code transcripts — `cwd` field on the first event records
  the absolute time.

State current state vs. failure-window state explicitly in your
report. Do not conflate them.

### The user-visible error is often a downstream symptom

When a tool's log file (`hub.log`, `error.log`, etc.) and the user's
reported error disagree, **the log is usually closer to the root
cause**. The user only sees the *last* error before the process gave
up; the log captured the *first* error, which is what you actually
need to explain.

Cross-check: the timestamp of the user's reported failure should
follow, not precede, the upstream errors in the tool's log. If the
log's earlier error is plausibly a cause of the later user-visible
one, name the upstream error as the root cause and the user-visible
error as the downstream symptom.

## Capture environment versions

Different sessions, different tool versions:

```sh
which <tool>
<tool> --version
go list -m all 2>/dev/null | grep <relevant-dep>
sw_vers              # macOS
uname -a             # Linux
```

If multiple binaries of the same tool exist on PATH (e.g.
`/opt/homebrew/bin/<tool>` vs. `~/go/bin/<tool>`), an orphan from one
binary running alongside a fresh invocation of the other is a
plausible bug source.

## Cross-workspace correlation

A bug that surfaces in one workspace may have peers. Briefly survey
sibling workspaces:

```sh
ls ~/projects/                                  # or wherever
for d in ~/projects/*/.bones; do
  [ -d "$d" ] && ls -t "$d"/*.log 2>/dev/null | head -1
done
```

If the same artifact appears in unrelated projects, the bug is in the
tool, not the workspace.

## Read-only mindset

You are diagnosing, not fixing.

- Don't run mutating commands (`<tool> down`, `git reset`, `kill`,
  `rm`) without explicit user authorization for *this* investigation.
- Don't re-run the failing command "to see what happens" — it may
  damage the evidence (overwrite logs, change state). Investigate
  first, repro second, only if needed.
- If the workspace recovered between failure and now, **do not
  destroy the recovered state** to reproduce; capture findings
  against historical evidence first.

## Reporting

The user wants three things:

1. **What happened** (causal chain, not just symptom).
2. **Evidence** for each step in the chain — paths, line numbers,
   commands run, exact log lines.
3. **What's still uncertain** — assumptions you couldn't verify,
   reproductions you didn't attempt, prior-agent claims you couldn't
   re-derive.

Always include #3. Investigations without admitted gaps usually have
hidden ones.

## Evolutionary feedback (this skill is in the Evolution category)

An investigation that ends with a report and no proposals for change
is incomplete. Before closing, produce four kinds of evolutionary
output and route each to the right surface.

| Output | Goes to |
|---|---|
| Friction with a specific tool | A GitHub issue on that tool's repo, with the captured trace as evidence |
| Cross-session pattern (could `evolution-engine` detect this if it ran across many sessions?) | A note in `~/.claude/evolution-reports/` for aggregation; see the `evolution-engine` skill |
| Gap in this skill itself (you had to improvise around something the Quick Reference / Common Mistakes table didn't cover) | A diff against this SKILL.md — the skill must grow each time it's used |
| Settings / memory / hook change that would have shortened this investigation | A diff candidate via `update-config` or a memory write; record what would have helped |

Findings are not just artifacts — they are **proposals for the next
agent's environment**. If you can identify "the next agent shouldn't
have to rediscover this", that's an evolutionary deliverable. Skip
this step and the investigation only helps once.

### Watch for operator-nuke-instinct

When the user proposes a "blow it all away" recovery — uninstall +
reinstall, `git reset --hard`, deleting `.bones/`, dropping a
database, wiping config — that's the user reporting a UX gap they
don't have language for. The literal answer is rarely the right
answer. Instead:

1. Stop the nuke. The current state is evidence.
2. Capture what made the user reach for the nuke as a finding —
   the underlying tool is missing a recovery affordance, not the
   user panicking.
3. Propose a non-destructive recovery path (kill orphan processes,
   rotate a corrupt file, repair a setting) backed by your
   investigation.
4. The "nuke-was-the-only-option" friction itself is filable —
   route it through the table above as a tool-friction issue.

When evolution proposals are applied (e.g., a diff lands, an issue
gets fixed, a memory entry is written), record it in `EVOLUTION.md`
via the `evolution-changelog` skill so the loop is closed.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Inheriting prior agent's conclusion without re-deriving it | Read their full note, check timestamps and amendments, verify each claim against current evidence. |
| `ps aux \| grep` and stopping there | Add `lsof -p <pid>` and `etime`. Most orphans are invisible in `ps` alone. |
| Treating current disk state as the failure-window state | Cross-check with mtimes, log timestamps, process etimes. Note divergence in the report. |
| Reading the whole session JSONL into context | Use `jq` filters or `grep` — pull only the events you need. |
| Forgetting to capture tool version + binary location | Run `which` + `--version`. Multiple binaries of the same name commonly explain "weird" behavior. |
| Skipping `~/.claude/projects/<encoded-cwd>/` because the dir name looks like junk | The encoded path is intentional. It's where transcripts live. |
| "I'll just run `<tool> doctor` to see what it says" | Mutating. Diagnose first. |

## Red Flags — STOP and verify

- You're about to write a report whose root cause comes verbatim
  from a prior note, without your own re-derivation.
- You're about to **file an issue or write a final report based on
  a hypothesis you have not reproduced.** An unfalsified hypothesis
  becomes a wrong issue in production.
- You're about to act on a subagent's report's load-bearing
  numeric claim ("six leaves", "zero invocations", "duration 545ms")
  without re-deriving it from direct evidence.
- You found one suspicious file/process and stopped looking.
- You can't say "I checked X, here's what it shows" for each item in
  the Quick Reference table you decided was relevant.
- Your timeline contradicts the user's report and you have not asked
  them about the discrepancy.
- You're tempted to run a mutating command "just to confirm".

All of these mean: stop, gather more evidence, re-read prior claims
critically, replicate the underlying observations, then write the
report.
