// phase4_shuffle_determinism.js
//
// Permutation-stability smoke for the prime kernel.
//
// IMPORTANT INTERPRETIVE NOTE
// ───────────────────────────
// What this smoke establishes:
//   • The kernel does not have a hidden order-sensitive bug (e.g. early-exit
//     summation, indexing-aware caching, or sign-asymmetric pair force).
//   • The amount of f64 round-off attributable purely to summation order is
//     small (~1e-14) and therefore the conservation diagnostics surfaced by
//     the LED, σ_K/σ_H, and the dt-halving smoke are *physically* meaningful
//     rather than artifacts of one particular entity layout.
//   • Two different machines computing the same prime evolution on the same
//     entity set will agree to within this f64 ceiling regardless of how
//     they happen to enumerate pairs internally — i.e. determinism is
//     portable across hardware in the practical sense, even though it is
//     *not* bit-identical at the f64 level when entity order changes.
//
// What this smoke does NOT establish:
//   • That the chosen pair-force formula is the *correct* physics (that's
//     phase4_prime_bridge.js's job: bit-identical agreement between two
//     independently-implemented kernels at fixed order).
//   • That the integrator preserves the symplectic structure (that's
//     phase4_hamiltonian_smoke.js's L_z drift + dt-halving witnesses).
//   • That symplecticity continues to hold under arbitrary code edits
//     (any of the above can be true while reordering breaks something).
//
// The constellation of evidence for "deterministic, conservative, portable":
//   • bit-identical cross-port at fixed order → math is the same in two
//     implementations  (phase4_prime_bridge.js)
//   • L_z drift at f64 epsilon × N_steps → rotational symmetry is preserved
//     by the splitting  (phase4_hamiltonian_smoke.js)
//   • dt-halving ratio ≈ 12–16× → order-4 composition is correctly applied
//     (phase4_hamiltonian_smoke.js)
//   • permutation stability at f64 round-off → no hidden order-dependence
//     (this file)
// Drop any one and the others can still be true while this property fails.
// Read |Δstate| ≤ 1e-12 below as "the kernel doesn't care about your
// entity layout", not "the kernel is the right physics."
//
// ── Method (unchanged) ─────────────────────────────────────────────────────
// The cross-port smoke (phase4_prime_bridge.js) proved that two independent
// implementations agree bit-for-bit on the *same* entity ordering. That's a
// claim about the math; this smoke makes a separate claim about the *code*:
//
//   When the same kernel is fed the same physical state with entities listed
//   in two different orders, the resulting trajectories agree up to floating-
//   point non-associativity of the pair-summation order — and we want to
//   measure how much non-associativity there actually is.
//
// Why this matters:
//   • The prime pass family ships as part of svg42's deterministic core.
//     "Same pipeline produces same IR every run" is the load-bearing property
//     for checkpoints, A/B compare, session bundles, and the cross-port smoke.
//   • If conservation diagnostics are silently dependent on a particular entity
//     order (because that order happens to put close-approach pairs together
//     and minimises catastrophic cancellation), then sorting entities in a
//     different order would give different conservation numbers — and our
//     "round-off level L_z conservation" claim would be hardware-dependent.
//
// Method:
//   1. Build an ensemble of N entities.
//   2. Snapshot it. Run prime evolve for K steps. Call this state_natural.
//   3. Re-snapshot. Apply a permutation π. Run prime evolve for K steps.
//      Apply π⁻¹ to bring entities back to natural order. Call this state_shuffled.
//   4. Compute max |state_natural − state_shuffled|.
//
// Expected results:
//   • Exact 0 ⇒ unusually stable summation (kernel uses pair-symmetric updates
//     that happen to be permutation-invariant in arithmetic order).
//   • ~1e-15 ⇒ normal f64 non-associativity. Acceptable. This is what we'd
//     expect from any non-Kahan-summed pair force.
//   • > 1e-12 ⇒ red flag. The kernel is sensitive to entity order in a way
//     that suggests a bug or a deeply unstable summation scheme.
//
// We also check:
//   • Energy H is permutation-stable to ≤ 1e-13.
//   • Angular momentum L_z is permutation-stable to ≤ 1e-13.
//   • The result holds for both Verlet 2 and Yoshida 4.
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  ✓  ${label}`); if (detail) console.log(`     ${detail}`); }
  else { fail++; console.log(`  ✗  ${label}  (${detail || ""})`); }
}

// ── Load standalone phase 4 kernel into a sandbox (it has Ensemble, which
//    builds entities for us via Float64Array initialisation). ───────────────
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
`;
const sandboxA = vm.createContext({ Math, Float64Array, Uint32Array, Float32Array, console });
vm.runInContext(phase4Math + '\n' + phase4Footer, sandboxA, { filename: 'phase4-A.js' });
const EnsembleA = sandboxA.Ensemble;

// ── Load builder prime kernel into sandbox B ──────────────────────────────
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
globalThis.passPrimeEvolve = passPrimeEvolve;
globalThis.primeLift = primeLift;
globalThis.primeEnergy = primeEnergy;
globalThis.primeInvariants = primeInvariants;
`;
const sandboxB = vm.createContext({ Math, Float64Array, Uint32Array, Float32Array, console, Object });
vm.runInContext(builderStubs + primeBlock + builderFooter, sandboxB, { filename: 'phase4-B.js' });
const BAPI = sandboxB;

// ── Helpers ──────────────────────────────────────────────────────────────
function entitiesFromEnsemble(ens) {
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

// Deterministic permutation of {0..N-1} from a seed (Fisher–Yates with mulberry32).
function permutation(N, seed) {
  const rng = sandboxA.mulberry32(seed >>> 0);
  const perm = new Array(N);
  for (let i = 0; i < N; i++) perm[i] = i;
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  return perm;
}

function applyPermutation(entities, perm) {
  // perm[i] = j means "the new slot i comes from old slot j".
  const out = new Array(entities.length);
  for (let i = 0; i < entities.length; i++) out[i] = entities[perm[i]];
  return out;
}

function unpermute(entities, perm) {
  // Inverse: place perm[i]'s payload back at slot perm[i].
  const out = new Array(entities.length);
  for (let i = 0; i < entities.length; i++) out[perm[i]] = entities[i];
  return out;
}

function maxAbs(a, b) {
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    m = Math.max(m, Math.abs(a[i].x  - b[i].x));
    m = Math.max(m, Math.abs(a[i].y  - b[i].y));
    m = Math.max(m, Math.abs(a[i].vx - b[i].vx));
    m = Math.max(m, Math.abs(a[i].vy - b[i].vy));
  }
  return m;
}

// ── 0. Sanity: permutation/unpermutation round-trips ──────────────────────
{
  const eA = new EnsembleA(8, 1);
  const ents = entitiesFromEnsemble(eA);
  const perm = permutation(8, 0xCAFE);
  const shuffled = applyPermutation(ents, perm);
  const restored = unpermute(shuffled, perm);
  const m = maxAbs(ents, restored);
  check("permutation round-trips: π⁻¹(π(state)) = state",
    m === 0, `max |Δ| = ${m}`);
}

// ── Main: run shuffled vs natural and compare ────────────────────────────
function runShuffleCheck(N, steps, order, perm_seed, ens_seed) {
  const params = {
    mode: "H", order, dt: 0.005,
    kappa: 0.4, eps: 0.1, eta: 0.2,
    gamma: 0.3, beta: 0.1
  };

  // Natural trajectory.
  const eAnat = new EnsembleA(N, ens_seed);
  const ents_nat = entitiesFromEnsemble(eAnat);
  const ir_nat = { entities: ents_nat, meta: { phase4: { params: { ...params } } } };
  BAPI.passPrimeEvolve(ir_nat, steps);

  // Shuffled trajectory: permute entities, evolve, then unpermute the result.
  const eAsh = new EnsembleA(N, ens_seed);  // identical IC seed
  const ents_sh_orig = entitiesFromEnsemble(eAsh);
  const perm = permutation(N, perm_seed);
  const ents_sh_perm = applyPermutation(ents_sh_orig, perm);
  const ir_sh = { entities: ents_sh_perm, meta: { phase4: { params: { ...params } } } };
  BAPI.passPrimeEvolve(ir_sh, steps);
  const restored = unpermute(ir_sh.entities, perm);

  // Energy/invariants are permutation-invariant scalars.
  const ensNatLifted = BAPI.primeLift(ir_nat.entities);
  const ensShLifted  = BAPI.primeLift(ir_sh.entities);
  const H_nat = BAPI.primeEnergy(ensNatLifted, params).H;
  const H_sh  = BAPI.primeEnergy(ensShLifted,  params).H;
  const Lz_nat = BAPI.primeInvariants(ensNatLifted).Lz;
  const Lz_sh  = BAPI.primeInvariants(ensShLifted ).Lz;

  return {
    diff:    maxAbs(ir_nat.entities, restored),
    dH:      Math.abs(H_nat - H_sh),
    dLz:     Math.abs(Lz_nat - Lz_sh),
    H_nat, H_sh, Lz_nat, Lz_sh
  };
}

// ── 1. Verlet 2: 100 steps, N=12 ──────────────────────────────────────────
{
  const r = runShuffleCheck(12, 100, 2, 0xBEEF, 314);
  // Tolerance: f64 non-associativity over ~100 steps × ~144 pair sums each
  // can plausibly accumulate to ~1e-13 worst-case. Anything < 1e-12 confirms
  // the kernel is permutation-stable in the practical sense.
  check("Verlet 2 (N=12, 100 steps): trajectory diff ≤ 1e-12 under permutation",
    r.diff < 1e-12, `max |Δstate| = ${r.diff.toExponential(3)}`);
  check("Verlet 2: H is permutation-stable to ≤ 1e-13",
    r.dH < 1e-13, `|ΔH| = ${r.dH.toExponential(3)} (H_nat=${r.H_nat.toExponential(4)}, H_sh=${r.H_sh.toExponential(4)})`);
  check("Verlet 2: L_z is permutation-stable to ≤ 1e-13",
    r.dLz < 1e-13, `|ΔLz| = ${r.dLz.toExponential(3)}`);
  // Report the bit-identicality status separately so the user can see whether
  // we got the "unusually stable" outcome (= 0) or the normal one (~1e-15).
  console.log(`     · summation regime: ${r.diff === 0
    ? "BIT-IDENTICAL (kernel is symbolically permutation-invariant)"
    : "non-associative (normal f64 round-off, " + r.diff.toExponential(2) + ")"}`);
}

// ── 2. Yoshida 4: 100 steps, N=12 ─────────────────────────────────────────
{
  const r = runShuffleCheck(12, 100, 4, 0xC0DE, 271);
  check("Yoshida 4 (N=12, 100 steps): trajectory diff ≤ 1e-12 under permutation",
    r.diff < 1e-12, `max |Δstate| = ${r.diff.toExponential(3)}`);
  check("Yoshida 4: H is permutation-stable to ≤ 1e-13",
    r.dH < 1e-13, `|ΔH| = ${r.dH.toExponential(3)}`);
  check("Yoshida 4: L_z is permutation-stable to ≤ 1e-13",
    r.dLz < 1e-13, `|ΔLz| = ${r.dLz.toExponential(3)}`);
  console.log(`     · summation regime: ${r.diff === 0
    ? "BIT-IDENTICAL (kernel is symbolically permutation-invariant)"
    : "non-associative (normal f64 round-off, " + r.diff.toExponential(2) + ")"}`);
}

// ── 3. Larger N stress test (more pairs, more potential for accumulation) ─
{
  const r = runShuffleCheck(32, 200, 4, 0xD00D, 17);
  // Tolerance scales with #pairs · steps; we relax slightly here.
  check("Yoshida 4 (N=32, 200 steps): trajectory diff ≤ 1e-10 under permutation",
    r.diff < 1e-10, `max |Δstate| = ${r.diff.toExponential(3)}`);
  check("N=32: H permutation-stable to ≤ 1e-12",
    r.dH < 1e-12, `|ΔH| = ${r.dH.toExponential(3)}`);
  check("N=32: L_z permutation-stable to ≤ 1e-12",
    r.dLz < 1e-12, `|ΔLz| = ${r.dLz.toExponential(3)}`);
  console.log(`     · summation regime: ${r.diff === 0
    ? "BIT-IDENTICAL"
    : "non-associative (" + r.diff.toExponential(2) + ")"}`);
}

console.log("");
console.log(`  ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
