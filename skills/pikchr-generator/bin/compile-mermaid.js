#!/usr/bin/env node
// compile-mermaid.js — read Mermaid source on stdin, write SVG on stdout.
// Invoked by compile-mermaid.sh which sets the THEME env var.
//
// We load themes.json to map our canonical theme names to beautiful-mermaid
// RenderOptions (bg/fg/line/accent/muted/surface/border). When a theme has
// mermaidKey set, we use THEMES[mermaidKey] spread into the options; when
// null, we pass our theme's individual color fields.
//
// beautiful-mermaid ships as ESM (package "type": "module"), so we load it
// via dynamic import() rather than require().
'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.resolve(__dirname, '..');
const THEMES_JSON = path.join(SKILL_DIR, 'lib', 'themes.json');

const THEME = process.env.THEME || 'default';

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const ourThemes = JSON.parse(fs.readFileSync(THEMES_JSON, 'utf8'));
  const theme = ourThemes[THEME] || ourThemes['default'];

  let renderMermaidSVG;
  let THEMES;
  try {
    ({ renderMermaidSVG, THEMES } = await import('beautiful-mermaid'));
  } catch (e) {
    console.error('ERROR: beautiful-mermaid not installed. Run: bash bin/install-mermaid.sh');
    console.error(e.message);
    process.exit(3);
  }

  // Build RenderOptions — if the theme has a mermaidKey, use beautiful-mermaid's
  // own THEMES palette as the base and layer our colors on top (identical in
  // most cases). If mermaidKey is null, use our theme's colors directly.
  const opts = {};
  if (theme.mermaidKey && THEMES[theme.mermaidKey]) {
    Object.assign(opts, THEMES[theme.mermaidKey]);
  }
  // Our themes.json is the source of truth: override with any explicit values.
  for (const k of ['bg', 'fg', 'line', 'accent', 'muted', 'surface', 'border']) {
    if (theme[k]) opts[k] = theme[k];
  }

  const src = await readStdin();
  const svg = renderMermaidSVG(src, opts);

  // beautiful-mermaid emits its own <style> block already.
  process.stdout.write(svg);
}

main().catch((e) => {
  console.error('ERROR:', e.stack || e.message);
  process.exit(1);
});
