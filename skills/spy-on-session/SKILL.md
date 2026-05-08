---
name: spy-on-session
version: 0.1.0
description: >-
  Audit how a tool integrates with a Claude Code session — fingerprint files
  before and after the tool's bootstrap, monitor the live transcript JSONL and
  any event streams the tool publishes, classify findings as bugs /
  inconveniences / improvements with severity, source pointer, observed,
  expected, and repro hint. Use whenever the user wants to spy on a Claude
  Code integration, audit how a hook / skill / MCP / sidecar behaves in a real
  session, find what a tool is silently breaking, watch a Claude session
  running with <some tool> to surface rough edges, run a tool's bootstrap on a
  project and report what's broken, or generally "find what <tool> gets wrong
  on <project>" — even if they don't use the word "spy". For tools that
  already have a specialised spy skill (e.g. `spy-on-bones-session`), prefer
  that and use this only as a reference.
type: skill
targets:
  - claude-code
category:
  primary: evolution
  secondary:
    - tooling
    - backpressure
---

# Spy on Session

Tool-agnostic methodology for live spy audits of any tool that integrates
into a Claude Code session via skills, hooks, settings, MCPs, or a sidecar
process. Produces a structured findings report ready to hand off to
`superpowers:systematic-debugging` and `to-issues`.

## Inputs

- **`<project>`** — absolute path to the target project.
- **`<tool>`** — the integration being audited (its name, bootstrap
  command, log paths, status verbs).
- **An operator** — someone will actually run `claude` inside `<project>`
  while you watch. The skill is hollow without a live session to observe.

If any of these are ambiguous, ask once before starting.

## When NOT to use

- The session already ran and there is no live operator → use
  `investigating-agent-sessions` (cold-read counterpart) instead.
- The user already knows the specific bug → use
  `superpowers:systematic-debugging` directly.
- A tool-specific spy skill exists for `<tool>` → prefer it (e.g.
  `spy-on-bones-session` for bones).

## Workspace

`/tmp/spy-<project-basename>-<UTC-timestamp>/`. Subdirs: `before/`,
`after/`, `live/`, `findings.md`. Tell the user the path so they can
inspect.

## What a spy does — four pillars

A spy session does four things and nothing else matters as much:

1. **Fingerprint the files** — before and after the tool's bootstrap.
   Diff. Attribute every change to the tool, not pre-existing repo state.
2. **Read the JSONL** — the session transcript is the source of truth.
   Hooks, tool calls, `additionalContext`, exit codes — all there, and
   nowhere else.
3. **Monitor the stream live** — subscribe to whatever event stream the
   tool publishes *before* the operator does anything else. Tail the
   tool's own logs in parallel. You only see transitions if you were
   listening.
4. **Write findings as they happen** — bug / inconvenience / improvement,
   with severity, source pointer, observed, expected, repro hint.
   Inline, not at the end. Memory rots in minutes.

Everything below is staging or coaching for those four pillars.

---

## Pillar 1 — Fingerprint the files

The point is to know *exactly* what the tool added/changed/created so
you can attribute findings correctly.

### 1a. Before bootstrap → `before/`

Use `mcp__plugin_context-mode_context-mode__ctx_batch_execute` so the
raw output stays out of your context window. Pull only summaries +
hashes into chat.

- File tree: `find <project> -maxdepth 5 -type f -not -path '*/.git/*' -not -path '*/node_modules/*' -not -path '*/.worktrees/*' | sort`
- Git: `git -C <project> status --porcelain`, `git -C <project> rev-parse HEAD` (skip if not a repo)
- Tool-relevant directories — every dot-dir the tool's docs mention.
  Record presence + `ls -la` for each.
- Hash key config files: `<project>/.claude/settings.json`,
  `<project>/.claude/settings.local.json`, `<project>/CLAUDE.md`, plus
  any tool-specific config (`.envrc`, `.tool-versions`, etc.).
- Process list: `ps -eo pid,etime,command | grep -E '<tool-process-pattern>' | grep -v grep`
- Tool binary: `which <tool>`, `<tool> --version`
- Transcript dir: `ls -la ~/.claude/projects/$(echo "<project>" | tr / -)/ 2>/dev/null`
  — note which sessions already exist so you can identify the *new* one
  in Pillar 3.

### 1b. Run the tool's bootstrap

```sh
cd <project> && <tool-bootstrap> 2>&1 | tee /tmp/spy-.../bootstrap.log
```

Capture: exit code, wall-clock duration, any interactive prompts (those
are friction findings), anything written to stderr that isn't an obvious
progress line.

If the bootstrap fails outright, that's a P0 — record and stop the
fingerprint flow; ask the user how to proceed.

### 1c. After bootstrap → `after/`

Same captures as 1a, into `after/`. Plus tool-specific state — status
verbs, scaffold files, sidecar logs, sockets, pid files.

### 1d. Diff

```sh
diff before/files.txt after/files.txt           # files added/removed
diff before/settings.json after/settings.json   # config the tool rewrote
```

Categorise the diff: **state / hooks / config / artifact**.

### 1e. Network egress side-check

Some tools' sidecar processes phone home (telemetry, license check,
update probe) without disclosing it in their bootstrap output. Not
necessarily a bug — but should not be a *surprise*.

```sh
lsof -c <tool-process-name> -i TCP | grep ESTABLISHED
```

Some connections are one-shot at init and disappear quickly — capture
twice (now and again at the end of Pillar 3). Reverse-DNS / `whois`
non-trivial remote IPs and note them as findings if undisclosed.

---

## Pillar 2 — Read the JSONL

The session transcript at
`~/.claude/projects/-<encoded-project-path>/<session-uuid>.jsonl` is
the authoritative record of what happened in the operator's session.
**Default to JSONL-first analysis**:

- After every operator tool-use, jq the corresponding line and read the
  actual `tool_use_result.content` rather than scrolling tmux.
- Hook attachments are JSONL events with `attachment.hookEvent`,
  `attachment.stdout`, `attachment.exitCode`. They never appear on the
  user's screen — only the JSONL has them.
- If the JSONL and `tmux capture-pane` disagree, JSONL wins.

Use `tmux capture-pane` only for "what does the operator currently see
in their input box" — never for analysis. tmux is a screen buffer:
line-truncated, scroll-bound, lossy.

### Hook-protocol verification (the silently-lossy class)

The most common silently-lossy bug for tools that install Claude Code
hooks: the hook command emits valid output to stdout but in the wrong
*shape*, so Claude Code discards it. The agent receives nothing even
though the hook fired exit-code 0.

Claude Code's hook protocol expects this envelope:

```json
{"hookSpecificOutput": {"hookEventName": "<EventName>", "additionalContext": "<...>"}}
```

A hook that emits bare structured data — e.g. `{"records": [], "items": [...]}` —
exits 0 and is silently dropped.

For each command the tool installed under `.claude/settings.json`'s
`hooks` block:

```sh
# 1. Run the hook command standalone and inspect its output
<the hook command> | jq '.'
# 2. The output MUST be wrapped in {"hookSpecificOutput":{"hookEventName":"...","additionalContext":"..."}}.
#    If it's bare data — that's a P1 finding.
```

Confirmable from the live session's transcript JSONL:

```sh
TX=$(ls -t ~/.claude/projects/-...<project>/*.jsonl | head -1)
# Pick a token that should appear in the hook's output
grep -c '<some-token-from-output>' "$TX"   # 0 = output never reached agent context
```

---

## Pillar 3 — Monitor the stream live

### Operator handoff

> "Open a new terminal, `cd <project>`, run `claude`, and start the
> workflow you want to test. I'll watch in real time. Tell me when
> you're done, or if you hit something that feels wrong — I want to
> hear about it as it happens, not after."

Find the new transcript JSONL the moment it appears:

```sh
TX_DIR=~/.claude/projects/$(echo "<project>" | tr / -)
ls -t "$TX_DIR"/*.jsonl | head -1
```

### High-value first calls

Before the operator drives freely, get these captures — they prove or
disprove the most common integration bugs in seconds:

1. **A live event-stream subscription, started BEFORE anything else.**
   If the tool publishes an event log (NATS, fossil, Kafka,
   structured-stdout `--watch` mode), launch the watcher in a
   backgrounded shell and tee output to a file. Without this, you can
   only post-hoc reconstruct the stream from snapshots — which loses
   transient transitions.
2. **The hook-protocol check from Pillar 2** — confirm the hook's
   `additionalContext` does or does not actually appear in the new
   Claude session's transcript, not just standalone.
3. **`<tool> --help` AND `<tool> <verb> --help` for every verb you
   care about.** Top-level `--help` often hides rich filters that only
   appear under subcommand `--help`. Discoverability gaps are themselves
   findings.

### What to monitor in parallel

- Tool-side log files. If they're silent during routine operation,
  **silence is a finding** — no RPC audit trail. Note it explicitly.
- The operator's transcript JSONL (each new event arrives as a
  notification via the harness `Monitor` tool).

### Operator coaching

Things the operator (and you) cannot do — set expectations early so you
don't burn 3+ minutes finding out:

- **Slash commands (`/doctor`, `/clear`, `/compact`, etc.) are
  REPL-only.** They can't be invoked from a tool call, can't be
  redirected to a file, won't fall through to a subprocess. If you need
  data from one, ask the operator to run it by hand, ESC out of the TUI,
  and paste relevant lines into a file under `/tmp/spy-…/`.
- **`claude doctor` (the shell subcommand) is an interactive TUI too**,
  not a redirect-friendly CLI. It will hang on `> /tmp/...` redirection.
  Same workaround.
- **`harness-tell` injects literal text into the input box.** Slash
  commands typed there ARE recognized by Claude Code, but it's the same
  as the operator typing them — no scripting around the TUI.

### When the operator stays idle

If the operator goes idle for 10+ minutes after the handoff:

1. **Drive small read-only tasks yourself.** Run the tool's read-only
   verbs (status, list, watch, show equivalents). You'll find the bulk
   of daily-driver bugs without needing the operator's specific workflow.
2. **Skip ahead cleanly.** A spy report from Pillar 1 + a self-driven
   verb sweep is still useful. State explicitly in the report what was
   *not* exercised.

Don't wait indefinitely. Burning a 9-minute `harness-listen` timeout
three times is not investigation, it's stalling.

---

## Pillar 4 — Write findings

For every event observed, classify into one of three buckets and append
to `findings.md` *immediately*:

- **Bug** — the tool did something wrong: error, crash, wrong output,
  data loss, hook misfire, stale status, race, hang, command exits
  non-zero when it shouldn't
- **Inconvenience** — the tool worked but the operator had to do extra
  work, wait without feedback, guess what to do next, retry, or
  copy-paste around something
- **Improvement** — the tool could plausibly do this better even if it
  isn't strictly broken

Each finding gets:
- ID (sequential), severity guess (P0–P3), one-line title
- Source pointer: `<file>:<line>` or `<jsonl-uuid>` or
  `<bootstrap-log>:<line>`
- Observed (what the tool actually did)
- Expected (what should have happened)
- Repro hint (minimal steps if obvious)

### Quiescence sanity check before finalising

When the operator pauses or finishes, re-run the tool's status verb and
compare to Pillar 1's `after/`. Anything that drifted unexpectedly
(orphan processes, leftover holds, stale state, missing artifacts) is a
finding. Also `lsof` long-lived sidecar processes — held files in
`~/.Trash/` or in deleted state dirs are a known orphan pattern.

Re-run the network egress check from Pillar 1 — note any outbound
connections that appeared/disappeared.

### Final report shape

Deliver inline (the user prefers chat-rendered audits over auto-saved
docs). Save the long version to `findings.md` in the workspace and link
to it; only inline the highlights:

```
# <Tool> spy report — <project> — <UTC date>

## Environment
<tool> <version> · <OS> · project type · git HEAD <sha>

## Fingerprint diff
- N files added by bootstrap (categorized: state / hooks / config / artifact)
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
- List untouched verbs / surfaces. A normal spy covers ~15% of a
  mature tool's surface area. Be honest about the gap.

## Hand-off
Next: `superpowers:systematic-debugging` on the P0/P1 bugs, then
`to-issues` to file. Workspace at /tmp/spy-…/ for raw evidence.
```

---

## Optional: architectural reflection

If the user requests an architectural reflection / root-cause clustering
/ "why are these bugs related," the answer must be source-grounded, not
behavior-grounded:

- Spawn an Explore subagent on the tool's source repo with the specific
  bugs and a path:line-required output format. Behavior alone can't tell
  you "is this two bugs in different call sites or one upstream bug?" —
  only the source can.
- Cite `path:line` for every architectural claim. Quote source comments
  where authors have already named the design choice (smoking-gun
  comments are gold).
- Verify "X-line fix" claims against actual code before publishing.
  Behavioral observation rarely tells you fix size; code does.

---

## Discipline

- **Read-only mindset.** No teardown verbs (`tool down`), no `kill`, no
  `rm` of state files during the spy. The session is evidence. If
  something is genuinely broken and the operator needs to recover,
  surface it as a finding and ask before nuking.
- **Replicate to verify.** If a finding cites a log line, re-tail the
  log and confirm. If it cites a JSONL event, re-`jq` it. Subagents and
  your own first read both abbreviate.
- **Upstream over user-visible.** When the operator's visible error and
  the tool's log disagree, the log's earlier error is usually the real
  cause. Name the upstream as the root cause and the user-visible as
  the symptom.
- **Operator-nuke-instinct is itself a finding.** If the operator
  reaches for a "blow it all away" recovery, the underlying tool is
  missing a recovery affordance. File that as an improvement.
- **Verify fix-size claims against source.** "5-line fix" is a claim
  the source has to back. If you didn't read it, don't say it.

## Common mistakes

| Mistake | Fix |
|---|---|
| Fingerprinting only the obvious tool dir | Also check `.claude/`, project root, transcript dir, every dot-dir the tool's docs mention |
| Watching only the JSONL | Tail tool-side logs in parallel — sometimes the bug is sidecar-side, never surfaces in the session |
| Trusting `tmux capture-pane` over the transcript JSONL | tmux is screen buffer (line-truncated, scroll-bound). The JSONL is authoritative. Default to JSONL-first analysis. |
| Reporting "operator got confused" without a root cause | Trace to a specific tool output / missing prompt / unclear status — that's the real finding |
| Forgetting to pin tool version | Capture `<tool> --version` in Pillar 1 *and* during quiescence — version may change mid-session if the tool self-updates |
| Letting the operator finish before opening `findings.md` | Capture live; details fade in minutes |
| Confusing existing repo state with tool-added state | The Pillar-1-before fingerprint is what disambiguates — don't skip it because the project "looks clean" |
| Asking the operator to "redirect /doctor output" to a file | `/doctor` is REPL-only and `claude doctor` is a TUI. Both will hang on redirect. Have the operator paste output by hand. |
| Conflating "hook fired" with "its output reached the agent" | Hook firing means exit-code 0 and stdout captured. Output reaching the agent requires `hookSpecificOutput` envelope shape. Verify with `grep` of the new transcript's `additionalContext`. |
| Calling fixes "X lines" without verifying against source | Behavioral observation rarely tells you fix size. Spawn an Explore agent or read the source before claiming. |
| Waiting indefinitely for an idle operator | After 10 min idle, drive read-only verbs yourself or skip to writing findings. Stalling on `harness-listen` timeouts is not investigation. |
