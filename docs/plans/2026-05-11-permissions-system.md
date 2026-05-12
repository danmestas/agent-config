# Permissions System Implementation Plan

> **STATUS — landed.** Phase 1 (suit) shipped as `@agent-ops/suit@0.14.0` (suit PR #59); Phase 2 (wardrobe canary + docs) shipped via this plan's same branch. The implementation is the source of truth — read [`suit/src/lib/schema.ts`](https://github.com/danmestas/suit/blob/main/src/lib/schema.ts) for the canonical schema. See "Implementation notes — post-merge" at the end of this doc for the deviations encountered during execution.

> **For agentic workers:** Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan spans two repos; respect the **phase gate** at the end of Phase 1.

**Goal:** Let wardrobe outfits author a `permissions:` block in frontmatter that suit emits verbatim into each target harness's native permission config file.

**Architecture:** Pure passthrough. The `permissions:` block has four opaque sub-fields — `claude`, `codex`, `gemini`, `pi` — each deep-merged verbatim into the target's native config file via a shared `applyPassthroughPermissions` helper. No LCD vocabulary; authors write each harness's native syntax directly. Missing block (or missing target sub-block) = no emit, harness defaults apply.

**Rationale for passthrough-only (v1):** An LCD vocabulary (`mode` / `bash_allow` / `mcp.*`) was sketched and rejected after Ousterhout review. The proposed verbs covered too little of real-world permission semantics to be a deep abstraction; the bulk of authoring would have fallen through to passthrough anyway, with surprise merge precedence between LCD-compiled output and passthrough overrides. The LCD was also a leaky abstraction — e.g. Claude's `defaultMode='default'` and Codex's `approval_policy='on-request'` don't mean the same thing mechanically, so any mapping table would have misled authors. LCD verbs may be promoted in v2 once ≥3 outfits author permissions and a real repeat pattern emerges.

**Tech Stack:** TypeScript, Zod v4, Vitest (suit). YAML frontmatter, markdown (wardrobe).

**Scope:** Outfits only in v1. Cuts/accessories declaring `permissions:` will fail validation (Zod `.strict()`) — composition semantics for layered permission merges are deferred to v2.

**Non-goals:**
- Cut/accessory `permissions:` blocks
- LCD / unified rule vocabulary across harnesses
- Cross-harness rule translation (Claude `Bash(npm run *)` → Codex `prefix_rules` etc.) — write both if you want both
- Migrating the existing evolution-detector (`suit/src/lib/evolution/permissions.ts`) into the new pipeline

---

## File Structure

### suit repo (`/Users/dmestas/projects/suit`)

| File | Responsibility | Action |
|---|---|---|
| `src/lib/schema.ts` | Zod schemas for component frontmatter | Modify — add `PermissionsBlockSchema` (4 opaque fields), attach to `OutfitSchema` only |
| `src/lib/types.ts` | Type exports | Modify — export `PermissionsBlock` type |
| `src/adapters/_permissions.ts` | Shared passthrough emit helper | Create — single deep module: `applyPassthroughPermissions(permissions, target, destination)` |
| `src/adapters/claude-code.ts` | Emit Claude Code artifacts | Modify — one-line call to helper, merge into `.claude/settings.fragment.json` |
| `src/adapters/codex.ts` | Emit Codex artifacts | Modify — one-line call, merge into `codex.config.toml` |
| `src/adapters/gemini.ts` | Emit Gemini artifacts | Modify — one-line call, merge into `.gemini/settings.fragment.json` |
| `src/adapters/pi.ts` | Emit Pi artifacts | Modify — write `permissions.pi` verbatim to `.pi/permissions.json` |
| `src/lib/resolution.ts` | Layer-merge outfit/cut/accessory | No change expected — `permissions` only on outfits in v1 |
| `src/tests/schema.permissions.test.ts` | Schema tests | Create |
| `src/tests/adapters/_permissions.test.ts` | Helper tests | Create |
| `src/tests/adapters/permissions/<target>-basic/` | Golden fixtures per target | Create (4 fixture dirs) |
| `src/tests/adapters/{claude-code,codex,gemini,pi}.test.ts` | Existing adapter tests | Modify — add one passthrough case each |

### wardrobe repo (`/Users/dmestas/projects/wardrobe`)

| File | Responsibility | Action |
|---|---|---|
| `outfits/backend/outfit.md` | Canary outfit with first `permissions:` block | Modify |
| `docs/HARNESS_INTEGRATION.md` | Authoring docs for component frontmatter | Modify — add `permissions:` field documentation |
| `docs/plans/2026-05-11-permissions-system.md` | This plan | Create (this file) |

---

## Phase 1 — suit: schema + shared helper + 4 adapter wirings + tests

> **Repo:** `/Users/dmestas/projects/suit`. Branch off `main`: `git checkout -b feat/permissions-block`.

### Task 1: Define `PermissionsBlockSchema` (passthrough-only)  `[slot: any]`

**Files:**
- Modify: `src/lib/schema.ts` (insert before `ManifestBaseSchema` at line ~58)
- Modify: `src/lib/types.ts` (add type export at end of file)
- Create: `src/tests/schema.permissions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/schema.permissions.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { PermissionsBlockSchema } from '../lib/schema.js';

describe('PermissionsBlockSchema', () => {
  it('accepts an empty block', () => {
    expect(() => PermissionsBlockSchema.parse({})).not.toThrow();
  });

  it('accepts all four target sub-blocks with opaque content', () => {
    const input = {
      claude: { allow: ['Bash(git status:*)'], deny: ['Bash(rm -rf:*)'] },
      codex: { sandbox_mode: 'workspace-write', rules: { prefix_rules: [{ prefix: 'git ' }] } },
      gemini: { security: { folderTrust: { enabled: true } }, mcpServers: { signoz: { enabled: true } } },
      pi: { tools: ['read', 'bash'] },
    };
    expect(() => PermissionsBlockSchema.parse(input)).not.toThrow();
  });

  it('rejects unknown top-level keys (no LCD vocabulary in v1)', () => {
    expect(() => PermissionsBlockSchema.parse({ mode: 'default' })).toThrow();
    expect(() => PermissionsBlockSchema.parse({ bash_allow: ['git'] })).toThrow();
    expect(() => PermissionsBlockSchema.parse({ mcp: {} })).toThrow();
  });

  it('rejects null target blocks', () => {
    expect(() => PermissionsBlockSchema.parse({ claude: null })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: FAIL with "PermissionsBlockSchema is not exported"

- [ ] **Step 3: Implement `PermissionsBlockSchema`**

In `src/lib/schema.ts`, add before `ManifestBaseSchema`:

```typescript
export const PermissionsBlockSchema = z
  .object({
    claude: z.record(z.string(), z.unknown()).optional(),
    codex: z.record(z.string(), z.unknown()).optional(),
    gemini: z.record(z.string(), z.unknown()).optional(),
    pi: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type PermissionsBlock = z.infer<typeof PermissionsBlockSchema>;
```

In `src/lib/types.ts`, append:

```typescript
export type { PermissionsBlock } from './schema.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts src/lib/types.ts src/tests/schema.permissions.test.ts && \
git commit -m "feat(schema): add PermissionsBlockSchema (passthrough-only)"
```

---

### Task 2: Attach `permissions:` to `OutfitSchema` only  `[slot: any]`

**Files:**
- Modify: `src/lib/schema.ts` (OutfitSchema at line ~122; CutSchema and AccessorySchema unchanged — `.strict()` will reject)

- [ ] **Step 1: Write the failing test**

Append to `src/tests/schema.permissions.test.ts`:

```typescript
import { OutfitSchema, CutSchema, AccessorySchema } from '../lib/schema.js';

describe('Permissions attachment', () => {
  const base = { name: 'x', version: '0.0.1', description: 'd' };

  it('outfit accepts permissions block', () => {
    expect(() =>
      OutfitSchema.parse({
        ...base,
        type: 'outfit',
        permissions: { claude: { allow: [] } },
      }),
    ).not.toThrow();
  });

  it('cut rejects permissions block in v1', () => {
    expect(() =>
      CutSchema.parse({
        ...base,
        type: 'cut',
        permissions: { claude: { allow: [] } },
      }),
    ).toThrow();
  });

  it('accessory rejects permissions block in v1', () => {
    expect(() =>
      AccessorySchema.parse({
        ...base,
        type: 'accessory',
        permissions: { claude: { allow: [] } },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: FAIL (outfit case — `permissions` not yet recognized)

- [ ] **Step 3: Implement**

In `src/lib/schema.ts`, extend `OutfitSchema` only:

```typescript
export const OutfitSchema = ManifestBaseSchema.extend({
  type: z.literal('outfit'),
  // ...existing fields...
  permissions: PermissionsBlockSchema.optional(),
}).strict();
```

CutSchema and AccessorySchema remain unchanged — `.strict()` rejects unknown `permissions` keys automatically.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: PASS (7 tests total across both describes)

- [ ] **Step 5: Verify whole-repo validation still works**

Run: `npm run validate`
Expected: PASS (no regressions on existing components)

- [ ] **Step 6: Commit**

```bash
git add src/lib/schema.ts src/tests/schema.permissions.test.ts && \
git commit -m "feat(schema): attach permissions block to outfit only (v1 scope)"
```

---

### Task 3: Shared `applyPassthroughPermissions` helper  `[slot: any]`

This is the single deep module the four adapters share. It hides the "is the block present?", "is the target sub-block present?", and "deep-merge into destination" steps behind a one-line call.

**Files:**
- Create: `src/adapters/_permissions.ts`
- Create: `src/tests/adapters/_permissions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/adapters/_permissions.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { applyPassthroughPermissions } from '../../adapters/_permissions.js';

describe('applyPassthroughPermissions', () => {
  it('returns destination unchanged when permissions is undefined', () => {
    const dest = { existing: 'value' };
    expect(applyPassthroughPermissions(undefined, 'claude', dest)).toEqual({ existing: 'value' });
  });

  it('returns destination unchanged when target sub-block is missing', () => {
    const dest = { existing: 'value' };
    expect(applyPassthroughPermissions({ codex: { sandbox_mode: 'x' } }, 'claude', dest)).toEqual({ existing: 'value' });
  });

  it('deep-merges the target sub-block into the destination', () => {
    const dest = { permissions: { allow: ['Bash(git:*)'] } };
    const result = applyPassthroughPermissions(
      { claude: { permissions: { allow: ['Bash(npm:*)'], deny: ['Bash(rm:*)'] } } },
      'claude',
      dest,
    );
    expect(result).toEqual({
      permissions: { allow: ['Bash(git:*)', 'Bash(npm:*)'], deny: ['Bash(rm:*)'] },
    });
  });

  it('does not mutate the destination object', () => {
    const dest = { existing: 'value' };
    applyPassthroughPermissions({ claude: { added: 'new' } }, 'claude', dest);
    expect(dest).toEqual({ existing: 'value' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/_permissions.test.ts`
Expected: FAIL with "Cannot find module '../../adapters/_permissions.js'"

- [ ] **Step 3: Implement helper**

Create `src/adapters/_permissions.ts`:

```typescript
import type { Target } from '../lib/types.js';
import type { PermissionsBlock } from '../lib/schema.js';
import { deepMerge } from '../lib/merge.js';

export function applyPassthroughPermissions(
  permissions: PermissionsBlock | undefined,
  target: Target,
  destination: Record<string, unknown>,
): Record<string, unknown> {
  const block = permissions?.[target];
  if (!block) return destination;
  return deepMerge(destination, block) as Record<string, unknown>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/_permissions.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/adapters/_permissions.ts src/tests/adapters/_permissions.test.ts && \
git commit -m "feat(adapters): add applyPassthroughPermissions shared helper"
```

---

### Task 4: Wire Claude Code adapter  `[slot: any]`

**Files:**
- Modify: `src/adapters/claude-code.ts` (existing `emitSettings` around line ~99)
- Create: `src/tests/adapters/permissions/claude-code-basic/outfit.md`
- Create: `src/tests/adapters/permissions/claude-code-basic/expected/.claude/settings.fragment.json`
- Modify: `src/tests/adapters/claude-code.test.ts`

- [ ] **Step 1: Create the fixture**

Create `src/tests/adapters/permissions/claude-code-basic/outfit.md`:

```markdown
---
name: claude-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [claude]
permissions:
  claude:
    allow:
      - "Bash(git status:*)"
      - "mcp__signoz__signoz_search_logs"
    deny:
      - "Bash(rm -rf:*)"
    additionalDirectories:
      - "~/src"
---
```

Create `src/tests/adapters/permissions/claude-code-basic/expected/.claude/settings.fragment.json`:

```json
{
  "permissions": {
    "allow": ["Bash(git status:*)", "mcp__signoz__signoz_search_logs"],
    "deny": ["Bash(rm -rf:*)"],
    "additionalDirectories": ["~/src"]
  }
}
```

- [ ] **Step 2: Write the failing test**

In `src/tests/adapters/claude-code.test.ts`, append:

```typescript
it('emits permissions.claude verbatim into settings fragment', async () => {
  const result = await runGolden(
    claudeCodeAdapter,
    path.join(HERE, 'permissions/claude-code-basic'),
  );
  expect(result.diff).toEqual([]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/claude-code.test.ts -t "emits permissions.claude"`
Expected: FAIL (no permissions emitted)

- [ ] **Step 4: Wire the helper**

In `src/adapters/claude-code.ts`, import the helper at the top:

```typescript
import { applyPassthroughPermissions } from './_permissions.js';
```

Inside the function that builds the settings fragment object (find `emitSettings` or the `.claude/settings.fragment.json` writer), after the existing settings object is built and before it's serialized:

```typescript
const withPermissions = applyPassthroughPermissions(
  component.manifest.permissions,
  'claude',
  settings,
);
// ...then serialize `withPermissions` instead of `settings`.
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/claude-code.test.ts -t "emits permissions.claude"`
Expected: PASS

- [ ] **Step 6: Run all Claude adapter tests**

Run: `npx vitest run src/tests/adapters/claude-code.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/claude-code.ts src/tests/adapters/claude-code.test.ts src/tests/adapters/permissions/claude-code-basic && \
git commit -m "feat(adapter/claude): emit permissions.claude into settings fragment"
```

---

### Task 5: Wire Codex adapter  `[slot: any]`

**Files:**
- Modify: `src/adapters/codex.ts`
- Create: `src/tests/adapters/permissions/codex-basic/outfit.md`
- Create: `src/tests/adapters/permissions/codex-basic/expected/codex.config.toml`
- Modify: `src/tests/adapters/codex.test.ts`

- [ ] **Step 1: Create the fixture**

Create `src/tests/adapters/permissions/codex-basic/outfit.md`:

```markdown
---
name: codex-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [codex]
permissions:
  codex:
    approval_policy: on-request
    sandbox_mode: workspace-write
    rules:
      prefix_rules:
        - prefix: "git "
        - prefix: "npm "
    mcp_servers:
      signoz:
        enabled: true
        enabled_tools: ["signoz_search_logs"]
---
```

Create `src/tests/adapters/permissions/codex-basic/expected/codex.config.toml`:

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[[rules.prefix_rules]]
prefix = "git "

[[rules.prefix_rules]]
prefix = "npm "

[mcp_servers.signoz]
enabled = true
enabled_tools = ["signoz_search_logs"]
```

- [ ] **Step 2: Write the failing test**

In `src/tests/adapters/codex.test.ts`, append:

```typescript
it('emits permissions.codex verbatim into codex.config.toml', async () => {
  const result = await runGolden(codexAdapter, path.join(HERE, 'permissions/codex-basic'));
  expect(result.diff).toEqual([]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/codex.test.ts -t "emits permissions.codex"`
Expected: FAIL

- [ ] **Step 4: Wire the helper**

In `src/adapters/codex.ts`, import and apply before serializing to TOML:

```typescript
import { applyPassthroughPermissions } from './_permissions.js';

// ...inside the function that builds the codex config object, before TOML.stringify:
const configWithPermissions = applyPassthroughPermissions(
  component.manifest.permissions,
  'codex',
  config,
);
```

Note: deep-merge into the in-memory config object before TOML serialization. Existing TOML writer handles the rest.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/codex.test.ts -t "emits permissions.codex"`
Expected: PASS

- [ ] **Step 6: Run all Codex adapter tests**

Run: `npx vitest run src/tests/adapters/codex.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/codex.ts src/tests/adapters/codex.test.ts src/tests/adapters/permissions/codex-basic && \
git commit -m "feat(adapter/codex): emit permissions.codex into codex.config.toml"
```

---

### Task 6: Wire Gemini adapter  `[slot: any]`

**Files:**
- Modify: `src/adapters/gemini.ts`
- Create: `src/tests/adapters/permissions/gemini-basic/outfit.md`
- Create: `src/tests/adapters/permissions/gemini-basic/expected/.gemini/settings.fragment.json`
- Modify: `src/tests/adapters/gemini.test.ts`

- [ ] **Step 1: Create the fixture**

Create `src/tests/adapters/permissions/gemini-basic/outfit.md`:

```markdown
---
name: gemini-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [gemini]
permissions:
  gemini:
    general:
      defaultApprovalMode: default
    security:
      folderTrust: { enabled: true }
    mcpServers:
      signoz: { enabled: true }
---
```

Create `src/tests/adapters/permissions/gemini-basic/expected/.gemini/settings.fragment.json`:

```json
{
  "general": { "defaultApprovalMode": "default" },
  "security": { "folderTrust": { "enabled": true } },
  "mcpServers": { "signoz": { "enabled": true } }
}
```

- [ ] **Step 2: Write the failing test**

In `src/tests/adapters/gemini.test.ts`, append:

```typescript
it('emits permissions.gemini verbatim into .gemini/settings.fragment.json', async () => {
  const result = await runGolden(geminiAdapter, path.join(HERE, 'permissions/gemini-basic'));
  expect(result.diff).toEqual([]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/gemini.test.ts -t "emits permissions.gemini"`
Expected: FAIL

- [ ] **Step 4: Wire the helper**

In `src/adapters/gemini.ts`, import and apply before serializing the settings fragment:

```typescript
import { applyPassthroughPermissions } from './_permissions.js';

// ...inside the settings-fragment build path:
const settingsWithPermissions = applyPassthroughPermissions(
  component.manifest.permissions,
  'gemini',
  settings,
);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/gemini.test.ts -t "emits permissions.gemini"`
Expected: PASS

- [ ] **Step 6: Run all Gemini adapter tests**

Run: `npx vitest run src/tests/adapters/gemini.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/gemini.ts src/tests/adapters/gemini.test.ts src/tests/adapters/permissions/gemini-basic && \
git commit -m "feat(adapter/gemini): emit permissions.gemini into settings fragment"
```

---

### Task 7: Wire Pi adapter  `[slot: any]`

Pi has no existing destination file for permissions. We emit `permissions.pi` to a new `.pi/permissions.json` for forward compatibility — Pi today ignores it, but authors get a single place to declare intent (matches the existing `.pi/mcp.experimental.json` convention).

**Files:**
- Modify: `src/adapters/pi.ts`
- Create: `src/tests/adapters/permissions/pi-basic/outfit.md`
- Create: `src/tests/adapters/permissions/pi-basic/expected/.pi/permissions.json`
- Modify: `src/tests/adapters/pi.test.ts`

- [ ] **Step 1: Create the fixture**

Create `src/tests/adapters/permissions/pi-basic/outfit.md`:

```markdown
---
name: pi-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [pi]
permissions:
  pi:
    tools: [read, bash, write]
---
```

Create `src/tests/adapters/permissions/pi-basic/expected/.pi/permissions.json`:

```json
{
  "tools": ["read", "bash", "write"]
}
```

- [ ] **Step 2: Write the failing test**

In `src/tests/adapters/pi.test.ts`, append:

```typescript
it('emits permissions.pi verbatim into .pi/permissions.json', async () => {
  const result = await runGolden(piAdapter, path.join(HERE, 'permissions/pi-basic'));
  expect(result.diff).toEqual([]);
});

it('emits nothing when permissions.pi is absent', async () => {
  // ...use an existing pi fixture without a permissions block...
  const result = await runGolden(piAdapter, path.join(HERE, 'pi/basic'));
  expect(result.files.some((f) => f.path.endsWith('.pi/permissions.json'))).toBe(false);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/pi.test.ts -t "emits permissions.pi"`
Expected: FAIL

- [ ] **Step 4: Wire the helper**

In `src/adapters/pi.ts`, add an emit step that writes `.pi/permissions.json` when `permissions.pi` is present:

```typescript
import { applyPassthroughPermissions } from './_permissions.js';

// ...inside the emit() function, after existing emits:
const piPerms = applyPassthroughPermissions(
  component.manifest.permissions,
  'pi',
  {},
);
if (Object.keys(piPerms).length > 0) {
  emittedFiles.push({
    path: '.pi/permissions.json',
    contents: JSON.stringify(piPerms, null, 2) + '\n',
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/pi.test.ts -t "emits permissions.pi"`
Expected: PASS

- [ ] **Step 6: Run all Pi adapter tests**

Run: `npx vitest run src/tests/adapters/pi.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/pi.ts src/tests/adapters/pi.test.ts src/tests/adapters/permissions/pi-basic && \
git commit -m "feat(adapter/pi): emit permissions.pi to .pi/permissions.json"
```

---

### Task 8: Suit-side integration sanity + PR  `[slot: any]`

**Files:** none modified — verification + release workflow.

- [ ] **Step 1: Run full validation + test suite**

Run: `npm run validate && npx vitest run`
Expected: PASS (all)

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck` (or `tsc --noEmit` if no script)
Expected: PASS

- [ ] **Step 3: Identify local CI surface**

Run: `ls .github/workflows/ && cat .github/workflows/*.yml`
Note what CI runs (typical: validate, test, build, typecheck).

- [ ] **Step 4: Run local CI equivalents**

Run whatever CI runs, locally. Per project CLAUDE.md, do not declare PR ready until local CI is green. If a step relies on infra not reproducible locally, surface that explicitly.

Expected: all green.

- [ ] **Step 5: Manual emit smoke test**

```bash
node dist/cli.js show outfit claude-perm-basic --emit /tmp/perm-smoke --target claude 2>&1
cat /tmp/perm-smoke/.claude/settings.fragment.json
```

Expected: file contents match the Task 4 golden.

Repeat for codex/gemini/pi targets.

- [ ] **Step 6: Push branch and open PR**

```bash
git push -u origin feat/permissions-block
gh pr create --title "feat: permissions block (passthrough) for outfit frontmatter" --body "$(cat <<'EOF'
## Summary
- `PermissionsBlockSchema` with four opaque sub-fields (claude/codex/gemini/pi)
- Attached to OutfitSchema only; CutSchema and AccessorySchema reject via Zod `.strict()`
- Shared `applyPassthroughPermissions` helper deep-merges target sub-block into adapter's native destination
- Per-adapter emits: Claude → `.claude/settings.fragment.json`, Codex → `codex.config.toml`, Gemini → `.gemini/settings.fragment.json`, Pi → new `.pi/permissions.json`
- No LCD vocabulary in v1 (Ousterhout-driven design decision — see linked wardrobe plan)

## Test plan
- [ ] Schema tests pass (PermissionsBlockSchema + attachment)
- [ ] Helper tests pass (`_permissions.test.ts`)
- [ ] One passthrough golden fixture per adapter, all green
- [ ] `npm run validate` passes
- [ ] `npx vitest run` passes
- [ ] Local CI equivalents replicated green
- [ ] Manual emit smoke test for all four targets
EOF
)"
```

- [ ] **Step 7: Wait for remote CI**

Run: `gh pr checks $(gh pr view --json number -q .number)`
Distinguish transient infra failures from real failures explicitly when reporting status.

- [ ] **Step 8: Wait for human merge and release**

🛑 **PHASE GATE.** Do not proceed to Phase 2 until:
1. The suit PR is merged to `main`.
2. A new suit version is published to npm with this schema.
3. Wardrobe's `suit.config.yaml` (or equivalent pin) is bumped to the new suit version.

The wardrobe canary will fail validation otherwise.

---

## Phase 2 — wardrobe: canary outfit + docs

> **Repo:** `/Users/dmestas/projects/wardrobe`. Branch off `main`: `git checkout -b feat/permissions-canary-backend`.

### Task 9: Add `permissions:` block to `outfits/backend/outfit.md`  `[slot: any]`

**Files:**
- Modify: `outfits/backend/outfit.md` (frontmatter)

- [ ] **Step 1: Read existing frontmatter**

Run: `head -30 outfits/backend/outfit.md`
Note current frontmatter shape.

- [ ] **Step 2: Add `permissions:` block (Claude-only for first canary)**

Insert into frontmatter (preserving existing fields):

```yaml
permissions:
  claude:
    allow:
      - "Bash(git status:*)"
      - "Bash(git diff:*)"
      - "Bash(go test:*)"
      - "Bash(go build:*)"
      - "Bash(npm run test:*)"
      - "mcp__signoz__signoz_search_logs"
      - "mcp__signoz__signoz_query_metrics"
      - "mcp__signoz__signoz_search_traces"
    deny:
      - "Bash(git push:main)"
      - "Bash(rm -rf:*)"
```

The block is intentionally Claude-only. Other harness sub-blocks can be added in follow-up commits as outfit-author intent forms — the schema rejects only unknown *top-level* keys, not missing sub-blocks.

- [ ] **Step 3: Validate against suit schema**

Run: `SUIT_CONTENT_PATH=$PWD npm run validate -- --filter backend`
Expected: PASS

- [ ] **Step 4: Emit and inspect each target**

```bash
for t in claude codex gemini pi; do
  echo "=== $t ==="
  SUIT_CONTENT_PATH=$PWD suit show outfit backend --target=$t --emit=/tmp/canary-$t 2>&1 | tail -5
done
```

Expected:
- Claude target produces `.claude/settings.fragment.json` containing the merged permissions block
- Codex / Gemini / Pi targets produce no permissions artifact (no `permissions.codex` / `.gemini` / `.pi` in the outfit)

- [ ] **Step 5: Diff against pre-change emit**

```bash
git stash
SUIT_CONTENT_PATH=$PWD suit show outfit backend --target=claude --emit=/tmp/canary-before
git stash pop
diff -ru /tmp/canary-before/.claude /tmp/canary-claude/.claude | head -40
```

Expected: only diff is the new `permissions` key in `settings.fragment.json`.

- [ ] **Step 6: Commit**

```bash
git add outfits/backend/outfit.md && \
git commit -m "feat(outfit/backend): add permissions.claude block (canary)"
```

---

### Task 10: Document `permissions:` field in HARNESS_INTEGRATION.md  `[slot: any]`

**Files:**
- Modify: `docs/HARNESS_INTEGRATION.md`

- [ ] **Step 1: Read current structure**

Run: `head -120 docs/HARNESS_INTEGRATION.md`
Find where frontmatter fields are documented.

- [ ] **Step 2: Add `permissions:` section**

Append (or insert in the frontmatter-fields location):

````markdown
### `permissions:` (outfit-only, v1)

Authoring surface for harness-native permission / approval config. Four opaque
sub-blocks, one per target harness. Each sub-block is emitted verbatim into the
target's native config file via deep-merge.

```yaml
permissions:
  claude: { allow: [...], ask: [...], deny: [...], additionalDirectories: [...], defaultMode: ... }
  codex:  { approval_policy: ..., sandbox_mode: ..., rules: { prefix_rules: [...] }, mcp_servers: { ... } }
  gemini: { general: { defaultApprovalMode: ... }, security: { ... }, mcpServers: { ... } }
  pi:     { tools: [...] }
```

Write each sub-block in that harness's native syntax — there is no
cross-harness translation in v1. If you want the same permission expressed for
multiple harnesses, write it in each sub-block.

**Emit destinations:**

| Target | Output file | Note |
|---|---|---|
| `claude` | `.claude/settings.fragment.json` | Deep-merged into the existing fragment |
| `codex` | `codex.config.toml` | Deep-merged into the in-memory TOML object before serialization |
| `gemini` | `.gemini/settings.fragment.json` | Deep-merged into the existing fragment |
| `pi` | `.pi/permissions.json` | New file written only when `permissions.pi` is non-empty; Pi today ignores it (forward-compat) |

Missing `permissions:` block, or missing target sub-block, = no emit and harness
defaults apply.

**Scope (v1):** outfits only. Cuts and accessories declaring `permissions:`
fail validation; layered composition semantics are deferred to v2.
````

- [ ] **Step 3: Commit**

```bash
git add docs/HARNESS_INTEGRATION.md && \
git commit -m "docs(harness): document permissions frontmatter field (passthrough)"
```

---

### Task 11: Push wardrobe canary PR + local CI  `[slot: any]`

**Files:** none modified — release workflow only.

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/permissions-canary-backend
```

- [ ] **Step 2: Run local CI equivalents**

Per wardrobe `.github/workflows/ci.yml`, the surface is `npm run validate` + `npm run build -- --target all --dry-run`. Run both locally:

```bash
npm install
npm run validate
npm run build -- --target all --dry-run
```

Expected: PASS.

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "feat(outfit/backend): canary permissions.claude block" --body "$(cat <<'EOF'
## Summary
- First wardrobe outfit to author a `permissions:` block (depends on suit `feat/permissions-block` PR being merged + released)
- Documents the new field in `docs/HARNESS_INTEGRATION.md`
- Emits Claude-only for the first canary; other harness sub-blocks can be added in follow-ups

## Test plan
- [ ] `npm run validate` passes (suit's new schema accepts the block)
- [ ] `npm run build -- --target all --dry-run` passes
- [ ] `suit show outfit backend --target=claude` shows the merged permissions block in the emitted settings fragment
- [ ] `suit show outfit backend --target={codex,gemini,pi}` produces no permissions artifact (correct — no sub-blocks authored yet)
EOF
)"
```

- [ ] **Step 4: Check remote CI status**

Run: `gh pr checks $(gh pr view --json number -q .number)`
Expected: all green. Surface any transient-vs-real distinction explicitly.

- [ ] **Step 5: Hand off to human for merge**

Surface the PR URL and wait for manual merge per CLAUDE.md PR policy. After merge:

```bash
git checkout main && git pull && git branch -d feat/permissions-canary-backend
git push origin --delete feat/permissions-canary-backend
git remote prune origin
```

---

## Self-Review Checklist

**1. Spec coverage** — every architectural decision:
- [x] Outfit-only attachment (Task 2)
- [x] Passthrough-only (no LCD) (Task 1)
- [x] Four opaque target sub-blocks (Task 1)
- [x] Shared deep-merge helper (Task 3)
- [x] Per-target emit destinations (Tasks 4–7)
- [x] No emit when block absent (helper's early-return)
- [x] Suit-first, wardrobe canary after (phase gate at end of Task 8)
- [x] Backend as canary outfit, Claude-only first (Task 9)
- [x] Cross-repo PR discipline (Tasks 8 & 11)
- [x] Local CI before "ready" (Tasks 8.4 & 11.2)

**2. Placeholder scan** — none. Every code block is concrete and self-contained.

**3. Type consistency** — `PermissionsBlock` defined once in `src/lib/schema.ts`, exported from `src/lib/types.ts`, consumed unchanged by `applyPassthroughPermissions` and all four adapters. The `Target` union type drives the helper's second parameter; no string-typed magic.

**4. Risks not in tasks above:**
- *Existing evolution detector* (`suit/src/lib/evolution/permissions.ts`) generates session-time diffs to `.claude/settings.json` (not the `.fragment.json` we emit at build time). The output paths differ, but both touch the `permissions` key. Flag for v2 review — may want to teach the evolution detector to write into the outfit's `permissions.claude` block instead of the live settings file.
- *Pi forward-compat emit* — writing `.pi/permissions.json` that Pi today ignores creates a documentation burden ("why is this here?"). The convention is consistent with existing `.pi/mcp.experimental.json`, but worth revisiting if Pi's permission model never materializes.

---

## Design log

Earlier draft of this plan included an LCD vocabulary (`mode` / `bash_allow` / `mcp.<server>.*`) compiled per-harness, with passthrough as override. Rejected on Ousterhout review:

- **Shallow abstraction**: 3 LCD verbs covered <20% of realistic permission semantics; passthrough was always the dominant authoring path.
- **Leaky mapping**: Claude `defaultMode='default'` and Codex `approval_policy='on-request'` have different mechanical meanings. Any compile table would mislead authors.
- **Surprise merge precedence**: writing both `bash_allow: [git]` and `claude.allow: ["Bash(npm:*)"]` produced an implicit-ordered `allow` list — conjoined methods between LCD and passthrough.
- **Over-generalization**: zero outfits had ever authored permissions; the LCD was designed without data on which patterns would repeat.

Passthrough-only is the smallest honest interface. LCD verbs are a v2 candidate, to be considered only after ≥3 outfits ship `permissions:` blocks and real repeat patterns emerge.

---

## Deviations from `writing-plans` skill defaults

- **Plan location**: `docs/plans/` (wardrobe convention), not `docs/bones-powers/plans/`. Wardrobe doesn't use bones.
- **No bones task materialization**: wardrobe and suit don't use the `bones` task graph. The plan is the executable artifact.
- **No subagent-driven-development handoff prompt**: cross-repo work with explicit phase gate; the human operator picks execution mode after reviewing this doc.

---

## Implementation notes — post-merge

Deviations between the plan as written and what actually shipped. Recorded so future agents reading this doc don't re-make the same assumptions.

### Schema key naming: `claude-code`, not `claude`

The plan's YAML examples used `permissions.claude.*` everywhere. Implementation uses `permissions.claude-code.*` to match suit's existing `Target` enum (`['claude-code', 'codex', 'gemini', 'pi']`), the same name authors already write in `targets:`. Eliminates an internal mapping in `applyPassthroughPermissions` (just indexes by `Target` directly). The wardrobe canary in `outfits/backend/outfit.md` reflects the final shape.

### TOML merge support added to `lib/merge.ts` (scope expansion)

The plan did not anticipate that `codex.config.toml` would already be a multi-source emit path. The existing `emitMcp` in `suit/src/adapters/codex.ts` writes there; an outfit's `permissions.codex` emit would collide at `compose.ts#dedupeByPath` because `isJsonMergeable('codex.config.toml')` is false. Added during Phase 1 Task 5:

- `isTomlMergeable(filepath)` / `mergeTomlBuffers(a, b)` — TOML parse → deepMerge → re-stringify via `@iarna/toml`
- `isMergeable(filepath)` / `mergeBuffers(filepath, a, b)` dispatcher (handles both JSON and TOML)
- `compose.ts` updated to use the dispatcher

10 new merge tests cover this. The change is API-additive: existing `isJsonMergeable` / `mergeJsonBuffers` still export.

### Suit local CI is `typecheck + build + test`, not `npm run validate`

The plan's Task 7 step 5 instructs `npm run validate` for suit. That script doesn't exist in suit — it's a wardrobe-only script. Suit's CI (`.github/workflows/ci.yml`) runs `npm run typecheck` (`tsc --noEmit`), `npm run build` (`tsc + postbuild`), `npm link`, and `npm test` (`vitest run`). The Phase 1 PR mirrored all four locally before push.

### Outfit case in adapters: previously `[]`, now emits per-target

The plan implicitly assumed adapters had a `permissions` emit slot to extend. They didn't — every adapter's outfit case returned `[]` with the comment "Outfits are harness-agnostic, consumed by `ac` at resolution time. Not emitted per-target." The Phase 1 implementation changed that contract for outfits (cuts/accessories still emit `[]`). Each adapter's outfit case now routes to an `emitOutfit(component)` function that calls `applyPassthroughPermissions` and writes the target-native file.

### `Bash(git push:main)` doesn't match Claude's rule grammar

The plan's canary suggested denying `Bash(git push:main)`. Claude's rule grammar treats `:<suffix>` as a prefix match on args, so this rule would match `git push main` (no remote argument) but NOT `git push origin main`. There's no way to express "deny push specifically to the main branch" with the rule grammar alone — that's a hooks job. The actual canary in `outfits/backend/outfit.md` denies `Bash(git push --force:*)` and `Bash(git push -f:*)` instead; the "no push to main" intent is enforced via the `pr-policy` accessory's prose rules.

### Files committed as `.fragment.json`, runtime resolves to `.local.json`

The plan referenced `.claude/settings.fragment.json` as the Claude destination. That's the *adapter-level* emit name; `compose.ts` then merges all fragments and `up.ts` (or the prepare workflow) writes the runtime-visible `.claude/settings.local.json` (or `.claude/settings.json`, depending on flags). Both names are accurate at different layers. `HARNESS_INTEGRATION.md` references the user-visible `.local.json` since that's what authors interact with; this plan retains the `.fragment.json` references since they describe the adapter contract.
