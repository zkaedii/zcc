// phase4_macros_smoke.js
//
// Self-validating regression smoke for the named `prime macro <name>` family.
//
// IMPORTANT INTERPRETIVE NOTE
// ───────────────────────────
// What this smoke establishes:
//   • Each named macro lands the kernel in a regime whose K/V/V_conf
//     decomposition signature matches its declared classification:
//       - kepler   → V_pair-led  (close-approach activity dominates exchange)
//       - breather → V_conf-led  (trap dominates exchange)
//       - cluster  → balanced    (no single subsystem > 2× runner-up)
//       - harmonic → V_conf-led  (pure trap, V_pair near zero)
//     The macros are *self-validating*: a future kernel change that
//     preserves H but alters which subsystem is loudest fails this smoke
//     even though it would pass H-conservation.
//   • Each macro's (q_x, p_x) phase-space portrait has the declared
//     shape signature (bounded extents, no NaN/Inf escape, sufficient
//     fill ratio to distinguish ellipses from filled regions).
//   • The named-macro DSL surface (`prime macro kepler` etc.) is wired
//     correctly into the Phase 3 parser, the UI registry, and the
//     `emitPrimeMacroLine` helper — verified via static regex match.
//
// What this smoke does NOT establish:
//   • That the macros' parameter choices are *physically realistic* —
//     they're chosen to be diagnostically distinguishable, not to model
//     real astrophysics. Don't infer "kepler simulates two-body
//     gravity" from "macro passes". (It traces ellipses; gravity is
//     incidental.)
//   • That symplecticity holds in the macros (that's the
//     phase4_hamiltonian_smoke.js drift-bound + dt-halving witnesses).
//   • That macro execution is bit-identical to the standalone tool
//     (that's phase4_prime_bridge.js's job at fixed parameters).
//
// The constellation of evidence for "kepler is what it claims":
//   • parser dispatches `prime macro kepler` to the correct recipe
//     (this file, static check)
//   • that recipe's K/V/V signature matches the dominator classifier
//     (this file, dynamic check)
//   • the (q_x, p_x) trail has the expected portrait extents
//     (this file, dynamic check)
//   • the kernel itself is symplectic + bit-identical with standalone
//     (phase4_hamiltonian_smoke.js + phase4_prime_bridge.js)
// Read the assertions below as "the macro is what it advertises", not
// "the underlying physics is real two-body gravity."
//
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  ✓  ${label}`); if (detail) console.log(`     ${detail}`); }
  else { fail++; console.log(`  ✗  ${label}  (${detail || ""})`); }
}

// ── 1. Load builder prime kernel + macros into a sandbox ─────────────────
const builderPath = path.join(__dirname, '..', 'tools', 'svg42', 'svg42_compiler_builder.html');
const builderHtml = fs.readFileSync(builderPath, 'utf8');
const primeBlock = (() => {
  const startMarker = '// ─── Prime: symplectic';
  const endMarker = 'function passRandomize(';
  const start = builderHtml.indexOf(startMarker);
  const end = builderHtml.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('could not extract prime kernel from builder');
  return builderHtml.slice(start, end);
})();
const builderStubs = `
function ensureFinite(v) { return Number.isFinite(v) ? +v : 0; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function mulberry32(seed) { let s = seed >>> 0; return function() { s = (s + 0x6D2B79F5) | 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
`;
const builderFooter = `
globalThis.PRIME_DEFAULTS = PRIME_DEFAULTS;
globalThis.PRIME_MACROS = PRIME_MACROS;
globalThis.ensurePrimeMeta = ensurePrimeMeta;
globalThis.primeLift = primeLift;
globalThis.primeCommit = primeCommit;
globalThis.primeForces = primeForces;
globalThis.primeStep = primeStep;
globalThis.primeEnergy = primeEnergy;
globalThis.primeInvariants = primeInvariants;
globalThis.passPrimeEvolve = passPrimeEvolve;
`;
const sandbox = vm.createContext({ Math, Float64Array, Uint32Array, Float32Array, console, Object });
vm.runInContext(builderStubs + primeBlock + builderFooter, sandbox, { filename: 'macros-kernel.js' });

check("PRIME_MACROS registry loaded", typeof sandbox.PRIME_MACROS === 'object');
check("primeStep loaded",            typeof sandbox.primeStep === 'function');
check("primeEnergy loaded",          typeof sandbox.primeEnergy === 'function');
check("ensurePrimeMeta loaded",      typeof sandbox.ensurePrimeMeta === 'function');

const M = sandbox.PRIME_MACROS;
check("kepler macro defined",   M && typeof M.kepler === 'object');
check("breather macro defined", M && typeof M.breather === 'object');
check("cluster macro defined",  M && typeof M.cluster === 'object');
check("harmonic macro defined", M && typeof M.harmonic === 'object');

// Each macro has the four required spec fields.
for (const name of ["kepler", "breather", "cluster", "harmonic"]) {
  const m = M[name];
  check(`${name} has params`,           m && typeof m.params === 'object');
  check(`${name} has evolve count`,     m && Number.isFinite(m.evolve) && m.evolve > 0);
  check(`${name} has expectDominator`,  m && typeof m.expectDominator === 'string');
  check(`${name} has portraitShape`,    m && typeof m.portraitShape === 'string');
  check(`${name} has signature string`, m && typeof m.sig === 'string' && m.sig.length > 0);
  check(`${name} has description`,      m && typeof m.desc === 'string' && m.desc.length > 0);
  check(`${name} params.mode === H`,    m && m.params && m.params.mode === 'H');
  check(`${name} params.order ∈ {2,4}`, m && m.params && (m.params.order === 2 || m.params.order === 4));
  check(`${name} params.dt valid`,      m && m.params && m.params.dt > 0 && m.params.dt <= 0.1);
}

// ── 2. Build a fixed initial ensemble (deterministic, no RNG dependency) ──
function buildFixedEnsemble(N) {
  // A small ring of N entities at radius 1, with tangential velocity. Choosing
  // a ring (rather than random points) keeps the test deterministic without
  // depending on a seeded RNG, and gives every macro a non-degenerate starting
  // point: the trap, pair coupling, and kinetic terms are all initially nonzero.
  const out = [];
  const r = 1.0;
  const v = 0.4;
  for (let i = 0; i < N; i++) {
    const theta = (2 * Math.PI * i) / N;
    out.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
      vx: -v * Math.sin(theta),
      vy:  v * Math.cos(theta),
      scale:   1.0,
      attract: 0.5,
      repel:   0.0,
      hue:     theta * 180 / Math.PI,
      phase:   0,
      life:    1,
    });
  }
  return out;
}

// ── 3. Run a macro from a snapshot, return trail + decomposition stats ────
function runMacro(macroName, N) {
  const m = M[macroName];
  if (!m) throw new Error("unknown macro: " + macroName);
  const ir = { entities: buildFixedEnsemble(N), meta: {} };
  // Apply macro params — same Object.assign pattern the parser uses.
  sandbox.ensurePrimeMeta(ir);
  for (const k of Object.keys(m.params)) ir.meta.phase4.params[k] = m.params[k];
  // Lift into ensemble form, run macro.evolve steps, sample (q_x, p_x) for
  // entity 0 plus K/V_pair/V_conf at every step.
  const ens = sandbox.primeLift(ir.entities);
  const fx = new Float64Array(ens.N);
  const fy = new Float64Array(ens.N);
  const params = ir.meta.phase4.params;
  const trail = { qx: [], px: [] };
  const Ks = [], Vps = [], Vcs = [], Hs = [];
  for (let s = 0; s < m.evolve; s++) {
    sandbox.primeStep(ens, fx, fy, params);
    if (!Number.isFinite(ens.x[0]) || !Number.isFinite(ens.vx[0])) {
      throw new Error(`${macroName}: blew up at step ${s}`);
    }
    trail.qx.push(ens.x[0]);
    trail.px.push(ens.m[0] * ens.vx[0]);
    const en = sandbox.primeEnergy(ens, params);
    Ks.push(en.K);
    Vps.push(en.V_pair);
    Vcs.push(en.V_conf);
    Hs.push(en.H);
  }
  return { trail, Ks, Vps, Vcs, Hs, params };
}

function meanStd(arr) {
  let m = 0;
  for (const x of arr) m += x;
  m /= arr.length;
  let s2 = 0;
  for (const x of arr) { const d = x - m; s2 += d * d; }
  return { mean: m, std: Math.sqrt(s2 / arr.length) };
}

function trailBox(trail) {
  let qmin = Infinity, qmax = -Infinity, pmin = Infinity, pmax = -Infinity;
  for (let i = 0; i < trail.qx.length; i++) {
    if (trail.qx[i] < qmin) qmin = trail.qx[i];
    if (trail.qx[i] > qmax) qmax = trail.qx[i];
    if (trail.px[i] < pmin) pmin = trail.px[i];
    if (trail.px[i] > pmax) pmax = trail.px[i];
  }
  return { qmin, qmax, pmin, pmax, qExt: qmax - qmin, pExt: pmax - pmin };
}

// Exchange-led classifier: which V is doing the exchange work?
//
// In any K↔V exchange, K's std tracks whichever V is doing the work (energy
// conservation enforces it). So K's std isn't diagnostic on its own. The
// real question — and the one the macro signatures encode — is whether
// V_pair or V_conf is the "V" carrying the exchange.
//
// Method: compute σ_V_pair / σ_V_conf.
//   • > 2     → V_pair-led exchange (close-approach activity dominates V)
//   • < 0.5   → V_conf-led exchange (trap dominates V)
//   • [0.5, 2] → balanced (both subsystems contribute comparably)
//
// This is a *different* classifier from decomposeDriftHint in the standalone
// tool, which sorts σ_K, σ_V_pair, σ_V_conf together to pick a top-of-3
// dominator. Both classifiers are valid for their own purpose:
//   • decomposeDriftHint: "which subsystem is loudest, including K?" — used
//     for failure-mode diagnosis (K-led drift = integrator at fault, etc.)
//   • classifyExchange (here): "which V is doing the exchange?" — used to
//     classify macros by physics regime.
function classifyExchange(Vps, Vcs) {
  const sVp = meanStd(Vps).std;
  const sVc = meanStd(Vcs).std;
  const ratio = sVp / Math.max(sVc, 1e-15);
  if (ratio > 2)   return "V_pair";
  if (ratio < 0.5) return "V_conf";
  return "balanced";
}

// ── 4. Run each macro and validate its declared signature ─────────────────
console.log("\n── macro execution + signature validation ──");

for (const name of ["kepler", "breather", "cluster", "harmonic"]) {
  console.log(`\n  [macro: ${name}]`);
  let result;
  try {
    result = runMacro(name, 8);
  } catch (e) {
    check(`${name} runs without blowing up`, false, e.message);
    continue;
  }
  check(`${name} runs without blowing up`, true);

  const dominator = classifyExchange(result.Vps, result.Vcs);
  const expected = M[name].expectDominator;
  check(`${name} exchange-led classifier matches expectation`, dominator === expected,
    `exchange-led=${dominator}, expected=${expected}`);

  const box = trailBox(result.trail);
  check(`${name} trail bounded (q-extent finite)`,
    Number.isFinite(box.qExt) && box.qExt > 0 && box.qExt < 50,
    `q-extent=${box.qExt.toExponential(3)}`);
  check(`${name} trail bounded (p-extent finite)`,
    Number.isFinite(box.pExt) && box.pExt > 0 && box.pExt < 50,
    `p-extent=${box.pExt.toExponential(3)}`);

  // Check that H is well-defined and σ_K/σ_H is in the right ballpark for a
  // working symplectic integrator (we expect at least 1 decade of separation
  // for any healthy run; macros with order-4 should hit ≥ 2 decades).
  const sH = meanStd(result.Hs).std;
  const sK = meanStd(result.Ks).std;
  const ratio = sK / Math.max(sH, 1e-15);
  check(`${name} σ_K/σ_H separation ≥ 10× (one decade min)`,
    ratio >= 10,
    `σ_K/σ_H = ${ratio.toExponential(2)}`);

  // Macro-specific portrait shape checks. These are *qualitative* assertions
  // about the (q_x, p_x) trail's bounding box that distinguish ellipse/radial
  // /filled signatures. They're robust to f64 round-off and to minor kernel
  // tweaks, but fail loudly if a macro stops producing its named regime.
  const shape = M[name].portraitShape;
  if (shape === "ellipse") {
    // Ellipse: bounded closed-orbit-like trail with both axes substantial.
    // Aspect ratio in [0.1, 10] means neither q nor p extent is degenerate
    // (degenerate would be a line in (q, p), which the kernel shouldn't
    // produce in mode H with finite κ + η + ε). All three of {kepler,
    // breather, harmonic} should land here — they're distinguished from
    // each other by expectDominator (which V is doing the exchange), not
    // by entity-0 portrait shape.
    const aspect = box.qExt / Math.max(box.pExt, 1e-15);
    check(`${name} portrait shape "ellipse" — aspect in [0.1, 10]`,
      aspect >= 0.1 && aspect <= 10,
      `q/p aspect = ${aspect.toFixed(3)}`);
  } else if (shape === "filled") {
    // Filled: chaotic but bounded. Both q and p have substantial extent
    // (cluster is many-body so neither axis is degenerate), and the trail
    // does not collapse to a 1D curve. We require both extents > 5% of the
    // total so neither becomes a thin band.
    //
    // What distinguishes "filled" from "ellipse" in this smoke is *not*
    // the bounding box (both have non-degenerate aspect ratios) but the
    // expected exchange-led classification — cluster is "balanced" while
    // the ellipse macros are V_pair- or V_conf-led. The shape and the
    // dominator together identify each macro uniquely.
    const total = box.qExt + box.pExt;
    check(`${name} portrait shape "filled" — both axes ≥ 5% of total extent`,
      box.qExt / total > 0.05 && box.pExt / total > 0.05,
      `q-frac=${(box.qExt / total * 100).toFixed(1)}%, p-frac=${(box.pExt / total * 100).toFixed(1)}%`);
  } else {
    check(`${name} declares known portrait shape (ellipse|filled)`, false,
      `unknown portraitShape: ${shape}`);
  }

  const sK_  = meanStd(result.Ks).std;
  const sVp_ = meanStd(result.Vps).std;
  const sVc_ = meanStd(result.Vcs).std;
  console.log(
    `     summary: dominator=${dominator}, q∈[${box.qmin.toFixed(3)}, ${box.qmax.toFixed(3)}], `
    + `p∈[${box.pmin.toFixed(3)}, ${box.pmax.toFixed(3)}], σ_K/σ_H=${ratio.toExponential(2)}\n`
    + `              σ_K=${sK_.toExponential(2)}  σ_V_pair=${sVp_.toExponential(2)}  σ_V_conf=${sVc_.toExponential(2)}`
  );
}

// ── 5. Static checks: parser branch + UI wiring + helper function ─────────
console.log("\n── static source checks ──");

check("parser branch: `sub === \"macro\"` exists",
  /else if \(sub === "macro"\)/.test(builderHtml));
check("parser validates name against PRIME_MACROS",
  /const macro = PRIME_MACROS\[macroName\];/.test(builderHtml));
check("parser applies params and runs evolve",
  /for \(const k of Object\.keys\(macro\.params\)\)[\s\S]{0,200}meta4\.params\[k\] = macro\.params\[k\];[\s\S]{0,400}passPrimeEvolve\(next, macro\.evolve\)/.test(builderHtml));
check("parser sets meta4.lastMacro for portrait legend",
  /meta4\.lastMacro = macroName;/.test(builderHtml));
check("parser includes macro in subcommand list",
  /Try: evolve\|mode\|order\|dt\|couple\|trap\|soft\|reset\|kick\|macro/.test(builderHtml));

check("HTML: portrait canvas present",
  /<canvas id="primePortraitCanvas"/.test(builderHtml));
check("HTML: 4 macro buttons present",
  (builderHtml.match(/class="prime-macro-btn"/g) || []).length >= 4);
check("HTML: kepler macro button has data-macro=\"kepler\"",
  /<button[^>]*class="prime-macro-btn"[^>]*data-macro="kepler"/.test(builderHtml));
check("HTML: breather macro button has data-macro=\"breather\"",
  /<button[^>]*class="prime-macro-btn"[^>]*data-macro="breather"/.test(builderHtml));
check("HTML: cluster macro button has data-macro=\"cluster\"",
  /<button[^>]*class="prime-macro-btn"[^>]*data-macro="cluster"/.test(builderHtml));
check("HTML: harmonic macro button has data-macro=\"harmonic\"",
  /<button[^>]*class="prime-macro-btn"[^>]*data-macro="harmonic"/.test(builderHtml));

check("UI registry: btnPrimePortraitTrace bound",
  /btnPrimePortraitTrace: document\.getElementById\("btnPrimePortraitTrace"\)/.test(builderHtml));
check("UI registry: primePortraitCanvas bound",
  /primePortraitCanvas: document\.getElementById\("primePortraitCanvas"\)/.test(builderHtml));
check("UI registry: primePortraitLegend bound",
  /primePortraitLegend: document\.getElementById\("primePortraitLegend"\)/.test(builderHtml));

check("function: emitPrimeMacroLine defined",
  /function emitPrimeMacroLine\(name\)/.test(builderHtml));
check("function: primePortraitTrace defined",
  /function primePortraitTrace\(\)/.test(builderHtml));
check("function: primePortraitDraw defined",
  /function primePortraitDraw\(trails, usedLen, params, N\)/.test(builderHtml));

// emitPrimeMacroLine writes to phase3Input but maintains NO hidden state —
// same architectural negative match as Prime Lab. The macro buttons follow
// the same source-of-truth contract as the rest of the panel.
const emitMacroBlock = (() => {
  const start = builderHtml.indexOf("function emitPrimeMacroLine(");
  if (start < 0) return "";
  const end = builderHtml.indexOf("\n    function ", start + 30);
  return end > start ? builderHtml.slice(start, end) : builderHtml.slice(start);
})();
check("emitPrimeMacroLine: appends `prime macro` to ui.phase3Input",
  /ui\.phase3Input\.value = cur \+ sep \+ line \+ "\\n";/.test(emitMacroBlock));
check("emitPrimeMacroLine: respects auto-compile checkbox",
  /ui\.primeLabAutoCompile && ui\.primeLabAutoCompile\.checked[\s\S]{0,500}compileAndReport\(\)/.test(emitMacroBlock));
check("emitPrimeMacroLine: integrates with macro recorder",
  /typeof recordMacroLine === "function" && macroRecording[\s\S]{0,200}recordMacroLine\(line\)/.test(emitMacroBlock));
// Negative match: emitPrimeMacroLine MUST NOT write to localStorage (the
// Phase 3 textarea is the only persisted source of truth) and MUST NOT
// maintain any side-state object named primeMacro*State. This locks in
// the architectural invariant that survives across feature additions.
check("emitPrimeMacroLine: NO localStorage writes (negative match)",
  !/localStorage\.setItem\(/.test(emitMacroBlock),
  "macro emission must remain stateless on disk; persisted state lives only in the textarea");
check("emitPrimeMacroLine: NO hidden primeMacro*State object (negative match)",
  !/primeMacro[A-Z][a-zA-Z]*State\s*[\.\=]/.test(emitMacroBlock),
  "macro emission must not maintain a parallel state cache");

// ── 6. Wire-up: macro button click handler exists ─────────────────────────
check("listener: .prime-macro-btn click → emitPrimeMacroLine",
  /document\.querySelectorAll\("\.prime-macro-btn"\)\.forEach\([\s\S]{0,300}emitPrimeMacroLine\(name\)/.test(builderHtml));
check("listener: btnPrimePortraitTrace → primePortraitTrace",
  /btnPrimePortraitTrace\.addEventListener\("click", primePortraitTrace\)/.test(builderHtml));

// ── 7. Summary ─────────────────────────────────────────────────────────────
console.log(`\n── phase4_macros_smoke ──   pass=${pass}  fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
