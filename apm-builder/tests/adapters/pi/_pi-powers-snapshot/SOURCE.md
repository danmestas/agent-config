# pi-powers snapshot — format reference

Source: https://github.com/danmestas/pi-powers
Commit: 9a6ca74a232e615dfae807a8ca60cfbe18cf106e
Captured: 2026-04-26
Purpose: This directory is a read-only reference for the file layout
expected by `pi install <pkg>`. The Pi adapter goldens (in sibling
fixture dirs) emit output that conforms to this shape.

Files retained:
- package.json — package metadata, "pi" keyword, "main": "src/index.ts"
- README.md    — install instructions
- src/index.ts — TypeScript extension entrypoint using ExtensionAPI
- skills/<name>/SKILL.md — frontmatter (name, description) + markdown body

Skill bodies truncated. Format-relevant fields preserved verbatim.

DO NOT EDIT this directory by hand. Re-run the snapshot procedure in
the plan (`docs/superpowers/plans/2026-04-26-pi-adapter.md`, Task 1)
to refresh against a newer pi-powers commit.
