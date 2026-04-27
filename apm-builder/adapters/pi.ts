import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';

export const piAdapter: Adapter = {
  target: 'pi',

  supports(component) {
    return component.manifest.targets.includes('pi');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill':
        return emitSkill(component);
      case 'agent':
      case 'rules':
        return emitAgentsMdContribution(component, ctx);
      case 'plugin':
        return emitPluginPackage(component, ctx);
      case 'hook':
        return emitHookExtension(component);
      case 'mcp':
        return emitMcpStub(component);
      default:
        throw new Error(`pi adapter: type "${component.manifest.type}" not supported`);
    }
  },
};

function emitSkill(component: ComponentSource): EmittedFile[] {
  const { manifest, body } = component;
  // Pi skills follow the Agent Skills standard: frontmatter is just
  // name + description. All other manifest fields are stripped during emission
  // (version, type, targets, etc. are infrastructure metadata, not skill content).
  const frontmatter = ['---', `name: ${manifest.name}`, `description: ${manifest.description}`, '---'].join('\n');
  return [
    {
      path: `.pi/skills/${manifest.name}/SKILL.md`,
      content: `${frontmatter}\n\n${body.trimStart()}`,
    },
  ];
}
function emitAgentsMdContribution(
  _component: ComponentSource,
  _ctx: AdapterContext,
): EmittedFile[] {
  throw new Error('not implemented (Task 5)');
}
function emitPluginPackage(
  _component: ComponentSource,
  _ctx: AdapterContext,
): EmittedFile[] {
  throw new Error('not implemented (Task 6)');
}
function emitHookExtension(_component: ComponentSource): EmittedFile[] {
  throw new Error('not implemented (Task 7)');
}
function emitMcpStub(_component: ComponentSource): EmittedFile[] {
  throw new Error('not implemented (Task 8)');
}
