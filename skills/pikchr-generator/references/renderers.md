# Pikchr Renderers and Clients Reference

Deeper rationale for each delivery target. For the decision tree, see `SKILL.md`. For syntax details, see [syntax.md](./syntax.md), [theming.md](./theming.md), and [stdlib-reference.md](./stdlib-reference.md).

**Bottom line:** Pikchr is "native" only in the Fossil / SQLite / Pikchr.org ecosystem. Everywhere else you install a plugin, pre-render to SVG, or use Kroki. In AI agent CLIs, users see raw code unless the agent takes extra steps.

## 1. Compatibility Matrix

| Surface                  | Native                  | Plugin path                                           | None / workaround          |
| ------------------------ | ----------------------- | ----------------------------------------------------- | -------------------------- |
| Fossil SCM               | Yes (wiki/forum/docs)   | —                                                     | —                          |
| SQLite docs              | Yes (Fossil-hosted)     | —                                                     | —                          |
| pikchrshow               | Yes (WASM playground)   | —                                                     | —                          |
| Kroki                    | Yes (HTTP service)      | `kroki.io/pikchr/svg/...` or POST                     | —                          |
| GitHub (README/issue/PR) | No                      | —                                                     | Pre-render SVG, commit     |
| GitLab                   | No                      | Admin-enabled Kroki in AsciiDoc only                  | Pre-render                 |
| Gitea                    | No                      | Footer JS snippet or external renderer (`app.ini`)    | Pre-render                 |
| Forgejo / Codeberg       | No                      | External renderers, not wired for Pikchr              | Pre-render                 |
| Bitbucket                | No                      | —                                                     | Pre-render                 |
| Jekyll                   | No                      | —                                                     | Pre-render or Kroki        |
| Docusaurus               | No                      | —                                                     | Pre-render or pikchr.js    |
| MkDocs                   | No                      | `md-code-renderer` workaround                         | Pre-render                 |
| 11ty                     | No                      | —                                                     | Pre-render or Kroki        |
| Astro                    | No                      | pikchr.js in JSX component                            | Pre-render                 |
| Hugo                     | No                      | `goldmark-pikchr` (custom build) OR Kroki shortcode   | Pre-render                 |
| Typora / MarkText        | No                      | —                                                     | Pre-render, embed image    |
| Vim / Neovim             | No                      | —                                                     | Compile + file-watcher     |
| VSCode / Cursor          | No                      | `xuzn.pikchr-markdown-preview` or `gebv.pikchr`       | Pre-render                 |
| JetBrains                | No                      | `IntelliPikchr` (syntax highlight only, no preview)   | Pre-render                 |
| mdBook                   | No                      | `cargo install mdbook-pikchr` (bundles pikchr.c)      | —                          |
| Sphinx                   | No                      | `sphinxcontrib-kroki` (reST `.. kroki:: :type: pikchr`) | Pre-render               |
| AsciiDoctor              | No                      | `asciidoctor-kroki` gem, `[pikchr]` block             | Pre-render                 |
| Pandoc                   | No                      | `pikchr.lua` or `filter-kroki.lua` filter             | Pre-render                 |
| Obsidian                 | No                      | `Adamantine Pick` (WASM, local) or Kroki plugin       | Pre-render                 |

## 2. Agent Harness Reality Check

**Every major AI coding agent harness — Claude Code, Cursor, Copilot CLI, Gemini CLI, Codex CLI, Cline, Continue, Aider — shows Pikchr fences as raw text.** None renders diagrams inline from source. Syntax highlighting is the best you get.

Two workable responses:

- **Compile to SVG and commit.** Write source with the pikchr CLI at `../bin/pikchr` via [../bin/compile.sh](../bin/compile.sh), commit the `.svg`, reference it from markdown with `![alt](./diagram.svg)`. Works on any downstream viewer.
- **Read SVG inline for multimodal display.** In Claude Code and other multimodal harnesses, the `Read` tool displays SVG files as images in the conversation. Flow: write `.pikchr` → run [../bin/render.sh](../bin/render.sh) → `Read` the `.svg`. The user sees the rendered diagram in chat, plus has the source file on disk for edits.

Web chat with artifacts (Claude.ai Artifacts, ChatGPT Canvas) will render `<svg>` tags inlined in HTML artifacts — but not `` ```pikchr `` fences. Pre-render, then inline the SVG tag in the artifact.

## 3. Three Workflows

### Pre-render to SVG + commit (universal fallback)

The one approach that works on every surface that displays images. Use this unless you know the target renders Pikchr natively.

```bash
# First-time: build the binary
../bin/install-pikchr.sh

# Each diagram
../bin/compile.sh diagram.pikchr            # → diagram.svg
git add diagram.pikchr diagram.svg
```

In markdown: `![Diagram](./diagram.svg)`. Commit both the source and SVG so later edits don't require re-deriving source. See templates like [../templates/architecture.pikchr](../templates/architecture.pikchr) and [../templates/sequence.pikchr](../templates/sequence.pikchr) for starting points.

### Native pikchr fence (Fossil ecosystem only)

Only when you have confirmed the viewer is Fossil, a Fossil-backed site (SQLite docs, pikchr.org), mdBook with `mdbook-pikchr`, Obsidian with Adamantine Pick, or Kroki-backed (Sphinx, AsciiDoctor, GitLab admin-enabled).

````markdown
``` pikchr center toggle
arrow; box "Hello" "World!" fit; arrow
```
````

Fossil-only info-string modifiers: `center`, `indent`, `toggle` (click to see source), `float-left`, `float-right`, `source`, `source-inline`. Most plugins ignore these — only Fossil honors them. mdBook's preprocessor treats `pikchr` as just the language tag.

### Agent inline display (compile-then-Read)

When the user is chatting with an agent and wants to see the diagram in the conversation:

1. Write source to `./diagram.pikchr` (persisted for edits).
2. Run [../bin/render.sh](../bin/render.sh) `./diagram.pikchr` → writes `./diagram.svg`.
3. `Read` `./diagram.svg`. Multimodal harnesses display it as an image.

Alternative quick-share path: URL-encode the source and emit `https://pikchr.org/home/pikchrshow?p=<encoded>`. The user clicks through to the playground. No build step, but the user has to click.

## 4. Top Gotchas

- **GitHub strips `<script>` and `<object>`/`<embed>` from inline SVG.** Interactive / scripted SVG breaks. CSS `<style>` inside SVG is preserved; SMIL animations work. Reference an `.svg` file — do not paste raw SVG into markdown.
- **`<img src="file.svg">` does not inherit `color` or CSS custom properties from the host page.** Dark-mode theming via `currentColor` only works when SVG is inlined or loaded via `<object>`. For GitHub, bake light/dark variants or use `<picture>` with `prefers-color-scheme` media queries on two SVG files.
- **GitHub rejects `<img src="data:image/svg+xml;base64,...">`** — renders empty. Commit an actual file.
- **GitHub release-asset SVGs** are served as `application/octet-stream`, so `<img>` may not render them. Commit SVGs into the repo tree.
- **Kroki rate limits** apply to the hosted service at `kroki.io`. For anything beyond occasional use, self-host: `docker run -p 8000:8000 yuzutech/kroki`.
- **Hugo Goldmark is compiled in.** Adding `goldmark-pikchr` requires building a custom Hugo binary. For most users, a shortcode that shells out to the pikchr CLI at build time or calls Kroki is far simpler.
- **GitLab Pikchr support** requires an admin to enable Kroki integration, works only in AsciiDoc (not markdown), and is off by default on GitLab.com. Assume unsupported unless explicitly told otherwise.
- **Pre-rendered SVG size.** Pikchr-generated SVGs are verbose; run `svgo` before committing large batches.

## 5. Decision Shortcuts

- Target is Fossil / SQLite docs / pikchr.org → emit fence.
- Target is anything else AND you can write files → pre-render to SVG, commit, embed with `![](path.svg)`.
- User wants to see it in the current agent chat → write source, compile, `Read` the SVG.
- User wants a shareable link without a build → `https://pikchr.org/home/pikchrshow?p=<urlencoded-source>`.
- Target is mdBook → `cargo install mdbook-pikchr`, add `[preprocessor.pikchr]` to `book.toml`, emit fence.
- Target is Obsidian → install `Adamantine Pick` from Community Plugins, emit fence.
- Target is Hugo/Jekyll/Docusaurus/MkDocs/11ty/Astro → pre-render at build time.
- Target is a GitHub README → pre-render, commit both `.pikchr` and `.svg`.
