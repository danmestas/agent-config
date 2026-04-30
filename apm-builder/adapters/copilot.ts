import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';
import { composeRulesBody, selectRules } from '../lib/rules.ts';
import { effectiveTargets } from '../lib/validate.ts';

export const copilotAdapter: Adapter = {
  target: 'copilot',

  supports(component) {
    return effectiveTargets(component).includes('copilot');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'rules':
      case 'skill':
        return emitInstructions(component, ctx);
      case 'hook':
        return emitHook(component, ctx);
      case 'plugin':
      case 'agent':
      case 'mcp':
        throw new Error(
          `copilot adapter: type "${component.manifest.type}" not supported by Copilot CLI ` +
            `(see compatibility matrix in spec). Remove "copilot" from the component's targets.`,
        );
      case 'persona':
      case 'mode':
        // Personas and modes are harness-agnostic, consumed by `ac` at resolution
        // time. Not emitted per-target. See spec §5.2.
        return [];
      default:
        throw new Error(
          `copilot adapter: unknown component type "${component.manifest.type}"`,
        );
    }
  },
};

/**
 * Compose copilot-instructions.md content from a filtered set of components.
 * Exported so the CLI `docs --target copilot` can reuse it directly.
 */
export function composeCopilotInstructions(allComponents: ComponentSource[]): string {
  const rules = selectRules(allComponents, 'copilot', 'project');
  const skills = allComponents
    .filter(
      (c) =>
        c.manifest.type === 'skill' &&
        effectiveTargets(c).includes('copilot'),
    )
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

  const sections: string[] = [];
  if (rules.length > 0) sections.push(`# Rules\n\n${composeRulesBody(rules)}`);
  if (skills.length > 0) {
    const skillSections = skills
      .map((s) => `## ${s.manifest.name}\n\n${s.body.trim()}\n`)
      .join('\n');
    sections.push(`# Skills\n\n${skillSections}`);
  }
  return sections.join('\n');
}

function emitInstructions(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const allComponents = ctx.allComponents;

  // Pick a canonical owner: alphabetically-first project rule, or, if no rules, alphabetically-first skill.
  const rules = selectRules(allComponents, 'copilot', 'project');
  const skills = allComponents
    .filter(
      (c) =>
        c.manifest.type === 'skill' &&
        effectiveTargets(c).includes('copilot'),
    )
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

  const owner = rules[0] ?? skills[0];
  if (!owner || owner.manifest.name !== component.manifest.name) return [];

  // For rule components that are user-scoped, opt out (Copilot has no user scope).
  if (component.manifest.type === 'rules' && (component.manifest.scope ?? 'project') !== 'project') {
    return [];
  }

  const content = composeCopilotInstructions(allComponents);
  if (!content) return [];
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
