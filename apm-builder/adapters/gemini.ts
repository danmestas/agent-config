import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  Adapter,
  ComponentSource,
  EmittedFile,
  AdapterContext,
} from '../lib/types.ts';
import {
  selectRules,
  composeRulesBody,
  isOwnerOfRulesFile,
} from '../lib/rules.ts';

const GEMINI_EVENTS = new Set([
  'SessionStart',
  'BeforeAgent',
  'BeforeToolSelection',
  'BeforeTool',
  'AfterModel',
  'AfterAgent',
]);

function validateGeminiHookEvent(event: string, componentName: string): void {
  if (!GEMINI_EVENTS.has(event)) {
    throw new Error(
      `gemini adapter: hook event "${event}" on component "${componentName}" is not a Gemini event. ` +
        `Valid events: ${[...GEMINI_EVENTS].join(', ')}. ` +
        `(Note: Gemini does NOT use Claude Code's PreToolUse/PostToolUse — they are not aliases.)`,
    );
  }
}

export const geminiAdapter: Adapter = {
  target: 'gemini',

  supports(component) {
    return component.manifest.targets.includes('gemini');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill':
        return emitSkill(component);
      case 'rules':
        return emitRules(component, ctx);
      case 'hook':
        return emitHook(component);
      case 'mcp':
        return emitMcp(component);
      case 'persona':
      case 'mode':
        // Personas and modes are harness-agnostic, consumed by `ac` at resolution
        // time. Not emitted per-target. See spec §5.2.
        return [];
      // agent and plugin are schema-rejected by validate.ts (compatibility matrix).
      default:
        throw new Error(
          `gemini adapter: type "${component.manifest.type}" is not supported on Gemini`,
        );
    }
  },
};

function emitSkill(component: ComponentSource): EmittedFile[] {
  const { manifest, body } = component;

  // Metadata: loaded at session start, used by Gemini's skill index.
  const metadata = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    ...(manifest.tags ? { tags: manifest.tags } : {}),
    body_path: 'skill.md',
  };

  // Skill body: loaded only when Gemini calls activate_skill.
  const bodyFrontmatter = [
    '---',
    `name: ${manifest.name}`,
    `description: ${manifest.description}`,
    '---',
  ].join('\n');

  return [
    {
      path: `skills/${manifest.name}/metadata.json`,
      content: `${JSON.stringify(metadata, null, 2)}\n`,
    },
    {
      path: `skills/${manifest.name}/skill.md`,
      content: `${bodyFrontmatter}\n\n${body.trimStart()}`,
    },
  ];
}

function emitRules(component: ComponentSource, ctx: AdapterContext): EmittedFile[] {
  if (!isOwnerOfRulesFile(component, ctx.allComponents, 'gemini')) return [];
  const scope = component.manifest.scope ?? 'project';
  const sorted = selectRules(ctx.allComponents, 'gemini', scope);
  const content = composeRulesBody(sorted);
  // Project scope: GEMINI.md at repo root. User scope: ~/.gemini/GEMINI.md
  // (path here is relative to dist/gemini/; the user-scope path is the
  // installer's responsibility to relocate).
  const filename = scope === 'user' ? '.gemini/GEMINI.md' : 'GEMINI.md';
  return [{ path: filename, content }];
}

async function emitHook(component: ComponentSource): Promise<EmittedFile[]> {
  const { manifest, dir } = component;
  if (!manifest.hooks) return [];

  const fragment: {
    _comment: string;
    hooks: Record<string, Array<{ matcher: string; command: string }>>;
  } = {
    _comment:
      'Gemini hook contract: scripts referenced below MUST emit valid JSON on ' +
      'stdout. Use stderr for any logging. See https://geminicli.com/docs/hooks/',
    hooks: {},
  };
  const files: EmittedFile[] = [];

  for (const [event, def] of Object.entries(manifest.hooks)) {
    validateGeminiHookEvent(event, manifest.name);
    fragment.hooks[event] ??= [];
    fragment.hooks[event]!.push({
      matcher: def.matcher ?? '*',
      command: `\${GEMINI_PROJECT_DIR}/${def.command}`,
    });

    // Bundle the referenced script if it lives inside the component dir.
    const scriptPath = path.join(dir, def.command);
    const scriptExists = await fs.stat(scriptPath).then(() => true).catch(() => false);
    if (scriptExists) {
      const content = await fs.readFile(scriptPath);
      // Heuristic: smell-test for the JSON-on-stdout contract — script must
      // begin with a shebang AND contain "json" (case-insensitive) somewhere
      // in the first 1KB. The adapter cannot fully verify the contract
      // without executing the script.
      const head = content.subarray(0, 1024).toString('utf8');
      const looksOk = head.startsWith('#!') && /json/i.test(head);
      if (!looksOk) {
        throw new Error(
          `gemini adapter: hook script "${def.command}" on component "${manifest.name}" ` +
            `does not appear to honor Gemini's JSON-on-stdout contract ` +
            `(no shebang or no mention of JSON in first 1KB). ` +
            `See https://geminicli.com/docs/hooks/ — stdout must be valid JSON, ` +
            `logs go to stderr.`,
        );
      }
      // Only emit each unique script once across multiple events.
      if (!files.some((f) => f.path === def.command)) {
        files.push({ path: def.command, content, mode: 0o755 });
      }
    }
  }

  files.push({
    path: '.gemini/settings.fragment.json',
    content: `${JSON.stringify(fragment, null, 2)}\n`,
  });
  return files;
}

function emitMcp(component: ComponentSource): EmittedFile[] {
  const { manifest } = component;
  if (!manifest.mcp) return [];
  const fragment = {
    mcpServers: {
      [manifest.name]: {
        command: manifest.mcp.command,
        ...(manifest.mcp.args ? { args: manifest.mcp.args } : {}),
        ...(manifest.mcp.env ? { env: manifest.mcp.env } : {}),
      },
    },
  };
  return [
    {
      path: '.gemini/settings.fragment.json',
      content: `${JSON.stringify(fragment, null, 2)}\n`,
    },
  ];
}
