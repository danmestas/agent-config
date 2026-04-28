// Copilot CLI harness adapter — STUB. Real implementation lands when a hook
// needs to ship to Copilot CLI.

import type { HarnessAdapter } from './types.ts';

export const copilotHarnessAdapter: HarnessAdapter = {
  name: 'copilot',
  normalizeInput() {
    throw new Error('copilot harness adapter: not yet implemented');
  },
  formatOutput() {
    throw new Error('copilot harness adapter: not yet implemented');
  },
};
