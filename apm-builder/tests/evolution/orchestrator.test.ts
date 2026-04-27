// apm-builder/tests/evolution/orchestrator.test.ts
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runEvolution } from '../../lib/evolution/orchestrator.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../../..');

describe('runEvolution', () => {
  it('produces a report with permission and memory findings (no LLM)', async () => {
    const report = await runEvolution({
      repoRoot: REPO_ROOT,
      project: 'evolution-test',
      sinceMs: 365 * 24 * 60 * 60 * 1000, // 1 year window
      noLlm: true,
      includeArcs: false,
      dryRun: true,
      json: false,
      sessionsDir: path.join(HERE, 'fixtures/sessions'),
      memoryDir: path.join(HERE, 'fixtures/memory'),
    });
    expect(report.project).toBe('evolution-test');
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.llmCostUsd).toBe(0);
  });
});
