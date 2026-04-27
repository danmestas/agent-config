import type { Adapter, Target } from '../lib/types.ts';
import { claudeCodeAdapter } from './claude-code.ts';
import { geminiAdapter } from './gemini.ts';

const REGISTRY: Partial<Record<Target, Adapter>> = {
  'claude-code': claudeCodeAdapter,
  gemini: geminiAdapter,
  // apm, codex, copilot, pi adapters land in their own plans.
};

export function getAdapter(target: Target): Adapter | undefined {
  return REGISTRY[target];
}

export function listImplementedTargets(): Target[] {
  return Object.keys(REGISTRY) as Target[];
}
