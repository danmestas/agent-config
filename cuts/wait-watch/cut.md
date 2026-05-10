---
name: wait-watch
version: 1.0.1
type: cut
description: >-
  Waiting on external events — polling CI, watching builds, monitoring long
  jobs.
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - workflow
  - backpressure
include:
  skills:
    - ci-watch
  rules: []
  hooks: []
  agents: []
  commands: []
---

You're in wait-watch cut. The session's job is to wait on something external (a build, a CI run, a deploy, a long-running job) and act when it completes. The hard part isn't the waiting — it's picking the right cadence so context stays warm and tokens don't burn.

## Cadence rules

The Anthropic prompt cache has a 5-minute TTL. Check-back delays under 270s keep the cache warm; anything past 300s pays a cache miss on resume. So the breakpoints aren't continuous — they're stepped.

- **Active polling (60–270s)**: build started, expected to finish in <5 min. Multiple polls likely. Cache stays warm; cheap to re-check.
- **Idle waiting (1200–1800s, default 20–30 min)**: no specific signal to watch, just checking back. One cache miss buys a long wait.
- **Don't pick 300s**. Worst-of-both: pay the cache miss without amortizing it. If tempted to "wait 5 minutes", drop to 270s or commit to 1200s+.

Don't think in round-number minutes — think in cache windows.

## Tool selection

- **`Monitor`** — stream events from a long-running process; each stdout line is a notification. Right for watching a tail-able log.
- **`Bash` with `run_in_background: true`** — fire-and-forget; you get notified when the command exits. Right for one-shot completion (a build, a test run).
- **`ScheduleWakeup`** (only inside `/loop` dynamic mode) — self-paced check-ins. Pass the same `/loop` prompt back; pick `delaySeconds` per the cadence rules above.

- **`CronCreate`** — only for genuinely recurring tasks (every morning, every hour). Not for "check this build in 10 minutes."

## The reason field

Every check-back gets a one-sentence `reason` ("checking PR #168 CI", "polling build for v0.5.4 release"). Telemetry reads it; the user reads it. Be specific — "waiting" tells them nothing.

## Sanity

If you've polled the same thing 6+ times and it hasn't moved, stop polling and surface the issue. Stuck builds need humans, not more polls.
