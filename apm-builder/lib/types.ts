export const COMPONENT_TYPES = ['skill', 'plugin', 'hook', 'agent', 'rules', 'mcp', 'persona', 'mode'] as const;
export type ComponentType = typeof COMPONENT_TYPES[number];

export const TARGETS = ['claude-code', 'apm', 'codex', 'gemini', 'copilot', 'pi'] as const;
export type Target = typeof TARGETS[number];

// Re-export the Category type so callers depending on `types.ts` get the full
// public surface in one import. The canonical list lives in `schema.ts` to
// keep the Zod enum and the TypeScript type derived from a single source.
export type { Category } from './schema.ts';
import type { Category } from './schema.ts';

/**
 * Attribution metadata for components vendored from an upstream source.
 * Used in the `license:` frontmatter field as an alternative to a plain
 * SPDX-style string. Captures upstream license, source repo + pinned SHA, and
 * the original path within that repo.
 */
export interface LicenseAttribution {
  upstream: string;
  source: string;
  path: string;
}

export interface ComponentSource {
  /** Absolute path to the component dir (contains the component's manifest file — typically `SKILL.md`). */
  dir: string;
  /** Relative path from repo root (e.g., "skills/pikchr-generator"). */
  relativeDir: string;
  /** Parsed frontmatter manifest. */
  manifest: ComponentManifest;
  /** Markdown body (everything after the frontmatter). */
  body: string;
}

/**
 * The frontmatter manifest of a component. Intentionally permissive: type-specific
 * blocks (hooks, agent, mcp, etc.) are all optional at the type level, with
 * presence/correctness enforced by the Zod schema (apm-builder/lib/schema.ts) at
 * parse time. Do not rewrite as a discriminated union — the validation boundary
 * is Zod, not the type system, and a discriminated union here would force callers
 * to re-narrow after Zod has already validated.
 */
export interface ComponentManifest {
  name: string;
  version: string;
  description: string;
  category?: { primary: Category; secondary?: Category[] };
  type: ComponentType;
  targets: Target[];
  author?: string;
  /**
   * Either a SPDX-style string ("MIT", "Apache-2.0") or an attribution block
   * carrying upstream-source provenance for vendored components.
   */
  license?: string | LicenseAttribution;
  tags?: string[];
  // Type-specific blocks (validated by Zod schema, not all required):
  hooks?: Record<string, { command: string; matcher?: string }>;
  agent?: { tools?: string[]; model?: string; color?: string };
  mcp?: { command: string; args?: string[]; env?: Record<string, string> };
  includes?: string[];
  scope?: 'project' | 'user';
  before?: string[];
  after?: string[];
  overrides?: Partial<Record<Target, Record<string, unknown>>>;
  // persona / mode specific
  categories?: string[];
  skill_include?: string[];
  skill_exclude?: string[];
}

export interface EmittedFile {
  /** Path relative to dist/<target>/. */
  path: string;
  /** Bytes to write. */
  content: string | Buffer;
  /** File mode (defaults to 0o644). */
  mode?: number;
}

export interface Adapter {
  target: Target;
  /**
   * True if this adapter can emit this component. The default check is
   * `component.manifest.targets.includes(this.target)`. Override only when an
   * adapter has constraints beyond `targets:` membership (e.g., a future Claude Code
   * adapter rejecting components that require features unavailable in a target version).
   * Keep this in sync with `targets:` validation in apm-builder/lib/validate.ts.
   */
  supports(component: ComponentSource): boolean;
  /** Emit files for this component. Paths returned are relative to `dist/<target>/`. */
  emit(component: ComponentSource, ctx: AdapterContext): Promise<EmittedFile[]>;
}

export interface AdapterContext {
  /** Repo-level config for this target (from apm-builder.config.yaml). */
  config: Record<string, unknown>;
  /** All discovered components — needed by the rules adapter for composition. */
  allComponents: ComponentSource[];
  /** Repo root absolute path. */
  repoRoot: string;
}
