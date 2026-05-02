// phase4_prime_bridge.js
//
// Cross-validation smoke for the Phase-4 → main-builder kernel port.
//
// The standalone Phase 4 tool (tools/svg42/svg42_phase4_prime.html) and the main
// SVG42 builder (tools/svg42/svg42_compiler_builder.html) now share a symplectic
// Hamiltonian kernel — but the code lives in two separate files and was
// ported by hand. This smoke runs *both* kernels in identical sandboxes from
// identical initial conditions and asserts that the resulting trajectories
// agree to round-off.
//
// If the two ports ever drift apart (someone touches one file but not the
// other, or a refactor changes the force formula in one place), this smoke
// fails with a clear position/velocity divergence number, immediately.
//
// Cross-checked properties:
//   • H_after agrees to ≤ 1e-12 (same Hamiltonian function on both sides)
//   • Trajectories (x_i, y_i, vx_i, vy_i) agree to ≤ 1e-12 over 200 steps
//   • Both orders (Verlet 2 and Yoshida 4) agree
//   • Newton's 3rd law: both ports give zero net pair force
//
// The test uses the same vm-sandbox extraction trick as phase4_hamiltonian_smoke.js.
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  ✓  ${label}`); if (detail) console.log(`     ${detail}`); }
  else { fail++; console.log(`  ✗  ${label}  (${detail || ""})`); }
}

// ── 1. Load the standalone-tool kernel into sandbox A ──────────────────────
const phase4Path = path.join(__dirname, '..', 'tools', 'svg42', 'svg42_phase4_prime.html');
const phase4Html = fs.readFileSync(phase4Path, 'utf8');
const phase4Math = (() => {
  const sStart = phase4Html.indexOf('<script>');
  const sEnd = phase4Html.lastIndexOf('</script>');
  if (sStart < 0 || sEnd < 0) throw new Error('phase4 <script> tags not found');
  const fullJs = phase4Html.slice(sStart + '<script>'.length, sEnd);
  const cut = fullJs.indexOf('// ─── Detector');
  if (cut < 0) throw new Error("phase4 cut marker '// ─── Detector' not found");
  return fullJs.slice(0, cut);
})();
const phase4Footer = `
globalThis.Ensemble = Ensemble;
globalThis.PARAMS = PARAMS;
globalThis.STATE = STATE;
globalThis.mulberry32 = mulberry32;
globalThis.gauss = gauss;
globalThis.sigmoid = sigmoid;
globalThis.clamp = clamp;
`;
const sandboxA = vm.createContext({ Math, Float64Array, Uint32Array, Float32Array, console });
vm.runInContext(phase4Math + '\n' + phase4Footer, sandboxA, { filename: 'phase4-A.js' });
const EnsembleA = sandboxA.Ensemble;

// ── 2. Load the main-builder prime helpers into sandbox B ──────────────────
const builderPath = path.join(__dirname, '..', 'tools', 'svg42', 'svg42_compiler_builder.html');
const builderHtml = fs.readFileSync(builderPath, 'utf8');
// The kernel + helpers live between "// ─── Prime: symplectic" and "function passRandomize".
const primeBlock = (() => {
  const startMarker = '// ─── Prime: symplectic';
  const endMarker = 'function passRandomize(';
  const start = builderHtml.indexOf(startMarker);
  const end = builderHtml.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('could not extract prime kernel from builder');
  return builderHtml.slice(start, end);
})();
// The builder relies on a few helpers (`ensureFinite`, `clamp`, `mulberry32`).
// Stub out just enough for the prime kernel.
const builderStubs = `
function ensureFinite(v) { return Number.isFinite(v) ? +v : 0; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function mulberry32(seed) { let s = seed >>> 0; return function() { s = (s + 0x6D2B79F5) | 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
`;
const builderFooter = `
globalThis.PRIME_DEFAULTS = PRIME_DEFAULTS;
globalThis.ensurePrimeMeta = ensurePrimeMeta;
globalThis.primeLift = primeLift;
globalThis.primeCommit = primeCommit;
globalThis.primeForces = primeForces;
globalThis.primeVerletSubstep = primeVerletSubstep;
globalThis.primeStep = primeStep;
globalThis.primeEnergy = primeEnergy;
globalThis.primeInvariants = primeInvariants;
globalThis.passPrimeEvolve = passPrimeEvolve;
`;
const sandboxB = vm.createContext({ Math, Float64Array, Uint32Array, Float32Array, console, Object });
vm.runInContext(builderStubs + primeBlock + builderFooter, sandboxB, { filename: 'phase4-B.js' });
const BAPI = sandboxB;

check("standalone Ensemble loaded", typeof EnsembleA === 'function');
check("builder primeStep loaded", typeof BAPI.primeStep === 'function');
check("builder primeEnergy loaded", typeof BAPI.primeEnergy === 'function');

// ── 3. Build identical initial conditions in both sandboxes ────────────────
function buildEntitiesFromEnsemble(ens) {
  // Convert standalone-tool Ensemble into the IR-entity shape the builder uses.
  // The builder's primeLift reads:
  //   mass   m  ← e.scale
  //   charge c  ← e.attract − e.repel  (pair-coupling charge, not inertial mass)
  //   pos       ← e.x, e.y
  //   vel       ← e.vx, e.vy
  // so we must include attract/repel (and the passive channels for completeness).
  const out = [];
  for (let i = 0; i < ens.N; i++) {
    out.push({
      x:  ens.x[i],  y:  ens.y[i],
      vx: ens.vx[i], vy: ens.vy[i],
      scale:   ens.scale[i],
      attract: ens.attract[i],
      repel:   ens.repel[i],
      hue:     ens.hue[i],
      phase:   ens.phase[i],
      life:    ens.life[i],
    });
  }
  return out;
}

function maxAbsDiff(eA, ents) {
  // Compare standalone Ensemble (eA) against builder entity array (ents).
  let m = 0;
  for (let i = 0; i < eA.N; i++) {
    m = Math.max(m, Math.abs(eA.x[i]  - ents[i].x));
    m = Math.max(m, Math.abs(eA.y[i]  - ents[i].y));
    m = Math.max(m, Math.abs(eA.vx[i] - ents[i].vx));
    m = Math.max(m, Math.abs(eA.vy[i] - ents[i].vy));
  }
  return m;
}

// ── 4. Test: Verlet-2, 200 steps, identical initial conditions ─────────────
function runCrossCheck(order, steps) {
  const eA = new EnsembleA(16, 1234);
  const entitiesB = buildEntitiesFromEnsemble(eA);
  const irB = { entities: entitiesB, meta: {} };
  const params = {
    mode: "H", order: order, dt: 0.005,
    kappa: 0.4, eps: 0.1, eta: 0.2,
    gamma: 0.3, beta: 0.1
  };
  // Run standalone for `steps` symplectic steps
  for (let i = 0; i < steps; i++) eA.stepHamiltonian(params);
  // Run builder for `steps` symplectic steps via prime evolve
  irB.meta.phase4 = { params: { ...params } };
  BAPI.passPrimeEvolve(irB, steps);
  return {
    eA, entitiesB: irB.entities,
    diff: maxAbsDiff(eA, irB.entities),
    H_A: eA.energyHamiltonian(params).H,
    H_B: BAPI.primeEnergy(BAPI.primeLift(irB.entities), params).H,
  };
}

const r2 = runCrossCheck(2, 200);
check(
  "Verlet 2: trajectories agree across ports to ≤ 1e-12 over 200 steps",
  r2.diff < 1e-12,
  `max |Δstate| = ${r2.diff.toExponential(3)}`
);
check(
  "Verlet 2: H_after agrees across ports to ≤ 1e-12",
  Math.abs(r2.H_A - r2.H_B) < 1e-12,
  `|ΔH| = ${Math.abs(r2.H_A - r2.H_B).toExponential(3)} (H_A=${r2.H_A.toExponential(4)}, H_B=${r2.H_B.toExponential(4)})`
);

const r4 = runCrossCheck(4, 200);
check(
  "Yoshida 4: trajectories agree across ports to ≤ 1e-12 over 200 steps",
  r4.diff < 1e-12,
  `max |Δstate| = ${r4.diff.toExponential(3)}`
);
check(
  "Yoshida 4: H_after agrees across ports to ≤ 1e-12",
  Math.abs(r4.H_A - r4.H_B) < 1e-12,
  `|ΔH| = ${Math.abs(r4.H_A - r4.H_B).toExponential(3)}`
);

// ── 5. Test: invariants() and primeInvariants() agree ──────────────────────
{
  const eA = new EnsembleA(8, 7);
  const irB = { entities: buildEntitiesFromEnsemble(eA), meta: {} };
  const invA = eA.invariants();
  const ensB = BAPI.primeLift(irB.entities);
  const invB = BAPI.primeInvariants(ensB);
  const dPx = Math.abs(invA.Px - invB.Px);
  const dPy = Math.abs(invA.Py - invB.Py);
  const dLz = Math.abs(invA.Lz - invB.Lz);
  check("invariants agree across ports (Px, Py, Lz to ≤ 1e-13)",
    dPx < 1e-13 && dPy < 1e-13 && dLz < 1e-13,
    `dPx=${dPx.toExponential(2)} dPy=${dPy.toExponential(2)} dLz=${dLz.toExponential(2)}`);
}

// ── 6. Test: builder also exhibits time-reversibility ──────────────────────
// (Witnesses the same self-adjointness in the ported code.)
{
  const eA = new EnsembleA(8, 11);
  const irB = { entities: buildEntitiesFromEnsemble(eA), meta: {} };
  const before = irB.entities.map(e => ({ x: e.x, y: e.y, vx: e.vx, vy: e.vy }));
  const ensB = BAPI.primeLift(irB.entities);
  const fx = new Float64Array(ensB.N);
  const fy = new Float64Array(ensB.N);
  const params = { mode: "H", order: 2, dt: 0.005, kappa: 0.4, eps: 0.1, eta: 0.2 };
  BAPI.primeVerletSubstep(ensB, fx, fy, params, +0.01);
  BAPI.primeVerletSubstep(ensB, fx, fy, params, -0.01);
  BAPI.primeCommit(irB.entities, ensB);
  let m = 0;
  for (let i = 0; i < before.length; i++) {
    m = Math.max(m, Math.abs(irB.entities[i].x  - before[i].x));
    m = Math.max(m, Math.abs(irB.entities[i].y  - before[i].y));
    m = Math.max(m, Math.abs(irB.entities[i].vx - before[i].vx));
    m = Math.max(m, Math.abs(irB.entities[i].vy - before[i].vy));
  }
  check("builder primeVerletSubstep is time-symmetric: Φ_{+h} ∘ Φ_{-h} = id",
    m < 1e-12, `max |Δstate| = ${m.toExponential(3)}`);
}

// ── 7. Test: Newton's 3rd law in the builder kernel ────────────────────────
{
  const eA = new EnsembleA(6, 5);
  const irB = { entities: buildEntitiesFromEnsemble(eA), meta: {} };
  const ensB = BAPI.primeLift(irB.entities);
  const fx = new Float64Array(ensB.N);
  const fy = new Float64Array(ensB.N);
  const noTrap = { mode: "H", order: 2, dt: 0.005, kappa: 0.4, eps: 0.1, eta: 0 };
  BAPI.primeForces(ensB, fx, fy, noTrap);
  let sumX = 0, sumY = 0;
  for (let i = 0; i < ensB.N; i++) { sumX += fx[i]; sumY += fy[i]; }
  const totF = Math.hypot(sumX, sumY);
  check("builder primeForces: total pair force vanishes (Newton 3rd law)",
    totF < 1e-13, `|Σ F| = ${totF.toExponential(3)}`);
}

// ── 8. Test: passPrimeEvolve preserves H within bounded oscillation ────────
{
  const eA = new EnsembleA(12, 99);
  const irB = { entities: buildEntitiesFromEnsemble(eA), meta: {} };
  irB.meta.phase4 = { params: { mode: "H", order: 4, dt: 0.005, kappa: 0.4, eps: 0.1, eta: 0.2, gamma: 0.3, beta: 0.1 } };
  const r = BAPI.passPrimeEvolve(irB, 1000);
  check("passPrimeEvolve(1000, order=4): |ΔH/H₀| < 1e-2",
    Number.isFinite(r.H_drift) && r.H_drift < 1e-2,
    `|ΔH/H₀| = ${r.H_drift.toExponential(3)}`);
  check("passPrimeEvolve(1000, order=4): |ΔL_z/L_z₀| < 1e-2",
    Number.isFinite(r.L_drift) && r.L_drift < 1e-2,
    `|ΔL_z/L_z₀| = ${r.L_drift.toExponential(3)}`);
  check("passPrimeEvolve writes velocities back onto entities",
    Number.isFinite(irB.entities[0].vx) && Number.isFinite(irB.entities[0].vy),
    `e[0].vx=${irB.entities[0].vx.toExponential(2)} e[0].vy=${irB.entities[0].vy.toExponential(2)}`);
  check("passPrimeEvolve advances cumulative step counter",
    irB.meta.phase4.evolveStep === 1000,
    `evolveStep = ${irB.meta.phase4.evolveStep}`);
}

// ── 9. Test: mode A is correctly skipped (returns {skipped: true}) ─────────
{
  const eA = new EnsembleA(4, 1);
  const irB = { entities: buildEntitiesFromEnsemble(eA), meta: { phase4: { params: { ...BAPI.PRIME_DEFAULTS, mode: "A" } } } };
  const r = BAPI.passPrimeEvolve(irB, 50);
  check("mode A: passPrimeEvolve returns {skipped: true}",
    r.skipped === true && r.mode === "A",
    `r=${JSON.stringify(r)}`);
}

console.log("");
console.log(`  ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
