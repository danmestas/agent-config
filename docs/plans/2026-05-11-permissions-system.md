# Permissions System Implementation Plan

> **For agentic workers:** Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan spans two repos; respect the **phase gate** at the end of Phase 1.

**Goal:** Let wardrobe outfits (and later cuts/accessories) author a `permissions:` block in frontmatter that suit composes and emits as harness-native permission config for Claude Code, Codex, Gemini, and Pi.

**Architecture:** Hybrid schema — a thin LCD (`mode`, `bash_allow`, `mcp.<server>.{enabled,enabled_tools,disabled_tools}`) compiles per-harness; a per-target passthrough block (`permissions.claude.*`, `permissions.codex.*`, etc.) is emitted verbatim and deep-merged over the LCD output. Missing block = no emit (harness defaults apply). Suit ships the schema + 4 adapter emitters first; wardrobe adds the first canary outfit after suit releases.

**Tech Stack:** TypeScript, Zod v4, Vitest (suit). YAML frontmatter, markdown (wardrobe).

**Scope:** Outfits only in v1. Cuts/accessories declaring `permissions:` is a deliberate non-goal — schema validation will reject for now, to be lifted in v2 once the merge-precedence question is resolved.

**Non-goals:**
- Cut/accessory `permissions:` blocks (v2)
- Migrating the existing evolution-detector (`suit/src/lib/evolution/permissions.ts`) into the new pipeline
- Auto-translating Claude wildcards into Codex prefix rules — out of scope; passthrough handles that

---

## File Structure

### suit repo (`/Users/dmestas/projects/suit`)

| File | Responsibility | Action |
|---|---|---|
| `src/lib/schema.ts` | Zod schemas for component frontmatter | Modify — add `PermissionsBlockSchema`, attach to `OutfitSchema` only |
| `src/lib/types.ts` | Type exports | Modify — export `PermissionsBlock` type |
| `src/adapters/claude-code.ts` | Emit Claude Code artifacts | Modify — add `emitPermissions` helper, merge into `.claude/settings.fragment.json` |
| `src/adapters/codex.ts` | Emit Codex artifacts | Modify — emit permissions into `codex.config.toml` |
| `src/adapters/gemini.ts` | Emit Gemini artifacts | Modify — emit into `.gemini/settings.fragment.json` + warnings for unmapped LCD |
| `src/adapters/pi.ts` | Emit Pi artifacts | Modify — emit `--tools` flag template into a new `.pi/permissions.json` + warnings |
| `src/lib/resolution.ts` | Layer-merge outfit/cut/accessory | No change expected — verify `deepMerge` already covers `permissions` |
| `src/tests/adapters/permissions/` | Test fixtures for permission emit | Create — one fixture per adapter, golden-file pattern |
| `src/tests/adapters/claude-code.test.ts` | Existing tests | Modify — add permissions cases |
| `src/tests/adapters/codex.test.ts` | Existing tests | Modify — add permissions cases |
| `src/tests/adapters/gemini.test.ts` | Existing tests | Modify — add permissions cases |
| `src/tests/adapters/pi.test.ts` | Existing tests | Modify — add permissions cases |

### wardrobe repo (`/Users/dmestas/projects/wardrobe`)

| File | Responsibility | Action |
|---|---|---|
| `outfits/backend/outfit.md` | Canary outfit with first `permissions:` block | Modify |
| `docs/HARNESS_INTEGRATION.md` | Authoring docs for component frontmatter | Modify — add `permissions:` field documentation |
| `docs/plans/2026-05-11-permissions-system.md` | This plan | Create |

---

## Phase 1 — suit: schema + adapters + tests

> **Repo:** `/Users/dmestas/projects/suit`. Branch off `main`: `git checkout -b feat/permissions-block`.

### Task 1: Define `PermissionsBlockSchema` in suit `[slot: any]`

**Files:**
- Modify: `src/lib/schema.ts` (insert before `ManifestBaseSchema` definition at line ~58)
- Modify: `src/lib/types.ts` (add type export at end of file)

- [ ] **Step 1: Write the failing test**

Create `src/tests/schema.permissions.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { PermissionsBlockSchema } from '../lib/schema.js';

describe('PermissionsBlockSchema', () => {
  it('accepts a fully-populated LCD + passthrough block', () => {
    const input = {
      mode: 'default',
      bash_allow: ['git', 'npm'],
      mcp: {
        signoz: { enabled: true, enabled_tools: ['signoz_search_logs'] },
      },
      claude: { allow: ['Bash(git status:*)'], deny: [] },
      codex: { sandbox_mode: 'workspace-write' },
      gemini: { security: { folderTrust: { enabled: true } } },
      pi: { tools: ['read', 'bash'] },
    };
    expect(() => PermissionsBlockSchema.parse(input)).not.toThrow();
  });

  it('rejects unknown LCD mode values', () => {
    expect(() => PermissionsBlockSchema.parse({ mode: 'nope' })).toThrow();
  });

  it('accepts an empty block', () => {
    expect(() => PermissionsBlockSchema.parse({})).not.toThrow();
  });

  it('treats passthrough targets as opaque (accepts unknown keys)', () => {
    expect(() =>
      PermissionsBlockSchema.parse({ claude: { foo: { bar: 1 } } }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: FAIL with "PermissionsBlockSchema is not exported"

- [ ] **Step 3: Implement `PermissionsBlockSchema`**

In `src/lib/schema.ts`, add before `ManifestBaseSchema`:

```typescript
const McpServerPermissionSchema = z
  .object({
    enabled: z.boolean().optional(),
    enabled_tools: z.array(z.string()).optional(),
    disabled_tools: z.array(z.string()).optional(),
  })
  .strict();

export const PermissionsBlockSchema = z
  .object({
    mode: z.enum(['default', 'accept-edits', 'plan', 'yolo']).optional(),
    bash_allow: z.array(z.string()).optional(),
    mcp: z.record(z.string(), McpServerPermissionSchema).optional(),
    claude: z.record(z.string(), z.unknown()).optional(),
    codex: z.record(z.string(), z.unknown()).optional(),
    gemini: z.record(z.string(), z.unknown()).optional(),
    pi: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type PermissionsBlock = z.infer<typeof PermissionsBlockSchema>;
```

In `src/lib/types.ts`, add at the bottom:

```typescript
export type { PermissionsBlock } from './schema.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.ts src/lib/types.ts src/tests/schema.permissions.test.ts && \
git commit -m "feat(schema): add PermissionsBlockSchema for outfit frontmatter"
```

---

### Task 2: Attach `permissions:` to `OutfitSchema` only (reject on cut/accessory) `[slot: any]`

**Files:**
- Modify: `src/lib/schema.ts:122` (OutfitSchema), `src/lib/schema.ts:140` (CutSchema), `src/lib/schema.ts:155` (AccessorySchema)

- [ ] **Step 1: Write the failing test**

Append to `src/tests/schema.permissions.test.ts`:

```typescript
import { OutfitSchema, CutSchema, AccessorySchema } from '../lib/schema.js';

describe('Permissions attachment', () => {
  const base = { name: 'x', version: '0.0.1', description: 'd', type: 'outfit' };

  it('outfit accepts permissions block', () => {
    expect(() =>
      OutfitSchema.parse({ ...base, type: 'outfit', permissions: { mode: 'default' } }),
    ).not.toThrow();
  });

  it('cut rejects permissions block in v1', () => {
    expect(() =>
      CutSchema.parse({ ...base, type: 'cut', permissions: { mode: 'default' } }),
    ).toThrow();
  });

  it('accessory rejects permissions block in v1', () => {
    expect(() =>
      AccessorySchema.parse({ ...base, type: 'accessory', permissions: { mode: 'default' } }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: FAIL (outfit case fails — `permissions` not recognized)

- [ ] **Step 3: Implement**

In `src/lib/schema.ts`, modify `OutfitSchema` (around line 122) to extend with `permissions`:

```typescript
export const OutfitSchema = ManifestBaseSchema.extend({
  type: z.literal('outfit'),
  // ...existing fields...
  permissions: PermissionsBlockSchema.optional(),
}).strict();
```

CutSchema and AccessorySchema remain unchanged — Zod's `.strict()` will reject unknown `permissions` keys.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/schema.permissions.test.ts`
Expected: PASS (7 tests total)

- [ ] **Step 5: Verify whole-repo validation still works**

Run: `npm run validate`
Expected: PASS (no regressions on existing components)

- [ ] **Step 6: Commit**

```bash
git add src/lib/schema.ts src/tests/schema.permissions.test.ts && \
git commit -m "feat(schema): attach permissions block to outfit only (v1 scope)"
```

---

### Task 3: Claude Code adapter — emit LCD + passthrough `[slot: any]`

**Files:**
- Modify: `src/adapters/claude-code.ts` (existing `emitSettings` around line ~99)
- Create: `src/tests/adapters/permissions/claude-code-basic/outfit.md` (fixture)
- Create: `src/tests/adapters/permissions/claude-code-basic/expected/.claude/settings.fragment.json` (golden)
- Modify: `src/tests/adapters/claude-code.test.ts`

- [ ] **Step 1: Write the fixture**

Create `src/tests/adapters/permissions/claude-code-basic/outfit.md`:

```markdown
---
name: claude-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [claude]
permissions:
  mode: default
  bash_allow: [git, npm]
  mcp:
    signoz:
      enabled: true
      enabled_tools: [signoz_search_logs]
  claude:
    allow: ["Bash(go test:*)"]
    deny: ["Bash(rm -rf:*)"]
    additionalDirectories: ["~/src"]
---
```

Create `src/tests/adapters/permissions/claude-code-basic/expected/.claude/settings.fragment.json`:

```json
{
  "permissions": {
    "defaultMode": "default",
    "allow": ["Bash(git:*)", "Bash(npm:*)", "mcp__signoz__signoz_search_logs", "Bash(go test:*)"],
    "deny": ["Bash(rm -rf:*)"],
    "additionalDirectories": ["~/src"]
  }
}
```

- [ ] **Step 2: Write the failing test**

In `src/tests/adapters/claude-code.test.ts`, add:

```typescript
it('emits permissions block — LCD compile + passthrough merge', async () => {
  const result = await runGolden(
    claudeCodeAdapter,
    path.join(HERE, 'permissions/claude-code-basic'),
  );
  expect(result.diff).toEqual([]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/claude-code.test.ts -t "emits permissions block"`
Expected: FAIL (no permissions emitted)

- [ ] **Step 4: Implement `compilePermissions` helper**

In `src/adapters/claude-code.ts`, add before `emitSettings`:

```typescript
function compileClaudePermissions(p: PermissionsBlock | undefined): Record<string, unknown> | undefined {
  if (!p) return undefined;
  const allow: string[] = [];
  const ask: string[] = [];
  const deny: string[] = [];
  const out: Record<string, unknown> = {};

  if (p.mode) out.defaultMode = p.mode;
  if (p.bash_allow) for (const cmd of p.bash_allow) allow.push(`Bash(${cmd}:*)`);
  if (p.mcp) {
    for (const [server, cfg] of Object.entries(p.mcp)) {
      if (cfg.enabled === false) deny.push(`mcp__${server}`);
      for (const tool of cfg.enabled_tools ?? []) allow.push(`mcp__${server}__${tool}`);
      for (const tool of cfg.disabled_tools ?? []) deny.push(`mcp__${server}__${tool}`);
    }
  }
  if (allow.length) out.allow = allow;
  if (ask.length) out.ask = ask;
  if (deny.length) out.deny = deny;

  // Passthrough — deep-merge target-specific block on top
  if (p.claude) {
    const merged = deepMerge(out, p.claude) as Record<string, unknown>;
    // additionalDirectories lives at the top level of permissions in Claude
    return merged;
  }
  return out;
}
```

In the `emitSettings` function, merge `compileClaudePermissions(component.manifest.permissions)` into the `permissions` key of the settings fragment.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/claude-code.test.ts -t "emits permissions block"`
Expected: PASS

- [ ] **Step 6: Run all Claude adapter tests for regressions**

Run: `npx vitest run src/tests/adapters/claude-code.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/claude-code.ts src/tests/adapters/claude-code.test.ts src/tests/adapters/permissions/claude-code-basic && \
git commit -m "feat(adapter/claude): emit permissions block to settings fragment"
```

---

### Task 4: Codex adapter — emit LCD + passthrough `[slot: any]`

**Files:**
- Modify: `src/adapters/codex.ts`
- Create: `src/tests/adapters/permissions/codex-basic/{outfit.md, expected/codex.config.toml}`
- Modify: `src/tests/adapters/codex.test.ts`

- [ ] **Step 1: Write the fixture**

Create `src/tests/adapters/permissions/codex-basic/outfit.md`:

```markdown
---
name: codex-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [codex]
permissions:
  mode: default
  bash_allow: [git, npm]
  mcp:
    signoz:
      enabled: true
      enabled_tools: [signoz_search_logs]
  codex:
    sandbox_mode: workspace-write
    approval_policy: on-request
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

In `src/tests/adapters/codex.test.ts`, add:

```typescript
it('emits permissions block — bash_allow → prefix_rules, mcp passthrough', async () => {
  const result = await runGolden(codexAdapter, path.join(HERE, 'permissions/codex-basic'));
  expect(result.diff).toEqual([]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/codex.test.ts -t "emits permissions block"`
Expected: FAIL

- [ ] **Step 4: Implement `compileCodexPermissions`**

In `src/adapters/codex.ts`, add:

```typescript
function compileCodexPermissions(p: PermissionsBlock | undefined): Record<string, unknown> | undefined {
  if (!p) return undefined;
  const out: Record<string, unknown> = {};
  const codexModeMap: Record<string, string> = {
    'default': 'on-request',
    'accept-edits': 'on-request',
    'plan': 'untrusted',
    'yolo': 'never',
  };
  if (p.mode) out.approval_policy = codexModeMap[p.mode];
  if (p.bash_allow) {
    out.rules = { prefix_rules: p.bash_allow.map((cmd) => ({ prefix: `${cmd} ` })) };
  }
  if (p.mcp) {
    out.mcp_servers = Object.fromEntries(
      Object.entries(p.mcp).map(([k, v]) => [k, { ...v }]),
    );
  }
  // Codex passthrough deep-merged last (overrides LCD)
  return p.codex ? (deepMerge(out, p.codex) as Record<string, unknown>) : out;
}
```

Wire into the TOML emit path in `codex.ts` (look for `codex.config.toml` emission).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/codex.test.ts -t "emits permissions block"`
Expected: PASS

- [ ] **Step 6: Run all Codex adapter tests**

Run: `npx vitest run src/tests/adapters/codex.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/codex.ts src/tests/adapters/codex.test.ts src/tests/adapters/permissions/codex-basic && \
git commit -m "feat(adapter/codex): emit permissions block to codex.config.toml"
```

---

### Task 5: Gemini adapter — partial LCD + passthrough + warnings `[slot: any]`

**Files:**
- Modify: `src/adapters/gemini.ts`
- Create: `src/tests/adapters/permissions/gemini-basic/{outfit.md, expected/.gemini/settings.fragment.json}`
- Modify: `src/tests/adapters/gemini.test.ts`

- [ ] **Step 1: Write the fixture**

Create `src/tests/adapters/permissions/gemini-basic/outfit.md`:

```markdown
---
name: gemini-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [gemini]
permissions:
  mode: default
  bash_allow: [git, npm]
  mcp:
    signoz:
      enabled: false
  gemini:
    security:
      folderTrust: { enabled: true }
---
```

Create `src/tests/adapters/permissions/gemini-basic/expected/.gemini/settings.fragment.json`:

```json
{
  "general": {
    "defaultApprovalMode": "default"
  },
  "mcpServers": {
    "signoz": {
      "enabled": false
    }
  },
  "security": {
    "folderTrust": {
      "enabled": true
    }
  }
}
```

- [ ] **Step 2: Write the failing test**

In `src/tests/adapters/gemini.test.ts`, add:

```typescript
it('emits permissions — mode mapped, mcp passthrough, bash_allow warned', async () => {
  const warnings: string[] = [];
  const result = await runGolden(geminiAdapter, path.join(HERE, 'permissions/gemini-basic'), {
    onWarn: (m: string) => warnings.push(m),
  });
  expect(result.diff).toEqual([]);
  expect(warnings.some((w) => /bash_allow.*ignored/.test(w))).toBe(true);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/gemini.test.ts -t "emits permissions"`
Expected: FAIL

- [ ] **Step 4: Implement `compileGeminiPermissions`**

In `src/adapters/gemini.ts`, add:

```typescript
function compileGeminiPermissions(
  p: PermissionsBlock | undefined,
  warn: (m: string) => void,
): Record<string, unknown> | undefined {
  if (!p) return undefined;
  const out: Record<string, unknown> = {};
  const modeMap: Record<string, string> = {
    'default': 'default',
    'accept-edits': 'auto_edit',
    'plan': 'plan',
    'yolo': 'yolo',
  };
  if (p.mode) out.general = { defaultApprovalMode: modeMap[p.mode] };
  if (p.bash_allow?.length) {
    warn(`gemini: bash_allow [${p.bash_allow.join(', ')}] ignored — Gemini has no per-command rule grammar`);
  }
  if (p.mcp) {
    out.mcpServers = Object.fromEntries(
      Object.entries(p.mcp).map(([k, v]) => [k, { enabled: v.enabled }]),
    );
    for (const [server, cfg] of Object.entries(p.mcp)) {
      if (cfg.enabled_tools || cfg.disabled_tools) {
        warn(`gemini: mcp.${server} tool-level allow/deny ignored — Gemini gates at server level only`);
      }
    }
  }
  return p.gemini ? (deepMerge(out, p.gemini) as Record<string, unknown>) : out;
}
```

Thread the adapter's warning sink through `emit()`. If no warning sink exists yet, add one to `AdapterContext` (`src/lib/types.ts`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/gemini.test.ts -t "emits permissions"`
Expected: PASS

- [ ] **Step 6: Run all Gemini adapter tests**

Run: `npx vitest run src/tests/adapters/gemini.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/gemini.ts src/tests/adapters/gemini.test.ts src/tests/adapters/permissions/gemini-basic src/lib/types.ts && \
git commit -m "feat(adapter/gemini): emit partial permissions + warn on unmappable LCD"
```

---

### Task 6: Pi adapter — `--tools` template + warnings `[slot: any]`

**Files:**
- Modify: `src/adapters/pi.ts`
- Create: `src/tests/adapters/permissions/pi-basic/{outfit.md, expected/.pi/permissions.json}`
- Modify: `src/tests/adapters/pi.test.ts`

- [ ] **Step 1: Write the fixture**

Create `src/tests/adapters/permissions/pi-basic/outfit.md`:

```markdown
---
name: pi-perm-basic
version: 0.0.1
description: fixture
type: outfit
targets: [pi]
permissions:
  mode: default
  bash_allow: [git, npm]
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

In `src/tests/adapters/pi.test.ts`, add:

```typescript
it('emits pi permissions as --tools template, warns on unmappable LCD', async () => {
  const warnings: string[] = [];
  const result = await runGolden(piAdapter, path.join(HERE, 'permissions/pi-basic'), {
    onWarn: (m: string) => warnings.push(m),
  });
  expect(result.diff).toEqual([]);
  expect(warnings.some((w) => /bash_allow.*--tools/.test(w))).toBe(true);
  expect(warnings.some((w) => /mode.*ignored/.test(w))).toBe(true);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/tests/adapters/pi.test.ts -t "emits pi permissions"`
Expected: FAIL

- [ ] **Step 4: Implement `compilePiPermissions`**

In `src/adapters/pi.ts`, add:

```typescript
function compilePiPermissions(
  p: PermissionsBlock | undefined,
  warn: (m: string) => void,
): Record<string, unknown> | undefined {
  if (!p) return undefined;
  if (p.mode) warn(`pi: mode '${p.mode}' ignored — Pi has no settings-level mode toggle`);
  if (p.bash_allow?.length) {
    warn(`pi: bash_allow [${p.bash_allow.join(', ')}] not declarative — pass via --tools at launch instead`);
  }
  if (p.mcp) warn(`pi: mcp tool-level gating not supported`);
  return p.pi ?? undefined;
}
```

Emit the returned object to `.pi/permissions.json` if non-undefined.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/tests/adapters/pi.test.ts -t "emits pi permissions"`
Expected: PASS

- [ ] **Step 6: Run all Pi adapter tests**

Run: `npx vitest run src/tests/adapters/pi.test.ts`
Expected: PASS (all)

- [ ] **Step 7: Commit**

```bash
git add src/adapters/pi.ts src/tests/adapters/pi.test.ts src/tests/adapters/permissions/pi-basic && \
git commit -m "feat(adapter/pi): emit permissions passthrough + warn on unmappable LCD"
```

---

### Task 7: Suit-side integration sanity + PR `[slot: any]`

**Files:** none modified — verification only.

- [ ] **Step 1: Run full validation + test suite**

Run: `npm run validate && npx vitest run`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck` (or `tsc --noEmit` if no script exists)
Expected: PASS

- [ ] **Step 3: Manually emit a fixture and inspect**

Run from suit repo root:

```bash
node dist/cli.js show outfit claude-perm-basic --emit /tmp/perm-test 2>&1
ls -la /tmp/perm-test/.claude/
cat /tmp/perm-test/.claude/settings.fragment.json
```

Expected: `.claude/settings.fragment.json` contains the merged permissions block matching the Task 3 golden.

- [ ] **Step 4: Push branch and open PR**

```bash
git push -u origin feat/permissions-block
gh pr create --title "feat: permissions block for outfit frontmatter + 4-adapter emit" --body "$(cat <<'EOF'
## Summary
- Add `PermissionsBlockSchema` (LCD: mode / bash_allow / mcp.<server>.*, plus per-target passthrough)
- Attach `permissions:` to OutfitSchema only (cuts/accessories rejected — v2 scope)
- Emit per-harness: Claude Code settings fragment, Codex TOML, Gemini settings fragment (partial + warnings), Pi permissions.json (passthrough + warnings)
- Golden-file tests for each adapter

## Test plan
- [ ] `npm run validate` passes
- [ ] `npx vitest run` passes (all adapter + schema tests)
- [ ] `npm run typecheck` passes
- [ ] Manual emit smoke-tested on each fixture
EOF
)"
```

- [ ] **Step 5: Run local CI before declaring ready**

Per project CLAUDE.md, identify what CI runs (read `.github/workflows/*.yml` in suit) and replicate locally. Common surface: `npm test`, `npm run validate`, `npm run typecheck`, `npm run build`.

Expected: all local CI green before declaring PR ready. If any step depends on infra not reproducible locally, surface explicitly.

- [ ] **Step 6: Wait for human merge and release**

🛑 **PHASE GATE.** Do not proceed to Phase 2 until:
1. The suit PR is merged to `main`.
2. A new suit version is published to npm with this schema.
3. Wardrobe's `suit.config.yaml` (or equivalent pin) is bumped to the new suit version.

The wardrobe canary will fail validation otherwise.

---

## Phase 2 — wardrobe: canary outfit + docs

> **Repo:** `/Users/dmestas/projects/wardrobe`. Branch off `main`: `git checkout -b feat/permissions-canary-backend`.

### Task 8: Add `permissions:` block to `outfits/backend/outfit.md` `[slot: any]`

**Files:**
- Modify: `outfits/backend/outfit.md` (frontmatter)

- [ ] **Step 1: Read existing frontmatter**

Run: `head -30 outfits/backend/outfit.md`
Note the current frontmatter shape.

- [ ] **Step 2: Add `permissions:` block to frontmatter**

Insert (preserving existing frontmatter fields):

```yaml
permissions:
  mode: default
  bash_allow:
    - git
    - npm
    - go
    - rg
  mcp:
    signoz:
      enabled: true
      enabled_tools:
        - signoz_search_logs
        - signoz_query_metrics
        - signoz_search_traces
    axiom:
      enabled: true
    doppler:
      enabled: true
      enabled_tools:
        - doppler_secrets_get
        - doppler_secrets_list
  claude:
    deny:
      - "Bash(git push:main)"
      - "Bash(rm -rf:*)"
```

Rationale (for plan reader, not the file): `backend` already loads signoz/axiom/doppler MCPs per its CLAUDE.md; this just narrows tool surface. The Claude `deny` block enforces the PR-policy rule at the permission layer rather than relying on the agent reading `pr-policy` accessory text.

- [ ] **Step 3: Validate against suit schema**

Run: `SUIT_CONTENT_PATH=$PWD npm run validate -- --filter backend`
Expected: PASS

- [ ] **Step 4: Emit and inspect each target**

Run:

```bash
for t in claude codex gemini pi; do
  echo "=== $t ==="
  SUIT_CONTENT_PATH=$PWD suit show outfit backend --target=$t --emit=/tmp/canary-$t 2>&1 | tail -5
done
```

Expected: each target produces a permissions artifact in its conventional path; Gemini and Pi log warnings about ignored `bash_allow` entries (this is correct, not a bug).

- [ ] **Step 5: Diff against pre-change emit to confirm scope**

Run:

```bash
git stash
SUIT_CONTENT_PATH=$PWD suit show outfit backend --target=claude --emit=/tmp/canary-before
git stash pop
diff -ru /tmp/canary-before/.claude /tmp/canary-claude/.claude | head -40
```

Expected: the only diff is the new `permissions` key in `settings.fragment.json`.

- [ ] **Step 6: Commit**

```bash
git add outfits/backend/outfit.md && \
git commit -m "feat(outfit/backend): add permissions block (canary for new schema)"
```

---

### Task 9: Document `permissions:` field in HARNESS_INTEGRATION.md `[slot: any]`

**Files:**
- Modify: `docs/HARNESS_INTEGRATION.md`

- [ ] **Step 1: Read current structure**

Run: `head -120 docs/HARNESS_INTEGRATION.md`
Note where frontmatter fields are documented (likely a table).

- [ ] **Step 2: Add a `permissions:` section**

Append (or insert in the appropriate frontmatter-fields location):

````markdown
### `permissions:` (outfit-only, v1)

Authoring surface for harness permission/approval configs. Composed of a thin
LCD (lowest-common-denominator) plus per-target passthrough.

```yaml
permissions:
  # LCD — emitted per-harness via adapter translation
  mode: default               # default | accept-edits | plan | yolo
  bash_allow: [git, npm, go]  # exact command names
  mcp:
    <server-id>:
      enabled: true | false
      enabled_tools: [...]    # optional tool allowlist
      disabled_tools: [...]   # optional tool denylist (applied after enabled_tools)

  # Passthrough — emitted verbatim into the target's native config
  claude: { allow: [...], ask: [...], deny: [...], additionalDirectories: [...] }
  codex:  { approval_policy: ..., sandbox_mode: ..., rules: { prefix_rules: [...] } }
  gemini: { security: { ... }, mcpServers: { ... } }
  pi:     { tools: [...] }
```

**Per-harness coverage:**

| Field | Claude Code | Codex | Gemini | Pi |
|---|---|---|---|---|
| `mode` | ✅ `defaultMode` | ✅ `approval_policy` | ✅ `general.defaultApprovalMode` | ⚠️ warn (no setting) |
| `bash_allow` | ✅ `Bash(<cmd>:*)` | ✅ `rules.prefix_rules[]` | ⚠️ warn (no rule grammar) | ⚠️ warn (use CLI `--tools`) |
| `mcp.*.enabled` | ✅ | ✅ | ✅ | ⚠️ warn |
| `mcp.*.enabled_tools` / `disabled_tools` | ✅ | ✅ | ⚠️ warn (server-level only) | ⚠️ warn |
| `<target>:` passthrough | ✅ | ✅ | ✅ | ✅ |

Missing `permissions:` block = no emit, harness defaults apply.

**Scope (v1):** outfits only. Cuts and accessories declaring `permissions:` will
fail validation — composition semantics for layered permission merges are
deferred to v2.
````

- [ ] **Step 3: Commit**

```bash
git add docs/HARNESS_INTEGRATION.md && \
git commit -m "docs(harness): document permissions frontmatter field"
```

---

### Task 10: Push wardrobe canary PR + local CI `[slot: any]`

**Files:** none modified — release workflow only.

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/permissions-canary-backend
```

- [ ] **Step 2: Identify wardrobe CI**

Run: `ls .github/workflows/ 2>/dev/null && cat .github/workflows/*.yml 2>/dev/null | head -80`
Note the CI surface (likely `npm run validate` for content checks).

- [ ] **Step 3: Run local equivalents**

Run whatever CI runs, locally. Common surface in wardrobe:

```bash
npm install
npm run validate
```

Expected: PASS.

- [ ] **Step 4: Open PR**

```bash
gh pr create --title "feat(outfit/backend): canary permissions block" --body "$(cat <<'EOF'
## Summary
- First wardrobe outfit to author a `permissions:` block (depends on suit `feat/permissions-block` PR being merged + released)
- Documents the new field in `docs/HARNESS_INTEGRATION.md`
- Verified emission against all four harness targets

## Test plan
- [ ] `npm run validate` passes (suit's new schema accepts the block)
- [ ] `suit show outfit backend --target=<t>` for t in {claude, codex, gemini, pi} emits expected artifacts
- [ ] Gemini/Pi emit logs ignored-field warnings (expected behavior, not a regression)
EOF
)"
```

- [ ] **Step 5: Check remote CI status**

Run: `gh pr checks $(gh pr view --json number -q .number)`
Expected: all green. Distinguish transient infra failures from real failures explicitly in the status report.

- [ ] **Step 6: Hand off to human for merge**

Surface the PR URL and wait for manual merge per CLAUDE.md PR policy. After merge:

```bash
git checkout main && git pull && git branch -d feat/permissions-canary-backend
git push origin --delete feat/permissions-canary-backend
git remote prune origin
```

---

## Self-Review Checklist (run before handoff)

**1. Spec coverage** — every architectural decision from the design conversation:
- [x] Outfit-only attachment (Task 2)
- [x] LCD vocabulary = mode + bash_allow + mcp.* (Task 1)
- [x] Per-target passthrough (Tasks 3–6)
- [x] No emit when block absent (Task 1 schema makes optional; adapters early-return)
- [x] Suit-first, wardrobe canary after (phase gate at end of Task 7)
- [x] Backend as canary outfit (Task 8)
- [x] Cross-repo PR discipline (Tasks 7 & 10)
- [x] Local CI before "ready" (Tasks 7.5 & 10.3)

**2. Placeholder scan** — none found. Every code block is concrete.

**3. Type consistency** — `PermissionsBlock` defined once in suit `src/lib/schema.ts`, exported via `src/lib/types.ts`, consumed unchanged in all four adapters. Field names (`mode`, `bash_allow`, `mcp`, `claude`, `codex`, `gemini`, `pi`) used identically across tasks.

**4. Risks not in tasks above:**
- *Existing evolution detector* (`suit/src/lib/evolution/permissions.ts`) generates session-time diffs to `.claude/settings.json`. Its output could conflict with build-time emit. Not addressed in v1; flag for v2 review.
- *Codex sandbox_mode interaction with `mode` LCD* — both write into `codex.config.toml` but represent orthogonal concepts. The compiler in Task 4 maps `mode` to `approval_policy` only; `sandbox_mode` is passthrough-only. Documented in Task 9.

---

## Deviations from `writing-plans` skill defaults

- **Plan location**: `docs/plans/` (wardrobe convention), not `docs/bones-powers/plans/`. Wardrobe doesn't use bones.
- **No bones task materialization**: wardrobe and suit don't use the `bones` task graph. The plan is the executable artifact.
- **No subagent-driven-development handoff prompt**: cross-repo work with explicit phase gate; the human operator picks execution mode after reviewing this doc.
