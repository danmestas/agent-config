import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';
import { composeAgentsMd } from '../lib/agents-md.ts';

export const piAdapter: Adapter = {
  target: 'pi',

  supports(component) {
    return component.manifest.targets.includes('pi');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill': {
        // Pi loads both .pi/skills/*/SKILL.md (canonical skill discovery) and
        // .pi/AGENTS.md (always-on context). The AGENTS.md `# Skills` section
        // is a listing for visibility, not the actual skill loader.
        const skillFiles = emitSkill(component);
        const agentsMdFiles = emitAgentsMdContribution(component, ctx);
        return [...skillFiles, ...agentsMdFiles];
      }
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
  component: ComponentSource,
  ctx: AdapterContext,
): EmittedFile[] {
  // Determine the alphabetically-first eligible contributor across rules+agents+skills.
  // Only that one emits the file; others contribute via the shared composer and return [].
  const contributors = ctx.allComponents.filter(
    (c) =>
      c.manifest.targets.includes('pi') &&
      (c.manifest.type === 'rules' ||
        c.manifest.type === 'agent' ||
        c.manifest.type === 'skill'),
  );
  if (contributors.length === 0) return [];
  const leader = [...contributors].sort((a, b) =>
    a.manifest.name.localeCompare(b.manifest.name),
  )[0];
  if (!leader || leader.manifest.name !== component.manifest.name) return [];

  const content = composeAgentsMd(contributors, 'pi', ctx.config as never);
  return [{ path: '.pi/AGENTS.md', content }];
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
