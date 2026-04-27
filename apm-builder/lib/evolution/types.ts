import type { ComponentSource } from '../types.ts';

/** Event from a JSONL transcript. Subset we care about for v1 detectors. */
export interface SessionEvent {
  type?: string;
  sessionId?: string;
  timestamp?: string;
  message?: { content?: unknown };
  // permission events:
  tool?: string;
  input?: unknown;
  decision?: string;
}

/** Severity tier — frequency-based per the spec (low <3, medium 3-5, high >5). */
export type Severity = 'low' | 'medium' | 'high';

/** What pattern type produced this finding. */
export type PatternType =
  | 'permission-prompt-recurring'
  | 'memory-stale-ref'
  | 'correction-cluster'
  | 'edit-thrashing'
  | 'error-loop'
  | 'arc-cluster';

/** A unified diff against a target file. */
export interface ProposedDiff {
  /** Absolute or repo-relative path of the file to patch. */
  targetPath: string;
  /** Unified-diff content (--- a/file +++ b/file ... @@ ...). */
  diff: string;
  /** One-line human summary of what the diff does. */
  summary: string;
}

/** A single detection result. */
export interface Finding {
  id: string; // e.g., 'F-001'
  patternType: PatternType;
  severity: Severity;
  /** Frequency or count behind the severity. */
  count: number;
  /** Quoted/redacted evidence rendered as markdown blockquote chunks. */
  evidence: string[];
  /** Optional proposed fix. Some findings (e.g., high-level signals like restart-cluster) may be surface-only. */
  proposedDiff?: ProposedDiff;
}

/** The full report produced by orchestrator. */
export interface EvolutionReport {
  project: string;
  windowStart: Date;
  windowEnd: Date;
  sessionsScanned: number;
  llmCostUsd: number;
  findings: Finding[];
}

/** Skill catalog entry used by relevant-skill.ts. */
export interface SkillEntry {
  name: string;
  description: string;
  filePath: string; // absolute path to the SKILL.md
  category?: string;
}

/** Options the CLI passes into the orchestrator. */
export interface EvolveOptions {
  repoRoot: string;
  project: string;
  sinceMs: number; // Date.now() - sinceMs is the window start
  noLlm: boolean;
  includeArcs: boolean;
  dryRun: boolean;
  json: boolean;
}
