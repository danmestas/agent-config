import path from 'node:path';
import type { ComponentSource } from '../types.ts';

export interface MarketplaceContext {
  /** Git host + repo, e.g. "github.com/danmestas/agent-skills". */
  gitRepo: string;
}

/**
 * Render a `claude-plugins-official` listing entry for a plugin component.
 * The entry shape (name, version, description, publisher, homepage, release,
 * categories, includes) reflects the field set we expect of the official
 * schema; if marketplace requires more fields later, this is the single point
 * of change.
 */
export function renderMarketplaceEntry(
  component: ComponentSource,
  ctx: MarketplaceContext,
): string {
  if (component.manifest.type !== 'plugin') {
    throw new Error(
      `renderMarketplaceEntry expects a plugin component, got ${component.manifest.type}`,
    );
  }
  const includes = (component.manifest.includes ?? []).map((p) => path.basename(p));
  const entry = {
    name: component.manifest.name,
    version: component.manifest.version,
    description: component.manifest.description,
    publisher: 'danmestas',
    homepage: `https://${ctx.gitRepo}/tree/main/plugins/${component.manifest.name}`,
    release: `https://${ctx.gitRepo}/releases/tag/${component.manifest.name}@v${component.manifest.version}`,
    categories: component.manifest.tags ?? [],
    includes,
  };
  return `${JSON.stringify(entry, null, 2)}\n`;
}

/** Path under repo root for a per-plugin marketplace listing. */
export function marketplaceFilePath(skill: string): string {
  return `marketplace/plugins/${skill}.json`;
}
