import type { ComponentSource } from './types.ts';

export function renderReadme(components: ComponentSource[]): string {
  const sorted = [...components].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  const rows = sorted.map((c) => {
    const targets = [...c.manifest.targets].sort().join(', ');
    return `| ${c.manifest.name} | ${c.manifest.type} | ${c.manifest.version} | ${c.manifest.description} | ${targets} |`;
  });
  return [
    '# agent-skills',
    '',
    'Multi-harness skills monorepo. See `docs/superpowers/specs/` for design docs (local-only).',
    '',
    '## Components',
    '',
    '| Name | Type | Version | Description | Targets |',
    '|------|------|---------|-------------|---------|',
    ...rows,
    '',
  ].join('\n');
}
