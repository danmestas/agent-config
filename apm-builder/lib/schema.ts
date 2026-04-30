import { z } from 'zod';
import { COMPONENT_TYPES, TARGETS, type ComponentType, type Target } from './types.ts';

const SEMVER_RE = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const CATEGORIES = [
  'economy',
  'workflow',
  'backpressure',
  'tooling',
  'integrations',
  'context-management',
  'memory-management',
  'evolution',
] as const;
export type Category = typeof CATEGORIES[number];

const CategoryBlock = z
  .object({
    primary: z.enum(CATEGORIES as unknown as [Category, ...Category[]]),
    secondary: z
      .array(z.enum(CATEGORIES as unknown as [Category, ...Category[]]))
      .optional(),
  })
  .strict();

const HookEntry = z.object({
  command: z.string().min(1),
  matcher: z.string().optional(),
});

const AgentBlock = z.object({
  tools: z.array(z.string()).optional(),
  model: z.string().optional(),
  color: z.string().optional(),
});

const MCPBlock = z.object({
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

// License is either a SPDX-style string (e.g., "MIT") or an attribution block
// for upstream-sourced components carrying provenance metadata.
const LicenseAttribution = z
  .object({
    upstream: z.string().min(1),
    source: z.string().min(1),
    path: z.string().min(1),
  })
  .strict();
const LicenseField = z.union([z.string(), LicenseAttribution]);

const ManifestBaseSchema = z
  .object({
    name: z.string().regex(NAME_RE, 'name must be kebab-case lowercase'),
    version: z.string().regex(SEMVER_RE, 'version must be valid semver'),
    description: z.string().min(1),
    category: CategoryBlock.optional(),
    type: z.enum(['skill', 'plugin', 'hook', 'agent', 'rules', 'mcp'] as const),
    targets: z.array(z.enum(TARGETS as unknown as [Target, ...Target[]])).min(1),
    author: z.string().optional(),
    license: LicenseField.optional(),
    tags: z.array(z.string()).optional(),
    hooks: z.record(HookEntry).optional(),
    agent: AgentBlock.optional(),
    mcp: MCPBlock.optional(),
    includes: z.array(z.string()).optional(),
    scope: z.enum(['project', 'user']).optional(),
    before: z.array(z.string()).optional(),
    after: z.array(z.string()).optional(),
    overrides: z
      .record(
        z.enum(TARGETS as unknown as [Target, ...Target[]]),
        z.record(z.unknown()),
      )
      .optional(),
    // Plugin-bundling metadata. Set programmatically by discover.ts when
    // walking nested plugin skills; not user-authored in skill frontmatter
    // (though technically tolerated if present).
    plugin: z.string().optional(),
    defaultTargets: z
      .array(z.enum(TARGETS as unknown as [Target, ...Target[]]))
      .optional(),
  })
  .strict();

export const PersonaSchema = ManifestBaseSchema.extend({
  type: z.literal('persona'),
  categories: z.array(z.string()).min(0),
  skill_include: z.array(z.string()).default([]),
  skill_exclude: z.array(z.string()).default([]),
}).strict();

export type PersonaManifest = z.infer<typeof PersonaSchema>;

export const ModeSchema = ManifestBaseSchema.extend({
  type: z.literal('mode'),
  categories: z.array(z.string()).min(0),
  skill_include: z.array(z.string()).default([]),
  skill_exclude: z.array(z.string()).default([]),
}).strict();

export type ModeManifest = z.infer<typeof ModeSchema>;

export const ManifestSchema = z.discriminatedUnion('type', [
  ManifestBaseSchema,
  PersonaSchema,
  ModeSchema,
]);

export type Manifest = z.infer<typeof ManifestSchema>;
