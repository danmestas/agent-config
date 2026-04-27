---
name: dx-audit
description: Use when evaluating developer experience or user experience, assessing usability of a CLI/SDK/API/UI, scoring project ergonomics, identifying friction in workflows, or when asked to audit DX or UX. Triggers on "DX score", "UX audit", "developer experience", "user experience", "workflow friction", "usability audit", "how hard is it to use this".
category:
  primary: backpressure
---

# Experience Audit (DX / UX)

Systematic method for scoring developer or user experience by enumerating real workflows, listing exact steps, and identifying friction. Same process applies whether the surface is a CLI, SDK, API, or UI.

## Core Principle

**Experience is measured by workflows, not features.** A product can have every feature and still score poorly if the workflows that use those features are painful. Enumerate what people actually do, score each workflow, and fix the highest-leverage gaps.

## When to Use

- Evaluating a project's usability before planning improvements
- Comparing current state against competitors
- Prioritizing DX/UX work (what to fix first)
- Assessing whether a new feature actually improved the experience
- Writing up findings for stakeholders

## The Process

### 1. Explore the User-Facing Surface

Before scoring anything, build a complete picture of what people interact with.

**For developer tools (DX):**
- CLI commands, flags, output formats
- API endpoints and SDK methods
- Configuration (env vars, files, defaults)
- Setup/deploy (processes, prerequisites, ordering)
- Observability (logs, metrics, health checks)

**For user interfaces (UX):**
- Screens, views, navigation paths
- Forms, inputs, validation feedback
- Loading states, error states, empty states
- Onboarding flow, first-run experience
- Settings, preferences, account management

For each area note: what's automated vs manual, what's missing, what's confusing, what requires knowledge that isn't discoverable from the interface itself.

### 2. Enumerate Workflows (Most Common to Least)

Identify the 5-8 workflows people perform most often. Order by frequency:

| Frequency | DX Examples | UX Examples |
|-----------|------------|-------------|
| Daily | Run core operation, debug failures | Complete primary task, find information |
| Weekly | Add config, write extensions | Change settings, invite collaborators |
| Continuous | Monitor health, observe state | Check notifications, review activity |
| Rare | Deploy, migrate, onboard | Sign up, reset password, export data |

### 3. List Exact Steps Per Workflow

Write the concrete steps. Be specific — not "configure the system" but "write a JSON file with these 6 fields, run this command, check this output, fix errors by doing X." For UI: not "fill out the form" but "navigate to Settings > API, click Generate, copy the key, paste into config file, restart."

Count the steps. Note where the person needs knowledge that isn't discoverable from the interface.

### 4. Score Each Workflow (1-10)

| Score | Meaning |
|-------|---------|
| 9-10 | Delightful — works exactly as expected, zero friction |
| 7-8 | Good — minor friction, discoverable |
| 5-6 | Adequate — gets the job done with some pain |
| 3-4 | Painful — requires tribal knowledge or workarounds |
| 1-2 | Broken — effectively unusable without help |

After scoring, list specific pain points for each workflow.

### 5. Calculate Overall Score

Weighted average: weight daily workflows higher than rare ones. Present as a summary table:

```
| Workflow | Frequency | Score | Biggest Gap |
|----------|-----------|-------|-------------|
| Core task | Daily | X/10 | ... |
| Debug/recover | Daily | X/10 | ... |
| ...

Overall: X/10
```

### 6. Identify Highest-Leverage Improvements

Rank by: **(frequency) x (severity of gap) x (feasibility)**. The best improvements are high-frequency workflows with low scores that can be fixed with moderate effort.

**Before ranking, ask:** who is the user? A solo developer, a team, an end-user? Different audiences have different priorities.

## Output Format

Single document with:

1. **Summary table** — workflow, frequency, score, biggest gap
2. **Per-workflow detail** — exact steps, pain points, score justification
3. **Assessment** — what works well, what's broken
4. **Ranked improvements** — ordered by leverage, not by ease

## Common Mistakes

**Scoring features instead of workflows.** "We have retries" scores nothing. "Debugging a failed retry takes 8 steps across 3 tools with no unified view" is the actual observation.

**Assuming your own workflow is the common one.** The builder has different workflows than the user. Audit from the user's perspective.

**Fixing low-frequency workflows first.** A deploy story scoring 2/10 matters less than a daily workflow scoring 3/10 if deploys happen monthly.

**Proposing improvements without knowing the audience.** A solo developer, a team onboarding new members, and an end-user all need different things. Ask before ranking.

**Confusing polish with leverage.** A beautiful onboarding flow matters less than fixing the thing people do 50 times a day.
