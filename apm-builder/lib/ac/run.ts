import { runAcSession, type AcSessionDeps } from './session.ts';

export interface ParsedAcArgs {
  harness: string;
  persona?: string;
  mode?: string;
  noFilter: boolean;
  verbose: boolean;
  harnessArgs: string[];
}

/** Backwards-compatible alias for callers that import `RunDeps`. */
export type RunDeps = AcSessionDeps;

export function parseAcArgs(argv: string[]): ParsedAcArgs {
  if (argv.length === 0 || argv[0]!.startsWith('--')) {
    throw new Error('ac: missing harness name. Usage: ac <harness> [flags] -- <harness args>');
  }
  const out: ParsedAcArgs = {
    harness: argv[0]!,
    noFilter: false,
    verbose: false,
    harnessArgs: [],
  };
  let i = 1;
  while (i < argv.length) {
    const tok = argv[i]!;
    if (tok === '--') {
      out.harnessArgs = argv.slice(i + 1);
      return out;
    }
    if (tok === '--persona') {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) {
        throw new Error('ac: --persona requires a value');
      }
      out.persona = v;
      i += 2;
      continue;
    }
    if (tok === '--mode') {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) {
        throw new Error('ac: --mode requires a value');
      }
      out.mode = v;
      i += 2;
      continue;
    }
    if (tok === '--no-filter') {
      out.noFilter = true;
      i += 1;
      continue;
    }
    if (tok === '--verbose') {
      out.verbose = true;
      i += 1;
      continue;
    }
    throw new Error(`ac: unrecognized flag "${tok}". (ac flags must come before "--")`);
  }
  return out;
}

/**
 * CLI entry point: parse argv and hand off to the AC session orchestrator.
 * Kept as a separate export so existing tests and the `ac` shebang script
 * keep working unchanged.
 */
export async function runAc(argv: string[], deps: RunDeps = {}): Promise<number> {
  const args = parseAcArgs(argv);
  return runAcSession(args, deps);
}
