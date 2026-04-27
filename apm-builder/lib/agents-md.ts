import type { ComponentSource, Target } from './types.ts';
import { selectRules } from './rules.ts';

export type AgentsMdSection = 'rules' | 'agents' | 'skills';
export const DEFAULT_SECTION_ORDER: AgentsMdSection[] = ['rules', 'agents', 'skills'];

export interface ComposeOptions {
  /** Which harness target are we composing for (filter applied to components.targets). */
  target: Target;
  /** All discovered components. The composer filters internally. */
  components: ComponentSource[];
  /** Section order — typically read from apm-builder.config.yaml. */
  sectionOrder: AgentsMdSection[];
}

/**
 * Compose multiple content-bearing components (skill + agent + rules) into a
 * single AGENTS.md string. Used by both the Codex and Pi adapters.
 *
 * Layout:
 *   # <Section>            (one H1 per non-empty section)
 *
 *   ## <component-name>    (one H2 per component)
 *
 *   <body>
 *
 * Empty sections are omitted. Rules use topo-sort; agents and skills use
 * alphabetical-by-name. Components not targeting the given harness are filtered out.
 */
export function composeAgentsMd(opts: ComposeOptions): string {
  const { target, components, sectionOrder } = opts;
  const sections = new Map<AgentsMdSection, ComponentSource[]>();

  // Rules: filtered + topo-sorted per the shared helper.
  const rules = selectRules(components, target, 'project');
  sections.set('rules', rules);

  // Agents and skills: alphabetical by name, filtered to ones targeting this harness.
  const agents = components
    .filter((c) => c.manifest.type === 'agent' && c.manifest.targets.includes(target))
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  sections.set('agents', agents);

  const skills = components
    .filter((c) => c.manifest.type === 'skill' && c.manifest.targets.includes(target))
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  sections.set('skills', skills);

  const blocks: string[] = [];
  for (const section of sectionOrder) {
    const items = sections.get(section) ?? [];
    if (items.length === 0) continue;
    const header = `# ${capitalize(section)}`;
    const subsections = items.map(
      (c) => `## ${c.manifest.name}\n\n${c.body.trim()}`,
    );
    blocks.push([header, '', subsections.join('\n\n')].join('\n'));
  }
  return blocks.join('\n\n').trimEnd() + '\n';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
