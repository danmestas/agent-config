import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  Adapter,
  AdapterContext,
  ComponentSource,
  EmittedFile,
} from '../lib/types.ts';
import {
  composeAgentsMd,
  DEFAULT_SECTION_ORDER,
  type AgentsMdSection,
} from '../lib/agents-md.ts';
import { renderMcpServerToml } from '../lib/toml.ts';

const TARGET = 'codex' as const;

export const codexAdapter: Adapter = {
  target: TARGET,

  supports(component) {
    return component.manifest.targets.includes(TARGET);
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill':
      case 'agent':
      case 'rules':
        return emitAgentsMd(component, ctx);
      case 'hook':
        return emitHook(component);
      case 'mcp':
        return emitMcp(component, ctx);
      case 'persona':
      case 'mode':
        // Personas and modes are harness-agnostic, consumed by `ac` at resolution
        // time. Not emitted per-target. See spec §5.2.
        return [];
      // plugin is schema-rejected for codex (see Plan 1's validate.ts).
      default:
        throw new Error(
          `codex adapter: type "${component.manifest.type}" not yet implemented`,
        );
    }
  },
};

interface CodexHookEntry {
  command: string;
  matcher?: string;
}

async function emitHook(component: ComponentSource): Promise<EmittedFile[]> {
  const { manifest, dir } = component;
  if (!manifest.hooks) return [];

  // Group entries by event, alphabetize events for determinism.
  const events: Record<string, CodexHookEntry[]> = {};
  const sortedEvents = Object.keys(manifest.hooks).sort();
  for (const event of sortedEvents) {
    const def = manifest.hooks[event]!;
    const entry: CodexHookEntry = { command: def.command };
    if (def.matcher !== undefined) entry.matcher = def.matcher;
    events[event] = [entry];
  }
  const fragment = { hooks: events };

  const files: EmittedFile[] = [
    {
      path: 'hooks.json',
      content: `${JSON.stringify(fragment, null, 2)}\n`,
    },
  ];

  // Bundle any scripts that exist inside the component dir.
  for (const def of Object.values(manifest.hooks)) {
    const scriptPath = path.join(dir, def.command);
    const exists = await fs.stat(scriptPath).then(() => true).catch(() => false);
    if (exists) {
      const content = await fs.readFile(scriptPath);
      files.push({ path: def.command, content, mode: 0o755 });
    }
  }
  return files;
}

/**
 * Emit `AGENTS.md` exactly once across all content-bearing component invocations.
 * The "alphabetically-first content-bearing component targeting codex" wins;
 * everyone else returns []. Same idempotency pattern as the claude-code rules
 * adapter in Plan 1.
 */
function emitAgentsMd(
  component: ComponentSource,
  ctx: AdapterContext,
): EmittedFile[] {
  const contentBearing = ctx.allComponents
    .filter(
      (c) =>
        (c.manifest.type === 'skill' ||
          c.manifest.type === 'agent' ||
          c.manifest.type === 'rules') &&
        c.manifest.targets.includes(TARGET),
    )
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

  if (contentBearing[0]?.manifest.name !== component.manifest.name) return [];

  const sectionOrder = readSectionOrder(ctx.config);
  const content = composeAgentsMd({
    target: TARGET,
    components: ctx.allComponents,
    sectionOrder,
  });
  return [{ path: 'AGENTS.md', content }];
}

function emitMcp(
  component: ComponentSource,
  ctx: AdapterContext,
): EmittedFile[] {
  // Idempotency: only the alphabetically-first mcp component emits the file.
  const allMcp = ctx.allComponents
    .filter(
      (c) => c.manifest.type === 'mcp' && c.manifest.targets.includes(TARGET),
    )
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  if (allMcp[0]?.manifest.name !== component.manifest.name) return [];

  const blocks = allMcp
    .filter((c) => c.manifest.mcp !== undefined)
    .map((c) =>
      renderMcpServerToml(c.manifest.name, {
        command: c.manifest.mcp!.command,
        args: c.manifest.mcp!.args,
        env: c.manifest.mcp!.env,
      }).trimEnd(),
    );

  const content = blocks.join('\n\n') + '\n';
  return [{ path: 'codex.config.toml', content }];
}

function readSectionOrder(config: Record<string, unknown>): AgentsMdSection[] {
  const raw = config['agents_md_section_order'];
  if (!Array.isArray(raw)) return DEFAULT_SECTION_ORDER;
  const valid: AgentsMdSection[] = ['rules', 'agents', 'skills'];
  const filtered = raw.filter((x): x is AgentsMdSection =>
    valid.includes(x as AgentsMdSection),
  );
  // Fill in any missing sections at the end so we never lose content.
  for (const s of valid) if (!filtered.includes(s)) filtered.push(s);
  return filtered;
}
