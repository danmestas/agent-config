# CONTEXT

Domain vocabulary used across this repo. When introducing a new architectural
concept that future code should reference by name, add it here.

## Components (top-level dirs)

- **skill** — typed agent capability triggered by description. Lives in `skills/<name>/SKILL.md`.
- **agent** — subagent definition. Lives in `agents/<name>/AGENT.md`.
- **hook** — event-driven script (e.g. tts-announcer, trace, recall, bones-powers, monorepo-profiles). Lives in `hooks/<name>/HOOK.md` with payload alongside.
- **rule** — harness-native rules (CLAUDE.md / AGENTS.md content). Lives in `rules/<name>/RULES.md`.
- **command** — slash command. Lives in `commands/<name>/COMMAND.md`.

## Composition primitives (suit vocabulary)

- **outfit** — long-lived role bundle (e.g. backend, frontend, machines).
  Lives in `outfits/<name>/outfit.md`. Sets the baseline component set for
  a session.
- **cut** — work-shape overlay (e.g. focused, debugging, planning, ops). Lives
  in `cuts/<name>/cut.md`. Extends/overrides outfit components and
  injects a prompt body.
- **accessory** — small, named, repeatable add-on applied via
  `--accessory`. Lives in `accessories/<name>/accessory.md`.

Resolution order at `suit` prelaunch: empty → outfit → cut → accessory…
See suit ADR-0010 for the rename rationale and ADR-0011 for the layout.

## Build pipeline ([`suit`](https://github.com/danmestas/suit))

The build pipeline lives in the standalone [`suit` repo](https://github.com/danmestas/suit). wardrobe invokes `suit-build <cmd>` via `npx`. Glossary of pipeline concepts:

- **manifest** — the YAML frontmatter on a component (SKILL.md, AGENT.md, HOOK.md, RULES.md, COMMAND.md, outfit.md, cut.md, accessory.md).
- **catalog** — the discovered set of components for a given harness home (e.g. `~/.claude/skills/`).
- **harness** — a downstream agent runtime. First-tier (bulletproof): `claude-code`. Well-supported: `codex`, `gemini`, `pi`. Anything else is DIY — see `docs/HARNESS_INTEGRATION.md`.
- **adapter** — code that emits a component into one harness's expected layout. Lives in suit.
- **resolution** — the outfit/cut/accessory-applied view of a catalog: which skills to drop, what cut prompt to inject. Computed and persisted by suit when callers (e.g. the `suit` launcher) need both.
- **suit session** — the lifecycle of one `suit <harness> ...` invocation. Stages, in order: (1) resolveTarget, (2) persistResolution, (3) prelaunchForTarget, (4) exec. Implemented in suit.
- **prelaunch** — the harness-specific composition step that builds a temp HOME or package dir with outfit-/cut-/accessory-resolved components before spawning the harness binary.
