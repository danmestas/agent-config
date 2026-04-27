import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';
import { renderRulesSections, selectAndSortRules } from '../lib/rules.ts';

export const copilotAdapter: Adapter = {
  target: 'copilot',

  supports(component) {
    return component.manifest.targets.includes('copilot');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'rules':
      case 'skill':
        return emitInstructions(component, ctx);
      case 'hook':
        return emitHook(component, ctx);
      default:
        throw new Error(
          `copilot adapter: type "${component.manifest.type}" not yet implemented`,
        );
    }
  },
};

function emitInstructions(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  // Collect all components contributing to copilot-instructions.md.
  const rules = selectAndSortRules(ctx.allComponents, 'copilot', 'project');
  const skills = ctx.allComponents
    .filter(
      (c) =>
        c.manifest.type === 'skill' &&
        c.manifest.targets.includes('copilot'),
    )
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

  // Pick a canonical owner: alphabetically-first project rule, or, if no rules, alphabetically-first skill.
  const owner = rules[0] ?? skills[0];
  if (!owner || owner.manifest.name !== component.manifest.name) return [];

  // For rule components that are user-scoped, opt out (Copilot has no user scope).
  if (component.manifest.type === 'rules' && (component.manifest.scope ?? 'project') !== 'project') {
    return [];
  }

  const sections: string[] = [];
  if (rules.length > 0) sections.push(`# Rules\n\n${renderRulesSections(rules)}`);
  if (skills.length > 0) {
    const skillSections = skills
      .map((s) => `## ${s.manifest.name}\n\n${s.body.trim()}\n`)
      .join('\n');
    sections.push(`# Skills\n\n${skillSections}`);
  }
  if (sections.length === 0) return [];
  const content = sections.join('\n');
  return [{ path: 'copilot-instructions.md', content }];
}

function emitHook(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const { manifest } = component;
  if (!manifest.hooks) return [];
  const hooksDir =
    typeof ctx.config['hooks_dir'] === 'string'
      ? (ctx.config['hooks_dir'] as string)
      : '.github/hooks';
  const files: EmittedFile[] = [];
  for (const [event, def] of Object.entries(manifest.hooks)) {
    const payload = {
      event,
      matcher: def.matcher ?? '*',
      command: def.command,
      type: 'command',
    };
    files.push({
      path: `${hooksDir}/${event}-${manifest.name}.json`,
      content: `${JSON.stringify(payload, null, 2)}\n`,
    });
  }
  return files;
}
