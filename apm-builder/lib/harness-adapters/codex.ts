// Codex harness adapter — STUB. Real implementation lands when a hook needs
// to ship to Codex; until then we throw on use so callers fail loudly rather
// than silently.

import type { HarnessAdapter } from './types.ts';

export const codexHarnessAdapter: HarnessAdapter = {
  name: 'codex',
  normalizeInput() {
    throw new Error('codex harness adapter: not yet implemented');
  },
  formatOutput() {
    throw new Error('codex harness adapter: not yet implemented');
  },
};
