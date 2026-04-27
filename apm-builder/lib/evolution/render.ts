import type { EvolutionReport, Finding, Severity } from './types.ts';

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export function renderReport(report: EvolutionReport): string {
  const sorted = [...report.findings].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  const window = `${report.windowStart.toISOString().slice(0, 10)} → ${report.windowEnd
    .toISOString()
    .slice(0, 10)}`;

  const lines: string[] = [
    `# Evolution Report — ${report.project}`,
    '',
    `**Window:** ${window} (${report.sessionsScanned} sessions)`,
    `Cost (USD): $${report.llmCostUsd.toFixed(2)}`,
    '',
    '## Summary',
    '',
    '| Pattern | Count | Severity | Top fix |',
    '|---------|-------|----------|---------|',
  ];

  // Group by patternType for the summary table.
  const byPattern = new Map<string, Finding[]>();
  for (const f of sorted) {
    const list = byPattern.get(f.patternType) ?? [];
    list.push(f);
    byPattern.set(f.patternType, list);
  }
  for (const [pattern, items] of byPattern.entries()) {
    const top = items[0]!;
    const fix = top.proposedDiff?.summary ?? '(surface-only)';
    lines.push(`| ${pattern} | ${items.length} | ${top.severity} | ${fix} |`);
  }
  lines.push('', '## Findings', '');

  for (const f of sorted) {
    lines.push(`## ${f.id}`);
    lines.push('');
    lines.push(`- **Pattern:** ${f.patternType}`);
    lines.push(`- **Severity:** ${f.severity} (count: ${f.count})`);
    lines.push('');
    lines.push('### Evidence');
    lines.push('');
    for (const ev of f.evidence) lines.push(ev);
    lines.push('');
    if (f.proposedDiff) {
      lines.push('### Proposed fix');
      lines.push('');
      lines.push(`**Target:** \`${f.proposedDiff.targetPath}\``);
      lines.push('');
      lines.push(f.proposedDiff.summary);
      lines.push('');
      lines.push('```diff');
      lines.push(f.proposedDiff.diff.trimEnd());
      lines.push('```');
      lines.push('');
    } else {
      lines.push('### Note');
      lines.push('');
      lines.push('Surface-only finding — no proposed diff. Consider manually.');
      lines.push('');
    }
  }
  return lines.join('\n');
}
