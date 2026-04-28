import { listAllPersonas, type DiscoveryDirs } from '../persona.ts';
import { listAllModes } from '../mode.ts';

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
