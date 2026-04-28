# Using `ac` — Persona + Mode wrapper

`ac` is an opt-in wrapper that filters which skills your harness loads,
based on a named **persona** (long-lived role) and **mode** (ephemeral
intent). Today's behavior is preserved — invoke harnesses without `ac`
and nothing changes.

## What's shipped today (Plan 9 + 9b Phase 2)

- **Claude Code:** Pre-launch HOME-override. `ac` mirrors `~/.claude/` into a tempdir via symlinks, with `skills/` filtered to only the skills allowed by the active persona+mode. Claude sees a curated catalog. **Achieves token reduction.**
- **Codex + Copilot:** Pre-launch cwd-override. `ac` writes a filtered `AGENTS.md` / `copilot-instructions.md` into a per-session tempdir; harness reads it from cwd.
- **APM, Gemini, Pi:** Still on Path B (additionalContext-only). The hook injects "do not invoke X" instructions; skill descriptions still load. False-activation prevention works; token reduction is pending Plan 9b Phases 3-5.

## Quick start

```bash
# Install (one-time)
npm install -g @agent-config/apm-builder

# List available personas / modes
ac list personas
ac list modes

# Use a persona for a session
ac claude --persona backend
ac claude --persona frontend

# Combine with a mode
ac claude --persona backend --mode focused

# Pass through harness args after --
ac claude --persona backend -- --resume sess-123

# Bypass filtering for one invocation
ac claude --no-filter

# Verify the filter glue is installed for each harness
ac doctor

# Inspect a persona or mode before launching
ac show persona backend
ac show mode focused
```

## Authoring your own personas / modes

User-scope:

```bash
mkdir -p ~/.config/agent-config/personas
cat > ~/.config/agent-config/personas/oncall.md <<'EOF'
---
name: oncall
version: 1.0.0
type: persona
description: On-call rotation — observability + incident response
targets: [claude-code, apm]
categories: [tooling, integrations]
skill_include: [debugging, signoz-dashboard-builder]
skill_exclude: []
---

# On-call Persona
EOF
```

Project-scope (for monorepo per-subproject personas):

```bash
mkdir -p .agent-config/personas
cat > .agent-config/personas/this-repo-backend.md <<'EOF'
---
name: this-repo-backend
version: 1.0.0
type: persona
description: This repo's backend slice
targets: [claude-code]
categories: [tooling, workflow]
skill_include: []
skill_exclude: []
---
EOF
```

Project-scope wins over user-scope wins over built-in.

Modes follow the same shape under `modes/<name>/mode.md`. The body of a mode is injected as additional context when active.

## Built-in personas (shipped with agent-config)

| Persona | Use when |
|---------|----------|
| backend | Go / server-side / observability work |
| frontend | Datastar / UI / client-side work |
| personal | Journaling, knowledge-base, non-code |
| taxes | Tax prep / document handling |
| aviation | Flight planning, ops references |

## Built-in modes

| Mode | Effect |
|------|--------|
| code | TDD discipline, philosophy + tooling skills emphasized |
| design | Design systems + interaction patterns |
| ops | Infra / observability emphasis |
| focused | Single-task focus, no scope creep |

## Troubleshooting

- `ac claude` runs but skills aren't filtered → run `ac doctor`. Likely
  the per-harness filter hook isn't installed in `~/.claude/hooks/`.
  Reinstall with `apm-builder install --target claude-code`.

- "persona not found" → `ac list personas` to see what's discoverable.

- Wrong skills appearing/disappearing → inspect with `ac show persona <name>`
  to see the resolved categories and include/exclude lists.

- Codex / Copilot have no runtime hook — `ac` writes a filtered AGENTS.md
  / copilot-instructions.md to a tempdir per session. Your project files
  (`.git`, `package.json`, `tsconfig.json`, `.env`) are symlinked. If your
  tooling expects specific files in the cwd, add them to
  `apm-builder/lib/ac/prelaunch.ts`'s `toLink` list.

## Architecture

```
USER CONFIG  (~/.claude/, ~/.codex/, etc.)  ← user owns
       ▲
       │ additive layer
AC WRAPPER  (ac <harness> [--persona X] [--mode Y] -- ...)
       │   1. Resolve persona+mode → JSON resolution artifact
       │   2. Export AC_WRAPPED + AC_HARNESS + AC_RESOLUTION_PATH
       │   3. (Codex/Copilot) compose tempdir; (others) hook reads env
       │   4. exec harness
       ▼
HARNESS reads filtered config / hook injects additionalContext
```

Resolution artifact at `$AC_RESOLUTION_PATH`:

```json
{
  "schemaVersion": 1,
  "harness": "claude-code",
  "skillsDrop": ["frontend-design"],
  "skillsKeep": null,
  "modePrompt": "...",
  "metadata": {"persona": "backend", "mode": "focused", "categories": [...]}
}
```

## See also

- Spec: `docs/superpowers/specs/2026-04-28-config-scoping-design.md` (local-only)
- Plan: `docs/superpowers/plans/2026-04-28-config-scoping-plan.md` (local-only)
- TAXONOMY.md — the 8 categories used in personas/modes
