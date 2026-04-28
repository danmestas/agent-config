import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import {
  composeRulesBody,
  isOwnerOfRulesFile,
  selectRules,
} from '../lib/rules.ts';
import type {
  Adapter,
  AdapterContext,
  ComponentSource,
  EmittedFile,
} from '../lib/types.ts';

interface ApmConfig {
  package_scope?: string;
}

/** Build the package directory name (filesystem-safe portion). */
function packageDir(component: ComponentSource): string {
  return component.manifest.name;
}

/** Apply the repo-level package_scope to produce the manifest's `name:` value. */
function scopedName(component: ComponentSource, ctx: AdapterContext): string {
  const cfg = (ctx.config as ApmConfig) ?? {};
  const override = component.manifest.overrides?.apm?.package_name;
  if (typeof override === 'string') return override;
  if (cfg.package_scope) return `${cfg.package_scope}/${component.manifest.name}`;
  return component.manifest.name;
}

/**
 * Serialize a manifest object to a stable YAML string. `lineWidth: 0` and
 * PLAIN string defaults keep golden tests deterministic across Node versions.
 * The `yaml` library auto-quotes scoped names that begin with `@`.
 */
function renderManifest(manifest: Record<string, unknown>): string {
  return YAML.stringify(manifest, {
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
    lineWidth: 0,
  });
}

function emitSkill(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const dir = packageDir(component);
  const manifest: Record<string, unknown> = {
    name: scopedName(component, ctx),
    version: component.manifest.version,
    description: component.manifest.description,
  };
  if (component.manifest.author) manifest.author = component.manifest.author;
  if (component.manifest.license) manifest.license = component.manifest.license;
  manifest.type = 'skill';
  manifest.includes = 'auto';
  return [
    { path: `${dir}/apm.yml`, content: renderManifest(manifest) },
    {
      path: `${dir}/.apm/skills/${component.manifest.name}/SKILL.md`,
      content: component.body.trimStart(),
    },
  ];
}

export const apmAdapter: Adapter = {
  target: 'apm',

  supports(component) {
    return component.manifest.targets.includes('apm');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill':
        return emitSkill(component, ctx);
      case 'agent':
        return emitAgent(component, ctx);
      case 'hook':
        return emitHook(component, ctx);
      case 'mcp':
        return emitMcp(component, ctx);
      case 'rules':
        return emitRules(component, ctx);
      case 'plugin':
        return emitPlugin(component, ctx);
      case 'persona':
      case 'mode':
        // Personas and modes are harness-agnostic, consumed by `ac` at resolution
        // time. Not emitted per-target. See spec §5.2.
        return [];
      default:
        throw new Error(`apm adapter: type "${component.manifest.type}" not yet implemented`);
    }
  },
};

function emitPlugin(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const dir = packageDir(component);
  const includedSkillNames: string[] = [];
  for (const inc of component.manifest.includes ?? []) {
    const resolvedDir = path.normalize(path.join(component.relativeDir, inc));
    const target = ctx.allComponents.find((c) => c.relativeDir === resolvedDir);
    if (target && target.manifest.type === 'skill') {
      includedSkillNames.push(target.manifest.name);
    }
  }

  const manifest: Record<string, unknown> = {
    name: scopedName(component, ctx),
    version: component.manifest.version,
    description: component.manifest.description,
    type: 'hybrid',
    includes: 'auto',
  };

  const pluginJson = {
    name: component.manifest.name,
    version: component.manifest.version,
    description: component.manifest.description,
    skills: includedSkillNames,
  };

  return [
    { path: `${dir}/apm.yml`, content: renderManifest(manifest) },
    { path: `${dir}/plugin.json`, content: `${JSON.stringify(pluginJson, null, 2)}\n` },
  ];
}

function emitRules(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const scope = component.manifest.scope ?? 'project';
  if (!isOwnerOfRulesFile(component, ctx.allComponents, 'apm')) return [];
  const sorted = selectRules(ctx.allComponents, 'apm', scope);

  const content = composeRulesBody(sorted);
  const dir = scope === 'user' ? 'rules-bundle-user' : 'rules-bundle';
  const description =
    scope === 'user'
      ? 'Composed user-scope rules for the agent-skills monorepo'
      : 'Composed project-scope rules for the agent-skills monorepo';

  const cfg = (ctx.config as ApmConfig) ?? {};
  const name = cfg.package_scope ? `${cfg.package_scope}/${dir}` : dir;

  const manifest: Record<string, unknown> = {
    name,
    version: component.manifest.version,
    description,
    type: 'instructions',
    includes: 'auto',
  };

  return [
    { path: `${dir}/memory/constitution.md`, content },
    { path: `${dir}/apm.yml`, content: renderManifest(manifest) },
  ];
}

function emitMcp(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const mcp = component.manifest.mcp;
  if (!mcp) return [];
  const dir = packageDir(component);
  const mcpEntry: Record<string, unknown> = {
    name: component.manifest.name,
    registry: false,
    transport: 'stdio',
    command: mcp.command,
  };
  if (mcp.args && mcp.args.length > 0) mcpEntry.args = mcp.args;
  if (mcp.env && Object.keys(mcp.env).length > 0) mcpEntry.env = mcp.env;

  const manifest: Record<string, unknown> = {
    name: scopedName(component, ctx),
    version: component.manifest.version,
    description: component.manifest.description,
    type: 'skill',
    includes: 'auto',
    dependencies: { mcp: [mcpEntry] },
  };
  return [{ path: `${dir}/apm.yml`, content: renderManifest(manifest) }];
}

async function emitHook(component: ComponentSource, ctx: AdapterContext): Promise<EmittedFile[]> {
  if (!component.manifest.hooks) return [];
  const dir = packageDir(component);
  const files: EmittedFile[] = [];
  const scripts: Record<string, string> = {};

  for (const [event, def] of Object.entries(component.manifest.hooks)) {
    const scriptName = path.basename(def.command);
    scripts[`hook:${event}:${scriptName}`] = `\${APM_PACKAGE_DIR}/.apm/hooks/${scriptName}`;
    const scriptPath = path.join(component.dir, def.command);
    const exists = await fs.stat(scriptPath).then(() => true).catch(() => false);
    if (exists) {
      const content = await fs.readFile(scriptPath);
      files.push({
        path: `${dir}/.apm/hooks/${scriptName}`,
        content,
        mode: 0o755,
      });
    }
  }

  const manifest: Record<string, unknown> = {
    name: scopedName(component, ctx),
    version: component.manifest.version,
    description: component.manifest.description,
    type: 'skill',
    includes: 'auto',
    scripts,
  };
  files.push({ path: `${dir}/apm.yml`, content: renderManifest(manifest) });
  return files;
}

function emitAgent(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const dir = packageDir(component);
  const lines = ['---', `description: ${component.manifest.description}`];
  if (component.manifest.agent?.tools) {
    lines.push(`tools: [${component.manifest.agent.tools.join(', ')}]`);
  }
  if (component.manifest.agent?.model) {
    lines.push(`model: ${component.manifest.agent.model}`);
  }
  lines.push('---');
  const agentMd = `${lines.join('\n')}\n\n${component.body.trimStart()}`;

  const manifest: Record<string, unknown> = {
    name: scopedName(component, ctx),
    version: component.manifest.version,
    description: component.manifest.description,
    type: 'skill',
    includes: 'auto',
  };
  return [
    { path: `${dir}/apm.yml`, content: renderManifest(manifest) },
    { path: `${dir}/.apm/agents/${component.manifest.name}.agent.md`, content: agentMd },
  ];
}
