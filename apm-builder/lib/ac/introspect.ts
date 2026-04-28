import { execSync } from 'node:child_process';
import { listAllPersonas, findPersona, type DiscoveryDirs } from '../persona.ts';
import { listAllModes, findMode } from '../mode.ts';

export interface IntrospectDeps extends DiscoveryDirs {
  print: (line: string) => void;
}

export async function listCommand(
  what: 'personas' | 'modes',
  deps: IntrospectDeps,
): Promise<void> {
  if (what === 'personas') {
    const all = await listAllPersonas(deps);
    if (all.length === 0) {
      deps.print('(no personas found)');
      return;
    }
    for (const p of all) {
      deps.print(`${p.manifest.name.padEnd(20)} v${p.manifest.version.padEnd(8)} [${p.source}]  ${p.manifest.description}`);
    }
  } else {
    const all = await listAllModes(deps);
    if (all.length === 0) {
      deps.print('(no modes found)');
      return;
    }
    for (const m of all) {
      deps.print(`${m.manifest.name.padEnd(20)} v${m.manifest.version.padEnd(8)} [${m.source}]  ${m.manifest.description}`);
    }
  }
}

export interface ShowOptions {
  kind: 'persona' | 'mode' | 'effective';
  name?: string;
  persona?: string;
  mode?: string;
}

export async function showCommand(
  opts: ShowOptions,
  deps: IntrospectDeps,
): Promise<void> {
  if (opts.kind === 'persona') {
    if (!opts.name) throw new Error('ac show persona <name>: name required');
    const f = await findPersona(opts.name, deps);
    deps.print(`name: ${f.manifest.name}`);
    deps.print(`version: ${f.manifest.version}`);
    deps.print(`source: ${f.source} (${f.filepath})`);
    deps.print(`description: ${f.manifest.description}`);
    deps.print(`targets: ${f.manifest.targets.join(', ')}`);
    deps.print(`categories: ${f.manifest.categories.join(', ')}`);
    deps.print(`skill_include: ${(f.manifest.skill_include ?? []).join(', ')}`);
    deps.print(`skill_exclude: ${(f.manifest.skill_exclude ?? []).join(', ')}`);
    if (f.body.trim()) {
      deps.print('');
      deps.print('--- body ---');
      deps.print(f.body.trim());
    }
    return;
  }
  if (opts.kind === 'mode') {
    if (!opts.name) throw new Error('ac show mode <name>: name required');
    const f = await findMode(opts.name, deps);
    deps.print(`name: ${f.manifest.name}`);
    deps.print(`version: ${f.manifest.version}`);
    deps.print(`source: ${f.source} (${f.filepath})`);
    deps.print(`description: ${f.manifest.description}`);
    deps.print(`targets: ${f.manifest.targets.join(', ')}`);
    deps.print(`categories: ${f.manifest.categories.join(', ')}`);
    deps.print(`skill_include: ${(f.manifest.skill_include ?? []).join(', ')}`);
    deps.print(`skill_exclude: ${(f.manifest.skill_exclude ?? []).join(', ')}`);
    deps.print('');
    deps.print('--- mode prompt body (injected as additional context when active) ---');
    deps.print(f.body.trim());
    return;
  }
  // 'effective' is wired in the run.ts flow path; printed here.
  throw new Error('ac show effective: not yet implemented');
}

export interface DoctorDeps {
  /** List of harnesses to check */
  harnesses: string[];
  print: (line: string) => void;
}

const HARNESS_BINS: Record<string, string> = {
  'claude-code': 'claude',
  apm: 'apm',
  codex: 'codex',
  gemini: 'gemini',
  copilot: 'copilot',
  pi: 'pi',
};

export async function doctorCommand(deps: DoctorDeps): Promise<number> {
  let problems = 0;
  for (const target of deps.harnesses) {
    const bin = HARNESS_BINS[target];
    if (!bin) continue;
    try {
      execSync(`which ${bin}`, { stdio: 'ignore' });
      deps.print(`[ok]  ${target}: ${bin} found on PATH`);
    } catch {
      deps.print(`[!!]  ${target}: ${bin} not on PATH`);
      problems += 1;
    }
  }
  if (problems > 0) {
    deps.print('');
    deps.print(`${problems} harness binary(ies) missing from PATH.`);
  }
  return problems === 0 ? 0 : 1;
}
