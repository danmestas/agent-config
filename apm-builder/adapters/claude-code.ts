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
      // Other types added in Tasks 10-13.
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
