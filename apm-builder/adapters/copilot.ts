import type { Adapter } from '../lib/types.ts';

export const copilotAdapter: Adapter = {
  target: 'copilot',

  supports(component) {
    return component.manifest.targets.includes('copilot');
  },

  async emit(component, _ctx) {
    switch (component.manifest.type) {
      // Implementations land in Tasks 3, 4, 6.
      default:
        throw new Error(
          `copilot adapter: type "${component.manifest.type}" not yet implemented`,
        );
    }
  },
};
