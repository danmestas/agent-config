# Session Management Reference

## First Session (No Profile Exists)

When `<project>/profile/` does not exist or is empty:

1. Create the `profile/` directory
2. Create empty profile files with frontmatter (sessions: 0, completeness: 0%)
3. Start with experience — most recent role first
4. Open casually: "Alright, so what are you working on right now?" or "Tell me about your current gig."
5. Work backward through roles naturally as the conversation flows
6. Don't try to cover everything — a first session should aim to deeply cover 1-2 roles

## Return Sessions (Profile Exists)

When profile files already exist with content:

1. Read all profile files
2. Run gap analysis (see below)
3. Propose a focus area based on the thinnest section: "Your Sedera experience is pretty thin compared to the rest — want to dig into that?"
4. If the user specifies a topic ("let's talk about my side projects"), follow their lead
5. Open by referencing something from the existing profile to show continuity: "Last time you mentioned something about stuck transactions at Sedera — I want to come back to that."

## Gap Analysis

Score each profile file on completeness:

### experience.md
- Each role should have 3+ raw stories, key details filled, and 2+ extracted achievements
- Roles with fewer than 2 stories are "thin"
- Roles with no stories are "empty"
- Most recent roles should have the most depth

### philosophy.md
- Should have content in at least 3 topic areas
- Each topic should have 2+ substantive takes (not one-liners)
- If fewer than 3 topics have content, this file is "thin"

### education.md
- Should have formal education filled in
- Ongoing learning section adds depth but isn't required for completeness

### projects.md
- Each project should have a story, not just a description
- Projects with only "What" and "Stack" but no "Story" are "thin"

### goals.md
- Should have at least target roles and 2+ preferences filled
- If dealbreakers and "what they want next" are empty, it's thin

### Prioritization

When multiple areas are thin, prioritize:
1. Experience (most recent roles first) — this is the foundation
2. Philosophy — differentiates the person
3. Goals — needed for tailoring resumes
4. Projects — adds dimension
5. Education — usually covered quickly

## Session Flow

A session is a natural conversation, not a structured interview. But it has a rhythm:

1. **Opening (1-2 exchanges)**: Warm, casual, reference prior context or propose a focus
2. **Exploration (bulk of session)**: Follow the conversation wherever it goes. Dig deep on stories. Challenge polished answers. Let tangents run. Probe skills through context.
3. **Natural wrap**: When the conversation reaches a natural pause or the user signals they're done, begin wrapping. Don't force an ending.
4. **Session close**: Update profile files, regenerate skills.md, report what was captured.

## Updating Profile Files

After each session:

1. Read the current content of each affected profile file
2. Append new stories and details to the appropriate sections — never overwrite existing content
3. Update frontmatter: increment `sessions`, update `last_updated`, re-estimate `completeness`
4. Regenerate `skills.md` by scanning all profile files for technology/tool/pattern mentions
5. Report to the user: "Added 3 stories to your Sedera experience and 2 new takes to philosophy. Your experience is now about 60% complete. Goals is still empty — maybe we cover that next time."

## skills.md Regeneration

After every session, rebuild `skills.md` from scratch by:

1. Scanning `experience.md` for every technology, tool, framework, language, and platform mentioned
2. Scanning `projects.md` for additional technologies
3. For each skill found, determine:
   - **Depth**: How many stories involve it? How detailed is the usage?
   - **Recency**: What are the date ranges of roles where it appeared?
   - **Context**: What was built with it? (one-line summary)
4. Classify into Daily Driver / Proficient / Familiar using the rules in profile-format.md
5. Include a Leadership Skills section inferred from management stories and philosophy takes
