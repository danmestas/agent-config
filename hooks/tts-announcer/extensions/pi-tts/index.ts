import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  DEFAULT_KOKORO_URL,
  buildAgentReadyText,
  buildSubagentDoneText,
  buildToolFailedText,
  chooseVoiceForProject,
  extractSubagentSummary,
} from './shared.mjs';

const execFileAsync = promisify(execFile);

function projectNameFromCwd(cwd: string | undefined) {
  if (!cwd) return '';
  return path.basename(cwd);
}

function sanitizeFilePart(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'pi';
}

async function speak(text: string, project: string) {
  const voice = await chooseVoiceForProject(project);
  const kokoroUrl = process.env.KOKORO_URL || DEFAULT_KOKORO_URL;
  const outDir = path.join(os.tmpdir(), 'pi-tts');
  const outFile = path.join(outDir, `${sanitizeFilePart(project)}.mp3`);
  await mkdir(outDir, { recursive: true });

  const response = await fetch(`${kokoroUrl}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'kokoro', voice, input: text, response_format: 'mp3' }),
  });

  if (!response.ok) {
    throw new Error(`Kokoro request failed: ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outFile, bytes);
  await execFileAsync('afplay', [outFile]);
}

export default function (pi: ExtensionAPI) {
  const toolArgs = new Map<string, unknown>();

  pi.on('agent_end', async (_event, ctx) => {
    const project = projectNameFromCwd(ctx.cwd);
    try {
      await speak(buildAgentReadyText(project), project);
    } catch {
      // Never break pi for TTS failures.
    }
  });

  pi.on('tool_execution_start', async (event) => {
    toolArgs.set(event.toolCallId, event.args);
  });

  pi.on('tool_execution_end', async (event, ctx) => {
    const project = projectNameFromCwd(ctx.cwd);
    const args = toolArgs.get(event.toolCallId);
    toolArgs.delete(event.toolCallId);

    try {
      if ((event.toolName === 'subagent' || event.toolName === 'task') && !event.isError) {
        const { agent, task } = extractSubagentSummary(args);
        await speak(buildSubagentDoneText(project, agent, task), project);
        return;
      }

      if (event.isError) {
        await speak(buildToolFailedText(event.toolName, project), project);
      }
    } catch {
      // Never break pi for TTS failures.
    }
  });
}
