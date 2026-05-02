// phase4_hamiltonian_smoke.js
//
// Numerical conservation test for the Hamiltonian mode (mode H) of
// tools/svg42/svg42_phase4_prime.html.
//
// Strategy:
//   1. Read the HTML file, locate the inline <script>, and slice it down to
//      everything up to (but not including) the line that starts touching the
//      DOM. The result contains: PARAMS, STATE, constants, mulberry32, gauss,
//      clamp, sigmoid, and the full Ensemble class definition.
//   2. Evaluate that slice inside a vm sandbox (no DOM, no window).
//   3. Construct an Ensemble, snapshot H₀ via energyHamiltonian(),
//      run M velocity-Verlet steps, snapshot H₁, assert |ΔH / H₀| < threshold.
//   4. Repeat with a smaller dt; verify the drift shrinks ~quadratically
//      (this is the signature of a 2nd-order symplectic integrator).
//   5. Verify Newton's 3rd law inside _computeForces by checking that the
//      total force on the *isolated* (no trap) two-body system is zero.

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HTML = path.resolve(__dirname, "..", "tools", "svg42", "svg42_phase4_prime.html");
const html = fs.readFileSync(HTML, "utf8");

const checks = [];
function check(label, ok, detail) {
  checks.push({ label, ok: !!ok, detail: detail == null ? "" : String(detail) });
}

// ── 1. extract and sandbox-evaluate the math part of the script ────────────
const scriptStart = html.indexOf("<script>");
const scriptEnd = html.lastIndexOf("</script>");
if (scriptStart < 0 || scriptEnd < 0) {
  console.error("could not locate <script> tags");
  process.exit(2);
}
const fullJs = html.slice(scriptStart + "<script>".length, scriptEnd);

// Cut at "// ─── Detector" — the next major section after Ensemble. Everything
// before that line is pure compute (no DOM/canvas/window) and is what we want.
const cut = fullJs.indexOf("// ─── Detector");
if (cut < 0) {
  console.error("could not locate cut marker '// ─── Detector'");
  process.exit(2);
}
const mathJs = fullJs.slice(0, cut);

// `class Ensemble` and `const PARAMS` are lexically scoped in strict mode —
// they aren't attached to the sandbox globals when run via vm. Append a small
// footer that copies the relevant declarations onto globalThis so we can
// reach them from outside the script.
const exportsFooter = `
;globalThis.Ensemble = Ensemble;
globalThis.PARAMS = PARAMS;
globalThis.STATE = STATE;
globalThis.mulberry32 = mulberry32;
globalThis.gauss = gauss;
globalThis.sigmoid = sigmoid;
globalThis.clamp = clamp;
`;

const sandbox = { console };
vm.createContext(sandbox);
try {
  vm.runInContext(mathJs + exportsFooter, sandbox, { filename: "svg42_phase4_prime.html#math" });
} catch (e) {
  console.error("sandbox eval failed:", e.message);
  process.exit(2);
}

const Ensemble = sandbox.Ensemble;
check("Ensemble class is exposed in sandbox", typeof Ensemble === "function");
check("Ensemble.prototype.stepHamiltonian exists", typeof (Ensemble && Ensemble.prototype.stepHamiltonian) === "function");
check("Ensemble.prototype.energyHamiltonian exists", typeof (Ensemble && Ensemble.prototype.energyHamiltonian) === "function");
check("Ensemble.prototype._computeForces exists", typeof (Ensemble && Ensemble.prototype._computeForces) === "function");

// ── 2. core conservation test ──────────────────────────────────────────────
function runConservation(N, M, dt, kappa, eps, eta, order) {
  const e = new Ensemble(N, 42);
  // Use a deliberately mild parameter regime: bounded κ, generous softening,
  // dt small enough that |ΔH/H| ≪ 1 over M steps.
  const p = { eta, gamma: 0.3, beta: 0.1, eps, kappa, dt, order: order || 2 };
  const inv0 = e.invariants();
  const H0 = e.energyHamiltonian(p).H;
  for (let i = 0; i < M; i++) e.stepHamiltonian(p);
  const inv1 = e.invariants();
  const H1 = e.energyHamiltonian(p).H;
  const drift = Math.abs(H1 - H0) / Math.max(1e-12, Math.abs(H0));
  // Angular momentum drift: L_z is exactly conserved by the continuous flow.
  const lDrift = Math.abs(inv0.Lz) > 1e-9
    ? Math.abs(inv1.Lz - inv0.Lz) / Math.abs(inv0.Lz)
    : Math.abs(inv1.Lz - inv0.Lz);
  return { H0, H1, drift, Lz0: inv0.Lz, Lz1: inv1.Lz, lDrift };
}

// Coarse step (Verlet, order 2)
const r1 = runConservation(/*N*/ 24, /*M*/ 1000, /*dt*/ 0.005, /*kappa*/ 0.4, /*eps*/ 0.10, /*eta*/ 0.20, 2);
check(
  "Verlet 2: |ΔH/H₀| < 1% over 1000 steps (N=24, dt=0.005)",
  Number.isFinite(r1.drift) && r1.drift < 1e-2,
  `H0=${r1.H0.toExponential(3)} H1=${r1.H1.toExponential(3)} drift=${r1.drift.toExponential(3)}`,
);

// Halved step → drift should shrink by ~4× for Verlet 2.
const r2 = runConservation(/*N*/ 24, /*M*/ 2000, /*dt*/ 0.0025, /*kappa*/ 0.4, /*eps*/ 0.10, /*eta*/ 0.20, 2);
check(
  "Verlet 2: |ΔH/H₀| < 0.25% over 2000 steps (N=24, dt=0.0025)",
  Number.isFinite(r2.drift) && r2.drift < 2.5e-3,
  `drift=${r2.drift.toExponential(3)}`,
);

const ratio2 = r1.drift / Math.max(1e-15, r2.drift);
check(
  "Verlet 2: drift ratio ≥ 2 when dt halved (O(dt²) shadow conservation)",
  Number.isFinite(ratio2) && ratio2 >= 2,
  `r1.drift / r2.drift = ${ratio2.toFixed(2)}`,
);

// Yoshida 4th-order symplectic composition: drift should scale as O(dt⁴) in
// the asymptotic regime. The step uses 3× the force evaluations of Verlet 2,
// so the Yoshida advantage shows up only once dt is small enough to put us
// inside the O(dt⁴) regime (vs the prefactor-dominated regime where the
// negative middle substep adds noise comparable to the Verlet 2 error).
const r4 = runConservation(/*N*/ 24, /*M*/ 1000, /*dt*/ 0.005, /*kappa*/ 0.4, /*eps*/ 0.10, /*eta*/ 0.20, 4);
check(
  "Yoshida 4: |ΔH/H₀| stays bounded (< 1%) over 1000 steps at dt=0.005",
  Number.isFinite(r4.drift) && r4.drift < 1e-2,
  `drift=${r4.drift.toExponential(3)}`,
);

// Yoshida halved-dt drift should shrink by ~16× (O(dt⁴)). Allow factor ≥ 6 to
// account for the round-off floor (drift can hit Float64 precision near 1e-13).
// This is the *defining* numerical signature of an order-4 symplectic scheme.
const r4b = runConservation(/*N*/ 24, /*M*/ 2000, /*dt*/ 0.0025, /*kappa*/ 0.4, /*eps*/ 0.10, /*eta*/ 0.20, 4);
const ratio4 = r4.drift / Math.max(1e-15, r4b.drift);
check(
  "Yoshida 4: drift ratio ≥ 6 when dt halved (consistent with O(dt⁴) up to round-off)",
  Number.isFinite(ratio4) && (ratio4 >= 6 || r4b.drift < 1e-12),
  `r4.drift=${r4.drift.toExponential(3)} r4b.drift=${r4b.drift.toExponential(3)} ratio=${ratio4.toFixed(2)}`,
);

// Inside the asymptotic regime (dt small enough), Yoshida 4 should clearly
// beat Verlet 2 even at the same dt. At dt=0.0025 we should see ≥ 5× advantage.
check(
  "Yoshida 4 beats Verlet 2 by ≥ 5× at dt=0.0025 (asymptotic regime)",
  r2.drift / Math.max(1e-15, r4b.drift) >= 5,
  `Verlet/Yoshida @ dt=0.0025 = ${(r2.drift / Math.max(1e-15, r4b.drift)).toExponential(2)}`,
);

// Angular momentum L_z is exactly conserved by H. Symplectic integrators
// preserve it to round-off in unweighted systems; here masses ≠ 1 add some
// numerical drift but it should still be tiny.
check(
  "Verlet 2: |ΔL_z/L_z₀| < 1% over 1000 steps",
  Number.isFinite(r1.lDrift) && r1.lDrift < 1e-2,
  `Lz0=${r1.Lz0.toExponential(3)} Lz1=${r1.Lz1.toExponential(3)} drift=${r1.lDrift.toExponential(3)}`,
);
check(
  "Yoshida 4: |ΔL_z/L_z₀| < 1e-4 over 1000 steps",
  Number.isFinite(r4.lDrift) && r4.lDrift < 1e-4,
  `drift=${r4.lDrift.toExponential(3)}`,
);

// Sanity: invariants() exists and returns the right shape.
{
  const e = new Ensemble(4, 1);
  const inv = e.invariants();
  check("invariants() returns {Px, Py, P, Lz}",
    inv && Number.isFinite(inv.Px) && Number.isFinite(inv.Py)
      && Number.isFinite(inv.P) && Number.isFinite(inv.Lz),
    `inv=${JSON.stringify({Px:inv.Px.toFixed(3),Py:inv.Py.toFixed(3),P:inv.P.toFixed(3),Lz:inv.Lz.toFixed(3)})}`,
  );
}

// ── 3. time-reversibility (self-adjointness) of _verletSubstep ────────────
// A 2nd-order symplectic base method Φ_h is *time-symmetric* (self-adjoint)
// if Φ_h ∘ Φ_{-h} = id. This is the property that lifts a 2nd-order method
// to higher orders via Yoshida-style composition. Velocity Verlet implemented
// as kick-drift-kick (with half-kicks at the seams) is self-adjoint; an
// asymmetric variant (full-kick then full-drift) is *not* and the Yoshida
// composition would silently degrade to order-2.
//
// We test by stepping forward by h, then backward by -h, and asserting we're
// back at the starting state to round-off. If this fails, |Δstate| ~ O(h³)
// which would explode the assertion, even at h = 0.005.
{
  const e = new Ensemble(8, 7);
  // Snapshot the entire phase-space state.
  const x0  = Float64Array.from(e.x);
  const y0  = Float64Array.from(e.y);
  const vx0 = Float64Array.from(e.vx);
  const vy0 = Float64Array.from(e.vy);

  const p = { eta: 0.2, gamma: 0.3, beta: 0.1, eps: 0.10, kappa: 0.4, dt: 0.005, order: 2 };
  const h = 0.01; // an arbitrary, "interesting-sized" step
  e._verletSubstep(p, +h);
  e._verletSubstep(p, -h);

  // Largest absolute deviation across all phase-space coordinates.
  let maxDev = 0;
  for (let i = 0; i < e.N; i++) {
    maxDev = Math.max(maxDev, Math.abs(e.x[i]  - x0[i]));
    maxDev = Math.max(maxDev, Math.abs(e.y[i]  - y0[i]));
    maxDev = Math.max(maxDev, Math.abs(e.vx[i] - vx0[i]));
    maxDev = Math.max(maxDev, Math.abs(e.vy[i] - vy0[i]));
  }
  // f64 epsilon ≈ 2.22e-16. Our values are O(1), and we did ~12 multiply/adds
  // per coord, so a few ×10⁻¹⁵ is the round-off ceiling. < 1e-12 is generous.
  check(
    "_verletSubstep is time-symmetric: Φ_{+h} ∘ Φ_{-h} = id within round-off",
    maxDev < 1e-12,
    `max |Δstate| = ${maxDev.toExponential(3)} (expect ~1e-15..1e-14)`,
  );
}

// Time-symmetry should also hold for the full Yoshida composition (since c+b+c
// is symmetric and each substep is symmetric, the composition is symmetric).
{
  const e = new Ensemble(8, 11);
  const snap = {
    x:  Float64Array.from(e.x),  y:  Float64Array.from(e.y),
    vx: Float64Array.from(e.vx), vy: Float64Array.from(e.vy),
  };
  const pH = { eta: 0.2, gamma: 0.3, beta: 0.1, eps: 0.10, kappa: 0.4, dt: 0.01, order: 4 };
  const pBack = Object.assign({}, pH, { dt: -0.01 });
  e.stepHamiltonian(pH);
  e.stepHamiltonian(pBack);
  let maxDev = 0;
  for (let i = 0; i < e.N; i++) {
    maxDev = Math.max(maxDev, Math.abs(e.x[i]  - snap.x[i]));
    maxDev = Math.max(maxDev, Math.abs(e.y[i]  - snap.y[i]));
    // hue/phase advance is purely time-explicit and asymmetric (passive
    // channels, do not enter H), so we skip them in the reversibility check.
    maxDev = Math.max(maxDev, Math.abs(e.vx[i] - snap.vx[i]));
    maxDev = Math.max(maxDev, Math.abs(e.vy[i] - snap.vy[i]));
  }
  check(
    "stepHamiltonian (Yoshida 4) is time-symmetric within round-off",
    maxDev < 1e-12,
    `max |Δstate| = ${maxDev.toExponential(3)}`,
  );
}

// ── 3. Newton's 3rd law in _computeForces ──────────────────────────────────
// Without the harmonic trap (ω²=0), the *total* force on a closed system must
// be exactly zero (up to round-off): Σ_i F_i = 0 because F_ij = −F_ji.
{
  const e = new Ensemble(8, 7);
  const fx = new Float64Array(8);
  const fy = new Float64Array(8);
  e._computeForces(fx, fy, /*G*/ 0.6, /*s²*/ 0.01, /*ω²*/ 0);
  let sx = 0, sy = 0;
  for (let i = 0; i < 8; i++) { sx += fx[i]; sy += fy[i]; }
  const tot = Math.hypot(sx, sy);
  check(
    "total pair force vanishes (Newton 3rd law) when trap is off",
    tot < 1e-10,
    `|Σ F| = ${tot.toExponential(3)}`,
  );
}

// ── 4. mode A is untouched (regression guard) ──────────────────────────────
{
  const e = new Ensemble(8, 9);
  const p = { eta: 0.4, gamma: 0.3, beta: 0.1, eps: 0.05, kappa: 0.6, dt: 0.016 };
  const rand = sandbox.mulberry32(123);
  const eBefore = e.energy();
  for (let i = 0; i < 32; i++) e.step(p, rand);
  const eAfter = e.energy();
  check(
    "mode A step() still runs without throwing",
    Number.isFinite(eBefore.H) && Number.isFinite(eAfter.H),
    `H before=${eBefore.H.toFixed(3)} after=${eAfter.H.toFixed(3)}`,
  );
}

// ── 5. mode H step is deterministic (no rand argument) ─────────────────────
{
  const eA = new Ensemble(12, 31);
  const eB = new Ensemble(12, 31);
  const p = { eta: 0.2, gamma: 0.3, beta: 0.1, eps: 0.10, kappa: 0.4, dt: 0.005 };
  for (let i = 0; i < 50; i++) {
    eA.stepHamiltonian(p);
    eB.stepHamiltonian(p);
  }
  let same = true;
  for (let i = 0; i < 12; i++) {
    if (eA.x[i] !== eB.x[i] || eA.vx[i] !== eB.vx[i]) { same = false; break; }
  }
  check("stepHamiltonian is deterministic for fixed seed/params", same);
}

// ── 6. mode H trajectory is bounded by the trap ───────────────────────────
// With ω²>0, V_conf adds a confining potential. The trajectory should remain
// inside a finite region rather than fly off to infinity.
{
  const e = new Ensemble(12, 17);
  const p = { eta: 0.5, gamma: 0.3, beta: 0.1, eps: 0.06, kappa: 0.05, dt: 0.012 };
  for (let i = 0; i < 2000; i++) e.stepHamiltonian(p);
  let rmax = 0;
  for (let i = 0; i < 12; i++) {
    const r = Math.hypot(e.x[i], e.y[i]);
    if (r > rmax) rmax = r;
  }
  check(
    "harmonic trap bounds the trajectory (max |q| < 10)",
    Number.isFinite(rmax) && rmax < 10,
    `max |q| = ${rmax.toFixed(3)}`,
  );
}

// ── 7. PARAMS default mode is "H" (default truth-in-naming) ───────────────
check(
  "PARAMS.mode defaults to 'H'",
  sandbox.PARAMS && sandbox.PARAMS.mode === "H",
  "PARAMS.mode = " + (sandbox.PARAMS && sandbox.PARAMS.mode),
);

// ── 8. energyHamiltonian returns the K + V_pair + V_conf decomposition ────
// The strip-plot decomposition relies on these three components being present
// and finite in the energy() return value. They have well-defined signs:
//   • K     ≥ 0  (sum of squares)
//   • V_conf ≥ 0  (½ ω² Σ |q|²)
//   • V_pair  : sign of −G c_i c_j; for κ>0 with charges from attract−repel
//               of mixed sign, V_pair can be either sign in general but is
//               typically ≤ 0 when most charges share sign.
//
// IMPORTANT INTERPRETIVE NOTE for the |Δ|=0 assertions below:
// ───────────────────────────────────────────────────────────
// The "|H − (K + V_pair + V_conf)| = 0" check is a *code-consistency*
// property, NOT a *physics-correctness* property. It holds exactly because
// energyHamiltonian computes H by *summing* K, V_pair, V_conf — there is one
// arithmetic path producing all four quantities, so the identity is true by
// construction.
//
// What this consistency check actually buys us is:
//   • If a future refactor splits the H computation off from the V_pair /
//     V_conf computation (say, computing H by a separate pair-loop), this
//     test will catch the divergence between the two paths.
//   • It guards against a class of bugs where the decomposition rendered
//     in the strip plot doesn't actually sum to the H plotted on the same axes.
//
// What this consistency check does NOT establish:
//   • That K is the right kinetic energy for the integrator's velocities
//   • That V_pair has the correct functional form (Plummer / charge-charge)
//   • That V_conf has the correct trap shape (½ ω² |q|²)
//   • That H is conserved by the dynamics
//
// Those are physics properties, established separately by:
//   • Conservation diagnostics: H drift bounded by O(dt^order)
//   • Integrator order: drift ratio when dt is halved
//   • Time reversibility: Φ_h ∘ Φ_{-h} = id
//   • Newton's 3rd law: Σ_i F_i = 0 with trap off
//   • V_conf ≥ 0 (sign-of-trap)
//   • K ≥ 0 (sign-of-kinetic)
//   • Cross-port determinism (phase4_prime_bridge.js)
//
// Read |Δ|=0 below as "the code factors correctly", not "the math is right".
{
  const e = new Ensemble(16, 5);
  const p = { eta: 0.5, gamma: 0.3, beta: 0.1, eps: 0.06, kappa: 0.4, dt: 0.005, order: 2 };
  const en = e.energyHamiltonian(p);
  check(
    "energyHamiltonian returns {K, V_pair, V_conf, V, H}",
    en && Number.isFinite(en.K) && Number.isFinite(en.V_pair)
      && Number.isFinite(en.V_conf) && Number.isFinite(en.V) && Number.isFinite(en.H),
    `K=${en.K.toExponential(3)} V_pair=${en.V_pair.toExponential(3)} V_conf=${en.V_conf.toExponential(3)} H=${en.H.toExponential(3)}`,
  );
  check(
    "energyHamiltonian: V = V_pair + V_conf identically",
    Math.abs(en.V - (en.V_pair + en.V_conf)) < 1e-12,
    `V=${en.V.toExponential(4)}, V_pair+V_conf=${(en.V_pair + en.V_conf).toExponential(4)}, |Δ|=${Math.abs(en.V - (en.V_pair + en.V_conf)).toExponential(2)}`,
  );
  check(
    "energyHamiltonian: H = K + V_pair + V_conf identically",
    Math.abs(en.H - (en.K + en.V_pair + en.V_conf)) < 1e-12,
    `H=${en.H.toExponential(4)}, K+V_pair+V_conf=${(en.K + en.V_pair + en.V_conf).toExponential(4)}`,
  );
  check(
    "V_conf is non-negative (harmonic trap, ½ ω² |q|²)",
    en.V_conf >= 0,
    `V_conf=${en.V_conf.toExponential(3)}`,
  );
  check(
    "K is non-negative (sum of |p|²)",
    en.K >= 0,
    `K=${en.K.toExponential(3)}`,
  );
}

// ── 9. K↔V exchange under evolution: |K| and |V_pair| both vary ───────────
// The defining property of mode-H dynamics is that K and V exchange energy
// while H stays bounded. The smoke is: over a short evolution, the std-dev
// of K across snapshots should be substantially larger than the std-dev of
// H (exchange dominates over drift). If H drifts comparable to K's range,
// the integrator is leaking and the symplectic structure is broken.
{
  const e = new Ensemble(16, 91);
  const p = { eta: 0.4, gamma: 0.3, beta: 0.1, eps: 0.08, kappa: 0.5, dt: 0.01, order: 4 };
  const Ks = [], Vps = [], Vcs = [], Hs = [];
  for (let i = 0; i < 200; i++) {
    e.stepHamiltonian(p);
    const en = e.energyHamiltonian(p);
    Ks.push(en.K); Vps.push(en.V_pair); Vcs.push(en.V_conf); Hs.push(en.H);
  }
  const std = arr => {
    const m = arr.reduce((a, x) => a + x, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, x) => a + (x - m) ** 2, 0) / arr.length);
  };
  const sK = std(Ks), sH = std(Hs), sVp = std(Vps), sVc = std(Vcs);
  check(
    "K↔V exchange is much larger than H drift (σ_K ≫ σ_H)",
    sK > 50 * Math.max(sH, 1e-15),
    `σ_K=${sK.toExponential(2)}, σ_V_pair=${sVp.toExponential(2)}, σ_V_conf=${sVc.toExponential(2)}, σ_H=${sH.toExponential(2)}, ratio σ_K/σ_H=${(sK / Math.max(sH, 1e-15)).toExponential(2)}`,
  );
}

// ── report ─────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
for (const c of checks) {
  if (c.ok) {
    pass++;
    console.log(`  ✓  ${c.label}${c.detail ? "  (" + c.detail + ")" : ""}`);
  } else {
    fail++;
    console.log(`  ✗  ${c.label}${c.detail ? "  (" + c.detail + ")" : ""}`);
  }
}
console.log(`\n  ${pass}/${checks.length} checks passed`);
process.exit(fail === 0 ? 0 : 1);
