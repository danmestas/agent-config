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
      // Tasks 4-5 add: hook, mcp.
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
