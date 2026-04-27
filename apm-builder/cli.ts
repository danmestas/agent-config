import fs from 'node:fs/promises';
import { defineCommand, runMain } from 'citty';
import pc from 'picocolors';
import chokidar from 'chokidar';
import { discoverComponents } from './lib/discover.ts';
import { validateComponents } from './lib/validate.ts';
import { runBuild, matchesGlob } from './lib/build.ts';
import { renderReadme } from './lib/docs.ts';
import { TARGETS, type Target } from './lib/types.ts';
import { listImplementedTargets } from './adapters/index.ts';

const validateCmd = defineCommand({
  meta: { name: 'validate', description: 'Validate all components' },
  args: {
    filter: { type: 'string', description: 'Glob filter on component names', required: false },
  },
  async run({ args }) {
    const repoRoot = process.cwd();
    const all = await discoverComponents(repoRoot);
    const components = args.filter ? all.filter((c) => matchesGlob(c.manifest.name, args.filter!)) : all;
    const errors = validateComponents(components);
    for (const e of errors) {
      const prefix = e.severity === 'error' ? pc.red('error') : pc.yellow('warn');
      console.log(`${prefix} [${e.componentName}] ${e.message}`);
    }
    const fatal = errors.filter((e) => e.severity === 'error');
    if (fatal.length > 0) {
      console.log(pc.red(`\n${fatal.length} validation error(s).`));
      process.exit(1);
    }
    console.log(pc.green(`OK (${components.length} components, ${errors.length} warnings).`));
  },
});

const buildCmd = defineCommand({
  meta: { name: 'build', description: 'Build per-target artifacts to dist/' },
  args: {
    target: { type: 'string', description: 'Target name (or "all")', default: 'all' },
    filter: { type: 'string', description: 'Glob filter on component names', required: false },
    'dry-run': { type: 'boolean', default: false },
    out: { type: 'string', default: 'dist' },
  },
  async run({ args }) {
    const repoRoot = process.cwd();
    let targets: Target[];
    if (args.target === 'all') targets = listImplementedTargets();
    else if ((TARGETS as readonly string[]).includes(args.target)) targets = [args.target as Target];
    else {
      console.log(pc.red(`unknown target: ${args.target}`));
      process.exit(1);
    }
    const result = await runBuild({
      repoRoot,
      targets,
      outDir: args.out,
      filter: args.filter,
      dryRun: args['dry-run'],
    });
    for (const e of result.errors) {
      const prefix = e.severity === 'error' ? pc.red('error') : pc.yellow('warn');
      console.log(`${prefix} [${e.componentName}] ${e.message}`);
    }
    if (result.errors.some((e) => e.severity === 'error')) process.exit(1);
    console.log(pc.green(`built ${result.written.length} file(s) across ${targets.length} target(s).`));
  },
});

const watchCmd = defineCommand({
  meta: { name: 'watch', description: 'Rebuild on change' },
  args: {
    target: { type: 'string', default: 'claude-code' },
    out: { type: 'string', default: 'dist' },
  },
  async run({ args }) {
    const repoRoot = process.cwd();
    const target = args.target as Target;
    const watcher = chokidar.watch(['skills/**/SKILL.md', 'plugins/**/SKILL.md', 'rules/**/SKILL.md', 'apm-builder.config.yaml'], {
      cwd: repoRoot,
      ignoreInitial: true,
    });
    let inProgress = false;
    let queued = false;
    async function rebuild() {
      if (inProgress) {
        queued = true;
        return;
      }
      inProgress = true;
      try {
        const result = await runBuild({ repoRoot, targets: [target], outDir: args.out });
        const ts = new Date().toISOString();
        if (result.errors.some((e) => e.severity === 'error')) {
          console.log(pc.red(`[${ts}] build failed (${result.errors.length} issues)`));
        } else {
          console.log(pc.green(`[${ts}] built ${result.written.length} file(s)`));
        }
      } finally {
        inProgress = false;
        if (queued) {
          queued = false;
          await rebuild();
        }
      }
    }
    const initial = await runBuild({ repoRoot, targets: [target], outDir: args.out });
    const initTs = new Date().toISOString();
    if (initial.errors.some((e) => e.severity === 'error')) {
      console.log(pc.red(`[${initTs}] initial build failed (${initial.errors.length} issues)`));
    } else {
      console.log(pc.green(`[${initTs}] initial build: ${initial.written.length} file(s) emitted`));
    }
    watcher.on('all', () => void rebuild());
    console.log(pc.cyan(`watching for changes; building target=${target}`));
  },
});

const docsCmd = defineCommand({
  meta: { name: 'docs', description: 'Regenerate top-level README.md' },
  async run() {
    const repoRoot = process.cwd();
    const components = await discoverComponents(repoRoot);
    const md = renderReadme(components);
    await fs.writeFile(`${repoRoot}/README.md`, md);
    console.log(pc.green(`wrote README.md (${components.length} components).`));
  },
});

const main = defineCommand({
  meta: { name: 'apm-builder', description: 'Multi-harness skills build tool' },
  subCommands: { validate: validateCmd, build: buildCmd, watch: watchCmd, docs: docsCmd },
});

runMain(main);
