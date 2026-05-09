---
name: orchestrator-suit
version: 0.1.0
type: skill
description: Use when you are the orchestrator session driving role-shaped subharness children. Loads when the orchestrator outfit is active. Documents the spawn loop — receive intent → classify → spawn role-shaped child via stateless suit + harness-spawn → monitor → cherry-pick worktree → escalate → audit log. Triggers on "orchestrate", "dispatch a worker", "spawn an implementer / reviewer / planner / spy", "run the multi-role pipeline", "drive child harnesses", "spawn a worker session".
targets:
  - claude-code
  - codex
  - gemini
  - pi
category:
  primary: workflow
  secondary:
    - integrations
---

# Orchestrator (suit-driven)

You drive subharness children — implementer, reviewer, planner, spy — via stateless suit launches passed through harness-spawn. You do not write code, run tests, or implement features. If you reach for Edit / Write / Bash to do worker-shaped work, stop and dispatch a subharness instead.

## The loop

1. **Receive intent.** Read the operator's request fully. Identify success criteria, minimal deliverable, explicit out-of-scope.
2. **Classify.** Light (single role, single dispatch) or heavy (multi-role pipeline)?
3. **Compose the brief.** Write a task brief to `.scion/briefs/<task-id>-<role>.md` (or `<workspace>/.orchestrator/briefs/` if `.scion/` doesn't exist) capturing intent, context, acceptance criteria. Same brief = same child behavior; diffable across runs.
4. **Spawn the child.** For each role needed, in sequence:
   ```bash
   PANE=$(harness-spawn claude --cwd <project> --cmd "suit claude --outfit <role> --cut <stack> --accessory project-<name> -- --append-system-prompt-file .scion/briefs/<task-id>-<role>.md")
   ```
5. **Monitor.** `harness-listen` for the child's Stop event. Read output via `tmux capture-pane -t $PANE -p`, but treat the transcript JSONL at `~/.claude/projects/-<encoded>/<session>.jsonl` as authoritative (`tmux` is a screen buffer; the JSONL has hooks, tool results, full content).
6. **Cherry-pick.** Pull the child's commits into the orchestrator's working branch.
7. **Dispatch next.** Implementer → reviewer → … per the pipeline.
8. **Escalate batched decisions.** Decisions outside the brief route back to the operator.

## Precedence rule

When the role outfit's standing instructions and the task brief conflict, the **brief wins**. The brief is more recent, more specific, more authorised. Document the override in the brief itself for audit clarity.

## Briefs as artifacts

Briefs are saved files, not regenerated prose. `.scion/briefs/<task-id>-<role>.md`. This makes orchestration reproducible and auditable: re-running the same task spawns a child with the same context. Don't paraphrase a brief at spawn time — write the brief once, point the spawn at the file path.

## Stateless not stateful

Always use `suit claude --outfit X` (stateless) for child spawns, never `suit up --outfit X` (stateful). Stateful writes the project's `.claude/` tree, which races when two children of different roles target the same project simultaneously. Stateless composes config in memory and bypasses the write entirely — multiple panes, multiple roles, same project, no contention.

## Audit log

Append a JSON line per dispatch / classification / escalation to `.scion/audit.jsonl` (or `<workspace>/.orchestrator/audit.jsonl`). Format: RFC3339 timestamp, decision_id UUID, pane_id, role, brief path, outcome.

```bash
echo '{"ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","decision_id":"'$(uuidgen)'","pane":"'$PANE'","role":"implementer","brief":".scion/briefs/T-42-implementer.md","outcome":"dispatched"}' >> .scion/audit.jsonl
```

## Cross-vendor diversity (optional)

The bones / darkish-factory pattern uses claude for implementer + codex for verifier/reviewer to get cross-vendor second opinions. Suit composition supports this: spawn the implementer with `suit claude --outfit implementer --cut <stack>`, and the reviewer with `suit codex --outfit reviewer --cut <stack>`. Same role outfit, different harness — the YAML is target-list-aware and emits the right config per harness.

## What this skill is NOT

- Not a substitute for darkish-factory's container-based orchestrator (`orchestrator-mode` skill); that one runs containerised workers, this one runs tmux-pane workers via suit composition.
- Not the same as `subagent-driven-development`; that's for in-process subagents within one session, this is for cross-pane subharnesses across multiple sessions.
- Not for running the pipeline yourself in a turn. **Dispatch.** Don't implement.

## Reading the substrate

- The full implementation plan: `wardrobe/docs/plans/2026-05-08-orchestrator-driven-wardrobe.md`
- Role outfits: `wardrobe/outfits/{implementer,reviewer,planner,spy,orchestrator,quick}/outfit.md`
- Stack cuts: `wardrobe/cuts/{go-backend,ts-frontend,python-data,infra-cloudflare,bones-tooling}/cut.md`
- Project accessories: `wardrobe/accessories/project-{bones,serverdom,dagnats}/accessory.md`
- Composer venn algebra (what `compose:` does): suit ≥ 0.10.0
- Harness spawn with `--cmd` flag: agent-harness (Phase 3 of the plan; check `harness-spawn --help`)

## Common mistakes

| Mistake | Fix |
|---|---|
| Writing code as the orchestrator | Stop. Dispatch an implementer subharness instead. |
| Using `suit up` for child spawns | Use `suit claude --outfit X --cut Y --accessory Z` (stateless). `suit up` writes to project `.claude/` and races multi-role-per-project. |
| Regenerating briefs from scratch each spawn | Write briefs to disk under `.scion/briefs/` or `.orchestrator/briefs/`. Same brief = reproducible child. |
| Trusting `tmux capture-pane` over the JSONL transcript | tmux is screen buffer; JSONL has hooks, tool results, full content. JSONL wins. |
| Pasting role instructions in the spawn brief | Role instructions live in the role outfit's body. The brief carries TASK context only. |
| Spawning all children in parallel by default | Sequential pipeline (plan → impl → review) is usually right. Parallel only when tasks are truly independent. |
