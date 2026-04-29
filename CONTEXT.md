# CONTEXT

Domain vocabulary used across this repo. When introducing a new architectural
concept that future code should reference by name, add it here.

## Components (top-level dirs)

- **skill** — typed agent capability triggered by description. Lives in `skills/<name>/SKILL.md`.
- **plugin** — multi-skill bundle. Lives in `plugins/<name>/.claude-plugin/plugin.json`.
- **agent** — wshobson-sourced subagent. Lives in `agents/<name>/`.
- **hook** — event-driven script (e.g. tts-announcer, trace, recall). Lives in `hooks/<name>/`.
- **persona** / **mode** — filters that intersect a skill catalog into a smaller, focused set. Live in `personas/` and `modes/`.

## Build pipeline (`apm-builder/`)

- **manifest** — the YAML frontmatter on a component (SKILL.md, plugin.json, etc).
- **catalog** — the discovered set of components for a given harness home (e.g. `~/.claude/skills/`).
- **harness** — a downstream agent runtime: `claude-code`, `apm`, `codex`, `gemini`, `copilot`, `pi`.
- **adapter** — code that emits a component into one harness's expected layout. Lives in `apm-builder/lib/harness-adapters/<harness>.ts`.
- **resolution** — the persona/mode-filtered view of a catalog: which skills to drop, what mode prompt to inject. Produced by `resolve()` in `apm-builder/lib/resolution.ts`. Persisted to disk by `writeResolutionArtifact()`; both happen together via `resolveAndPersist()` for callers (today: AC) that need both.
- **AC session** — the lifecycle of one `ac <harness> ...` invocation. Defined in `apm-builder/lib/ac/session.ts`. Stages, in order: (1) resolveTarget, (2) persistResolution, (3) prelaunchForTarget, (4) exec. The per-harness `prelaunchCompose*` helpers in `lib/ac/prelaunch.ts` are the unit-test surface; the session module concentrates the dispatch.
- **prelaunch** — the harness-specific composition step that builds a temp HOME or package dir with persona-filtered skills before spawning the harness binary.
