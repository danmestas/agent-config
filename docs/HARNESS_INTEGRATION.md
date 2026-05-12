# Harness Integration

How wardrobe content reaches a harness, and how to make a new harness consume it.

## Tiered support

| Tier | Harnesses | What you get |
|------|-----------|--------------|
| Bulletproof | `claude-code` | Full agent suite, hooks, skills, settings, outfits, cuts, accessories. Tested most. |
| Well-supported | `codex`, `gemini`, `pi` | Working adapters in [`suit`](https://github.com/danmestas/suit). Skills + rules ship; richer surfaces (agents, hooks, outfits) vary per harness. |
| DIY | anything else | The wardrobe doesn't ship an adapter, but the source format is documented below. Read this doc, write your own emitter. |

Anything not in the first two tiers is the DIY tier — copilot, aider, cursor, continue, openhands, your own harness, all the same shape. We'll merge a PR adding your harness to the well-supported tier if you ship a working adapter to suit and demonstrate parity on outfit/cut/accessory composition.

## What this repo guarantees to a harness adapter author

Every authored component has YAML frontmatter on a manifest file (`SKILL.md`, `AGENT.md`, `HOOK.md`, `RULE.md`, `COMMAND.md`, `outfit.md`, `cut.md`, `accessory.md`) and a markdown body. The frontmatter fields wardrobe authors fill in:

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Kebab-case. Unique within its component type. |
| `version` | semver | Optional but recommended. |
| `description` | string | One-line trigger description. Read by the harness when deciding to load. |
| `type` | enum | `skill \| agent \| hook \| rules \| mcp \| command \| outfit \| cut \| accessory \| plugin`. |
| `targets` | string[] | Harness names the component opts into. After a component is authored, only adapters whose target appears here will emit it. |
| `category` | object | `{ primary, secondary? }`. See `docs/CONTEXT.md` for the category list. |
| `scope` | enum | `project \| user`. Where the harness should install the component. Used by rules composition. |
| `before` / `after` | string[] | Topo-sort hints used when composing rules into a single output file. |
| `agent` | object | Agent-specific: `tools[]`, `model`, `color`. |
| `mcp` | object | MCP-specific: `command`, `args[]`, `env`. |
| `hooks` | object | Hook-specific: `<event>: { command, matcher? }`. |
| `includes` | string[] | Plugin-specific: relative paths to bundled components. |
| `skill_include` / `skill_exclude` | string[] | Outfit/cut: skill manifest. |
| `include` | object | Accessory: `{ skills?, rules?, hooks?, agents?, commands? }`. |
| `overrides` | object | Per-target field overrides: `{ <target>: { ...harness-specific... } }`. |
| `permissions` | object | Outfit-only (v1). Per-target passthrough emitted into the harness's native permission config. Four opaque sub-fields keyed by `Target` enum: `claude-code`, `codex`, `gemini`, `pi`. See "Permissions emit" below. |

The canonical schema (Zod, with full validation) lives in [`suit/src/lib/schema.ts`](https://github.com/danmestas/suit/blob/main/src/lib/schema.ts) and the composition algorithm in [`suit/src/lib/rules.ts`](https://github.com/danmestas/suit/blob/main/src/lib/rules.ts). When in doubt, read those — this doc enumerates the fields wardrobe authors actually fill in, not every field the schema permits.

## Composition rules

A `suit` session resolves a stack:

```
empty → outfit → cut → accessory[, accessory…] → harness-specific prelaunch → exec harness binary
```

- **Outfit** sets the baseline component set (e.g. `backend` outfit pulls in a fixed list of skills + agents + rules).
- **Cut** is a work-shape overlay (e.g. `debugging`, `planning`) that extends or overrides the outfit and injects a prompt body.
- **Accessory** is a small reusable add-on applied via `--accessory <name>`. Repeatable.

Rules with the same `scope:` value targeting the same harness compose into one output file. Composition uses Kahn's topological sort with an alphabetical tiebreak; `before:` and `after:` declarations move a rule earlier or later in the sequence. References to rules outside the input set are ignored. Cycles are rejected at validation time.

A worked example: with `outfit: engineer` + `cut: focused` + `--accessory pr-policy`, the rules in scope `project` for `claude-code` get topologically sorted and emitted as a single `CLAUDE.md` at the project root.

## Per-harness emission contracts (existing four)

This is what suit emits today for the kept harnesses. A new adapter mirrors the *shape*, not the content.

| Target | Layout |
|--------|--------|
| `claude-code` | `CLAUDE.md` (composed rules), `.claude/skills/<name>/SKILL.md`, `.claude/agents/<name>.md`, `.claude/hooks/<event>/<script>`, `.claude/settings.local.json` |
| `codex` | `AGENTS.md` (one file, sections in `[rules, agents, skills]` order from `suit.config.yaml#codex.agents_md_section_order`) |
| `gemini` | `GEMINI.md` (composed rules), `.gemini/skills/<name>/skill.md` (note lowercase `skill.md`) + `.gemini/skills/<name>/metadata.json` |
| `pi` | `.pi/AGENTS.md`, `.pi/skills/<name>/SKILL.md`, `.pi/extensions/<name>/...` for runtime extensions |

The tracked source in this repo lives under `outfits/`, `cuts/`, `accessories/`, `skills/`, `agents/`, `rules/`, `hooks/`, `commands/`. Everything at the repo root that names a harness (`CLAUDE.md`, `GEMINI.md`, `.claude/`, `.gemini/`, `.pi/`, `AGENTS.md`) is *emitted* by suit, not authored. Don't hand-edit those files in this repo — your edits get clobbered the next build.

### Permissions emit (suit ≥ 0.14)

Outfits may carry a `permissions:` frontmatter block to author harness-native
permission config. The block has four opaque sub-fields, one per target. Each
sub-block is emitted verbatim into the target's native permission file via
deep-merge — no cross-harness translation, no LCD vocabulary.

```yaml
permissions:
  claude-code:
    allow: ["Bash(git status:*)", "mcp__signoz__signoz_search_logs"]
    deny:  ["Bash(rm -rf:*)"]
  codex:
    approval_policy: on-request
    sandbox_mode: workspace-write
  gemini:
    general: { defaultApprovalMode: default }
    security: { folderTrust: { enabled: true } }
  pi:
    tools: [read, bash, write]
```

| Target | Output file | Note |
|--------|-------------|------|
| `claude-code` | `.claude/settings.local.json` (`permissions` key) | Wrapped under a `permissions:` key, matching Claude's settings shape. Merged with hook fragments at the same path. |
| `codex` | `codex.config.toml` | Top-level merge. Coexists with MCP emit at the same path via TOML deep-merge in `suit/lib/merge.ts`. |
| `gemini` | `.gemini/settings.fragment.json` | Top-level merge. |
| `pi` | `.pi/permissions.json` | Forward-compat marker. Pi today has no declarative permission surface — file is consistent with the existing `.pi/mcp.experimental.json` convention. |

Missing block, or missing target sub-block, = no emit and harness defaults apply.

**Scope (v1):** outfits only. Cuts and accessories declaring `permissions:`
fail validation (Zod `.strict()`); layered composition semantics for
permission merges across the resolution stack are deferred to v2.

Each target's sub-block is written in that harness's native syntax — there is
no cross-harness rule translation in v1. Authoring `bash_allow: [git]` once and
expecting it to populate all four targets won't work; declare the rule in each
target sub-block where you want it.

## DIY playbook

To ship wardrobe content into a harness suit doesn't yet support:

1. **Read the canonical schema.** [`suit/src/lib/schema.ts`](https://github.com/danmestas/suit/blob/main/src/lib/schema.ts) — Zod definition of every frontmatter field.
2. **Walk the source tree.** Open `outfits/`, `cuts/`, `accessories/`, `skills/`, `agents/`, `rules/`, `hooks/`, `commands/`. Each subdirectory contains one component; the manifest file is named after its type (`outfit.md`, `cut.md`, `SKILL.md`, etc.). Parse the YAML frontmatter and the markdown body.
3. **Filter by `targets`.** Only emit components where your harness name appears in `manifest.targets`. (For DIY harnesses, you decide the convention — pick a stable identifier and document it.)
4. **Filter by `scope`.** For rules and other scoped types, partition into project-scope and user-scope. Some harnesses install user-scope content into a shared home directory (`~/.<harness>/`), others bundle everything per-project.
5. **Topo-sort rules.** Use the algorithm in [`suit/src/lib/rules.ts`](https://github.com/danmestas/suit/blob/main/src/lib/rules.ts) — Kahn with alphabetical tiebreak, honouring `before` and `after`. Compose the sorted bodies into one output file (the harness's equivalent of `CLAUDE.md` / `AGENTS.md`).
6. **Resolve outfit + cut + accessory.** When the user runs your harness via suit (or your equivalent launcher), apply the outfit's component list, then the cut's overrides + prompt injection, then each accessory's includes. The resolution algorithm is implemented in [`suit/src/lib/resolution.ts`](https://github.com/danmestas/suit/blob/main/src/lib/resolution.ts).
7. **Emit your harness's expected files.** This is the only adapter-specific step — every other step has a working reference implementation in suit.

To get your harness into the well-supported tier: register an adapter in [`suit/src/adapters/index.ts`](https://github.com/danmestas/suit/blob/main/src/adapters/index.ts), add a `<harness>:` block to `suit.config.yaml`, and open a PR. Use `claude-code.ts` as the reference for full-featured harnesses (agents + hooks + skills + rules + settings) or `gemini.ts` / `pi.ts` for skill-and-rules-only harnesses.

## Suit upstream reference

| Concern | File |
|---------|------|
| Frontmatter schema (Zod) | [`suit/src/lib/schema.ts`](https://github.com/danmestas/suit/blob/main/src/lib/schema.ts) |
| Rules topo-sort + composition | [`suit/src/lib/rules.ts`](https://github.com/danmestas/suit/blob/main/src/lib/rules.ts) |
| Outfit / cut / accessory resolution | [`suit/src/lib/resolution.ts`](https://github.com/danmestas/suit/blob/main/src/lib/resolution.ts) |
| Build orchestrator | [`suit/src/lib/build.ts`](https://github.com/danmestas/suit/blob/main/src/lib/build.ts) |
| Adapter contract | [`suit/src/adapters/index.ts`](https://github.com/danmestas/suit/blob/main/src/adapters/index.ts) and [`suit/src/lib/types.ts`](https://github.com/danmestas/suit/blob/main/src/lib/types.ts) (`Adapter` interface) |
| Reference adapters | [`suit/src/adapters/claude-code.ts`](https://github.com/danmestas/suit/blob/main/src/adapters/claude-code.ts), `codex.ts`, `gemini.ts`, `pi.ts` |
| Adapter design notes | suit `docs/` ADR-0010 and ADR-0011 |
