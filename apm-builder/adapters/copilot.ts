import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';
import { isFirstRule, renderRulesSections, selectAndSortRules } from '../lib/rules.ts';

export const copilotAdapter: Adapter = {
  target: 'copilot',

  supports(component) {
    return component.manifest.targets.includes('copilot');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'rules':
        return emitRules(component, ctx);
      // skill, hook implementations land in Tasks 4 and 6.
      default:
        throw new Error(
          `copilot adapter: type "${component.manifest.type}" not yet implemented`,
        );
    }
  },
};

function emitRules(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  const scope = component.manifest.scope ?? 'project';
  if (scope !== 'project') {
    // Copilot CLI does not have a user-scoped rules concept; user-scoped rules are skipped silently.
    return [];
  }
  if (!isFirstRule(component, ctx.allComponents, 'copilot', scope)) return [];
  const rules = selectAndSortRules(ctx.allComponents, 'copilot', scope);
  const content = `# Rules\n\n${renderRulesSections(rules)}`;
  return [{ path: 'copilot-instructions.md', content }];
}
