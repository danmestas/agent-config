import { z } from 'zod';
import { COMPONENT_TYPES, TARGETS, type ComponentType, type Target } from './types.ts';

const SEMVER_RE = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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

export const ManifestSchema = z
  .object({
    name: z.string().regex(NAME_RE, 'name must be kebab-case lowercase'),
    version: z.string().regex(SEMVER_RE, 'version must be valid semver'),
    description: z.string().min(1),
    type: z.enum(COMPONENT_TYPES as unknown as [ComponentType, ...ComponentType[]]),
    targets: z.array(z.enum(TARGETS as unknown as [Target, ...Target[]])).min(1),
    author: z.string().optional(),
    license: z.string().optional(),
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
  })
  .strict();

export type Manifest = z.infer<typeof ManifestSchema>;
