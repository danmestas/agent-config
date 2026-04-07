#!/usr/bin/env node
/**
 * Merge Midscene HTML reports into a single navigable file.
 *
 * Usage:
 *   node merge-reports.mjs [--report-dir ./report] [--output combined-report.html] [--labels labels.json]
 *
 * Run from the midscene_run/ directory (where reports are generated).
 * Without --labels, reports are named "Step 1", "Step 2", etc.
 *
 * Labels file format (JSON array matching chronological report order):
 *   [
 *     { "title": "Login", "desc": "Fill credentials and sign in" },
 *     { "title": "Create RO", "desc": "New repair order for customer" }
 *   ]
 *
 * How it works:
 *   Midscene reports are standalone React apps. Each report contains:
 *   - ~1.8MB of React boilerplate (same in every file)
 *   - <script type="midscene_web_dump" data-group-id="UUID"> tags with JSON action data
 *   - <script type="midscene-image" data-id="UUID"> tags with base64 screenshots
 *
 *   The dropdown reads names from playwright_test_title HTML attributes on script tags.
 *   This script injects those attributes and deduplicates shared images.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parseArgs } from 'util';

const { values: args } = parseArgs({
  options: {
    'report-dir': { type: 'string', default: 'report' },
    'output': { type: 'string', default: 'combined-report.html' },
    'labels': { type: 'string' },
    'help': { type: 'boolean', short: 'h' },
  },
});

if (args.help) {
  console.log(`Usage: node merge-reports.mjs [--report-dir ./report] [--output combined.html] [--labels labels.json]`);
  process.exit(0);
}

const REPORT_DIR = resolve(args['report-dir']);
const OUTPUT = resolve(args.output);
const UUID = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

// Regexes that match REAL data scripts (with proper UUID attributes), not template strings in the React bundle
const REAL_DUMP_RE = new RegExp(
  `<script type="midscene_web_dump" [^>]*data-group-id="${UUID}"[^>]*>[\\s\\S]*?</script>`, 'g'
);
const REAL_IMAGE_RE = new RegExp(
  `<script type="midscene-image" data-id="${UUID}">[\\s\\S]*?</script>`, 'g'
);

// Load labels if provided
let labels = null;
if (args.labels && existsSync(args.labels)) {
  labels = JSON.parse(readFileSync(args.labels, 'utf8'));
  console.log(`Loaded ${labels.length} labels from ${args.labels}`);
}

// Get all HTML reports sorted by filename (chronological)
const files = readdirSync(REPORT_DIR).filter(f => f.endsWith('.html')).sort();
console.log(`Found ${files.length} reports in ${REPORT_DIR}`);

// Filter out failed reports
const good = [];
const discarded = [];

for (const file of files) {
  const content = readFileSync(join(REPORT_DIR, file), 'utf8');
  const hasBlackScreen = (content.match(/completely black/g) || []).length > 2;
  const hasSessionClosed = content.includes('Session closed. Most likely the page has been closed');

  if (hasBlackScreen || hasSessionClosed) {
    discarded.push(file);
  } else {
    good.push({ file, content });
  }
}

if (discarded.length > 0) {
  console.log(`Discarding ${discarded.length} failed reports:`);
  discarded.forEach(f => console.log(`  skip: ${f}`));
}

if (good.length === 0) {
  console.error('No valid reports found!');
  process.exit(1);
}

// Extract React boilerplate from the largest report (everything before the first real data script)
const largest = good.reduce((a, b) => a.content.length > b.content.length ? a : b);
const firstRealScript = largest.content.search(
  new RegExp(`<script type="midscene_web_dump" [^>]*data-group-id="${UUID}"`)
);

if (firstRealScript === -1) {
  console.error('Could not find data scripts in any report. Are these Midscene reports?');
  process.exit(1);
}

const boilerplate = largest.content.substring(0, firstRealScript);

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// Collect all data scripts with injected names
const seenImages = new Set();
const allDumps = [];
const allImages = [];
let stepIndex = 0;

for (const { file, content } of good) {
  const dumps = content.match(REAL_DUMP_RE) || [];
  const images = content.match(REAL_IMAGE_RE) || [];

  if (dumps.length === 0 && images.length === 0) continue;

  // Determine label for this report
  let title, desc;
  if (labels && labels[stepIndex]) {
    title = labels[stepIndex].title || `Step ${stepIndex + 1}`;
    desc = labels[stepIndex].desc || '';
  } else {
    // Extract name from filename timestamp
    const timeMatch = file.match(/(\d{2})-(\d{2})-(\d{2})-/);
    const timeStr = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}` : '';
    title = `Step ${stepIndex + 1}`;
    desc = timeStr;
  }
  stepIndex++;

  // Inject playwright_test_title and playwright_test_description into script tags
  for (const dump of dumps) {
    const patched = dump.replace(
      '<script type="midscene_web_dump"',
      `<script type="midscene_web_dump" playwright_test_title="${escapeAttr(title)}" playwright_test_description="${escapeAttr(desc)}"`
    );
    allDumps.push(patched);
  }

  // Deduplicate images
  for (const img of images) {
    const idMatch = img.match(/data-id="([^"]+)"/);
    if (idMatch && !seenImages.has(idMatch[1])) {
      seenImages.add(idMatch[1]);
      allImages.push(img);
    }
  }
}

console.log(`Merged: ${allDumps.length} action dumps, ${allImages.length} unique images, ${stepIndex} steps`);

const combined = boilerplate
  + allDumps.join('\n') + '\n'
  + allImages.join('\n') + '\n'
  + '</body></html>';

writeFileSync(OUTPUT, combined);
const sizeMB = (Buffer.byteLength(combined) / 1024 / 1024).toFixed(1);
console.log(`Written: ${OUTPUT} (${sizeMB} MB)`);
