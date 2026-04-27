import type { Adapter, Target } from '../lib/types.ts';
import { claudeCodeAdapter } from './claude-code.ts';

const REGISTRY: Partial<Record<Target, Adapter>> = {
  'claude-code': claudeCodeAdapter,
  // apm, codex, gemini, copilot, pi adapters land in Plans 2-6.
};

export function getAdapter(target: Target): Adapter | undefined {
  return REGISTRY[target];
}

export function listImplementedTargets(): Target[] {
  return Object.keys(REGISTRY) as Target[];
}
