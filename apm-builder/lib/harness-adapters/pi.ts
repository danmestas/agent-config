// Pi harness adapter — STUB. Real implementation lands when a hook needs to
// ship to Pi.

import type { HarnessAdapter } from './types.ts';

export const piHarnessAdapter: HarnessAdapter = {
  name: 'pi',
  normalizeInput() {
    throw new Error('pi harness adapter: not yet implemented');
  },
  formatOutput() {
    throw new Error('pi harness adapter: not yet implemented');
  },
};
