// Gemini CLI harness adapter — STUB. Real implementation lands when a hook
// needs to ship to Gemini CLI.

import type { HarnessAdapter } from './types.ts';

export const geminiHarnessAdapter: HarnessAdapter = {
  name: 'gemini',
  normalizeInput() {
    throw new Error('gemini harness adapter: not yet implemented');
  },
  formatOutput() {
    throw new Error('gemini harness adapter: not yet implemented');
  },
};
