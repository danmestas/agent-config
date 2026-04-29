---
name: career-interview-setup
description: Configure career-interview plugin settings (TTS engine, voice, model)
allowed-tools: ["Read", "Write", "mcp__plugin_career-interview_tts__openai_tts", "mcp__plugin_career-interview_tts__say_tts", "mcp__plugin_career-interview_tts__elevenlabs_tts", "mcp__plugin_career-interview_tts__google_tts"]
---

# Career Interview Setup

Walk the user through configuring the career-interview plugin. Save settings to `.claude/career-interview.local.md`.

## Steps

1. Check if `.claude/career-interview.local.md` already exists. If it does, read it and show the current settings.

2. Ask which TTS engine to use:
   - **openai** — Highest quality, requires OPENAI_API_KEY (voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse)
   - **say** — macOS built-in, free, no API key needed
   - **elevenlabs** — Premium quality, requires ELEVENLABS_API_KEY
   - **google** — Google Gemini TTS, requires GOOGLE_API_KEY
   - **off** — Text-only, no voice

3. Based on the engine choice, ask which voice to use. Offer to play a sample using the TTS MCP tool so they can hear it before committing.

4. Ask about speed preference (default 1.0, range 0.25-4.0).

5. Write the settings file to `.claude/career-interview.local.md`:

```markdown
---
tts_engine: <chosen engine>
tts_voice: <chosen voice>
tts_model: <chosen model>
tts_speed: <chosen speed>
---

# Career Interview Settings

TTS configured with <engine> engine, <voice> voice.
```

6. Confirm by speaking a test phrase with the configured settings.

7. Remind the user to add `.claude/*.local.md` to their `.gitignore` if not already there.
