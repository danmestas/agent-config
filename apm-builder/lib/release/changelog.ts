import fs from 'node:fs/promises';

export interface ChangelogEntry {
  skill: string;
  version: string;
  date: Date;
  summary: string;
}

const HEADER =
  '# Changelog\n\nAll notable releases of components in this monorepo. Per-component semver.\n';

/**
 * Append a single release entry to the top-level CHANGELOG.md, grouped under
 * the entry's ISO date. If a section for that date already exists, the new line
 * is inserted directly under it (no duplicate heading). Missing files are
 * created with the standard header.
 */
export async function appendChangelogEntry(
  filePath: string,
  entry: ChangelogEntry,
): Promise<void> {
  const dateKey = entry.date.toISOString().slice(0, 10);
  const line = `- ${entry.skill}@v${entry.version} — ${entry.summary}`;
  const existing = await readOrInit(filePath);
  const updated = insertUnderDate(existing, dateKey, line);
  await fs.writeFile(filePath, updated, 'utf8');
}

async function readOrInit(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return `${HEADER}\n`;
  }
}

function insertUnderDate(content: string, dateKey: string, line: string): string {
  const heading = `## ${dateKey}`;
  const lines = content.split('\n');
  const headingIdx = lines.findIndex((l) => l === heading);
  if (headingIdx >= 0) {
    // Insert directly after the blank line(s) that follow the heading.
    let insertAt = headingIdx + 1;
    while (insertAt < lines.length && lines[insertAt] === '') insertAt += 1;
    lines.splice(insertAt, 0, line);
    return lines.join('\n');
  }
  // No section for this date yet — insert a new section above the first existing
  // date heading, or at the end of the header block if no date headings exist.
  const firstDateIdx = lines.findIndex((l) => /^## \d{4}-\d{2}-\d{2}$/.test(l));
  const insertAt = firstDateIdx >= 0 ? firstDateIdx : lines.length;
  const newSection = ['', heading, '', line, ''];
  lines.splice(insertAt, 0, ...newSection);
  // Collapse accidental triple-blank-line runs that the splice may produce.
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
