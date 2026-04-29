# Career Interview Plugin

A Claude Code plugin that conducts deep, conversational career interviews to build a structured profile for resume generation.

## Installation

```bash
# Install the plugin
claude plugin add ./career-interview

# Install the TTS server (recommended but optional)
go install github.com/blacktop/mcp-tts@latest
```

## Setup

### TTS (Text-to-Speech) — Optional

The plugin uses [blacktop/mcp-tts](https://github.com/blacktop/mcp-tts) to speak interview questions aloud. It defaults to macOS `say` (free, zero config).

For higher quality voices, set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key-here
```

Then change the engine in `.mcp.json` to `--engine openai`.

If TTS is not installed, the interview works fully as text.

### STT (Speech-to-Text) — User Provided

For the full voice conversation experience, set up your own speech-to-text input:

- **macOS Dictation**: System Settings → Keyboard → Dictation (free, built-in)
- **Whisper**: Local transcription via OpenAI Whisper
- **Any other input method**: The plugin just reads text — use whatever gets your words into the terminal

## Usage

Invoke the interview skill:

```
/career-interview
```

The interviewer will check for existing profile data in `./profile/` and either start fresh or pick up where you left off.

## Profile Output

All career data is saved to `<project>/profile/`:

| File | Content |
|------|---------|
| `experience.md` | Roles, companies, dates, raw stories |
| `philosophy.md` | Leadership style, engineering values, hot takes |
| `education.md` | Degrees, certifications, learning |
| `projects.md` | Side projects, OSS, personal builds |
| `goals.md` | Target roles, preferences, dealbreakers |
| `skills.md` | Auto-inferred from stories and conversations |
