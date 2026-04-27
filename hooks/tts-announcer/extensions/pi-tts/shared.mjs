import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_KOKORO_URL = 'http://localhost:8880';
export const DEFAULT_VOICE = 'af_bella';
export const DEFAULT_VOICES_FILE = path.join(os.homedir(), '.claude', 'tts-voices.json');
export const VOICE_POOL = [
  'af_bella', 'af_sarah', 'af_nicole', 'af_sky', 'af_heart', 'af_aoede', 'af_jessica',
  'am_adam', 'am_michael', 'am_liam', 'am_puck', 'am_fenrir',
  'bf_emma', 'bf_alice', 'bf_lily',
  'bm_george', 'bm_lewis', 'bm_daniel',
];

async function readVoiceMap(voicesFile) {
  try {
    const raw = await readFile(voicesFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeVoiceMap(voicesFile, voiceMap) {
  await mkdir(path.dirname(voicesFile), { recursive: true });
  await writeFile(voicesFile, `${JSON.stringify(voiceMap, null, 2)}\n`, 'utf8');
}

export async function chooseVoiceForProject(project, options = {}) {
  const env = options.env ?? process.env;
  const voicesFile = options.voicesFile ?? env.TTS_VOICES_FILE ?? DEFAULT_VOICES_FILE;
  const randomIndex = options.randomIndex ?? (() => Math.floor(Math.random() * VOICE_POOL.length));

  if (env.TTS_VOICE) return env.TTS_VOICE;
  if (!project) return DEFAULT_VOICE;

  const voiceMap = await readVoiceMap(voicesFile);
  if (typeof voiceMap[project] === 'string' && voiceMap[project]) return voiceMap[project];

  const idx = Math.abs(Number(randomIndex()) || 0) % VOICE_POOL.length;
  const voice = VOICE_POOL[idx] ?? DEFAULT_VOICE;
  voiceMap[project] = voice;
  await writeVoiceMap(voicesFile, voiceMap);
  return voice;
}

export function buildAgentReadyText(project) {
  return project ? `Pi is awaiting input in ${project}.` : 'Pi is awaiting input.';
}

export function buildToolFailedText(toolName, project) {
  const subject = toolName || 'A tool';
  return project ? `${subject} failed in ${project}.` : `${subject} failed.`;
}

export function buildSubagentDoneText(project, agent, task) {
  if (agent && task) return project ? `The ${agent} agent finished: ${task} in ${project}.` : `The ${agent} agent finished: ${task}.`;
  if (task) return project ? `A subagent finished: ${task} in ${project}.` : `A subagent finished: ${task}.`;
  if (agent) return project ? `The ${agent} agent finished in ${project}.` : `The ${agent} agent finished.`;
  return project ? `A subagent finished in ${project}.` : 'A subagent finished.';
}

export function extractSubagentSummary(args) {
  if (!args || typeof args !== 'object') return { agent: '', task: '' };

  if (typeof args.agent === 'string' || typeof args.task === 'string') {
    return {
      agent: typeof args.agent === 'string' ? args.agent : '',
      task: typeof args.task === 'string' ? args.task : '',
    };
  }

  if (Array.isArray(args.chain) && args.chain.length > 0) {
    const first = args.chain[0] ?? {};
    return {
      agent: typeof first.agent === 'string' ? first.agent : '',
      task: typeof first.task === 'string' ? first.task : '',
    };
  }

  if (Array.isArray(args.tasks) && args.tasks.length > 0) {
    const first = args.tasks[0] ?? {};
    return {
      agent: typeof first.agent === 'string' ? first.agent : args.tasks.length > 1 ? 'multiple' : '',
      task: typeof first.task === 'string' ? first.task : '',
    };
  }

  return { agent: '', task: '' };
}
