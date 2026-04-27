// Harness-adapter picker. Detects the host harness from environment cues and
// returns the matching adapter. Falls back to claude-code when no signal is
// present — that's the primary harness this repo targets.

import type { HarnessAdapter } from './types.ts';
import { claudeCodeHarnessAdapter } from './claude-code.ts';
import { codexHarnessAdapter } from './codex.ts';
import { geminiHarnessAdapter } from './gemini.ts';
import { copilotHarnessAdapter } from './copilot.ts';
import { piHarnessAdapter } from './pi.ts';

export type {
  HarnessAdapter,
  NormalizedHookInput,
  NormalizedHookOutput,
} from './types.ts';

export const HARNESS_ADAPTERS: Record<string, HarnessAdapter> = {
  'claude-code': claudeCodeHarnessAdapter,
  codex: codexHarnessAdapter,
  gemini: geminiHarnessAdapter,
  copilot: copilotHarnessAdapter,
  pi: piHarnessAdapter,
};

/**
 * Detect which harness is hosting the current process.
 *
 * Detection rules (first match wins):
 *  - `CLAUDE_PROJECT_DIR` set → `claude-code`
 *  - `CODEX_HOME` set → `codex`
 *  - `GEMINI_CLI` set → `gemini`
 *  - `GH_COPILOT_CLI` set → `copilot`
 *  - `PI_HOME` set → `pi`
 *  - default → `claude-code`
 */
export function detectHarness(env: NodeJS.ProcessEnv = process.env): string {
  if (env['CLAUDE_PROJECT_DIR']) return 'claude-code';
  if (env['CODEX_HOME']) return 'codex';
  if (env['GEMINI_CLI']) return 'gemini';
  if (env['GH_COPILOT_CLI']) return 'copilot';
  if (env['PI_HOME']) return 'pi';
  return 'claude-code';
}

/** Pick the adapter matching the host harness, or claude-code as a fallback. */
export function getHarnessAdapter(env: NodeJS.ProcessEnv = process.env): HarnessAdapter {
  const adapter = HARNESS_ADAPTERS[detectHarness(env)];
  // detectHarness always returns a key that exists; the fallback exists to
  // satisfy noUncheckedIndexedAccess.
  return adapter ?? claudeCodeHarnessAdapter;
}
