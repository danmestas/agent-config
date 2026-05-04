# stasi

Surveillance skills for agent sessions. Two complementary postures:

- **Live observation** — watch an operator's Claude Code session under bones in real time, classify every divergence between expectation and reality, and write findings as they happen.
- **Cold-read forensics** — reconstruct what a prior agent did from the artifacts it left behind (transcripts, dirty git state, log files, orphan processes).

The output of either skill is a structured findings report (bugs, inconveniences, improvements), ready to hand off to `superpowers:systematic-debugging` for repro and `to-issues` for filing.

## Skills

| Skill | Use when |
|---|---|
| [`spy-on-bones-session`](skills/spy-on-bones-session/SKILL.md) | A live operator will run `bones up` + `claude` in a target project and you can watch the session in real time. Fingerprints `<project>` before and after `bones up`, then tails the new transcript JSONL plus bones-side logs. |
| [`investigating-agent-sessions`](skills/investigating-agent-sessions/SKILL.md) | The session is already over. Only artifacts remain — transcripts on disk, dirty files, log entries, running processes. Reconstruct what happened well enough to debug or continue. |

## Boundaries

- **Read-only by default.** Both skills treat the session as evidence. No mutating commands during observation. If something is broken and the operator needs to recover, surface it as a finding and ask before nuking state.
- **Replicate to verify.** Subagents and first reads both abbreviate. Before writing a finding into the report, re-tail the log or re-`jq` the JSONL event it cites.
- **Upstream beats user-visible.** When the operator's error and the bones log disagree, the log's earlier error is usually the real cause. Name the upstream as the root cause; the user-visible message is the symptom.

## Hand-off

Findings produced here feed downstream:

- P0/P1 bugs → `superpowers:systematic-debugging` for minimal repro
- Anything worth filing → `to-issues` for ticket creation
- Improvements that affect bones core → upstream PR via `bones` repo
