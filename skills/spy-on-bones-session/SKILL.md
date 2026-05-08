---
name: spy-on-bones-session
version: 0.2.0
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
- `bones tasks status` — note that this verb lazy-starts the hub even
  when `bones status` does not. Record the divergence.
- `bones tasks prime --json` — this is what the SessionStart hook
  invokes; capture it now and inspect the output shape
- `bones swarm status` if available
- `<project>/.bones/` — `find ... -type f -exec stat ... \;` for every file
- Tail (last 50 lines) of every `<project>/.bones/*.log` and `<project>/.orchestrator/*.log`
- Hub socket / pid file presence
- New entries in `<project>/.claude/settings.json` — especially
  `hooks` — diffed against `before/`
- `ps` again to see new bones-related processes
- New transcript files in `~/.claude/projects/-...<project encoded>/`
- **Network egress check:** `lsof -c bones -i TCP | grep ESTABLISHED`
  — enumerate non-localhost outbound connections. Some are
  one-shot-at-hub-init and disappear quickly, so capture twice (now
  and again at the end of Phase 4). Reverse-DNS / whois any non-trivial
  remote IPs and note them as findings if undisclosed in `bones up` output.
- **Hook-protocol shape check:** for each command bones installed in
  `.claude/settings.json` hooks, dry-run it directly and verify its
  stdout is wrapped in Claude Code's hook protocol envelope —
  `{"hookSpecificOutput":{"hookEventName":"...","additionalContext":"..."}}`.
  Bare JSON like `{"open_tasks":[]...}` is silently discarded by
  Claude Code, so a hook that emits raw structured data is functionally
  dead. (See "Hook-protocol verification" sub-phase below.)

Compute diffs into `after/diffs/`:
- `diff before/files.txt after/files.txt` → files added/removed
- `diff before/settings.json after/settings.json` → config bones rewrote

### Sub-phase: Hook-protocol verification

After Phase 3, before Phase 4, do this one-shot check — the
bones SessionStart hook is a high-value, easy-to-miss bug
surface:

```sh
# 1. Run the hook command standalone and inspect its output
bones tasks prime --json | jq '.'

# 2. The output MUST be shaped like:
# {"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}
# If it's instead {"open_tasks":[],"peers":[...],...} — bones has no envelope
# and Claude Code will drop the output entirely. That's a P1 finding.
```

If the operator then opens a Claude session and you find the new
transcript JSONL, you can confirm the diagnosis directly:

```sh
TX=$(ls -t ~/.claude/projects/-...<project>/*.jsonl | head -1)
# Grep the aggregated context for any token from bones' output:
grep -c 'open_tasks' "$TX"   # 0 = bones output never made it into agent context
```

## Phase 4 — Spy the live session

### JSONL is the truth, not tmux

`tmux capture-pane` shows you the screen buffer — lines wrap, content
scrolls past, `[from %59]`-style prompt-injections collapse onto one
line. **The transcript JSONL at
`~/.claude/projects/-<encoded-project-path>/<session-uuid>.jsonl` is
the authoritative record.** Default to JSONL-first analysis:

- After every operator tool-use, jq the corresponding line and read
  the actual `tool_use_result.content` rather than scrolling tmux.
- Hook attachments are JSONL events with `attachment.hookEvent`,
  `attachment.stdout`, `attachment.exitCode`. They never appear on
  the user's screen — only the JSONL has them.
- If the JSONL and `tmux capture-pane` disagree, JSONL wins.

Use tmux capture only for "what does the operator currently see in
their input box" — never for analysis.

### Operator handoff

Tell the operator (verbatim or close):

> "Open a new terminal, `cd <project>`, run `claude`, and start the
> workflow you want to test. I'll watch in real time. Tell me when
> you're done, or if you hit something that feels wrong — I want to
> hear about it as it happens, not after."

Find the new transcript JSONL the moment it appears:

```
TX_DIR=~/.claude/projects/$(echo "<project>" | tr / -)
ls -t "$TX_DIR"/*.jsonl | head -1
```

### High-value first calls

Before letting the operator drive freely, get these captures —
they prove or disprove the most common bones bugs in seconds:

1. **`bones tasks watch --json` running BEFORE anything else.**
   Have the operator (or you) launch it in a backgrounded shell and
   tee output to a file. Every event from then on lands in that
   stream. Without this you can only post-hoc reconstruct the event
   stream from snapshots — which is exactly the lossy reconstruction
   bones itself does in `bones status`.
2. **The hook-protocol check from Phase 3** — confirm the
   SessionStart additionalContext does or does not include bones'
   priming output. (Do this in the new Claude session's transcript
   too, not just standalone.)
3. **`bones --help` AND `bones <verb> --help` for every verb you
   care about.** The top-level `--help` hides a lot; rich filters
   only appear under `bones tasks list --help`, `bones tasks claim
   --help`, etc. Discoverability gaps are themselves findings.

### Watch live

In parallel, also Monitor:
- `<project>/.bones/*.log` (hub log, swarm log, anything appending) —
  caveat: bones v0.12 hub logs lifecycle-only, so silence here is
  expected and is itself a finding (no RPC audit trail)
- `<project>/.orchestrator/*.log` if present
- The operator's transcript JSONL (each new event is a notification)

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

### Operator coaching

Things the operator (and you) cannot do — set expectations early so
you don't burn 3+ minutes finding out:

- **Slash commands (`/doctor`, `/clear`, `/compact`, etc.) are
  REPL-only.** They can't be invoked from a tool call, can't be
  redirected to a file, won't fall through to a subprocess. If you
  need data from one — e.g. the "Found N settings issues" detail
  from `/doctor` — ask the operator to run it by hand, ESC out of
  the TUI, and paste the relevant lines into a file under
  `/tmp/spy-…/`.
- **`claude doctor` (the shell subcommand) is an interactive TUI
  too**, not a redirect-friendly CLI. It will hang on `> /tmp/...`
  redirection. Same workaround.
- **`harness-tell` injects literal text into the input box.** Slash
  commands typed there ARE recognized by Claude Code, but it's the
  same as the operator typing them — no scripting around the TUI.

### What to do if the operator stays idle

If the operator goes idle for 10+ minutes after the handoff (e.g.
the orchestrator's "they're about to run X" never materializes), you
have two options:

1. **Drive small read-only tasks yourself.** Send the operator
   (or run yourself out-of-band) a sequence of bones verbs that
   exercise lifecycle: `tasks create / claim / show / close / list
   / watch`. You'll find the bulk of the daily-driver bugs without
   needing the operator's specific workflow.
2. **Skip to Phase 5–6 cleanly.** A spy report from Phases 1–3 +
   self-driven verb sweep is still useful. State explicitly in the
   report what was *not* exercised so the reader knows the gaps.

Do not wait indefinitely. Burning a 9-minute `harness-listen`
timeout three times is not investigation, it's stalling.

## Phase 5 — Quiescence sanity check

When the operator pauses or finishes, run `bones status` again and
compare to Phase 3. Anything that drifted unexpectedly (orphan
processes, leftover holds, stale tasks, missing artifacts) is a
finding. Also `lsof` any long-lived bones processes — held files in
`~/.Trash/` or in deleted state dirs are a known orphan pattern.

Re-run the network egress check — note any outbound connections
that appeared/disappeared since Phase 3.

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

## What I did NOT exercise
- List untouched verbs (swarm dispatch / join / fanin / reap, tasks
  link / autoclaim / compact / aggregate, repo / sync / bridge /
  notify / plan / apply / logs / workspaces, the PreCompact hook,
  multi-peer flow, `bones doctor`, etc.).
- A normal spy covers ~15% of bones' surface area. Be honest about
  the gap.

## Hand-off
Next: `superpowers:systematic-debugging` on the P0/P1 bugs, then
`to-issues` to file. Workspace at /tmp/spy-…/ for raw evidence.
```

## Phase 7 — Architectural reflection (only if asked)

If the user requests an architectural reflection / root-cause
clustering / "why are these bugs related," the answer must be
source-grounded, not behavior-grounded:

- Spawn an Explore subagent on `/Users/dmestas/projects/bones`
  with the specific bugs and a path:line-required output format.
  Behavior alone can't tell you "is this two bugs in different
  call sites or one upstream bug?" — only the source can.
- Cite `path:line` for every architectural claim. Quote source
  comments where authors have already named the design choice
  (e.g. `cli/status.go` has a comment that admits the missing
  event log — that's gold).
- Verify "X-line fix" claims against actual code before publishing.
  Behavioral observation rarely tells you fix size; code does.

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
- **Verify fix-size claims against source.** "5-line fix" is a claim
  the source has to back. If you didn't read it, don't say it.

## Common mistakes

| Mistake | Fix |
|---|---|
| Fingerprinting only `.bones/` | Also check `.claude/`, `.orchestrator/`, `.fossil/`, `.worktrees/`, project root, transcript dir |
| Watching only the JSONL | Tail bones-side logs in parallel — sometimes the bug is hub-side, never surfaces in the session |
| Trusting `tmux capture-pane` over the transcript JSONL | tmux is screen buffer (line-truncated, scroll-bound). The JSONL is authoritative. Default to JSONL-first analysis. |
| Reporting "operator got confused" without a root cause | Trace to a specific bones output / missing prompt / unclear status — that's the real finding |
| Forgetting to pin bones version | Capture `bones --version` in Phase 1 *and* Phase 3 — version may change mid-session if `bones up` self-updates |
| Letting the operator finish before opening `findings.md` | Capture live; details fade in minutes |
| Confusing existing repo state with bones-added state | The Phase-1 fingerprint is what disambiguates — don't skip it because the project "looks clean" |
| Asking the operator to "redirect /doctor output" to a file | `/doctor` is REPL-only and `claude doctor` is a TUI. Both will hang on redirect. Have the operator paste output by hand. |
| Conflating "bones SessionStart hook fired" with "its output reached the agent" | Hook firing means exit-code 0 and stdout captured. Output reaching the agent requires `hookSpecificOutput` envelope shape. Verify with `grep` of the new transcript's `additionalContext`. |
| Calling fixes "X lines" without verifying against source | Behavioral observation rarely tells you fix size. Spawn an Explore agent or read the source before claiming. |
| Waiting indefinitely for an idle operator | After 10 min idle, drive read-only verbs yourself or skip to Phase 5–6. Stalling on `harness-listen` timeouts is not investigation. |
