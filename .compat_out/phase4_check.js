// Verify the Phase 4 file:
//  1) extract its <script> block and node --check it
//  2) sanity-check the IR-bridge shape it emits (schema row count = 42, schema names sane)
//  3) confirm DOM ids referenced in JS exist in the HTML
const fs = require("fs");
const path = require("path");

const file = "tools/svg42/svg42_phase4_prime.html";
const html = fs.readFileSync(file, "utf8");
const stat = fs.statSync(file);

const pass = [];
const fail = [];
function check(name, cond, detail) { (cond ? pass : fail).push(detail ? name + " :: " + detail : name); }

// 1) HTML well-formed-ish (counts of opens vs closes for the structural tags)
function tagCount(re) { return (html.match(re) || []).length; }
check("one <html>",   tagCount(/<html\b/gi) === 1 && tagCount(/<\/html>/gi) === 1);
check("one <head>",   tagCount(/<head\b/gi) === 1 && tagCount(/<\/head>/gi) === 1);
check("one <body>",   tagCount(/<body\b/gi) === 1 && tagCount(/<\/body>/gi) === 1);
check("one <script>", tagCount(/<script\b/gi) === 1 && tagCount(/<\/script>/gi) === 1);
check("one <style>",  tagCount(/<style\b/gi) === 1 && tagCount(/<\/style>/gi) === 1);

// 2) Extract the JS body and node --check it
const m = html.match(/<script>([\s\S]*?)<\/script>/);
check("script extracted", !!m);
const js = m ? m[1] : "";
const jsPath = ".compat_out/phase4_extracted.js";
fs.writeFileSync(jsPath, js, "utf8");

const cp = require("child_process").spawnSync(process.execPath, ["--check", jsPath], { encoding: "utf8" });
check("node --check passes", cp.status === 0, cp.stderr || cp.stdout);

// 3) DOM ids referenced in JS must exist in the HTML
const idRefs = new Set();
const reGetById = /getElementById\(["']([\w-]+)["']\)/g;
const reDollar  = /\$\(\s*["']([\w-]+)["']\s*\)/g;
let mm;
while ((mm = reGetById.exec(js))) idRefs.add(mm[1]);
while ((mm = reDollar.exec(js)))  idRefs.add(mm[1]);
const missing = [];
for (const id of idRefs) {
  const re = new RegExp('\\bid=["\']' + id.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + '["\']');
  if (!re.test(html)) missing.push(id);
}
check("all referenced ids exist in HTML", missing.length === 0, missing.length ? "missing: " + missing.join(", ") : "");

// 4) IR-bridge shape — execute the SCHEMA_NAMES block in isolation
const schemaMatch = js.match(/const SCHEMA_NAMES = \[([\s\S]*?)\];/);
check("SCHEMA_NAMES literal found", !!schemaMatch);
if (schemaMatch) {
  const body = schemaMatch[1];
  const names = body.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  check("SCHEMA_NAMES has 42 entries", names.length === 42, "got " + names.length);
  // Spot-check critical names that the main builder's loader expects
  for (const expected of ["x", "y", "vx", "vy", "hue", "scale", "attract", "repel", "phase", "life", "rot", "fillAlpha", "strokeAlpha"]) {
    check("schema has '" + expected + "'", names.includes(expected));
  }
}

// 5) Phase4 IR meta carries provenance (so consumers can detect it)
check("toSvg42IR emits meta.phase4.source = 'prime-evolution'", /source:\s*"prime-evolution"/.test(js));
check("toSvg42IR emits meta.schemaVersion = 2", /schemaVersion:\s*2/.test(js));

// 6) Hotkey panel and hotkey handler agree
const hotkeyHelpHas = (k) => new RegExp('class="kbd">' + k + '<', "i").test(html);
const hotkeyHandlerHas = (k) => new RegExp('ev\\.key\\s*===\\s*"' + k + '"').test(js);
for (const k of ["n", "r", "p", "t", "m", "y"]) {
  check("hotkey '" + k + "' in help and handler", hotkeyHelpHas(k) && hotkeyHandlerHas(k));
}

// 7) Preset count matches what the panel claims (12 mode-A + 6 mode-H = 18)
//    Match the new shape `{ id: N, mode: "...", name: ...` (the mode field was
//    introduced when Hamiltonian-mode presets were added).
const presetMatches = js.match(/\{\s*id:\s*\d+\s*,\s*mode:/g) || [];
check("18 presets defined (12 A + 6 H)", presetMatches.length === 18, "got " + presetMatches.length);
// Only count `mode: "X"` that appears inside a preset entry (i.e. preceded by
// `id: <num>,` rather than at the top of PARAMS).
const aPresets = (js.match(/id:\s*\d+,\s*mode:\s*"A"/g) || []).length;
const hPresets = (js.match(/id:\s*\d+,\s*mode:\s*"H"/g) || []).length;
check("12 mode-A presets", aPresets === 12, "got " + aPresets);
check("6 mode-H presets", hPresets === 6, "got " + hPresets);
check("preset panel claims '12 stochastic + 6 hamiltonian'", /Presets · 12 stochastic \+ 6 hamiltonian/.test(html));

// 8) Hotkey handler handles only 1-9 (so presets 10..18 must be clicked) — sanity for help panel claim
check("hotkey handler numeric range comment matches '1-9'", />\s*1-9\s*<\/span>/.test(html));
check("preset hotkey lookup uses num >= 1 && num <= 9", /num\s*>=\s*1\s*&&\s*num\s*<=\s*9/.test(js));

// 9) No outbound network references introduced
check("no fetch() calls", !/\bfetch\s*\(/.test(js));
check("no XMLHttpRequest", !/XMLHttpRequest/.test(js));
check("no <link> to remote font/css", !/<link[^>]+href=["']https?:/i.test(html));

const total = pass.length + fail.length;
console.log("PASS " + pass.length + "/" + total);
if (fail.length) {
  console.log("FAIL:");
  fail.forEach((n) => console.log("  - " + n));
  process.exit(1);
}
console.log("FILE_BYTES=" + stat.size);
console.log("FILE_LINES=" + html.split("\n").length);
console.log("JS_BYTES=" + js.length);
