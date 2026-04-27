---
name: subagent-to-subharness
description: Use when you would normally dispatch a subagent via the Agent tool but you're operating as the Darkish Factory orchestrator. Translates the muscle memory into subharness dispatch. Maps task shapes to the right harness role, frames the task in caveman-standard, reads worker output back, decides next step.
category:
  primary: workflow
---

# Subagent → subharness translation

You came to this repo with Claude Code muscle memory: when a task is delegate-shaped, dispatch a subagent via `Agent`. In the Darkish Factory orchestrator role that's almost always the wrong reflex — you should spawn a **subharness** instead.

Subagents and subharnesses look similar (both delegate work, both return output) but their costs and capabilities differ.

## What's the difference?

| Property | `Agent` tool (subagent) | `bin/darkish spawn` (subharness) |
|---|---|---|
| Process | In-process, same Claude Code | Containerized, isolated |
| Backend | Same model as you | Per-role: claude-opus, claude-sonnet, claude-haiku, codex/gpt-5.5 |
| Skills | Inherits yours | Per-role staged bundle in `/home/scion/skills/role/` |
| Worktree | Shared with you | Own worktree, scion-managed |
| Auth | Yours | Hub secret per backend |
| Tool surface | Your tools | The role's manifest tools |
| Lifecycle | Synchronous, you wait | Async, poll via `scion list` / `scion look` |
| Cost | Cheap (same context) | Expensive (cold start, separate auth) |
| When | Pure-text, host-bound, < 2 min | Anything else |

## Decision tree

```
Operator gives you a task.
│
├─ Pure-text host work? (read code, summarize, search, draft a message)
│  └─ Stay inline. If broad codebase exploration → Agent (Explore).
│
├─ Mutates files / runs tests / builds / writes code?
│  └─ Spawn a subharness. Pick role from the table below.
│
├─ Needs a different model for cross-vendor diversity (verify, review)?
│  └─ Spawn a codex-backed subharness (verifier, reviewer, sme, darwin, planner-t4).
│
├─ Needs long context for spec drafting?
│  └─ Spawn planner-t4 (codex/gpt-5.5, 4h, 100 turns).
│
├─ Need a focused single answer to a well-formed question?
│  └─ Spawn sme (codex/gpt-5.5, 15m, 10 turns). Rejects malformed questions.
│
└─ Long-running observer / chronicle?
   └─ Spawn admin (claude-haiku, 8h, detached).
```

If you're tempted to use `Agent` for anything in branches 2–5, stop. The right primitive is `darkish spawn`.

## Mapping table

| Subagent reflex | Subharness equivalent | Notes |
|---|---|---|
| "I'll dispatch a researcher to gather context" | `darkish spawn r1 --type researcher "..."` | Researcher has no skills bundled (cheap recon); produces a brief in its worktree. |
| "I'll Agent out for spec writing" | `darkish spawn d1 --type designer "..."` | Designer is opus, gets ousterhout/hipp skills. |
| "I'll plan this in a sub-Agent" | `darkish spawn p1 --type planner-tN "..."` | Pick tier per `orchestrator-mode` skill. Default ambiguous → planner-t3. |
| "I'll have a sub-Agent write tests + impl" | `darkish spawn i1 --type tdd-implementer "..."` | Implementer is claude-sonnet; commits to its worktree. |
| "I'll ask a fresh Agent to verify" | `darkish spawn v1 --type verifier "..."` | Codex/gpt-5.5 — cross-vendor adversarial. |
| "I'll get a code-review Agent's opinion" | `darkish spawn rev1 --type reviewer "..."` | Codex/gpt-5.5 — block-or-ship. |
| "I'll spin up an SME for one question" | `darkish spawn s1 --type sme "..."` | Codex/gpt-5.5; 10 turns; rejects bad framing. |
| "I'll have an Agent log activity" | `darkish spawn admin1 --type admin "..."` | Detached; long-running chronicle. |
| "I'll evolve the pipeline post-run" | `darkish spawn dw1 --type darwin "..."` | Emits YAML to `.scion/darwin-recommendations/`; you gate via `darkish apply`. |

`Agent` is still right for: open-ended codebase exploration where the answer is text ("how does X flow through this repo?"), reading + summarizing many files, or scratch-pad reasoning that doesn't touch the worktree. The `Explore` subagent type is the canonical example — keep using it for those.

## Framing the task — caveman standard

Subharnesses talk to you in caveman tiers (per the `caveman` skill). When you compose a task for a subharness, write it caveman-standard: lead with the verb + objective, then bound the output, then context.

**Bad (subagent-style verbose):**
```
Hi! I need you to take a look at the authentication flow in our codebase. Specifically, I'm wondering if the session token handling is going to cause any issues with our new compliance requirements. Could you maybe look into it and let me know what you think? It would be great if you could also suggest some improvements...
```

**Good (caveman standard):**
```
Audit session-token handling in pkg/auth for compliance gap.

Output: docs/research-brief.md — 1 page max, evidence-first, list specific files+lines that fail compliance, propose minimum fix per finding.

Context: legal flagged token storage on 2026-04-22; constitution §VI requires rotation every 24h.
```

The subharness's manifest already constrains `max_turns` and `max_duration` — your task framing constrains scope and output shape. The caveman tier prevents prose drift.

## Reading output back

After `darkish spawn <name> --type <role> "<task>"`:

```bash
darkish list                  # see live state of all agents
scion look <name>             # read the agent's output (use --tail N for last N lines)
scion stop <name> --yes       # kill if hung (10-min heartbeat)
darkish doctor <name>         # per-harness preflight + post-mortem on the agent.log
```

If the agent committed deliverables to its worktree, cherry-pick them into your branch. Always log the dispatch + outcome in `.scion/audit.jsonl`.

## When NOT to spawn (anti-patterns)

- **One-shot info retrieval** ("what does config.X mean?") → use `Read` or stay inline. Spawn cost > task cost.
- **Trivial code edit** the operator could review in 30 seconds → just `Edit` (only allowed in operator-direct mode, not orchestrator mode — but if the operator explicitly authorizes, fine).
- **Already-spawned task** that's still running. `darkish list` first; don't double-spawn.
- **Spawning yourself** (the orchestrator role). You ARE the orchestrator in this session.

## When to escalate to the operator instead of dispatching

If the subharness output triggers the **escalation classifier** (Stage 1 deterministic gate or Stage 2 adversarial LLM), batch the question to the operator. Don't keep dispatching to "fix" something that hit a taste/ethics/reversibility/spec-silent issue. See the `orchestrator-mode` skill for the classifier specifics.

## Cross-vendor pattern

The pipeline pairs a claude-backed worker with a codex-backed cross-vendor pass for verification + review. This is deliberate: a single-vendor pipeline can mass-fail on the same blind spot. When you spawn an implementer (claude/sonnet), follow up with a verifier (codex/gpt-5.5) and reviewer (codex/gpt-5.5) — those flips bake the cross-vendor opinion into the loop.
