# Modes

Per-domain prompt scaffolding. A mode is a small JSON file that names a task
domain (`code`, `design`, `ops`, …) and lists the observation types, priority
skills, and memory topics relevant to that domain.

Modes are referenced by `--mode <name>` on selected skill commands and by
`mode:` in skill frontmatter on tasks. The mode value is a *hint* to the agent,
not a routing rule: skills like `skill-gap-detector` and `reflect` use it to
narrow their pattern detection and bias their proposals toward the domain in
play.

## Schema

```json
{
  "name": "code",
  "description": "Software development tasks…",
  "observation_types": ["bug", "fix", "refactor", "feature", "test"],
  "skills_priority": ["ousterhout", "tigerstyle", "idiomatic-go"],
  "memory_topics": ["architecture", "performance", "patterns"]
}
```

| Field | Purpose |
|---|---|
| `name` | Stable identifier used in `--mode` flags and `mode:` frontmatter. |
| `description` | Plain-language summary of the domain. |
| `observation_types` | Categories an evolution detector or `reflect` skill should look for in trace + memory. |
| `skills_priority` | Skill names to bias toward when proposing changes or composing prompts. |
| `memory_topics` | Topic tags `memorize` should attach to feedback memories created in this mode. |

## Adding a mode

1. Drop `<name>.json` into `apm-builder/modes/`.
2. Reference it from any skill that accepts a `--mode` flag.
3. Optionally update `skills/skill-gap-detector/SKILL.md` and `skills/reflect/SKILL.md` if the mode introduces new conventions worth documenting.

## Built-in modes

- [`code.json`](code.json) — software development.
- [`design.json`](design.json) — UI, UX, interaction.
- [`ops.json`](ops.json) — operations, infrastructure, on-call.

## Wiring status

The mode files exist and are referenced from skill docs. Full runtime wiring
(dispatching prompts and detectors based on mode) lands when a skill needs it;
until then, `--mode` is documented as a hint for the agent to interpret
in-prompt.
