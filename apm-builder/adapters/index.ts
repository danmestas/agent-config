import type { Adapter, Target } from '../lib/types.ts';
import { apmAdapter } from './apm.ts';
import { claudeCodeAdapter } from './claude-code.ts';
import { codexAdapter } from './codex.ts';
import { copilotAdapter } from './copilot.ts';
import { geminiAdapter } from './gemini.ts';
import { piAdapter } from './pi.ts';

const REGISTRY: Partial<Record<Target, Adapter>> = {
  'claude-code': claudeCodeAdapter,
  apm: apmAdapter,
  codex: codexAdapter,
  copilot: copilotAdapter,
  gemini: geminiAdapter,
  pi: piAdapter,
};

export function getAdapter(target: Target): Adapter | undefined {
  return REGISTRY[target];
}

export function listImplementedTargets(): Target[] {
  return Object.keys(REGISTRY) as Target[];
}
