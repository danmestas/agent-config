// apm-builder/lib/evolution/memory.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Finding } from './types.ts';

const PATH_REGEX = /`([a-zA-Z0-9_\-./]+\.(?:ts|js|md|json|yml|yaml|sh|go|py))`/g;

export async function detectStaleMemoryRefs(
  memoryDir: string,
  repoRoot: string,
): Promise<Finding[]> {
  const exists = await fs.stat(memoryDir).then(() => true).catch(() => false);
  if (!exists) return [];

  const entries = await fs.readdir(memoryDir, { withFileTypes: true });
  const findings: Finding[] = [];
  let idx = 1;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const filePath = path.join(memoryDir, entry.name);
    const content = await fs.readFile(filePath, 'utf8');
    const matches = [...content.matchAll(PATH_REGEX)];
    for (const m of matches) {
      const ref = m[1]!;
      const absoluteCandidate = path.isAbsolute(ref) ? ref : path.join(repoRoot, ref);
      const refExists = await fs.stat(absoluteCandidate).then(() => true).catch(() => false);
      if (refExists) continue;
      findings.push({
        id: `F-MEM-${String(idx).padStart(3, '0')}`,
        patternType: 'memory-stale-ref',
        severity: 'low',
        count: 1,
        evidence: [`> ${entry.name}: dead reference \`${ref}\``],
        proposedDiff: {
          targetPath: filePath,
          diff: buildDeleteRefDiff(filePath, ref),
          summary: `Remove dead reference \`${ref}\` from ${entry.name}`,
        },
      });
      idx += 1;
    }
  }
  return findings;
}

function buildDeleteRefDiff(targetPath: string, ref: string): string {
  return [
    `--- a/${targetPath}`,
    `+++ b/${targetPath}`,
    `@@ stale-ref @@`,
    `-Reference to \`${ref}\` (file does not exist)`,
    '',
  ].join('\n');
}
