#!/usr/bin/env node
/**
 * WCAG contrast gate for the NASF token layer.
 *
 * Reads the semantic tokens straight out of src/index.css rather than
 * restating them here, so the check cannot drift from the palette it is
 * checking. Resolves `var(--primitive)` indirection, then asserts every
 * declared pair in BOTH modes.
 *
 * Exits non-zero on any failure. Wired into `npm run lint`.
 *
 * Thresholds (WCAG 2.1):
 *   4.5:1  normal body text
 *   3.0:1  large text (>=18.66px bold / >=24px) and UI component boundaries
 *          that carry meaning on their own (1.4.11)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = resolve(HERE, "../src/index.css");

/* ---------- token extraction ---------------------------------------------- */

/**
 * Pull every `--name: value;` declaration out of every block opened by the
 * exact selector `selector`. Later declarations win, which mirrors the cascade
 * across the several `:root` blocks in index.css.
 *
 * Scans for the selector and walks braces rather than pattern-matching whole
 * blocks: a regex anchored on the *preceding* `}` silently skips the first
 * `:root` in the file, since it follows an at-rule terminated by `;`.
 */
function collectVars(rawCss, selector) {
  // Strip comments first. index.css is heavily commented, and a `/* … */`
  // sitting between two blocks otherwise hides the `}`/`;` the scanner
  // anchors on — which silently drops the block that follows it.
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");
  const vars = {};
  const openRe = new RegExp(`(^|[};])\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`, "g");
  let m;
  while ((m = openRe.exec(css)) !== null) {
    // Walk to the matching close brace so a nested block can never truncate
    // the body early.
    let depth = 1;
    let i = openRe.lastIndex;
    const start = i;
    while (i < css.length && depth > 0) {
      const ch = css[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      i++;
    }
    const body = css.slice(start, i - 1);
    const declRe = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let d;
    while ((d = declRe.exec(body)) !== null) {
      vars[d[1]] = d[2].trim();
    }
    // Resume ON the closing brace, not past it: the next block's match needs
    // that `}` as its leading anchor, and consuming it here makes every block
    // after the first invisible.
    openRe.lastIndex = i - 1;
  }
  return vars;
}

/** Resolve `var(--x)` chains down to a literal. */
function resolve1(vars, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`circular var reference at ${name}`);
  seen.add(name);
  const raw = vars[name];
  if (raw === undefined) throw new Error(`token ${name} is not defined`);
  const m = /^var\(\s*(--[\w-]+)\s*\)$/.exec(raw);
  return m ? resolve1(vars, m[1], seen) : raw;
}

/* ---------- colour maths --------------------------------------------------- */

function parseHex(hex) {
  const h = hex.trim().replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`not a hex colour: ${hex}`);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance. */
function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- the pairs ------------------------------------------------------ */

const AA = 4.5; // normal text
const UI = 3.0; // large text + UI component boundaries

/** [foreground token, background token, threshold, what it is] */
const PAIRS = [
  ["--fg", "--bg", AA, "body text on the page"],
  ["--fg", "--surface", AA, "body text on a card"],
  ["--fg", "--surface-raised", AA, "body text on a raised surface"],

  ["--fg-subtle", "--bg", AA, "secondary text on the page"],
  ["--fg-subtle", "--surface", AA, "secondary text on a card"],
  ["--fg-subtle", "--surface-raised", AA, "secondary text on a raised surface"],

  ["--primary-fg", "--primary", AA, "label on a primary button"],
  ["--accent-fg", "--accent", AA, "label on a gold surface"],

  ["--accent-text", "--bg", AA, "gold text on the page"],
  ["--accent-text", "--surface", AA, "gold text on a card"],

  ["--success", "--success-surface", AA, "success text in its badge"],
  ["--warning", "--warning-surface", AA, "warning text in its badge"],
  ["--danger", "--danger-surface", AA, "danger text in its badge"],
  ["--success", "--surface", AA, "success text on a card"],
  ["--warning", "--surface", AA, "warning text on a card"],
  ["--danger", "--surface", AA, "danger text on a card"],

  // Control affordances. `--border` is decorative and deliberately absent —
  // see the comment on the two border tokens in index.css.
  ["--border-strong", "--bg", UI, "control outline on the page"],
  ["--border-strong", "--surface", UI, "control outline on a card"],
  ["--focus", "--bg", UI, "focus ring on the page"],
  ["--focus", "--surface", UI, "focus ring on a card"],
  ["--primary", "--bg", UI, "primary surface against the page"],

  // State indicators — the active nav rail and tab underline. `--accent` is a
  // fill and is deliberately NOT checked here: it only ever appears with
  // `--accent-fg` text on it, which is the pair asserted above.
  ["--accent-indicator", "--surface", UI, "active-state rail on a card"],
  ["--accent-indicator", "--bg", UI, "active-state rail on the page"],
];

/* ---------- run ------------------------------------------------------------ */

const css = readFileSync(CSS, "utf8");

// `:root` blocks carry primitives + light semantics; `.dark` overrides a
// subset, so dark resolves against light as its base.
const light = collectVars(css, ":root");
const dark = { ...light, ...collectVars(css, ".dark") };

if (Object.keys(light).length === 0) {
  console.error("  ✗ no tokens found in src/index.css — the parser is out of sync with the file.");
  process.exit(1);
}

const MODES = [
  ["light", light],
  ["dark", dark],
];

let failures = 0;
const total = MODES.length * PAIRS.length;
const rows = [];

for (const [mode, vars] of MODES) {
  for (const [fgTok, bgTok, min, label] of PAIRS) {
    let fg, bg;
    try {
      fg = resolve1(vars, fgTok);
      bg = resolve1(vars, bgTok);
    } catch (err) {
      console.error(`  ✗ ${mode}: ${fgTok} on ${bgTok} — ${err.message}`);
      failures++;
      continue;
    }
    const ratio = contrast(fg, bg);
    const pass = ratio >= min;
    if (!pass) failures++;
    rows.push({ mode, label, fgTok, bgTok, fg, bg, ratio, min, pass });
  }
}

const pad = (s, n) => String(s).padEnd(n);
let currentMode = null;
for (const r of rows) {
  if (r.mode !== currentMode) {
    currentMode = r.mode;
    console.log(`\n  ${currentMode.toUpperCase()}`);
  }
  const mark = r.pass ? "✓" : "✗";
  const line = `  ${mark} ${pad(r.label, 38)} ${pad(r.fg, 9)} on ${pad(
    r.bg,
    9
  )} ${r.ratio.toFixed(2)}:1 (needs ${r.min})`;
  if (r.pass) console.log(line);
  else console.error(line);
}

console.log("");
if (failures) {
  console.error(
    `  contrast: ${failures} of ${total} pairs FAILED. Adjust the token in src/index.css, then update the table in UI_REBUILD_PLAN.md §4.1.\n`
  );
  process.exit(1);
}
console.log(`  contrast: all ${total} pairs pass (${PAIRS.length} per mode).\n`);
