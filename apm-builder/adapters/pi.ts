import path from 'node:path';
import type { Adapter, ComponentSource, EmittedFile, AdapterContext } from '../lib/types.ts';
import { composeAgentsMd } from '../lib/agents-md.ts';

export const piAdapter: Adapter = {
  target: 'pi',

  supports(component) {
    return component.manifest.targets.includes('pi');
  },

  async emit(component, ctx) {
    switch (component.manifest.type) {
      case 'skill': {
        // Pi loads both .pi/skills/*/SKILL.md (canonical skill discovery) and
        // .pi/AGENTS.md (always-on context). The AGENTS.md `# Skills` section
        // is a listing for visibility, not the actual skill loader.
        const skillFiles = emitSkill(component);
        const agentsMdFiles = emitAgentsMdContribution(component, ctx);
        return [...skillFiles, ...agentsMdFiles];
      }
      case 'agent':
      case 'rules':
        return emitAgentsMdContribution(component, ctx);
      case 'plugin':
        return emitPluginPackage(component, ctx);
      case 'hook':
        return emitHookExtension(component);
      case 'mcp':
        return emitMcpStub(component);
      default:
        throw new Error(`pi adapter: type "${component.manifest.type}" not supported`);
    }
  },
};

function emitSkill(component: ComponentSource): EmittedFile[] {
  const { manifest, body } = component;
  // Pi skills follow the Agent Skills standard: frontmatter is just
  // name + description. All other manifest fields are stripped during emission
  // (version, type, targets, etc. are infrastructure metadata, not skill content).
  const frontmatter = ['---', `name: ${manifest.name}`, `description: ${manifest.description}`, '---'].join('\n');
  return [
    {
      path: `.pi/skills/${manifest.name}/SKILL.md`,
      content: `${frontmatter}\n\n${body.trimStart()}`,
    },
  ];
}
function emitAgentsMdContribution(
  component: ComponentSource,
  ctx: AdapterContext,
): EmittedFile[] {
  // Determine the alphabetically-first eligible contributor across rules+agents+skills.
  // Only that one emits the file; others contribute via the shared composer and return [].
  const contributors = ctx.allComponents.filter(
    (c) =>
      c.manifest.targets.includes('pi') &&
      (c.manifest.type === 'rules' ||
        c.manifest.type === 'agent' ||
        c.manifest.type === 'skill'),
  );
  if (contributors.length === 0) return [];
  const leader = [...contributors].sort((a, b) =>
    a.manifest.name.localeCompare(b.manifest.name),
  )[0];
  if (!leader || leader.manifest.name !== component.manifest.name) return [];

  const content = composeAgentsMd(contributors, 'pi', ctx.config as never);
  return [{ path: '.pi/AGENTS.md', content }];
}
function emitPluginPackage(
  component: ComponentSource,
  ctx: AdapterContext,
): EmittedFile[] {
  const { manifest } = component;
  const pkgDir = manifest.name; // emitted at dist/pi/<pkgDir>/
  const keyword = (ctx.config?.package_keyword as string | undefined) ?? 'pi-package';

  // Resolve included skills (we only bundle skills; non-skill includes are
  // flagged by the validator at Plan 1 Task 5, but we tolerate them here by skipping).
  const includedSkills: ComponentSource[] = [];
  for (const inc of manifest.includes ?? []) {
    const resolvedDir = path.normalize(path.join(component.relativeDir, inc));
    const targetComponent = ctx.allComponents.find((c) => c.relativeDir === resolvedDir);
    if (targetComponent && targetComponent.manifest.type === 'skill') {
      includedSkills.push(targetComponent);
    }
  }

  const files: EmittedFile[] = [];

  // package.json
  const pkgJson: Record<string, unknown> = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    main: 'src/index.ts',
    type: 'module',
  };
  if (manifest.author) pkgJson.author = manifest.author;
  if (manifest.license) pkgJson.license = manifest.license;
  pkgJson.keywords = ['pi', keyword];
  pkgJson.peerDependencies = { '@mariozechner/pi-coding-agent': '*' };
  files.push({
    path: `${pkgDir}/package.json`,
    content: `${JSON.stringify(pkgJson, null, 2)}\n`,
  });

  // src/index.ts (extension entrypoint)
  files.push({
    path: `${pkgDir}/src/index.ts`,
    content: renderExtensionEntrypoint(),
  });

  // README
  files.push({
    path: `${pkgDir}/README.md`,
    content: renderPackageReadme(manifest.name, manifest.description, includedSkills),
  });

  // Each included skill: re-emit at <pkg>/skills/<skill>/SKILL.md with stripped frontmatter
  for (const sk of includedSkills) {
    const fm = ['---', `name: ${sk.manifest.name}`, `description: ${sk.manifest.description}`, '---'].join('\n');
    files.push({
      path: `${pkgDir}/skills/${sk.manifest.name}/SKILL.md`,
      content: `${fm}\n\n${sk.body.trimStart()}`,
    });
  }

  return files;
}

function renderExtensionEntrypoint(): string {
  return `import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";

interface SkillMeta {
  name: string;
  description: string;
  content: string;
}

function loadSkills(skillsDir: string): SkillMeta[] {
  if (!existsSync(skillsDir)) return [];
  const skills: SkillMeta[] = [];
  for (const dir of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const skillFile = join(skillsDir, dir.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    const raw = readFileSync(skillFile, "utf-8");
    const match = raw.match(/^---\\n([\\s\\S]*?)\\n---\\n([\\s\\S]*)$/);
    if (!match) continue;
    const frontmatter = match[1];
    const content = match[2].trim();
    const name = frontmatter.match(/name:\\s*(.+)/)?.[1]?.trim() || dir.name;
    const description = frontmatter.match(/description:\\s*(.+)/)?.[1]?.trim() || "";
    skills.push({ name, description, content });
  }
  return skills;
}

export default function plugin(pi: ExtensionAPI) {
  const extensionRoot = resolve(__dirname, "..");
  const skillsDir = join(extensionRoot, "skills");
  const skills = loadSkills(skillsDir);

  pi.registerCommand("skill", {
    description: "Invoke a bundled skill by name",
    getArgumentCompletions: (prefix) =>
      skills
        .filter((s) => s.name.startsWith(prefix))
        .map((s) => ({ value: s.name, label: \`\${s.name} — \${s.description}\` })),
    handler: async (args, ctx) => {
      const skillName = args.trim();
      const skill = skills.find((s) => s.name === skillName);
      if (!skill) {
        ctx.ui.notify(\`Skill not found: \${skillName}\`, "error");
        return;
      }
      pi.sendUserMessage(\`Using skill: \${skill.name}\\n\\n\${skill.content}\`, { deliverAs: "steer" });
    },
  });

  pi.registerCommand("skills", {
    description: "List bundled skills",
    handler: async (_args, ctx) => {
      const list = skills.map((s) => \`  \${s.name} — \${s.description}\`).join("\\n");
      ctx.ui.notify(\`Available skills:\\n\${list}\`, "info");
    },
  });
}
`;
}

function renderPackageReadme(
  name: string,
  description: string,
  skills: ComponentSource[],
): string {
  const rows = skills.map(
    (s) => `| ${s.manifest.name} | ${s.manifest.description} |`,
  );
  return `# ${name}

${description}

## Install

\`\`\`bash
pi install <git-url>
\`\`\`

Or add to \`.pi/settings.json\`:

\`\`\`json
{
  "extensions": ["<absolute-path>/src/index.ts"]
}
\`\`\`

## Skills

| Name | Description |
|------|-------------|
${rows.join('\n')}
`;
}
function emitHookExtension(_component: ComponentSource): EmittedFile[] {
  throw new Error('not implemented (Task 7)');
}
function emitMcpStub(_component: ComponentSource): EmittedFile[] {
  throw new Error('not implemented (Task 8)');
}
