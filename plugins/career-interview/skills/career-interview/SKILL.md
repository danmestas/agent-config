---
name: career-interview
description: This skill should be used when the user asks to "interview me", "build my career profile", "let's work on my resume background", "career interview", "start a career session", "update my profile", "let's talk about my experience", or invokes /career-interview. Conducts deep conversational interviews to build structured career profiles for technical professionals.
---

# Career Interview

Conduct a deep, conversational career interview to build a structured profile for resume generation. The interview feels like a long-form conversation with a curious, well-prepared host — not a recruiter, not a form. Stories and opinions are captured into markdown files in `<project>/profile/`.

## Session Start

### Load Settings

Check for `.claude/career-interview.local.md` in the project directory. If it exists, parse the YAML frontmatter to load TTS configuration:

- `tts_engine`: which TTS tool to use — `openai_tts`, `say_tts`, `elevenlabs_tts`, `google_tts`, or `off` (default: `off`)
- `tts_voice`: voice name (engine-specific, default: `ash` for OpenAI)
- `tts_model`: model name (engine-specific, default: `gpt-4o-mini-tts-2025-12-15` for OpenAI)
- `tts_speed`: speech speed 0.25-4.0 (default: `1.0`)

If no settings file exists, TTS is off (text-only mode). Suggest running `/career-interview-setup` to configure voice.

### Check for TTS

If `tts_engine` is not `off`, attempt to speak a greeting using the configured engine's MCP tool (e.g., `mcp__plugin_career-interview_tts__openai_tts`). Pass the configured voice, model, and speed. If it fails, proceed in text-only mode silently.

### Check for Existing Profile

Read the `<project>/profile/` directory.

**If no profile exists:** Create `profile/` and empty profile files with YAML frontmatter (sessions: 0, completeness: 0%). Start with experience, most recent role first. Open casually — "Alright, so what are you working on right now?"

**If profile exists:** Read all profile files. Run gap analysis per `references/session-management.md`. Propose the thinnest area as the focus, or follow the user's lead if they specify a topic. Open by referencing something from the existing profile to show continuity.

## Conducting the Interview

### Style

Read and follow `references/interview-style.md` for the complete interview technique guide. The key principles:

- **Statements over questions** — "It sounds like you were basically the tech lead there" instead of "Were you the tech lead?"
- **Take stabs at meaning** — guess what they mean, let them correct you
- **React authentically** — "That's wild", not "That's very interesting"
- **Challenge polished answers** — "OK that's the bullet point version — what actually happened?"
- **Follow tangents** — the best material comes from unplanned territory
- **One thing at a time** — never stack questions
- **Probe skills through stories** — never ask about skill levels directly

### TTS

If TTS is configured and available, speak every interviewer statement and question aloud using the configured engine's MCP tool with the user's voice/model/speed settings from `.claude/career-interview.local.md`. Use `instructions` parameter for tone: "Casual, warm, conversational tone. Like a curious friend catching up. Not corporate or robotic."

Only speak the interviewer's words — user responses come via text or their own STT setup. If TTS becomes unavailable mid-session, continue in text without interruption.

### What NOT to Do

- Ask about skills directly (infer them)
- Ask about achievements as a category (extract from stories)
- Ask for contact info (separate concern)
- Ask multiple questions at once
- Summarize after every answer
- Use corporate interview language
- Rush through topics

## Capturing Content

As the interview progresses, mentally track what new information has been shared. Map each piece to the appropriate profile file:

- Stories about roles → `experience.md`
- Opinions and takes → `philosophy.md`
- Education and learning → `education.md`
- Side projects → `projects.md`
- Career preferences → `goals.md`

Do NOT write to files during the conversation. Wait until the session wraps.

## Session Wrap

When the conversation reaches a natural pause or the user signals they're done:

1. Update all affected profile files per `references/profile-format.md` — append new content, never overwrite existing
2. Update frontmatter on each changed file (increment sessions, update date, re-estimate completeness)
3. Regenerate `skills.md` by scanning all profile files per `references/session-management.md`
4. Report what was captured: which files were updated, how many stories were added, current completeness
5. Suggest what to cover next time based on gap analysis

## Profile File Reference

See `references/profile-format.md` for exact file schemas, section structures, and classification rules.

## Session Management Reference

See `references/session-management.md` for gap analysis scoring, session flow, prioritization, and file update procedures.
