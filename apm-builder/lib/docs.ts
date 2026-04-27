import type { ComponentSource } from './types.ts';

/** Marker that opens the auto-generated component table region. */
export const COMPONENTS_BEGIN = '<!-- AUTO-GENERATED: COMPONENTS -->';
/** Marker that closes the auto-generated component table region. */
export const COMPONENTS_END = '<!-- /AUTO-GENERATED: COMPONENTS -->';

const TABLE_HEADER = [
  '| Name | Type | Version | Description | Targets |',
  '|------|------|---------|-------------|---------|',
];

const UNCATEGORIZED = 'Uncategorized';

function rowFor(c: ComponentSource): string {
  const targets = [...c.manifest.targets].sort().join(', ');
  return `| ${c.manifest.name} | ${c.manifest.type} | ${c.manifest.version} | ${c.manifest.description} | ${targets} |`;
}

/**
 * Render the components markdown table (header + rows), grouped by
 * `category.primary`. Components with no category appear under "Uncategorized"
 * (always rendered last). Within each group rows are sorted alphabetically by
 * name. Excludes the surrounding markers so that callers can splice the result
 * between `COMPONENTS_BEGIN` and `COMPONENTS_END`.
 */
export function renderComponentsTable(components: ComponentSource[]): string {
  const groups = new Map<string, ComponentSource[]>();
  for (const c of components) {
    const key = c.manifest.category?.primary ?? UNCATEGORIZED;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const categoryKeys = [...groups.keys()]
    .filter((k) => k !== UNCATEGORIZED)
    .sort();
  const orderedKeys = groups.has(UNCATEGORIZED)
    ? [...categoryKeys, UNCATEGORIZED]
    : categoryKeys;

  const sections: string[] = [];
  for (const key of orderedKeys) {
    const rows = (groups.get(key) ?? [])
      .slice()
      .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
      .map(rowFor);
    sections.push(`### ${key}`, '', ...TABLE_HEADER, ...rows);
    sections.push('');
  }

  // Trim a single trailing blank to avoid double newlines at the section end.
  if (sections[sections.length - 1] === '') sections.pop();
  return sections.join('\n');
}

/** Default README emitted when no existing README (or no markers) is found. */
function renderDefaultReadme(components: ComponentSource[]): string {
  return [
    '# agent-skills',
    '',
    'Multi-harness skills monorepo. Author once in canonical `SKILL.md` format; emit per-harness artifacts via `apm-builder`.',
    '',
    '## Components',
    '',
    COMPONENTS_BEGIN,
    renderComponentsTable(components),
    COMPONENTS_END,
    '',
  ].join('\n');
}

/**
 * Produce updated README content.
 *
 * - If `existingReadme` is null or missing the markers, returns a fresh default README.
 * - If both markers are present, replaces ONLY the content between them and preserves
 *   everything else (intro, outro, hand-written sections).
 *
 * Markers must appear on their own lines. The opening marker line and closing marker
 * line are themselves preserved so the region remains regenerable.
 */
export function updateReadme(
  existingReadme: string | null,
  components: ComponentSource[]
): string {
  if (existingReadme === null) return renderDefaultReadme(components);

  const beginIdx = existingReadme.indexOf(COMPONENTS_BEGIN);
  const endIdx = existingReadme.indexOf(COMPONENTS_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    return renderDefaultReadme(components);
  }

  const before = existingReadme.slice(0, beginIdx + COMPONENTS_BEGIN.length);
  const after = existingReadme.slice(endIdx);
  const table = renderComponentsTable(components);
  return `${before}\n${table}\n${after}`;
}

/**
 * @deprecated Prefer `updateReadme(existingReadme, components)` so hand-written
 * sections survive regeneration. Retained for backwards compatibility with the
 * original test that pinned the basic component-table render.
 */
export function renderReadme(components: ComponentSource[]): string {
  return renderDefaultReadme(components);
}
