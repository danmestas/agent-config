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

// Stubs replaced in Tasks 4-8:
function emitSkill(_component: ComponentSource): EmittedFile[] {
  throw new Error('not implemented (Task 4)');
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
