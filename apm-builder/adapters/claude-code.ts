import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';
import { selectRules, composeRulesBody, isOwnerOfRulesFile } from '../lib/rules.ts';
import { effectiveTargets } from '../lib/validate.ts';

function yamlValue(v: string): string {
  // Use yaml.stringify to safely encode a single scalar (with quoting if needed).
  // stringify of a string adds a trailing newline; trim it.
  return YAML.stringify(v).trimEnd();
}

export const claudeCodeAdapter: Adapter = {
  target: 'claude-code',

  supports(component) {
    return effectiveTargets(component).includes('claude-code');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill':
        return emitSkill(component, ctx);
      case 'agent':
        return emitAgent(component);
      case 'rules':
        return emitRules(component, ctx);
      case 'hook':
        return emitHook(component);
      case 'mcp':
        return emitMcp(component);
      case 'plugin':
        return emitPlugin(component, ctx);
      case 'persona':
      case 'mode':
        // Personas and modes are harness-agnostic, consumed by `ac` at resolution
        // time. Not emitted per-target. See spec §5.2.
        return [];
      default:
        throw new Error(`claude-code adapter: type "${component.manifest.type}" not yet implemented`);
    }
  },
};

async function emitSkill(component: ComponentSource, ctx: AdapterContext): Promise<EmittedFile[]> {
  const { manifest, body, relativeDir } = component;
  const frontmatter = [
    '---',
    `name: ${yamlValue(manifest.name)}`,
    `description: ${yamlValue(manifest.description)}`,
    '---',
  ].join('\n');

  // Plugin-bundled skills (manifest.plugin is set) use relativeDir to preserve
  // the plugin namespace in dist (e.g. plugins/bones-powers/skills/<name>/SKILL.md).
  // Regular skills continue to emit to the flat skills/<name>/SKILL.md path.
  const skillMdPath = manifest.plugin
    ? `${relativeDir}/SKILL.md`
    : `skills/${manifest.name}/SKILL.md`;

  const files: EmittedFile[] = [
    {
      path: skillMdPath,
      content: `${frontmatter}\n\n${body.trimStart()}`,
    },
  ];

  // For plugin-bundled skills, also copy any extra files (e.g. references/)
  // that live alongside SKILL.md in the component source directory.
  if (manifest.plugin) {
    const extraFiles = await collectExtraFiles(component.dir, relativeDir);
    files.push(...extraFiles);
  }

  return files;
}

/**
 * Walk `sourceDir` recursively and collect all files that are NOT SKILL.md,
 * returning them as EmittedFiles with paths relative to `relativeDir`.
 */
async function collectExtraFiles(sourceDir: string, relativeDir: string): Promise<EmittedFile[]> {
  const results: EmittedFile[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name !== 'SKILL.md') {
        const relativePath = path.relative(sourceDir, fullPath);
        const content = await fs.readFile(fullPath);
        results.push({ path: `${relativeDir}/${relativePath}`, content });
      }
    }
  }
  await walk(sourceDir);
  return results;
}

function emitAgent(component: ComponentSource): EmittedFile[] {
  const { manifest, body } = component;
  const lines = ['---', `name: ${yamlValue(manifest.name)}`, `description: ${yamlValue(manifest.description)}`];
  if (manifest.agent?.tools) lines.push(`tools: [${manifest.agent.tools.join(', ')}]`);
  if (manifest.agent?.model) lines.push(`model: ${manifest.agent.model}`);
  if (manifest.agent?.color) lines.push(`color: ${manifest.agent.color}`);
  lines.push('---');
  return [
    {
      path: `agents/${manifest.name}.md`,
      content: `${lines.join('\n')}\n\n${body.trimStart()}`,
    },
  ];
}

function emitRules(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  if (!isOwnerOfRulesFile(component, ctx.allComponents, 'claude-code')) return [];
  const scope = component.manifest.scope ?? 'project';
  const sorted = selectRules(ctx.allComponents, 'claude-code', scope);
  const content = composeRulesBody(sorted);
  const filename = scope === 'user' ? '.claude/CLAUDE.md' : 'CLAUDE.md';
  return [{ path: filename, content }];
}

async function emitHook(component: ComponentSource): Promise<EmittedFile[]> {
  const { manifest, dir } = component;
  if (!manifest.hooks) return [];
  const fragment: { hooks: Record<string, unknown[]> } = { hooks: {} };
  const files: EmittedFile[] = [];

  for (const [event, def] of Object.entries(manifest.hooks)) {
    fragment.hooks[event] ??= [];
    (fragment.hooks[event] as unknown[]).push({
      matcher: def.matcher ?? '*',
      hooks: [{ type: 'command', command: `\${CLAUDE_PROJECT_DIR}/${def.command}` }],
    });
    const scriptPath = path.join(dir, def.command);
    const scriptExists = await fs.stat(scriptPath).then(() => true).catch(() => false);
    if (!scriptExists) {
      throw new Error(
        `claude-code adapter: hook "${event}" in component "${manifest.name}" references missing script: ${def.command} (expected at ${scriptPath})`,
      );
    }
    const content = await fs.readFile(scriptPath);
    files.push({ path: def.command, content, mode: 0o755 });
  }
  files.push({
    path: '.claude/settings.fragment.json',
    content: `${JSON.stringify(fragment, null, 2)}\n`,
  });
  return files;
}

function emitMcp(component: ComponentSource): EmittedFile[] {
  const { manifest } = component;
  if (!manifest.mcp) return [];
  const fragment = {
    mcpServers: {
      [manifest.name]: {
        command: manifest.mcp.command,
        ...(manifest.mcp.args ? { args: manifest.mcp.args } : {}),
        ...(manifest.mcp.env ? { env: manifest.mcp.env } : {}),
      },
    },
  };
  return [{ path: '.mcp.fragment.json', content: `${JSON.stringify(fragment, null, 2)}\n` }];
}

function emitPlugin(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const { manifest } = component;
  const includedSkillNames: string[] = [];
  for (const inc of manifest.includes ?? []) {
    const resolvedDir = path.normalize(path.join(component.relativeDir, inc));
    const target = ctx.allComponents.find((c) => c.relativeDir === resolvedDir);
    if (target && target.manifest.type === 'skill') {
      includedSkillNames.push(target.manifest.name);
    }
  }
  const json = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    skills: includedSkillNames,
  };
  return [
    { path: '.claude-plugin/plugin.json', content: `${JSON.stringify(json, null, 2)}\n` },
  ];
}

