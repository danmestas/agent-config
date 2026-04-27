import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { defineCommand, runMain } from 'citty';
import pc from 'picocolors';
import chokidar from 'chokidar';
import { discoverComponents } from './lib/discover.ts';
import { validateComponents } from './lib/validate.ts';
import { runBuild } from './lib/build.ts';
import { matchesGlob } from './lib/glob.ts';
import { updateReadme } from './lib/docs.ts';
import { TARGETS, type Target } from './lib/types.ts';
import { listImplementedTargets } from './adapters/index.ts';
import { runEvolution } from './lib/evolution/orchestrator.ts';
import { renderReport } from './lib/evolution/render.ts';

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
  meta: { name: 'docs', description: 'Regenerate the components table in README.md (preserves hand-written sections)' },
  async run() {
    const repoRoot = process.cwd();
    const readmePath = path.join(repoRoot, 'README.md');
    const components = await discoverComponents(repoRoot);
    const existing = await fs.readFile(readmePath, 'utf8').catch(() => null);
    const md = updateReadme(existing, components);
    await fs.writeFile(readmePath, md);
    console.log(pc.green(`wrote README.md (${components.length} components).`));
  },
});

const initCmd = defineCommand({
  meta: { name: 'init', description: 'Scaffold a new component' },
  args: {
    name: { type: 'positional', required: true, description: 'Component name (kebab-case)' },
    type: { type: 'string', default: 'skill', description: 'skill | plugin | hook | agent | rules | mcp' },
    category: {
      type: 'string',
      default: 'tooling',
      description: 'Primary category: economy | workflow | backpressure | tooling | integrations | context-management | memory-management | evolution',
    },
  },
  async run({ args }) {
    const validTypes = ['skill', 'plugin', 'hook', 'agent', 'rules', 'mcp'];
    const validCategories = [
      'economy', 'workflow', 'backpressure', 'tooling', 'integrations',
      'context-management', 'memory-management', 'evolution',
    ];
    if (!validTypes.includes(args.type)) {
      console.log(pc.red(`unknown type: ${args.type}. Valid: ${validTypes.join(', ')}`));
      process.exit(1);
    }
    if (!validCategories.includes(args.category)) {
      console.log(pc.red(`unknown category: ${args.category}. Valid: ${validCategories.join(', ')}`));
      process.exit(1);
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(args.name)) {
      console.log(pc.red(`name must be kebab-case lowercase: ${args.name}`));
      process.exit(1);
    }
    const topDir = args.type === 'rules' ? 'rules' : args.type === 'plugin' ? 'plugins' : 'skills';
    const dir = path.join(process.cwd(), topDir, args.name);
    await fs.mkdir(dir, { recursive: true });
    const skillPath = path.join(dir, 'SKILL.md');
    const exists = await fs.stat(skillPath).then(() => true).catch(() => false);
    if (exists) {
      console.log(pc.red(`already exists: ${skillPath}`));
      process.exit(1);
    }
    const body = `---
name: ${args.name}
version: 0.1.0
description: Use when [describe triggering conditions in one sentence]
type: ${args.type}
targets:
  - claude-code
category:
  primary: ${args.category}
---

# ${args.name}

Describe what this ${args.type} does and how to use it.
`;
    await fs.writeFile(skillPath, body);
    console.log(pc.green(`created ${path.relative(process.cwd(), skillPath)}`));
    console.log(pc.cyan(`  category: ${args.category} (override with --category=<name>)`));
  },
});

const evolveCmd = defineCommand({
  meta: { name: 'evolve', description: 'Detect friction patterns in session history; emit a markdown report with proposed diffs' },
  args: {
    since: { type: 'string', default: '7d', description: 'Time window (e.g. 7d, 14d, 30d)' },
    project: { type: 'string', default: 'agent-skills', description: 'Project name (matches ~/.claude/projects/<name>)' },
    'no-llm': { type: 'boolean', default: false, description: 'Disable Haiku calls; deterministic-only' },
    'include-arcs': { type: 'boolean', default: false, description: 'Include arc-driven proposals (slower)' },
    'dry-run': { type: 'boolean', default: false, description: 'Detect but skip writing the report file' },
    json: { type: 'boolean', default: false, description: 'Print JSON instead of writing markdown' },
  },
  async run({ args }) {
    const sinceMs = parseDuration(args.since);
    const report = await runEvolution({
      repoRoot: process.cwd(),
      project: args.project,
      sinceMs,
      noLlm: args['no-llm'],
      includeArcs: args['include-arcs'],
      dryRun: args['dry-run'],
      json: args.json,
    });
    if (args.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    const md = renderReport(report);
    if (args['dry-run']) {
      console.log(md);
      return;
    }
    const reportDir = path.join(os.homedir(), '.claude', 'evolution-reports', args.project);
    await fs.mkdir(reportDir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const reportPath = path.join(reportDir, `${date}.md`);
    await fs.writeFile(reportPath, md);
    console.log(pc.green(`evolution report written: ${reportPath}`));
    console.log(pc.cyan(`${report.findings.length} finding(s); cost: $${report.llmCostUsd.toFixed(2)}`));
  },
});

const main = defineCommand({
  meta: { name: 'apm-builder', description: 'Multi-harness skills build tool' },
  subCommands: { validate: validateCmd, build: buildCmd, watch: watchCmd, docs: docsCmd, init: initCmd, evolve: evolveCmd },
});

runMain(main);

function parseDuration(s: string): number {
  const m = /^(\d+)([dhm])$/.exec(s);
  if (!m) throw new Error(`invalid duration: ${s}`);
  const n = Number(m[1]!);
  const unit = m[2]!;
  if (unit === 'd') return n * 86_400_000;
  if (unit === 'h') return n * 3_600_000;
  if (unit === 'm') return n * 60_000;
  throw new Error(`unknown unit: ${unit}`);
}
