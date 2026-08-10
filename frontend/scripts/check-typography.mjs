#!/usr/bin/env node
/**
 * Typography gate.
 *
 * The old build defined a full semantic type scale and then used it 9 times,
 * while reaching for `text-xs` 50 times and `text-[10px]` 16 times — body copy
 * at 12px and labels at 10px, in Arabic. That is the single largest
 * readability problem in the app, and a convention alone will not hold it:
 * one `text-xs` slips in during a hurried page and the floor is gone.
 *
 * So it is enforced. This fails `npm run lint` on:
 *
 *   - font-size utilities below the 13px floor (`text-xs`, `text-[10px]`, ...)
 *   - arbitrary font sizes (`text-[13px]`) — use a scale token
 *   - weights outside 400/600/700 (`font-black`, `font-extrabold`, ...)
 *
 * Files may opt out with `check-typography-disable-next-line` on the line
 * before, which forces the exception to be written down rather than absorbed.
 *
 * RATCHET: the rebuild is phased, so pages that have not been rewritten yet
 * still carry the old scale. Rather than block the build for six phases (which
 * would mean turning the gate off, which means it never comes back on), the
 * pre-rebuild debt is recorded per file in `typography-debt.json` as a BUDGET.
 * A file may have at most its budgeted number of violations. Anything new, or
 * any regression in a budgeted file, fails. Budgets only ever go down — the
 * script tells you to lower one the moment you beat it, and Phase 7 deletes
 * the file entirely.
 *
 * Exits non-zero with file:line for every hit.
 */

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "../src");
const ROOT = resolve(HERE, "..");

/** Scale tokens that are allowed as `text-<name>`. */
const ALLOWED_SIZES = new Set([
  "display",
  "title",
  "section",
  "body",
  "body-sm",
  "label",
  "caption",
]);

/** Tailwind default font-size utilities — all banned; use the scale. */
const TW_SIZES = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
];

const RULES = [
  {
    id: "arbitrary-size",
    re: /\btext-\[[^\]]*(?:px|rem|em|pt)[^\]]*\]/g,
    msg: (hit) => `arbitrary font size \`${hit}\` — use a scale token (text-body, text-label, text-caption…)`,
  },
  {
    id: "tailwind-size",
    re: new RegExp(`\\btext-(?:${TW_SIZES.join("|")})\\b`, "g"),
    msg: (hit) =>
      `\`${hit}\` is below/off the Arabic type scale — use text-display|title|section|body|body-sm|label|caption`,
  },
  {
    id: "font-weight",
    re: /\bfont-(?:thin|extralight|light|black|extrabold)\b/g,
    msg: (hit) => `\`${hit}\` — the scale allows font-normal (400), font-semibold (600), font-bold (700) only`,
  },
];

const DISABLE = "check-typography-disable-next-line";

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Blank out comment bodies, preserving line count and column positions so
 * reported locations stay accurate.
 *
 * Without this the gate flags its own documentation: index.css explains the
 * rule by naming `text-xs` and `text-[10px]`, and a commented-out JSX block
 * would count as live markup.
 */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));
}

const files = walk(SRC);
const hits = [];

for (const file of files) {
  const text = stripComments(readFileSync(file, "utf8"));
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i > 0 && lines[i - 1].includes(DISABLE)) continue;
    if (line.includes(DISABLE)) continue;

    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        // `text-[...]` that is clearly a colour, not a size, is out of scope
        // for the arbitrary-size rule — the regex already requires a unit.
        hits.push({
          file: relative(ROOT, file),
          line: i + 1,
          col: m.index + 1,
          rule: rule.id,
          message: rule.msg(m[0]),
          snippet: line.trim().slice(0, 100),
        });
      }
    }
  }
}

// Sanity check: the scale tokens the rules point people toward must exist.
const cssText = readFileSync(join(SRC, "index.css"), "utf8");
for (const name of ALLOWED_SIZES) {
  if (!cssText.includes(`--text-${name}:`)) {
    console.error(`  ✗ type scale token --text-${name} is missing from src/index.css`);
    process.exit(1);
  }
}

/* ---------- ratchet -------------------------------------------------------- */

const DEBT_FILE = resolve(HERE, "typography-debt.json");

const byFile = new Map();
for (const h of hits) {
  if (!byFile.has(h.file)) byFile.set(h.file, []);
  byFile.get(h.file).push(h);
}

// `--record` snapshots the current state as the starting budget. Run once, at
// the start of the rebuild. Never run it to "fix" a failure — that is the one
// way to defeat the ratchet.
if (process.argv.includes("--record")) {
  const debt = Object.fromEntries(
    [...byFile.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([f, l]) => [f, l.length])
  );
  writeFileSync(DEBT_FILE, JSON.stringify(debt, null, 2) + "\n");
  console.log(`  typography: recorded ${hits.length} pre-rebuild violation(s) across ${byFile.size} file(s).`);
  console.log(`  budgets written to scripts/typography-debt.json — they may only go down.\n`);
  process.exit(0);
}

const budgets = existsSync(DEBT_FILE) ? JSON.parse(readFileSync(DEBT_FILE, "utf8")) : {};

const newViolations = []; // in files with no budget at all
const regressions = []; // budgeted files that got worse
const beaten = []; // budgeted files that improved — lower the budget

for (const [file, list] of byFile) {
  const budget = budgets[file];
  if (budget === undefined) newViolations.push([file, list]);
  else if (list.length > budget) regressions.push([file, list, budget]);
  else if (list.length < budget) beaten.push([file, list.length, budget]);
}
for (const [file, budget] of Object.entries(budgets)) {
  if (!byFile.has(file) && budget > 0) beaten.push([file, 0, budget]);
}

const remaining = hits.length;
const budgetTotal = Object.values(budgets).reduce((a, b) => a + b, 0);

function report(list, heading) {
  console.error(`\n  ${heading}\n`);
  for (const entry of list) {
    const [file, hitList, budget] = entry;
    console.error(`  ${file}${budget !== undefined ? `  (budget ${budget}, found ${hitList.length})` : ""}`);
    for (const h of hitList) console.error(`    ${h.line}:${h.col}  ${h.message}`);
    console.error("");
  }
}

let failed = false;

if (newViolations.length) {
  report(newViolations, "NEW — these files have no budget and must be clean:");
  failed = true;
}
if (regressions.length) {
  report(regressions, "REGRESSION — these files exceeded their budget:");
  failed = true;
}

if (failed) {
  console.error(
    `  typography: FAILED.\n` +
      `  Use the scale: text-display|title|section|body|body-sm|label|caption, weights 400/600/700.\n` +
      `  A deliberate exception needs a \`${DISABLE}\` comment on the preceding line.\n`
  );
  process.exit(1);
}

if (beaten.length) {
  console.log("");
  for (const [file, found, budget] of beaten) {
    console.log(`  ↓ ${file}: ${budget} → ${found}. Lower its budget in scripts/typography-debt.json.`);
  }
}

if (remaining === 0) {
  console.log(`\n  typography: ${files.length} files clean (13px floor, 3 weights).`);
  if (budgetTotal > 0) {
    console.log(`  All budgets are now zero — delete scripts/typography-debt.json (Phase 7).`);
  }
  console.log("");
} else {
  console.log(
    `\n  typography: clean, ${remaining} pre-rebuild violation(s) left in ${byFile.size} not-yet-rewritten file(s) ` +
      `(budget ${budgetTotal}).\n`
  );
}
process.exit(0);
