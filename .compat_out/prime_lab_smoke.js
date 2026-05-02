// prime_lab_smoke.js
//
// UI-wiring smoke for the Prime Lab panel in the main builder.
//
// The Lab panel is an *input device* for the Phase 3 textarea — sliders cause
// `prime …` lines to be appended on `change`, and the textarea remains the
// source of truth. This smoke verifies the contract by static inspection of
// the HTML + JS source:
//
//   • The DOM has all the expected slider/select/button elements (so anything
//     pointing at the panel as a smoke target sees them).
//   • The slider `change` handlers actually call `emitPrimeLabLine` with the
//     right DSL syntax for κ / η / ε / dt / mode / order.
//   • `emitPrimeLabLine` writes into `ui.phase3Input.value` (the textarea —
//     the architectural source-of-truth claim) and not into a side channel.
//   • The "Append all params" button emits 6 lines covering every parameter.
//   • The diagnostic readout reads from the live IR meta (no hidden state).
//   • The auto-compile gate works as a checkbox-driven user override.
//
// We don't run the page; we statically inspect the markup and JS with regex.

'use strict';
const fs = require('fs');
const path = require('path');

const builderPath = path.join(__dirname, '..', 'tools', 'svg42', 'svg42_compiler_builder.html');
const html = fs.readFileSync(builderPath, 'utf8');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log("  ✓  " + label + (detail ? "  (" + detail + ")" : "")); }
  else { fail++; console.log("  ✗  " + label + (detail ? "  (" + detail + ")" : "")); }
}

// ── 1. DOM elements: section, sliders, selects, buttons, readouts ─────────
check("Prime Lab section exists with 'Hamiltonian flow' heading",
  /<h2[^>]*>Prime Lab · Hamiltonian flow<\/h2>/.test(html));
check("section is on the lab page (data-page=\"lab\")",
  /<section[^>]*data-page="lab"[^>]*>\s*<div[^>]*>\s*<h2[^>]*>Prime Lab/.test(html));

const elements = [
  ["primeLabMode",    "select"],
  ["primeLabOrder",   "select"],
  ["primeLabDt",      "input"],
  ["primeLabKappa",   "input"],
  ["primeLabKappaVal","b"],
  ["primeLabEta",     "input"],
  ["primeLabEtaVal",  "b"],
  ["primeLabEps",     "input"],
  ["primeLabEpsVal",  "b"],
  ["primeLabSteps",   "input"],
  ["btnPrimeLabAppendEvolve", "button"],
  ["btnPrimeLabAppendParams", "button"],
  ["btnPrimeLabReset",        "button"],
  ["primeLabAutoCompile",     "input"],
  ["primeLabEmitTail",        "pre"],
];
for (const [id, tag] of elements) {
  const re = new RegExp("<" + tag + "[^>]*\\bid=\"" + id + "\"");
  check("DOM has #" + id + " (<" + tag + ">)", re.test(html));
}
const diagRows = ["primeLabDiagParams", "primeLabDiagStep", "primeLabDiagH",
                  "primeLabDiagK", "primeLabDiagVpair", "primeLabDiagVconf",
                  "primeLabDiagLz", "primeLabDiagP"];
for (const id of diagRows) {
  check("diagnostic row #" + id + " present",
    new RegExp('id="' + id + '"').test(html));
}

// ── 2. Slider sliders are <input type="range"> with the right step/range ──
check("κ slider is range 0..1.5 step 0.01",
  /<input[^>]*\bid="primeLabKappa"[^>]*\btype="range"[^>]*\bmin="0"[^>]*\bmax="1\.5"[^>]*\bstep="0\.01"/.test(html));
check("η slider is range 0..1 step 0.01",
  /<input[^>]*\bid="primeLabEta"[^>]*\btype="range"[^>]*\bmin="0"[^>]*\bmax="1"[^>]*\bstep="0\.01"/.test(html));
check("ε slider is range 0.005..0.5 step 0.005",
  /<input[^>]*\bid="primeLabEps"[^>]*\btype="range"[^>]*\bmin="0\.005"[^>]*\bmax="0\.5"[^>]*\bstep="0\.005"/.test(html));

// ── 3. UI registry includes the new ids ───────────────────────────────────
for (const [id] of elements) {
  check("ui registry registers " + id,
    new RegExp(id + ":\\s*document\\.getElementById\\(\"" + id + "\"\\)").test(html));
}

// ── 4. Emitter helper: writes to phase3Input, recordMacroLine, optional compile ─
check("emitPrimeLabLine writes appended line into ui.phase3Input.value",
  /function emitPrimeLabLine\(line\)[\s\S]{0,500}ui\.phase3Input\.value\s*=\s*cur\s*\+\s*sep\s*\+\s*trimmed\s*\+\s*"\\n"/.test(html));
check("emitPrimeLabLine routes through recordMacroLine when recording",
  /function emitPrimeLabLine\(line\)[\s\S]{0,800}if\s*\(\s*typeof recordMacroLine === "function"[\s\S]{0,80}macroRecording\s*\)\s*recordMacroLine\(trimmed\)/.test(html));
check("emitPrimeLabLine respects the auto-compile checkbox",
  /function emitPrimeLabLine\(line\)[\s\S]{0,2400}primeLabAutoCompile[\s\S]{0,200}if\s*\(\s*auto[\s\S]{0,200}compileAndReport\(\)/.test(html));
check("emitPrimeLabLine maintains a tail buffer of recent emissions",
  /primeLabRecentLines\.push\(trimmed\)[\s\S]{0,200}primeLabRecentLines\.length > 8/.test(html));

// ── 5. Slider change handlers emit the right DSL ───────────────────────────
const expected = [
  ["κ slider", /primeLabKappa\.addEventListener\("change",\s*\(\)\s*=>\s*emitPrimeLabLine\("prime couple "\s*\+/, "prime couple"],
  ["η slider", /primeLabEta\.addEventListener\("change",\s*\(\)\s*=>\s*emitPrimeLabLine\("prime trap "\s*\+/, "prime trap"],
  ["ε slider", /primeLabEps\.addEventListener\("change",\s*\(\)\s*=>\s*emitPrimeLabLine\("prime soft "\s*\+/, "prime soft"],
  ["mode select", /primeLabMode\.addEventListener\("change",\s*\(\)\s*=>\s*emitPrimeLabLine\("prime mode "\s*\+/, "prime mode"],
  ["order select", /primeLabOrder\.addEventListener\("change",\s*\(\)\s*=>\s*emitPrimeLabLine\("prime order "\s*\+/, "prime order"],
  ["dt input", /primeLabDt\.addEventListener\("change",\s*\(\)\s*=>\s*emitPrimeLabLine\("prime dt "\s*\+/, "prime dt"],
];
for (const [label, re, dsl] of expected) {
  check(label + " change-handler emits `" + dsl + "`", re.test(html));
}

// ── 6. Slider input handlers update the inline value labels (no emission) ─
check("κ slider input handler updates label only (no DSL emission on `input`)",
  /primeLabKappa\.addEventListener\("input",\s*refreshPrimeLabValueLabels\)/.test(html));
check("input handlers don't emit lines (no `input.*emitPrimeLabLine` wiring)",
  !/addEventListener\("input"[^)]{0,40}emitPrimeLabLine/.test(html));

// ── 7. Append-all-params emits 6 lines ────────────────────────────────────
check("emitPrimeLabAllParams emits prime mode/order/dt/couple/trap/soft",
  /function emitPrimeLabAllParams[\s\S]{0,600}prime mode [\s\S]{0,200}prime order [\s\S]{0,200}prime dt [\s\S]{0,200}prime couple [\s\S]{0,200}prime trap [\s\S]{0,200}prime soft /.test(html));
check("Append-all-params button wired to emitPrimeLabAllParams",
  /btnPrimeLabAppendParams\.addEventListener\("click",\s*emitPrimeLabAllParams\)/.test(html));

// ── 8. Append-evolve and Append-reset are wired ──────────────────────────
check("Append-evolve handler emits `prime evolve <N>`",
  /btnPrimeLabAppendEvolve\.addEventListener\("click",[\s\S]{0,300}emitPrimeLabLine\("prime evolve "/.test(html));
check("Append-reset handler emits `prime reset`",
  /btnPrimeLabReset\.addEventListener\("click",\s*\(\)\s*=>\s*emitPrimeLabLine\("prime reset"\)/.test(html));

// ── 9. Diagnostic refresh reads ir.meta.phase4 (no hidden state) ─────────
check("refreshPrimeLabDiagnostic reads ir.meta.phase4",
  /function refreshPrimeLabDiagnostic\(\)[\s\S]{0,1200}activeIr\.meta\s*&&\s*activeIr\.meta\.phase4/.test(html));
check("refreshPrimeLabDiagnostic uses primeLift + primeEnergy + primeInvariants",
  /function refreshPrimeLabDiagnostic\(\)[\s\S]{0,4000}primeLift\(activeIr\.entities\)[\s\S]{0,800}primeEnergy\([\s\S]{0,800}primeInvariants\(/.test(html));

// ── 10. compileAndReport calls the diagnostic refresh on both paths ───────
check("compileAndReport refreshes the prime lab diagnostic on success",
  /function compileAndReport\(\)[\s\S]{0,2000}refreshPageStrap\(\);\s*if\s*\(\s*typeof refreshPrimeLabDiagnostic[\s\S]{0,80}refreshPrimeLabDiagnostic\(\)/.test(html));
check("compileAndReport refreshes the prime lab diagnostic on failure too",
  /catch\s*\(\s*err\s*\)\s*\{[\s\S]{0,400}refreshPageStrap\(\);\s*if\s*\(\s*typeof refreshPrimeLabDiagnostic[\s\S]{0,80}refreshPrimeLabDiagnostic\(\)/.test(html));

// ── 11. Source-of-truth claim: panel does NOT write to a side state object ─
//
// The architectural claim is that the panel's only persistent state is in the
// Phase 3 textarea. Anything else is decoration. We verify by negative match:
// no localStorage / IndexedDB writes from emitPrimeLabLine or
// emitPrimeLabAllParams. (refreshPrimeLabDiagnostic only reads.)
{
  const tail = html.indexOf("function emitPrimeLabLine");
  const head = html.indexOf("function refreshPrimeLabDiagnostic", tail);
  if (tail < 0 || head < 0) {
    check("can locate emitter+all-params block for negative storage check", false);
  } else {
    const block = html.slice(tail, head);
    check("emitter does not write to localStorage (no hidden state layer)",
      !/localStorage\.setItem|primeLab[A-Za-z]*Settings/.test(block));
    check("emitter does not maintain a hidden DSL buffer outside the textarea",
      // primeLabRecentLines is *visible* in #primeLabEmitTail and capped at 8 — that's UI scrollback, not a parallel state object.
      !/primeLab[A-Za-z]*State\s*=/.test(block));
  }
}

// ── 12. The textarea write IS the source-of-truth gesture ─────────────────
check("emit operations always go through ui.phase3Input.value (not a parallel buffer)",
  /function emitPrimeLabLine[\s\S]{0,800}ui\.phase3Input\.value\s*=/.test(html)
  && /function emitPrimeLabAllParams[\s\S]{0,800}ui\.phase3Input\.value\s*=/.test(html));

// ── report ───────────────────────────────────────────────────────────────
console.log("");
console.log("  " + pass + "/" + (pass + fail) + " checks passed");
if (fail > 0) process.exit(1);
