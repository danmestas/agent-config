---
name: skill-eval-runner
version: 0.1.0
description: >
  Use when the user types "/eval skill X", "test skill X", "run evals on", "regression
  test skill", "eval skill", or asks whether a skill's description still triggers correctly.
  Also fires PostToolUse on edits to any skills/*/SKILL.md so a freshly-edited skill's
  triggers are immediately checked. Runs binary pass/fail evals (no scoring) per
  MindStudio's research.
type: skill
targets:
  - claude-code
category:
  primary: evolution
---

# skill-eval-runner

Binary pass/fail evals for skill descriptions. Each test case is a prompt + the skill that *should* be invoked. The agent reads the description, judges (using its own description-matching, no external LLM call), and reports pass/fail per prompt.

## Why binary, not scored

MindStudio's research on agent evals: scoring (1-10) introduces noise from the judge model and gives false precision. A skill either triggers correctly on a prompt or it doesn't. Roll-up: a skill passes its eval if every prompt passes; otherwise it fails and the user sees which prompts regressed.

## When to invoke

- User explicit: `/eval skill <name>`, "test the X skill", "run evals", "regression check".
- Auto-firing: PostToolUse on edits to any `skills/*/SKILL.md`. If the description was edited, re-run that skill's evals immediately.

## Eval file location

For a skill at `skills/<name>/`, evals live at:

```
skills/<name>/tests/evals.json
```

Format:

```json
{
  "name": "<name>-eval",
  "prompts": [
    {
      "id": "trigger-on-design-question",
      "prompt": "How should I design a deep module?",
      "must_invoke_skill": "ousterhout"
    },
    {
      "id": "negative-case-pure-go-syntax",
      "prompt": "What's the syntax for a Go map literal?",
      "must_NOT_invoke_skill": "ousterhout"
    }
  ]
}
```

Each entry is one of two shapes:

- `must_invoke_skill: "<name>"` — the prompt should trigger this skill.
- `must_NOT_invoke_skill: "<name>"` — the prompt should NOT trigger this skill (false-positive guard).

## Running an eval

The agent reading this skill IS the LLM judge. No external API call required for v1.

For each prompt:

1. Read `skills/<name>/SKILL.md` frontmatter `description` field.
2. Without prior context bias, judge: *would Claude Code's skill-routing logic trigger this skill on this prompt?* Use the same heuristic the harness uses (description keyword/intent matching).
3. Compare to the expected outcome (`must_invoke_skill` or `must_NOT_invoke_skill`).
4. Mark each prompt **pass** or **fail**.

Roll-up: skill **passes** iff all prompts pass. Otherwise **fails** with the per-prompt failure reasons.

## Output

Print to the user:

```
skill-eval: ousterhout
  PASS  trigger-on-design-question      "How should I design a deep module?"
  PASS  negative-case-pure-go-syntax    "What's the syntax for a Go map literal?"
  FAIL  trigger-on-refactor-prompt      "Help me refactor this function"
        Expected: must_invoke_skill=ousterhout
        Reason: description doesn't include "refactor" trigger; consider adding.
  ----
  Result: 2/3 PASS — skill REGRESSED.
```

## When `evals.json` doesn't exist

If a skill has no `tests/evals.json`:

1. Scaffold an empty one with the schema:

   ```json
   {
     "name": "<name>-eval",
     "prompts": []
   }
   ```

2. Tell the user: "no evals defined yet for `<name>`. Wrote a stub at `skills/<name>/tests/evals.json`. Add 3-5 trigger prompts and 1-2 negative cases, then re-run `/eval skill <name>`."

3. Do NOT invent prompts inline. The user authors their own ground-truth.

## Anti-patterns

- **Do NOT score 1-10.** Pass/fail only.
- **Do NOT call an external LLM as judge.** The agent reading this skill is the judge — that's the trick.
- **Do NOT auto-fix descriptions.** Failing evals signal a problem; the human edits the description and re-runs.
- **Do NOT skip negative cases.** Triggers on the wrong prompt is just as bad as missing the right one.

## See also

- `skills/description-linter/SKILL.md` — static analysis on descriptions; this skill is dynamic.
- `skills/reflect/SKILL.md` — eval failures are a natural reflection trigger.
- MindStudio's eval architecture writeup (binary, programmatic, no scoring).
