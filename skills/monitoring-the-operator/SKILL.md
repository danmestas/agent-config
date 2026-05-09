---
name: monitoring-the-operator
version: 0.1.0
type: skill
description: >-
  Live-monitor an active operator session from a worker pane (typically a
  stasi/wait-watch worker auditing the parent that spawned it). Use when a
  worker should watch the operator's transcript JSONL in real time, surface
  audit-worthy events without polling, distinguish active autonomous runs
  from hangs, and avoid the chat-Stop feedback loop that wakes the operator
  on every routine eval. Triggers when the user spawns a wait-watch worker
  and asks it to "watch what I do", "monitor my session", "audit the
  orchestrator live", "tell me if I do anything wrong", or any equivalent.
targets:
  - claude-code
category:
  primary: evolution
  secondary:
    - tooling
    - backpressure
---

# Monitoring the Operator

Live-monitor an operator's active Claude Code session from a worker pane.
The operator is typing and tool-calling; the worker is observing. Goal:
surface audit-worthy events in real time, with minimal context overhead and
zero feedback-loop noise.

This skill is the *active* counterpart to `investigating-agent-sessions`
(cold post-mortem) and the *operator-aware* counterpart to `spy-on-session`
(tool-integration audit). It assumes the session is happening NOW, the
operator is the parent that spawned you, and you have read access to their
transcript JSONL.

## Turn-1 priority — ask the operator's exclusion model

Before doing anything else — before the audit, before the first read — send
the operator a one-line tell asking which listener exclusion model they run.
This is mandatory. Skipping it caused the documented amplification-loop
incident (F-7 below). Pattern selection (A vs B) is downstream of this
answer; do not pick a pattern before you have it.

The exact question:

> "Stasi here. Two questions before I start: (a) what's your listener
> exclusion model — am I excluded by default, or always in scope? (b) is
> monitoring scoped to this session only, or persistent until canceled?"

Wait for the answer. If the operator is idle, set a 5-minute
ScheduleWakeup; do not proceed with default Pattern A on assumption.

Once you have the exclusion model, the next mandatory step is the
`## Subagent delegation discipline` section — read it before any
multi-file read pass.

## When to use

- Spawned with `--outfit stasi --cut wait-watch` to audit a live session
- Operator asked: "watch what I do", "spy on my session", "tell me if I
  go off doctrine", "monitor the orch", "wake me if I do X"
- Long autonomous run where hang-detection matters and bash polling is
  the wrong tool

## When NOT to use

- The session is already over → `investigating-agent-sessions` (cold-read)
- Tool-integration audit, not session audit → `spy-on-session`
- Watching a CI build or external process, not an operator → `ci-watch`
- The "operator" is a peer worker, not the parent that spawned you →
  use `harness-subscribe <peer>` from the harness toolkit; this skill
  assumes the operator is the parent (and therefore not in the registry,
  has no `HARNESS_PANE_ID`, and emits no Stop hooks)

## Core asymmetry: the operator is structurally invisible to harness hooks

The operator session is started plainly (`cd <project> && claude`), not
via `harness-spawn`. That's correct — the env-var distinction `HARNESS_PANE_ID`
unset is what marks them as operator. But it means:

- The operator's Stop hook never fires (gates on `HARNESS_PANE_ID`).
- Their pane has no entry in `~/.cache/harness-registry/`.
- `harness-subscribe %27` would set up a daemon that never has anything
  to deliver — there are no Stop markers to fwatch.

So `harness-subscribe` does NOT work on operators. Use the **JSONL
transcript watch** path (the `harness-orchestration` skill flags this at
its "JSONL transcript alternative" section but doesn't make it easy).

## Filter design discipline (sample before you filter)

Before writing any Monitor filter for the JSONL, sample the data structure
and count expected fires. The two ways filters fail are not symmetric:

- **Too broad** → auto-stop for noise (Claude Code stops monitors that
  produce too many events).
- **Too narrow** → silent during real activity, indistinguishable from a
  hung process.

The discipline:

```sh
# 1. Count what each candidate filter would have matched historically
TX=<operator-transcript-jsonl>
grep -c '"role":"assistant"' "$TX"          # too broad? typically 6× per turn
grep -c '"stop_reason":"end_turn"' "$TX"     # logical-turn count
grep -c '"stop_reason":"tool_use"' "$TX"     # tool-call cadence
grep -oE '"stop_reason":"[^"]+"' "$TX" | sort | uniq -c   # full distribution

# 2. Look at the ratio
# If "candidate filter" matches > 6× the "logical turn" count, too broad.
# If < 0.5× the logical-turn count, possibly too narrow.

# 3. For multi-signal monitors, think about what each signal means
# semantically:
#   end_turn       = "operator just finished, safe to interrupt"
#   tool_use       = "operator is alive and working" (heartbeat — rate-limit it)
#   no events for N min while jsonl mtime stale = "possible hang" (silence alarm)
```

Single-signal filters all observed-fail in real sessions. Three signals
combine into the right shape — see Pattern A's recipe.

**Don't**: write the filter from memory, then debug noise/silence in
production.
**Do**: sample first, count expected fires, validate, then arm.

## Pattern A — exclusion-allowed: multi-signal Monitor

Stasi/wait-watch means the operator IS your target. Arm the monitor on
your *first* turn, before responding to your initial brief. Don't make
the operator prod you with "do you have an active monitor?" — that's a
sign you waited too long.

### Step 1 — find the operator's transcript JSONL

```sh
# The encoded path mangles slashes to dashes
PROJECT_DIR=/Users/<you>/projects/<their-project>   # or wherever they are
ENC=$(echo "$PROJECT_DIR" | tr / -)
TX_DIR=~/.claude/projects/"$ENC"

# Pick the most-recently-modified jsonl — that's the live session
TX=$(ls -t "$TX_DIR"/*.jsonl 2>/dev/null | head -1)
[ -n "$TX" ] || { echo "no live transcript at $TX_DIR"; exit 1; }
echo "watching: $TX"
```

If you're unsure which project the operator is in, ask once. Don't guess
across multiple `~/.claude/projects/-*` dirs — picking the wrong one means
you're watching a stale session.

### Step 2 — arm Monitor with a multi-signal filter

Use the **`Monitor`** tool. NOT `Bash` with `run_in_background`. Monitor
is persistent and self-rearming; bg-bash exits on each event and needs
manual re-arm — exactly the discipline gap that breaks effective monitoring
(documented failure: a bg-bash listener fires once, parent forgets to
re-arm during a multi-step task, then goes deaf for the rest of the
session).

The filter must emit **three distinct signals**, not one:

```
Monitor(
  description: "operator <pane> turn-end + heartbeat + silence-alarm",
  persistent: true,
  timeout_ms: 3600000,
  command: '''
    TX=<path-to-jsonl>
    LAST_HEARTBEAT_TS=0
    HB_INTERVAL=120   # seconds between heartbeat emits
    LAST_SEEN_TS=$(date +%s)
    tail -F -n 0 "$TX" 2>/dev/null | awk -v hb="$HB_INTERVAL" '\''
      function ts_now() { return systime() }
      /"stop_reason":"end_turn"/ {
        t = $0; sub(/.*"timestamp":"/, "", t); sub(/".*/, "", t)
        print "TURN-END @ " t
        last_seen = ts_now()
        last_hb = ts_now()
        fflush(); next
      }
      /"stop_reason":"tool_use"/ {
        last_seen = ts_now()
        if (ts_now() - last_hb >= hb) {
          t = $0; sub(/.*"timestamp":"/, "", t); sub(/".*/, "", t)
          print "HEARTBEAT (tool-use) @ " t
          last_hb = ts_now()
          fflush()
        }
        next
      }
    '\''
  '''
)
```

Then a separate **silence alarm** via `ScheduleWakeup` (or a second tiny
Monitor that polls `last-modified` of the jsonl every 30s):

```
ScheduleWakeup(
  delaySeconds: 600,    # 10 min, well under cache TTL
  reason: "silence alarm — check operator transcript hasn't gone quiet",
  prompt: <self-prompt to re-eval>
)
```

The three signals, by purpose:

| Signal | Filter | Cadence | Means |
|---|---|---|---|
| **TURN-END** | `"stop_reason":"end_turn"` | ~1 per logical turn | Operator finished a turn; safe to push if you have a finding |
| **HEARTBEAT** | `"stop_reason":"tool_use"`, rate-limited | ≤1 per N minutes | Operator is alive and working — *not* hung |
| **SILENCE-ALARM** | scheduled re-check | one-shot at N minutes | If neither TURN-END nor HEARTBEAT fired in the window, possible hang — surface to operator |

Single-signal failures observed in practice:
- **Only `assistant`-role match**: 6× per turn (every tool-call message), monitor auto-stopped for noise.
- **Only `end_turn` match**: zero events for 28 min during a long autonomous run; orchestrator looked dead but was actively tool-looping.
- **Only `tool_use` match**: catches activity but never marks "responsive now" moments — never know when it's safe to push without interrupting.

## Push contract — three tiers, never improvise

Pick the right one BEFORE you respond to a Monitor event. The default is
silence. Talk only when you'd talk on a hot phone line — terse, scoped,
real.

### Tier 1 — Silent (default)
No chat output. No `harness-tell`. The Monitor task itself absorbs the
event; you do an internal eval; if not actionable, your turn is just `.`
or empty. Most events land here.

### Tier 2 — Chat in your own pane
A finding worth your turn-end record but NOT worth interrupting the
operator. Examples: "noted: orch just hit pattern X for 3rd time", "filed
internal observation", "monitor cadence stabilized to ~1 turn-end per
40s." The operator can `tmux capture-pane -t <you>` to read on demand.

### Tier 3 — `harness-tell %<operator-pane> "..."`
Only when the operator should change course NOW, or before they commit a
P0 bug, or after the silence-alarm fires and you want a wellness check.
Format:

```
[from %<you> stasi] <one sentence finding>. <what to do, if obvious>.
```

One push per finding. No multi-question batteries. If two findings land
together, send one tell with both — don't spam two tells.

### Payload-safety rule for harness-tell

`harness-tell` invokes a bash wrapper. Any backtick, `$(...)`, unescaped
double-quote, or stream redirect in the payload will be interpreted by the
shell, not transmitted as text. Failure mode: the call hangs or sends
garbage.

**Rule**: if your payload meets ANY of these, use file-and-pointer instead
of inline:

- Length > 200 characters
- Contains any of: `` ` `` `$` `"` `<` `>` `|`
- Contains code blocks (which usually contain the above)

File-and-pointer pattern:

```sh
# Write the message to a file
cat > /tmp/spy-msg-$(date -u +%s).md <<'EOF'
... your payload, with all special chars safe inside the heredoc ...
EOF

# Send a short pointer
harness-tell %27 "[from %<you> stasi] Reply at /tmp/spy-msg-<ts>.md.
One-line summary: <thing>."
```

The heredoc with single-quoted EOF (`<<'EOF'`) preserves all shell-special
characters as literals. The pointer message stays under the 200-char
threshold and contains no shell-special syntax.

After every `harness-tell`, capture-pane the target to confirm delivery:

```sh
tmux capture-pane -t %<target> -pS -10 | tail -5
```

Look for your payload preview in the input box. If it's queued behind
another message, that's normal — the target will pick it up on next-idle.
If it's missing entirely, the send failed; investigate before retrying.

## Pattern B — no-exclusion: on-demand or aggregated only

If the operator's rule is "every worker stays in my listener," do NOT
run a JSONL Monitor that fires per-turn. The amplification loop is
structural:

```
operator turn-end → your Monitor fires → system injects task-notification
→ you must produce some assistant output (even ".") → your Stop fires
→ operator's listener wakes on your Stop → operator's eval turn → ...
```

The system expects *some* output after each task-notification — a `.` is
enough to fire Stop. You cannot opt out of that without breaking the
session. So under Pattern B, the only safe shape is **no Monitor**.

Three Pattern B sub-modes (pick one):

### B-1: On-demand (default for Pattern B)
Kill any Monitor you armed. Wait for the operator to ping you for an
audit refresh. When pinged, read the transcript tail since last refresh,
evaluate, report. Quietest option; loses real-time signal but operator
keeps full control of when you fire.

```sh
# When pinged, find new entries since the last checkpoint:
LAST_TS=<saved>
TX=<operator's jsonl>
awk -v cutoff="$LAST_TS" '
  /"timestamp":"/ {
    t = $0; sub(/.*"timestamp":"/, "", t); sub(/".*/, "", t)
    if (t > cutoff) print
  }
' "$TX" | jq -c '.message | select(.role == "assistant" and .stop_reason == "end_turn")'
```

### B-2: Aggregated batch
Use `ScheduleWakeup` (inside a `/loop` dynamic) at 30+ minute intervals.
Each wake-up evaluates the transcript delta since last check and emits
ONE batch finding. One Stop per 30 min ≪ one Stop per turn — the loop
math becomes acceptable.

```python
# In /loop dynamic mode:
ScheduleWakeup(
    delaySeconds=1800,   # 30 min, well past cache TTL — accept the miss
    reason="batch audit eval — delta since last checkpoint",
    prompt=<re-enter the same /loop>
)
```

### B-3: Pattern-of-interest only (advanced)
A Monitor whose filter is so narrow that real fires are genuinely rare
(e.g., maybe once per session). Examples that meet the bar:

- `>15 min gap between end_turns` → possible operator-listener deafness
- `>5 consecutive Read/Grep/Bash calls without a single Agent call` →
  subagent-delegation drift (per the user's CLAUDE.md mandate)
- `harness-listen` exit followed by no re-arm within 60s → manual-rearm
  discipline gap

**Bar to clear before adopting B-3**: you have the actual signature
patterns codified as awk/jq filters AND you can demonstrate they fire
≤ 1× per hour in practice. If you can't, fall back to B-1.

## Pattern A's feedback-loop avoidance (kept for completeness)

Under Pattern A (exclusion-allowed), the loop mitigations are:

1. **Operator excludes your pane** from their listener
   (`harness-listen --exclude %<you>`).
2. **You stay silent on routine** — default to Tier 1.

Both required. If the operator has not arranged (1), the loop happens
even if your chat is empty. Ask once via Tier 3 push and downgrade to
Pattern B if they refuse or run a no-exclusion model.

## Re-arm pattern — Monitor, not bg-bash

The harness-orchestration skill teaches a `harness-listen` re-arm pattern
in bg-bash:

```python
while orchestrating:
    Bash(harness-listen 3600, run_in_background=True)
    # parent does other work; manually re-launches after each fire
```

That pattern works on paper, but in practice the manual re-arm step is
the most-skipped step in the whole harness. Real failure mode observed:
listener fired on a worker's Stop, parent processed the wake-up, got
absorbed in spawning a new worker, never re-armed, deaf for 9 minutes
until manually prodded.

**Use `Monitor` instead of bg-bash for operator-monitoring.** Monitor:

- Stays armed across events (one event = one notification, the watcher
  keeps running)
- Survives session-length needs (`persistent: true`)
- Is the right primitive per `feedback_use_monitor_cron_loop` rule:
  *"Monitor — stream events from a long-running process; each stdout
  line is a notification."*

The bg-bash + harness-listen pattern is for one-shot waits. Operator
monitoring is multi-event indefinite — different shape, different tool.

## Liveness vs hang

A long autonomous tool-loop (extended `tool_use` chains, no `end_turn`)
looks identical to a hang from outside. Distinguish:

| Test | Live | Hung |
|---|---|---|
| Recent HEARTBEAT signal in last N min | yes | no |
| Transcript jsonl mtime advancing | yes | no |
| `tmux capture-pane -t %<op> -p \| head -3` shows "Working", "Meandering", spinner chars | yes | no |
| Silence-alarm fired and operator pane shows static screen | unlikely | likely |

When uncertain, capture-pane + check status bar. Claude Code's footer
shows current activity verb (`Working`, `Meandering`, `Thinking`, etc.)
when active and goes blank when idle.

If you decide it's a hang, use Tier 3 push: *"Operator silent for X min,
last activity at <ts>. Capture-pane shows <state>. Possible hang or just
deep work — check?"*

## Subagent delegation discipline

The audit you are conducting almost certainly meets the user's CLAUDE.md
mandate to delegate to subagents:

> *"When any task requires reading ≥3 files, searching across ≥2
> directories, writing >1 doc, or would produce >500 lines of raw tool
> output, dispatch an Explore or general-purpose agent and ask for a
> ≤200-word report. Do NOT do it inline."*

Spy missions match this almost by definition: you read the operator's
transcript (1 file ≈ 10MB), the send-log (1 file), the event-log (1 file),
the registry (multiple files), and several skill files (≥3). That is the
delegation threshold.

**Default behavior**: before any inline read pass that touches >2 files OR
processes >500 lines of output, dispatch an Explore subagent with a
specific question and a ≤200-word report instruction. Read the report.
Decide whether to verify inline.

**Exceptions**: live-monitor mode where each individual read is small and
you need rich context, OR you are confirming a finding the subagent
flagged (verification step — see *Re-verify before publishing* in the
`## Discipline` section).

**Recursive trap**: if the audit you are about to write will flag the
operator for under-using subagents, your own delegation rate during the
audit is the first thing your reader will check. Do not commit the same
failure your finding documents.

## Common failure modes — observed, not hypothetical

### F-1: Filter too broad → auto-stopped for noise
**Symptom**: 5+ events in 30s; Monitor auto-stops "too many events."
**Cause**: matched `"role":"assistant"` (every tool-call message).
**Fix**: tighten to `"stop_reason":"end_turn"` plus rate-limited
heartbeat; never use bare role-match.

### F-2: Filter too narrow → blind during autonomous runs
**Symptom**: zero events for 20+ minutes while operator is clearly active.
**Cause**: `end_turn`-only; operator is in a single extended turn.
**Fix**: add HEARTBEAT signal (rate-limited `tool_use` match) and a
SILENCE-ALARM (ScheduleWakeup at 10–15 min).

### F-3: Feedback loop with operator's listener
**Symptom**: every routine chat reply wakes the operator.
**Cause**: their listener subscribes to your pane; your Stop fires
whether you reply terse or empty.
**Fix**: identify which exclusion model the operator runs.
- Exclusion-allowed → ask for `--exclude %<you>` once, switch to Tier 1
  silence on routine. Pattern A is now safe.
- No-exclusion (hard rule) → kill any Monitor you armed and switch to
  Pattern B (B-1 on-demand is the default). Pattern A is structurally
  unsafe under this rule no matter how silent your chat — every
  task-notification requires an assistant turn, and that turn fires Stop.

### F-7: Picking Pattern A under a no-exclusion operator
**Symptom**: 1:1 amplification — every operator turn produces a stasi
turn, which produces an operator wake, which produces a stasi event…
**Cause**: defaulted to multi-signal Monitor without asking which
exclusion model the operator runs.
**Fix**: kill the Monitor, switch to Pattern B-1, log the constraint
for next session. The "ask first" check at spawn is what prevents this.

### F-4: bg-bash listener never re-armed
**Symptom**: one event, then deaf indefinitely.
**Cause**: bg-bash exited on first event; re-arm forgotten.
**Fix**: use Monitor (persistent) instead. Don't write your own
re-arm loop.

### F-5: Armed too late
**Symptom**: operator already 10+ min into a session before you started
watching; missed the early activity.
**Cause**: waited for explicit "start monitoring" prompt.
**Fix**: stasi + wait-watch means monitoring is the *job*. Arm at spawn,
not on prod.

### F-6: Picked the wrong transcript jsonl
**Symptom**: monitor stays silent forever even though operator is active.
**Cause**: directory has multiple `*.jsonl` and `ls -t | head -1` picked
a stale one (e.g., a session that was idle but not closed).
**Fix**: verify by `ls -la` of the dir + cross-checking with operator's
visible activity. If unsure, ask which session id they're in.

## Minimal recipes

### Pre-flight (both patterns)
```sh
# 1. Find transcript
PROJ=/Users/<you>/projects/<them>
ENC=$(echo "$PROJ" | tr / -)
TX=$(ls -t ~/.claude/projects/"$ENC"/*.jsonl 2>/dev/null | head -1)
echo "watching: $TX"
```

### Pattern A (exclusion confirmed)
Call `Monitor` with the multi-signal awk script from "Pattern A — Step 2".
Then optionally `ScheduleWakeup(delaySeconds: 600, ...)` for the silence
alarm.

### Pattern B-1 (on-demand, default)
No background tooling. When pinged, read the transcript tail since the
last checkpoint via `mcp__plugin_context-mode_context-mode__ctx_execute_file`,
filter for `"stop_reason":"end_turn"` events, evaluate, report. Save the
last-seen `ts_ns` to a file (`/tmp/spy-<pane>-checkpoint.txt`) so the
next refresh starts from the right place.

### Pattern B-2 (aggregated)
Open a `/loop` dynamic session, set `ScheduleWakeup(delaySeconds: 1800)`
to self-pace, evaluate transcript delta on each fire, emit one batch
finding, schedule the next.

## Discipline

- **Read-only mindset.** Don't `tmux send-keys` into the operator pane.
  Don't edit files in their cwd. Don't add hooks. Observe.
- **Surface before silence.** When uncertain whether a finding is push-
  worthy, lean toward Tier 2 (chat in your pane) rather than swallowing
  it. Easier for the operator to skim than to recover lost observations.
- **Date-stamp everything.** Findings without timestamps don't replay
  in the audit report.
- **One question per push.** When you Tier 3 push, ask the smallest
  question that unblocks. No multi-question batteries.
- **Withdraw findings publicly.** If a Tier 3 push turns out to be wrong
  on closer look, send a one-line correction: *"Withdrawing prior
  finding F-7 — re-check showed X."* The operator's audit trust depends
  on you correcting your own record.
- **Re-verify before publishing.** For every numerical or factual claim in
  the audit, run a *second* query that should produce the same answer if
  the claim is right. If the second query disagrees, investigate before
  publishing. Cite both queries in the source pointer for the finding.
  Without this, you are publishing single-source-confirmed claims and one
  of them will be wrong by accident — observed once this session, caught
  by luck.

## Output to the audit report

Maintain a running findings file at `/tmp/spy-<operator-pane>-<UTC>.md`.
Every Tier 2 chat eval and every Tier 3 push gets a numbered entry with
timestamp. At the end of the watch (operator's first explicit "you can
stop watching" or session-end), the file is the deliverable.

The structured format mirrors `spy-on-session`:
- ID, severity (P0–P3), one-line title
- Source pointer: `<jsonl-line-number>` or `<ts>`
- Observed
- Expected
- Recommended

Use the canonical template below. Copy it to your workspace
(`/tmp/spy-<your-pane>-findings.md`) at audit-start; fill it in as findings
land — do not batch.

```markdown
# Spy findings — <target> — <UTC date>

**Author**: <pane-id> stasi/wait-watch
**Target**: <session-id or operator-pane>
**Audit window**: <start-utc> → <end-utc>
**Mode**: <cold-read | live-monitor | mixed>

## Environment
- <agent-version> · <OS> · <project-type>
- Listener exclusion model: <answered-by-operator | unknown>
- Git HEAD or relevant context: <sha or n/a>

## Bugs (P0–P1 first, then P2–P3)

### B-1 [P0/P1] <one-line title>
- **Source**: <jsonl-line-number, ts, or file:line>
- **Observed**: ...
- **Expected**: ...
- **Repro**: ...
- **Verified by**: <second-query that confirmed>
- **Recommended**: <fix shape, smallest action that closes the finding>

## Inconveniences

### I-1 [P2] <title>
Same fields as B-1 (Source, Observed, Expected, Repro, Verified by, Recommended).

## Improvements

### M-1 [P2/P3] <title>
Same fields as B-1.

## Patterns worth promoting (multi-step recipes seen ≥2× this session)

- **A**: <pattern> — <count> instances, <why-promote>

## Doctrine compliance

| Rule | Compliance | Notes |
|---|---|---|
| <rule> | 🟢/🟡/🔴 | <evidence> |

## What I did NOT exercise

Be explicit about coverage gaps. A normal spy covers ≈15% of the surface
area; honesty about the gap is more useful than implied completeness.

- <thing not exercised>
- <another>
- <another>

## Top 5 actionable

Sorted by effort × impact:

1. ...
2. ...
3. ...
4. ...
5. ...

---

*Spy <pane-id>, audit window <range>. Self-reflection saved to <path>.*
```
