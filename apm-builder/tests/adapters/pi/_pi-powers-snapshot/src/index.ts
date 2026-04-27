import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { Type } from "@sinclair/typebox";

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
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;
    const frontmatter = match[1];
    const content = match[2].trim();
    const name = frontmatter.match(/name:\s*(.+)/)?.[1]?.trim() || dir.name;
    const description = frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() || "";
    skills.push({ name, description, content });
  }
  return skills;
}

export default function piPowers(pi: ExtensionAPI) {
  const extensionRoot = resolve(__dirname, "..");
  const skillsDir = join(extensionRoot, "skills");
  const skills = loadSkills(skillsDir);

  pi.registerCommand("skill", {
    description: "Invoke a superpowers skill by name",
    getArgumentCompletions: (prefix) =>
      skills
        .filter((s) => s.name.startsWith(prefix))
        .map((s) => ({ value: s.name, label: `${s.name} — ${s.description}` })),
    handler: async (args, ctx) => {
      const skillName = args.trim();
      const skill = skills.find((s) => s.name === skillName);
      if (!skill) {
        ctx.ui.notify(`Skill not found: ${skillName}`, "error");
        return;
      }
      pi.sendUserMessage(`Using skill: ${skill.name}\n\n${skill.content}`, { deliverAs: "steer" });
    },
  });

  // <!-- TRUNCATED for fixture — see SOURCE.md for canonical pi-powers source -->
}
