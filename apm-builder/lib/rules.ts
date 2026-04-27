import type { ComponentSource, Target } from './types.ts';

/**
 * Topologically sort rule components using before/after frontmatter, with
 * alphabetical tiebreak. Pure function — same input always yields same output.
 */
export function topoSortRules(rules: ComponentSource[]): ComponentSource[] {
  // Edge x → y means "x must appear before y".
  const byName = new Map(rules.map((r) => [r.manifest.name, r]));
  const edges = new Map<string, Set<string>>();
  for (const r of rules) edges.set(r.manifest.name, new Set());
  for (const r of rules) {
    for (const before of r.manifest.before ?? []) {
      if (byName.has(before)) edges.get(r.manifest.name)?.add(before);
    }
    for (const after of r.manifest.after ?? []) {
      if (byName.has(after)) edges.get(after)?.add(r.manifest.name);
    }
  }
  const inDegree = new Map<string, number>(rules.map((r) => [r.manifest.name, 0]));
  for (const targets of edges.values()) {
    for (const t of targets) inDegree.set(t, (inDegree.get(t) ?? 0) + 1);
  }
  const queue = rules
    .map((r) => r.manifest.name)
    .filter((n) => inDegree.get(n) === 0)
    .sort();
  const result: ComponentSource[] = [];
  while (queue.length > 0) {
    queue.sort();
    const next = queue.shift()!;
    const r = byName.get(next);
    if (r) result.push(r);
    for (const dep of edges.get(next) ?? []) {
      inDegree.set(dep, (inDegree.get(dep) ?? 0) - 1);
      if (inDegree.get(dep) === 0) queue.push(dep);
    }
  }
  return result;
}

/**
 * Filter ctx.allComponents down to rules of a given target/scope, sorted.
 */
export function selectRules(
  all: ComponentSource[],
  target: Target,
  scope: 'project' | 'user',
): ComponentSource[] {
  const filtered = all
    .filter((c) => c.manifest.type === 'rules' && c.manifest.targets.includes(target))
    .filter((c) => (c.manifest.scope ?? 'project') === scope);
  return topoSortRules(filtered);
}

/**
 * Compose a rules body — `## <name>` headers separating each rule's body.
 * Output ends with a single trailing newline.
 */
export function composeRulesBody(rules: ComponentSource[]): string {
  const sections = rules.map((r) => `## ${r.manifest.name}\n\n${r.body.trim()}\n`);
  return sections.join('\n');
}

/**
 * Returns true if the given rule is the alphabetically-first rule of its
 * scope+target tuple. Adapters use this to make rule emission idempotent —
 * only one rule "owns" the file, others contribute via composition.
 */
export function isOwnerOfRulesFile(
  component: ComponentSource,
  all: ComponentSource[],
  target: Target,
): boolean {
  const scope = component.manifest.scope ?? 'project';
  const sorted = selectRules(all, target, scope);
  return sorted[0]?.manifest.name === component.manifest.name;
}
