import { describe, it, expect } from 'vitest';
import { renderReport } from '../../lib/evolution/render.ts';
import type { EvolutionReport } from '../../lib/evolution/types.ts';

const sample: EvolutionReport = {
  project: 'agent-skills',
  windowStart: new Date('2026-04-20T00:00:00Z'),
  windowEnd: new Date('2026-04-27T00:00:00Z'),
  sessionsScanned: 12,
  llmCostUsd: 0.04,
  findings: [
    {
      id: 'F-001',
      patternType: 'permission-prompt-recurring',
      severity: 'high',
      count: 7,
      evidence: ['> sess-1 @ 2026-04-25T10:00:00Z: `npm test` (approve)'],
      proposedDiff: {
        targetPath: '.claude/settings.json',
        diff: '--- a/.claude/settings.json\n+++ b/.claude/settings.json\n@@ permissions.allow @@\n+    "npm test"\n',
        summary: 'Add `npm test` to permissions.allow[] (approved 7×)',
      },
    },
  ],
};

describe('renderReport', () => {
  it('renders header, summary table, and per-finding sections', () => {
    const out = renderReport(sample);
    expect(out).toContain('# Evolution Report — agent-skills');
    expect(out).toContain('| permission-prompt-recurring | 1 | high |');
    expect(out).toContain('## F-001');
    expect(out).toContain('```diff\n--- a/.claude/settings.json');
    expect(out).toContain('Cost (USD): $0.04');
  });

  it('orders findings high → low severity', () => {
    const multi: EvolutionReport = {
      ...sample,
      findings: [
        { ...sample.findings[0]!, id: 'F-002', severity: 'low' },
        { ...sample.findings[0]!, id: 'F-001', severity: 'high' },
      ],
    };
    const out = renderReport(multi);
    const f1Index = out.indexOf('## F-001');
    const f2Index = out.indexOf('## F-002');
    expect(f1Index).toBeLessThan(f2Index);
  });
});
