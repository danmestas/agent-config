---
name: ci-watch
version: 1.0.0
type: skill
description: >-
  Use when watching CI/CD checks complete — `gh pr checks`, `gh run watch`,
  polling PR conclusion, waiting for builds to finish before merge. Triggers:
  'watch CI', 'wait for build', 'poll PR', 'check CI status', 'is the build
  done', '/ci-watch'.
targets:
  - claude-code
  - codex
  - gemini
  - copilot
  - pi
category:
  primary: workflow
  secondary:
    - backpressure
---

# ci-watch: Watching CI to Completion

CI is the canonical "external event you're waiting on" — pair this skill with the `wait-watch` mode for cadence rules. This skill covers the mechanics: which `gh` command for which situation, how to read exit codes, how to tell a real failure from a flake.

## Surface

### `gh pr checks <PR>` — rolling status

Returns the current state of every check on a PR. Exit codes carry the verdict:

- **0** — all checks passed
- **1** — at least one check failed
- **8** — checks still pending

Use this for polling. It's cheap (one HTTP call), it's stable (no streaming connection to keep alive), and the exit code is the answer.

```bash
gh pr checks 168            # human-readable
gh pr checks 168 --watch    # blocks, prints updates as checks resolve
```

Prefer the non-watch form inside a poll loop — `--watch` ties up the shell and doesn't compose with `ScheduleWakeup`.

### `gh run watch <run-id> --exit-status` — block to completion

When you have a specific run ID (from `gh run list` or returned by a workflow trigger), `gh run watch` blocks until the run finishes and returns 0 on success / non-zero on failure. Right for "I just kicked off this run, wake me when it's done":

```bash
gh run watch 12345678 --exit-status
```

Pair with `Bash run_in_background: true` so the wait doesn't burn the foreground turn.

### Polling without `gh run watch`

When you don't have a run ID (PR-level checks, multi-workflow), poll `gh pr checks` on a cadence. Defer to the wait-watch mode's cadence rules:

- Build expected within ~5 min → poll every 60–270s
- Idle / unknown completion time → poll every 1200–1800s
- Never poll at 300s — pay the cache miss without amortizing

```bash
until gh pr checks 168 --required; do sleep 270; done
```

(Run this via `Monitor` so each check turns into a notification, not a foreground block.)

## Distinguishing flakes from real failures

Red checks aren't all the same. Before declaring a PR broken, look for the failure shape:

```bash
gh run view <run-id> --log-failed | tail -200
```

Flakes look like:
- `npm ERR! network` / `ETIMEDOUT` against the registry
- Runner provisioning errors (`Error: The runner has received a shutdown signal`)
- `connection refused` against an external service
- Action-version-not-found (registry hiccup)

Real failures look like:
- Test assertions
- Type errors / lint errors
- Build / compile failures
- Missing files

For a flake, `gh run rerun <run-id>` and re-poll. **Wait at least 30 seconds** after a rerun before polling — the new run needs time to register, and a too-fast poll will read the old (failed) status and falsely report still-broken.

## Gating actions on green CI

Surface these separately from the watch loop — they're "what to do once it's green", not "how to wait":

- `gh pr ready <PR>` — flip draft to ready for review
- `gh pr merge <PR> --merge --delete-branch` — merge and clean up the branch in one shot. Add `--auto` to queue the merge for whenever CI goes green.

The `--delete-branch` flag deletes the remote branch on merge; combine with `git branch -d <name>` locally and `git fetch --prune` to clear the stale ref.

## Reporting

When CI completes:
- Pass: one line — "PR #168 green (7/7 checks)" — and proceed to the gating action.
- Fail (real): summarize which check failed and the failure mode. Don't dump the whole log.
- Fail (flake suspected): name the flake pattern, rerun, set the next check-back per cadence rules.

Don't report "CI is still running" repeatedly. The user knows; the polling cadence is the report.
