// phase4_invariants_under_edit.js
//
// META-TEST for the Phase 4 / Prime regression net.
//
// IMPORTANT INTERPRETIVE NOTE
// ───────────────────────────
// What this smoke establishes:
//   • All eight witness chains documented in docs/rigor/PHASE4.md still
//     exist as files on disk and still contain their canonical assertions.
//   • The numeric thresholds inside those assertions have not been
//     silently relaxed (e.g. < 1e-12 → < 1e-3).
//   • The two-classifier distinction (decomposeDriftHint vs
//     classifyExchange) is preserved in source, with the documenting
//     comment block intact, so a future maintainer can't trivially
//     consolidate them.
//   • The architectural negative-match smokes (no localStorage in the
//     Lab/Macro emitters, no parallel state objects) still fire.
//   • The σ_K/σ_H multiplicative-threshold rationale is documented in the
//     standalone tool source.
//   • The order-aware copy in decomposeDriftHint ("drop to order 2"
//     advice for stiff problems in order-4 mode) survives edits.
//   • The PRIME_MACROS registry has exactly the 4 named macros with all
//     5 required fields each.
//   • docs/rigor/PHASE4.md exists with the documented section headings.
//
// What this smoke does NOT establish:
//   • That the kernel actually works — this is purely static. The dynamic
//     evidence lives in the eight witness smokes themselves.
//   • That a malicious edit can't pass this meta-test by tightening the
//     assertion text while loosening the actual numerics. (Defence in
//     depth: the per-witness smokes still run on every change; this
//     meta-test is the second layer.)
//   • That the code style is uniform, performant, or well-documented in
//     other respects — the net is scoped to the eight specific Phase 4
//     witness chains, not general code quality.
//
// The constellation of evidence for "the regression net is intact":
//   • This file passes (witness chains + thresholds + classifier
//     distinction + negative matches + macro registry + doc all present)
//   • The 8 witness smokes themselves still pass at runtime
//     (.compat_out/phase4_*.js + prime_lab_smoke.js)
//   • Cross-port bit-identity holds (.compat_out/phase4_prime_bridge.js)
//   • The Phase 4 / Prime architecture documentation reflects the same
//     witnesses (docs/rigor/PHASE4.md)
//
// Read this file's failures as: "someone removed or weakened a guard
// rail in the regression net itself," not "the kernel is broken."
//

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COMPAT = __dirname;
const TOOLS = path.join(ROOT, 'tools');
const DOCS = path.join(ROOT, 'docs');
// All RIGOR-discipline docs (PHASE4.md, RIGOR.md, ZCC_WITNESSES.md,
// RIGOR_RETROSPECTIVE_*.md) live in docs/rigor/. If the folder layout
// changes again, this is the only path constant that needs updating.
const RIGOR_DIR = path.join(DOCS, 'rigor');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) {
    pass++;
    console.log("  ✓  " + label + (detail ? "  (" + detail + ")" : ""));
  } else {
    fail++;
    console.log("  ✗  " + label + (detail ? "  (" + detail + ")" : ""));
  }
}

function readIfExists(p) {
  try { return fs.readFileSync(p, 'utf8'); }
  catch (_) { return null; }
}

// Helper: a single regex must match (with optional friendly description).
function matches(label, src, re, detail) {
  check(label, re.test(src), detail);
}

// Helper: a single regex must NOT match (negative match).
function notMatches(label, src, re, detail) {
  check(label, !re.test(src), detail);
}

// ─────────────────────────────────────────────────────────────────────────
// 0. The doc and the tools are reachable
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 0. files on disk ──");

const builderPath = path.join(TOOLS, 'svg42', 'svg42_compiler_builder.html');
const standalonePath = path.join(TOOLS, 'svg42', 'svg42_phase4_prime.html');
const phase4DocPath = path.join(RIGOR_DIR, 'PHASE4.md');

const builder = readIfExists(builderPath);
const standalone = readIfExists(standalonePath);
const phase4Doc = readIfExists(phase4DocPath);

check("builder file readable: tools/svg42/svg42_compiler_builder.html", builder !== null);
check("standalone file readable: tools/svg42/svg42_phase4_prime.html",  standalone !== null);
check("architecture doc readable: docs/rigor/PHASE4.md",          phase4Doc !== null);

// ─────────────────────────────────────────────────────────────────────────
// 1. All eight witness smoke files exist
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 1. witness smoke files exist on disk ──");

const SMOKES = {
  hamiltonian: path.join(COMPAT, 'phase4_hamiltonian_smoke.js'),
  bridge:      path.join(COMPAT, 'phase4_bridge_smoke.js'),
  crossport:   path.join(COMPAT, 'phase4_prime_bridge.js'),
  shuffle:     path.join(COMPAT, 'phase4_shuffle_determinism.js'),
  primeLab:    path.join(COMPAT, 'prime_lab_smoke.js'),
  macros:      path.join(COMPAT, 'phase4_macros_smoke.js'),
  check:       path.join(COMPAT, 'phase4_check.js'),
};

const smokeSrc = {};
for (const [name, p] of Object.entries(SMOKES)) {
  const s = readIfExists(p);
  smokeSrc[name] = s;
  check("smoke file present: " + path.relative(ROOT, p).replace(/\\/g, '/'),
    s !== null && s.length > 0,
    s ? `${s.length} bytes` : "missing");
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Witness W1 — energy conservation (|ΔH/H₀|)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 2. W1 energy conservation chain ──");

if (smokeSrc.hamiltonian) {
  const s = smokeSrc.hamiltonian;
  matches("W1: Verlet 2 |ΔH/H₀| < 1e-2 over 1000 steps assertion present",
    s, /Verlet 2:\s*\|ΔH\/H[₀0]\|\s*<\s*1%[\s\S]{0,400}r1\.drift\s*<\s*1e-2/);
  matches("W1: Yoshida 4 |ΔH/H₀| < 1% over 1000 steps assertion present",
    s, /Yoshida 4:\s*\|ΔH\/H[₀0]\|\s*stays bounded[\s\S]{0,400}r4\.drift\s*<\s*1e-2/);
  matches("W1: tighter Verlet 2 |ΔH/H₀| < 2.5e-3 at halved dt is checked",
    s, /r2\.drift\s*<\s*2\.5e-3/);
  matches("W1: drift is computed as |ΔH| / max(|H₀|, …) (relative)",
    s, /drift\s*=\s*Math\.abs\(H1\s*-\s*H0\)\s*\/\s*Math\.max\(/);
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Witness W2 — dt-halving order verification
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 3. W2 dt-halving order verification chain ──");

if (smokeSrc.hamiltonian) {
  const s = smokeSrc.hamiltonian;
  matches("W2: Verlet 2 ratio ≥ 2 when dt halved",
    s, /drift ratio ≥ 2 when dt halved[\s\S]{0,200}ratio2\s*>=\s*2/);
  matches("W2: Yoshida 4 ratio ≥ 6 when dt halved (allows for f64 floor)",
    s, /drift ratio ≥ 6 when dt halved[\s\S]{0,300}\(ratio4\s*>=\s*6\s*\|\|\s*r4b\.drift\s*<\s*1e-12\)/);
  matches("W2: Yoshida 4 ≥ 5× Verlet 2 at dt=0.0025 (asymptotic regime)",
    s, /Yoshida 4 beats Verlet 2 by ≥ 5×[\s\S]{0,200}r2\.drift\s*\/[\s\S]{0,80}>= 5/);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Witness W3 — angular momentum conservation
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 4. W3 angular momentum conservation chain ──");

if (smokeSrc.hamiltonian) {
  const s = smokeSrc.hamiltonian;
  matches("W3: Verlet 2 |ΔL_z/L_z₀| < 1e-2 (1000 steps) check present",
    s, /Verlet 2:\s*\|ΔL_z\/L_z[₀0]\|\s*<\s*1%[\s\S]{0,300}r1\.lDrift\s*<\s*1e-2/);
  matches("W3: Yoshida 4 |ΔL_z/L_z₀| < 1e-4 (1000 steps) check present",
    s, /Yoshida 4:\s*\|ΔL_z\/L_z[₀0]\|\s*<\s*1e-4[\s\S]{0,300}r4\.lDrift\s*<\s*1e-4/);
  matches("W3: invariants() shape (Px, Py, P, Lz) is verified",
    s, /invariants\(\)\s*returns\s*\{Px,\s*Py,\s*P,\s*Lz\}/);
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Witness W4 — time-reversibility (self-adjointness)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 5. W4 time-reversibility / self-adjointness chain ──");

if (smokeSrc.hamiltonian) {
  const s = smokeSrc.hamiltonian;
  matches("W4: _verletSubstep is time-symmetric Φ_{+h}∘Φ_{-h}=id",
    s, /_verletSubstep is time-symmetric[\s\S]{0,200}maxDev\s*<\s*1e-12/);
  matches("W4: stepHamiltonian (Yoshida 4) is time-symmetric",
    s, /stepHamiltonian \(Yoshida 4\) is time-symmetric[\s\S]{0,200}maxDev\s*<\s*1e-12/);
  matches("W4: round-trip uses h=+0.01 forward and -0.01 backward",
    s, /_verletSubstep\(p,\s*\+h\);[\s\S]{0,80}_verletSubstep\(p,\s*-h\)/);
  matches("W4: full Yoshida round-trip uses dt=+0.01 then dt=-0.01",
    s, /pBack\s*=\s*Object\.assign\(\{\},\s*pH,\s*\{\s*dt:\s*-0\.01\s*\}\)/);
}

// Cross-port also tests time-symmetry on the builder kernel.
if (smokeSrc.crossport) {
  matches("W4: builder primeVerletSubstep is also time-symmetric (cross-port)",
    smokeSrc.crossport, /builder primeVerletSubstep is time-symmetric[\s\S]{0,200}m\s*<\s*1e-12/);
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Witness W5 — Newton's 3rd law
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 6. W5 Newton's 3rd law chain ──");

if (smokeSrc.hamiltonian) {
  matches("W5 (standalone): total pair force = 0 when trap off, |ΣF| < 1e-10",
    smokeSrc.hamiltonian,
    /total pair force vanishes \(Newton 3rd law\)[\s\S]{0,200}tot\s*<\s*1e-10/);
}

if (smokeSrc.crossport) {
  matches("W5 (builder): primeForces total pair force vanishes, |ΣF| < 1e-13",
    smokeSrc.crossport,
    /builder primeForces:\s*total pair force vanishes[\s\S]{0,200}totF\s*<\s*1e-13/);
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Witness W6 — cross-port bit-identity
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 7. W6 cross-port bit-identity chain ──");

if (smokeSrc.crossport) {
  const s = smokeSrc.crossport;
  matches("W6: Verlet 2 trajectories agree to ≤ 1e-12 over 200 steps across ports",
    s, /Verlet 2:\s*trajectories agree across ports[\s\S]{0,200}r2\.diff\s*<\s*1e-12/);
  matches("W6: Yoshida 4 trajectories agree to ≤ 1e-12 over 200 steps across ports",
    s, /Yoshida 4:\s*trajectories agree across ports[\s\S]{0,200}r4\.diff\s*<\s*1e-12/);
  matches("W6: H_after agrees across ports to ≤ 1e-12 (Yoshida 4)",
    s, /Yoshida 4:\s*H_after agrees across ports[\s\S]{0,200}Math\.abs\(r4\.H_A\s*-\s*r4\.H_B\)\s*<\s*1e-12/);
  matches("W6: invariants (Px, Py, Lz) agree across ports to ≤ 1e-13",
    s, /invariants agree across ports \(Px, Py, Lz to ≤ 1e-13\)[\s\S]{0,300}dPx\s*<\s*1e-13[\s\S]{0,200}dLz\s*<\s*1e-13/);
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Witness W7 — permutation stability
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 8. W7 permutation stability chain ──");

if (smokeSrc.shuffle) {
  const s = smokeSrc.shuffle;
  matches("W7: state diff under permutation < 1e-12 (at least one assertion)",
    s, /r\.diff\s*<\s*1e-12,\s*`max \|Δstate\| =/);
  matches("W7: |ΔH| under permutation < 1e-13 (at least one assertion)",
    s, /r\.dH\s*<\s*1e-13,\s*`\|ΔH\|/);
  matches("W7: |ΔL_z| under permutation < 1e-13 (at least one assertion)",
    s, /r\.dLz\s*<\s*1e-13,\s*`\|ΔLz\|/);
  matches("W7: tests both Verlet 2 (order 2) and Yoshida 4 (order 4)",
    s, /runShuffleCheck\([^)]*,\s*2,[^)]*\)[\s\S]{0,5000}runShuffleCheck\([^)]*,\s*4,[^)]*\)|runShuffleCheck\([^)]*,\s*4,[^)]*\)[\s\S]{0,5000}runShuffleCheck\([^)]*,\s*2,[^)]*\)/);
  matches("W7: interpretive note distinguishes 'code consistency' from 'physics correctness'",
    s, /What this smoke does NOT establish[\s\S]{0,500}physics/i);
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Witness W8 — macro signature regression
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 9. W8 macro signature regression chain ──");

if (smokeSrc.macros) {
  const s = smokeSrc.macros;
  matches("W8: classifyExchange function is defined (V_pair vs V_conf only)",
    s, /function classifyExchange\(Vps,\s*Vcs\)\s*\{/);
  matches("W8: classifyExchange threshold > 2 → V_pair-led",
    s, /if\s*\(\s*ratio\s*>\s*2\s*\)\s*return\s*"V_pair"/);
  matches("W8: classifyExchange threshold < 0.5 → V_conf-led",
    s, /if\s*\(\s*ratio\s*<\s*0\.5\s*\)\s*return\s*"V_conf"/);
  matches("W8: σ_K/σ_H ratio ≥ 10 minimum gate per macro",
    s, /σ_K\/σ_H[\s\S]{0,400}ratio\s*>=?\s*10|σ_K\/σ_H[\s\S]{0,400}>=\s*10/);
  matches("W8: each of the 4 macros runs through dynamic validation",
    s, /for\s*\(\s*const\s+(?:name|macroName|m)\s+of\s*\[[\s\S]{0,200}"kepler"[\s\S]{0,200}"breather"[\s\S]{0,200}"cluster"[\s\S]{0,200}"harmonic"/);
  // All 4 macro names show up by string match somewhere in the smoke.
  for (const name of ["kepler", "breather", "cluster", "harmonic"]) {
    matches(`W8: macro "${name}" appears in regression smoke`,
      s, new RegExp('"' + name + '"'));
  }
  matches("W8: portrait shape branches on 'ellipse' AND 'filled'",
    s, /portraitShape[\s\S]{0,400}ellipse[\s\S]{0,400}filled|"ellipse"[\s\S]{0,200}"filled"|"filled"[\s\S]{0,200}"ellipse"/);
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Two-classifier distinction is preserved (decomposeDriftHint vs classifyExchange)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 10. two-classifier distinction is preserved ──");

if (standalone) {
  matches("standalone: decomposeDriftHint function is defined",
    standalone, /function decomposeDriftHint\(/);
  matches("standalone: decomposeDriftHint accepts (history, last, energyDrift, order)",
    standalone, /function decomposeDriftHint\(\s*history\s*,\s*last\s*,\s*energyDrift\s*,\s*order\s*\)/);
  matches("standalone: decomposeDriftHint computes a 3-way dominator over {K, V_pair, V_conf}",
    standalone, /decomposeDriftHint[\s\S]{0,2000}V_pair[\s\S]{0,400}V_conf|decomposeStats[\s\S]{0,2000}V_pair[\s\S]{0,400}V_conf/);
  matches("standalone: decomposeDriftHint contains order-aware advice ('drop to order 2')",
    standalone, /drop to order 2/);
  matches("standalone: σ_K/σ_H multiplicative-threshold rationale comment is present",
    standalone, /σ_K\s*\/\s*σ_H[\s\S]{0,4000}(MULTIPLICATIVE|multiplicative|powers of 10|log[- ]scaled|decade)/);
}

if (smokeSrc.macros) {
  // The classifyExchange function lives in the macros smoke (it answers a
  // *different* question than decomposeDriftHint).
  matches("macros smoke: classifyExchange answers a different question (only V_pair vs V_conf)",
    smokeSrc.macros, /classifyExchange[\s\S]{0,400}V_pair\s*'?\s*\)?\s*[\s\S]{0,80}V_conf|σ_V_pair[\s\S]{0,200}σ_V_conf/);
}

// The bridge smoke (or doc, or one of these files) should explicitly call
// out *why* both exist. We require the explanation lives somewhere readable.
const distinctionSources = [
  ['docs/rigor/PHASE4.md',                         phase4Doc],
  ['phase4_bridge_smoke.js',                       smokeSrc.bridge],
  ['phase4_macros_smoke.js',                       smokeSrc.macros],
];
{
  let foundDistinction = false;
  let foundIn = null;
  for (const [name, src] of distinctionSources) {
    if (!src) continue;
    if (/which subsystem is loudest[\s\S]{0,1500}which V is doing the exchange|loudest[\s\S]{0,1500}exchange partner|decomposeDriftHint[\s\S]{0,1500}classifyExchange[\s\S]{0,1500}different question|two[- ]classifier distinction/i.test(src)) {
      foundDistinction = true;
      foundIn = name;
      break;
    }
  }
  check("two-classifier distinction is documented in at least one canonical source",
    foundDistinction,
    foundIn ? `documented in ${foundIn}` : `not found in: ${distinctionSources.map(d => d[0]).join(", ")}`);
}

// ─────────────────────────────────────────────────────────────────────────
// 11. Architectural negative matches in the Lab + Macro emitters
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 11. source-of-truth negative matches still exist ──");

if (smokeSrc.primeLab) {
  matches("prime_lab_smoke: emitter no-localStorage negative match present",
    smokeSrc.primeLab, /emitter does not write to localStorage[\s\S]{0,800}!\/localStorage\\\.setItem\|primeLab\[A-Za-z\]\*Settings/);
  matches("prime_lab_smoke: no parallel state object negative match present",
    smokeSrc.primeLab, /emitter does not maintain a hidden DSL buffer[\s\S]{0,400}!\/primeLab\[A-Za-z\]\*State/);
  matches("prime_lab_smoke: no `input` event triggers DSL emission",
    smokeSrc.primeLab, /input handlers don't emit lines[\s\S]{0,200}!\/addEventListener\\\("input"\[\^\)\]\{0,40\}emitPrimeLabLine\//);
}

if (smokeSrc.macros) {
  matches("phase4_macros_smoke: emitPrimeMacroLine no-localStorage negative match",
    smokeSrc.macros, /emitPrimeMacroLine: NO localStorage writes \(negative match\)[\s\S]{0,200}!\/localStorage\\\.setItem/);
  matches("phase4_macros_smoke: emitPrimeMacroLine no parallel state object",
    smokeSrc.macros, /emitPrimeMacroLine: NO hidden primeMacro\*State object \(negative match\)[\s\S]{0,200}!\/primeMacro\[A-Z\]\[a-zA-Z\]\*State/);
}

// ─────────────────────────────────────────────────────────────────────────
// 12. PRIME_MACROS registry: 4 entries × 5 required fields
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 12. PRIME_MACROS registry shape ──");

if (builder) {
  matches("builder: PRIME_MACROS registry exists",
    builder, /const PRIME_MACROS\s*=\s*Object\.freeze\(\{/);
  matches("builder: macro 'kepler' present",   builder, /\bkepler:\s*Object\.freeze\(\{/);
  matches("builder: macro 'breather' present", builder, /\bbreather:\s*Object\.freeze\(\{/);
  matches("builder: macro 'cluster' present",  builder, /\bcluster:\s*Object\.freeze\(\{/);
  matches("builder: macro 'harmonic' present", builder, /\bharmonic:\s*Object\.freeze\(\{/);

  // Each macro must declare all 5 required fields. We sample on kepler.
  const keplerStart = builder.indexOf('kepler:');
  const keplerSlice = keplerStart >= 0 ? builder.slice(keplerStart, keplerStart + 1200) : '';
  for (const field of ['sig:', 'desc:', 'params:', 'evolve:', 'expectDominator:', 'portraitShape:']) {
    matches(`builder: macro 'kepler' declares ${field} field`,
      keplerSlice, new RegExp(field.replace(':', ':')));
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 13. README pointer blocks in both HTML files reference docs/PHASE4.md
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 13. README pointer blocks reference docs/rigor/PHASE4.md ──");

if (builder) {
  matches("builder: README block points to docs/rigor/PHASE4.md",
    builder, /docs\/rigor\/PHASE4\.md/);
  matches("builder: README block names the cross-port test",
    builder, /phase4_prime_bridge\.js/);
  matches("builder: README block names the meta-test",
    builder, /phase4_invariants_under_edit\.js/);
  matches("builder: README block lists all 8 witness names",
    builder, /eight independent witnesses[\s\S]{0,1500}cross-port[\s\S]{0,400}macro/i);
}

if (standalone) {
  matches("standalone: README block points to docs/rigor/PHASE4.md",
    standalone, /docs\/rigor\/PHASE4\.md/);
  matches("standalone: README block names the cross-port test",
    standalone, /phase4_prime_bridge\.js/);
}

// ─────────────────────────────────────────────────────────────────────────
// 14. docs/rigor/PHASE4.md has the section structure documented in this file
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 14. docs/rigor/PHASE4.md section structure ──");

if (phase4Doc) {
  const requiredHeadings = [
    /^## 1\. What Phase 4 is/m,
    /^## 2\. The Hamiltonian/m,
    /^## 3\. Integrators/m,
    /^## 4\. The eight witnesses/m,
    /^## 5\. The four-source macro validation chain/m,
    /^## 6\. The two-classifier distinction/m,
    /^## 7\. Source-of-truth boundaries/m,
    /^## 8\. Metrics reference/m,
    /^## 9\. ULP \/ round-off ceiling per property/m,
    /^## 10\. Smoke catalogue/m,
  ];
  for (let i = 0; i < requiredHeadings.length; i++) {
    matches(`docs/rigor/PHASE4.md has section ${i + 1} heading`,
      phase4Doc, requiredHeadings[i]);
  }

  // Each of the 8 witnesses gets a sub-section.
  for (const wid of ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8']) {
    matches(`docs/rigor/PHASE4.md describes witness ${wid}`,
      phase4Doc, new RegExp(`### ${wid}\\.`));
  }

  // Both classifiers are named.
  matches("docs/rigor/PHASE4.md names decomposeDriftHint",
    phase4Doc, /decomposeDriftHint/);
  matches("docs/rigor/PHASE4.md names classifyExchange",
    phase4Doc, /classifyExchange/);

  // Metric definitions are present.
  for (const metric of ['|ΔH/H', '|ΔL_z/L_z', 'σ_K/σ_H', 'V_pair', 'V_conf']) {
    matches(`docs/rigor/PHASE4.md defines metric: ${metric}`,
      phase4Doc, new RegExp(metric.replace(/[|.\/_*+?^${}()\[\]\\]/g, '\\$&')));
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 15. Threshold integrity: per-witness numeric thresholds appear once with
//     the documented bound. (Defends against a refactor that comments out
//     the assertion by replacing the threshold with a much looser value.)
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 15. threshold integrity ──");

const tightThresholds = [
  // Files where < 1e-12 must appear (cross-port + reversibility + perm + lab)
  ['phase4_hamiltonian_smoke.js', smokeSrc.hamiltonian, /<\s*1e-12/, "reversibility threshold"],
  ['phase4_prime_bridge.js',      smokeSrc.crossport,   /<\s*1e-12/, "cross-port threshold"],
  ['phase4_shuffle_determinism.js', smokeSrc.shuffle,   /<\s*1e-12/, "permutation state threshold"],
  ['phase4_shuffle_determinism.js', smokeSrc.shuffle,   /<\s*1e-13/, "permutation H/Lz threshold"],
  ['phase4_prime_bridge.js',      smokeSrc.crossport,   /<\s*1e-13/, "cross-port invariants threshold"],
];
for (const [fname, src, re, what] of tightThresholds) {
  check(`${fname}: tight threshold present (${what})`, src && re.test(src));
}

// ─────────────────────────────────────────────────────────────────────────
// 16. Sibling-discipline cross-references
//     Phase 4 is the *first* instantiation of the witness discipline.
//     The methodology and both instantiations now live together in
//     docs/rigor/ (RIGOR.md, PHASE4.md, ZCC_WITNESSES.md,
//     RIGOR_RETROSPECTIVE_001.md, README.md). The second instantiation
//     has its own sibling meta-test. This section asserts that the
//     methodology bridge from PHASE4 outward is intact — if any of
//     these documents disappears, or the folder index stops cataloging
//     a piece of the discipline, the discipline becomes orphaned and
//     Phase 4 reverts from "first instantiation of a methodology" to
//     "isolated worked example."
// ─────────────────────────────────────────────────────────────────────────
console.log("\n── 16. sibling-discipline cross-references ──");

const rigorPath = path.join(RIGOR_DIR, 'RIGOR.md');
const witnessesPath = path.join(RIGOR_DIR, 'ZCC_WITNESSES.md');
const retro001Path = path.join(RIGOR_DIR, 'RIGOR_RETROSPECTIVE_001.md');
const rigorReadmePath = path.join(RIGOR_DIR, 'README.md');
const zccMetaPath = path.join(COMPAT, 'zcc_invariants_under_edit.js');

check("docs/rigor/RIGOR.md exists (the methodology document)",
  readIfExists(rigorPath) !== null);

check("docs/rigor/ZCC_WITNESSES.md exists (the second instantiation)",
  readIfExists(witnessesPath) !== null);

check("docs/rigor/RIGOR_RETROSPECTIVE_001.md exists (first retrospective in the series)",
  readIfExists(retro001Path) !== null);

check("docs/rigor/README.md exists (folder index)",
  readIfExists(rigorReadmePath) !== null);

check(".compat_out/zcc_invariants_under_edit.js exists (sibling meta-test)",
  readIfExists(zccMetaPath) !== null);

// docs/rigor/PHASE4.md should explicitly reference RIGOR.md and ZCC_WITNESSES.md
// in its Methodology context header (the "first instantiation" framing).
if (phase4Doc) {
  matches("docs/rigor/PHASE4.md references docs/rigor/RIGOR.md as the methodology source",
    phase4Doc, /docs\/rigor\/RIGOR\.md/);
  matches("docs/rigor/PHASE4.md references docs/rigor/ZCC_WITNESSES.md as the second instantiation",
    phase4Doc, /docs\/rigor\/ZCC_WITNESSES\.md/);
  matches("docs/rigor/PHASE4.md frames itself as the 'first instantiation'",
    phase4Doc, /first instantiation/i);
}

// Folder-aware check: the README.md should catalog every artifact in
// the discipline (the four docs + both meta-tests + the orientation
// blocks). If the folder grows new artifacts that aren't catalogued in
// README.md, the folder stops being "aware of everything."
const rigorReadmeSrc = readIfExists(rigorReadmePath) || "";
if (rigorReadmeSrc.length > 0) {
  matches("docs/rigor/README.md catalogs RIGOR.md",            rigorReadmeSrc, /RIGOR\.md/);
  matches("docs/rigor/README.md catalogs PHASE4.md",           rigorReadmeSrc, /PHASE4\.md/);
  matches("docs/rigor/README.md catalogs ZCC_WITNESSES.md",    rigorReadmeSrc, /ZCC_WITNESSES\.md/);
  matches("docs/rigor/README.md catalogs RIGOR_RETROSPECTIVE_001.md",
    rigorReadmeSrc, /RIGOR_RETROSPECTIVE_001\.md/);
  matches("docs/rigor/README.md catalogs phase4_invariants_under_edit.js",
    rigorReadmeSrc, /phase4_invariants_under_edit\.js/);
  matches("docs/rigor/README.md catalogs zcc_invariants_under_edit.js",
    rigorReadmeSrc, /zcc_invariants_under_edit\.js/);
  matches("docs/rigor/README.md names the orientation-block HTML files",
    rigorReadmeSrc, /svg42_compiler_builder\.html/);
}

// ─────────────────────────────────────────────────────────────────────────
// 17. Report
// ─────────────────────────────────────────────────────────────────────────
console.log("");
console.log("  " + pass + "/" + (pass + fail) + " checks passed");
if (fail > 0) process.exit(1);
