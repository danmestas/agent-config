import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { findPersona } from '../persona.ts';
import { findMode } from '../mode.ts';
import { resolve, writeResolutionArtifact } from '../resolution.ts';
import { discoverComponents } from '../discover.ts';
import type { Target } from '../types.ts';
import { prelaunchComposeClaudeCode, prelaunchComposeCodex, prelaunchComposeCopilot } from './prelaunch.ts';

export interface ParsedAcArgs {
  harness: string;
  persona?: string;
  mode?: string;
  noFilter: boolean;
  verbose: boolean;
  harnessArgs: string[];
}

const HARNESS_ALIASES: Record<string, Target> = {
  claude: 'claude-code',
  'claude-code': 'claude-code',
  apm: 'apm',
  codex: 'codex',
  gemini: 'gemini',
  copilot: 'copilot',
  pi: 'pi',
};

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

export interface RunDeps {
  /** Override discovery roots (test injection). */
  projectDir?: string;
  userDir?: string;
  builtinDir?: string;
  /** Override real HOME dir used as source for prelaunch composition (test injection). */
  homeDir?: string;
  /** Override harness binary lookup (test injection). */
  resolveHarnessBin?: (harness: string) => string;
  /** Catalog provider (test injection). */
  loadCatalog?: () => Promise<any[]>;
  /** Hook called instead of execvp; used in tests to avoid replacing the process. */
  exec?: (bin: string, args: string[], env: NodeJS.ProcessEnv) => never | Promise<number>;
}

function defaultResolveHarnessBin(harness: string): string {
  const target = HARNESS_ALIASES[harness];
  if (!target) throw new Error(`ac: unknown harness "${harness}"`);
  // The actual on-PATH binary differs from the target name in some cases.
  const binNames: Record<Target, string> = {
    'claude-code': 'claude',
    apm: 'apm',
    codex: 'codex',
    gemini: 'gemini',
    copilot: 'copilot',
    pi: 'pi',
  };
  return binNames[target];
}

export async function runAc(argv: string[], deps: RunDeps = {}): Promise<number> {
  const args = parseAcArgs(argv);
  const target = HARNESS_ALIASES[args.harness];
  if (!target) {
    throw new Error(`ac: unknown harness "${args.harness}". Recognized: ${Object.keys(HARNESS_ALIASES).join(', ')}`);
  }

  const projectDir = deps.projectDir ?? process.cwd();
  const userDir = deps.userDir ?? path.join(os.homedir(), '.config', 'agent-config');
  // run.ts lives at <repo>/apm-builder/lib/ac/run.ts — walk up 3 dirs to the repo
  // root where personas/ and modes/ live.
  const builtinDir =
    deps.builtinDir ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const dirs = { projectDir, userDir, builtinDir };

  const env: NodeJS.ProcessEnv = { ...process.env, AC_WRAPPED: '1', AC_HARNESS: target };

  if (!args.noFilter && (args.persona || args.mode)) {
    const persona = args.persona ? (await findPersona(args.persona, dirs)).manifest : undefined;
    const found = args.mode ? await findMode(args.mode, dirs) : undefined;
    const mode = found?.manifest;
    const modeBody = found?.body;

    const catalog = await (deps.loadCatalog ?? (async () => discoverComponents(builtinDir)))();
    const resolution = resolve({ catalog, persona, mode, modeBody, harness: target });
    const artifactPath = await writeResolutionArtifact(resolution);
    env.AC_RESOLUTION_PATH = artifactPath;
  }

  let cwd = process.cwd();
  let cleanup: (() => Promise<void>) | undefined;

  // Claude Code: HOME-override pre-launch — physically filter ~/.claude/skills/
  // before claude reads it. Path C achieves real token reduction.
  if (!args.noFilter && target === 'claude-code' && (args.persona || args.mode)) {
    const personaManifest = args.persona
      ? (await findPersona(args.persona, dirs)).manifest
      : undefined;
    const found = args.mode ? await findMode(args.mode, dirs) : undefined;
    const result = await prelaunchComposeClaudeCode({
      realHome: deps.homeDir ?? os.homedir(),
      persona: personaManifest,
      mode: found?.manifest,
      modeBody: found?.body,
    });
    env.HOME = result.tempHome;
    cleanup = result.cleanup;
  } else if (target === 'codex' && env.AC_RESOLUTION_PATH) {
    const r = await prelaunchComposeCodex({ resolutionPath: env.AC_RESOLUTION_PATH, originalCwd: cwd });
    cwd = r.tempdir;
    env.AC_ORIGINAL_CWD = process.cwd();
    cleanup = r.cleanup;
  } else if (target === 'copilot' && env.AC_RESOLUTION_PATH) {
    const r = await prelaunchComposeCopilot({ resolutionPath: env.AC_RESOLUTION_PATH, originalCwd: cwd });
    cwd = r.tempdir;
    env.AC_ORIGINAL_CWD = process.cwd();
    cleanup = r.cleanup;
  }

  const bin = (deps.resolveHarnessBin ?? defaultResolveHarnessBin)(args.harness);
  if (deps.exec) {
    return deps.exec(bin, args.harnessArgs, env);
  }
  // Real execution: spawn and inherit stdio. We cannot use execvp from Node
  // directly without an extra dep; spawning + forwarding signals + exiting
  // on close achieves the same outcome from the user's perspective.
  return new Promise<number>((resolveCb, reject) => {
    const child = spawn(bin, args.harnessArgs, { stdio: 'inherit', env, cwd });
    child.on('error', reject);
    child.on('close', async (code) => {
      if (cleanup) await cleanup();
      resolveCb(code ?? 0);
    });
  });
}
