import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

// Auto-generated from skill component "tts-announcer".
// Source: see README.md for the canonical SKILL.md path.
//
// Pi has no JSON-config hooks; this scaffold registers each declared event
// programmatically via the ExtensionAPI. Customize the body of each handler
// or replace the script invocation as needed.

export default function ttsAnnouncerExtension(pi: ExtensionAPI) {
  pi.on("turn_end", async (event, _ctx) => {
    // Mirrors source hook: Stop → hooks/announce.sh
    const script = resolve(__dirname, "hooks/announce.sh");
    spawn(script, [], { stdio: "inherit" });
  });

  pi.on("post_tool_use", async (event, _ctx) => {
    // Mirrors source hook: PostToolUse → hooks/log.sh (matcher: "Bash")
    if (event.tool !== "Bash") return;
    const script = resolve(__dirname, "hooks/log.sh");
    spawn(script, [], { stdio: "inherit" });
  });
}
