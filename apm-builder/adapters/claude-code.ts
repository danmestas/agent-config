import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';

export const claudeCodeAdapter: Adapter = {
  target: 'claude-code',

  supports(component) {
    return component.manifest.targets.includes('claude-code');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill':
        return emitSkill(component);
      case 'agent':
        return emitAgent(component);
      case 'rules':
        return emitRules(component, ctx);
      // Other types added in Tasks 11-13.
      default:
        throw new Error(`claude-code adapter: type "${component.manifest.type}" not yet implemented`);
    }
  },
};

function emitSkill(component: ComponentSource): EmittedFile[] {
  const { manifest, body } = component;
  const frontmatter = ['---', `name: ${manifest.name}`, `description: ${manifest.description}`, '---'].join('\n');
  return [
    {
      path: `skills/${manifest.name}/SKILL.md`,
      content: `${frontmatter}\n\n${body.trimStart()}`,
    },
  ];
}

function emitAgent(component: ComponentSource): EmittedFile[] {
  const { manifest, body } = component;
  const lines = ['---', `name: ${manifest.name}`, `description: ${manifest.description}`];
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
  const scope = component.manifest.scope ?? 'project';
  const allRules = ctx.allComponents
    .filter((c) => c.manifest.type === 'rules' && c.manifest.targets.includes('claude-code'))
    .filter((c) => (c.manifest.scope ?? 'project') === scope);
  const sorted = topoSortRules(allRules);
  if (sorted[0]?.manifest.name !== component.manifest.name) return [];

  const sections = sorted.map((r) => `## ${r.manifest.name}\n\n${r.body.trim()}\n`);
  const content = sections.join('\n');
  const filename = scope === 'user' ? '.claude/CLAUDE.md' : 'CLAUDE.md';
  return [{ path: filename, content }];
}

function topoSortRules(rules: ComponentSource[]): ComponentSource[] {
  const byName = new Map(rules.map((r) => [r.manifest.name, r]));
  const edges = new Map<string, Set<string>>();
  for (const r of rules) edges.set(r.manifest.name, new Set());
  for (const r of rules) {
    for (const before of r.manifest.before ?? []) {
      if (byName.has(before)) edges.get(r.manifest.name)?.add(before);
    }
    for (const after of r.manifest.after ?? []) {
      if (byName.has(after)) edges.get(after)?.add(r.manifest.name);
    }
  }
  const inDegree = new Map<string, number>(rules.map((r) => [r.manifest.name, 0]));
  for (const targets of edges.values()) {
    for (const t of targets) inDegree.set(t, (inDegree.get(t) ?? 0) + 1);
  }
  const queue = [...rules.map((r) => r.manifest.name)]
    .filter((n) => inDegree.get(n) === 0)
    .sort();
  const result: ComponentSource[] = [];
  while (queue.length > 0) {
    queue.sort();
    const next = queue.shift()!;
    const r = byName.get(next);
    if (r) result.push(r);
    for (const dep of edges.get(next) ?? []) {
      inDegree.set(dep, (inDegree.get(dep) ?? 0) - 1);
      if (inDegree.get(dep) === 0) queue.push(dep);
    }
  }
  return result;
}
