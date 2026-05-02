// Smoke test for the three Phase-4 / main-builder bridge changes:
//  (a) toolbar "Phase 4 →" anchor + matching palette action
//  (b) IR-provenance pill DOM + helper + boot wiring
//  (c) Phase 4's "Hamiltonian" rename (no false claim left in user-visible text)
const fs = require("fs");

const builder = "tools/svg42/svg42_compiler_builder.html";
const phase4  = "tools/svg42/svg42_phase4_prime.html";

const html  = fs.readFileSync(builder, "utf8");
const html4 = fs.readFileSync(phase4, "utf8");

const pass = [];
const fail = [];
function check(name, cond, detail) { (cond ? pass : fail).push(detail ? name + " :: " + detail : name); }

// ------------------------------------------------------------------ (a) ---
// Toolbar link present and points at the sibling file
check("toolbar has Phase 4 link", /id="lnkPhase4"/.test(html));
check("link href is sibling Phase 4 file", /href="svg42_phase4_prime\.html"/.test(html));
check("link opens in new tab safely", /target="_blank"[^>]*rel="noopener noreferrer"|rel="noopener noreferrer"[^>]*target="_blank"/.test(html));
check("link styled via .ext-link", /class="ext-link"/.test(html));
check(".ext-link CSS rule exists", /a\.ext-link\s*\{/.test(html));
check("ui handle wired", /lnkPhase4: document\.getElementById\("lnkPhase4"\)/.test(html));

// Palette action
check("palette action app.open-phase4 registered", /id:\s*"app\.open-phase4"/.test(html));
check("palette action opens via window.open with noopener,noreferrer",
  /window\.open\("svg42_phase4_prime\.html",[^)]*"noopener,noreferrer"\)/.test(html));
check("palette action keywords mention recurrence/lyapunov/chaos",
  /keywords:\s*"phase 4 four prime evolution lyapunov recurrence chaos hamiltonian dynamics ensemble"/.test(html));

// ------------------------------------------------------------------ (b) ---
// Provenance pill DOM
check("provenance pill DOM present", /id="pageStrapProv"/.test(html));
check("provenance pill default state is closed", /data-open="false"/.test(html));
check("provenance pill has dismiss button", /id="pageStrapProvDismiss"/.test(html));
check("provenance pill label span has stable id", /id="pageStrapProvLabel"/.test(html));

// Provenance pill CSS
check(".ps-prov CSS rule exists", /\.pagestrap \.ps-prov\s*\{/.test(html));
check(".ps-prov is hidden by default", /\.pagestrap \.ps-prov\s*\{[\s\S]*?display:\s*none/.test(html));
check(".ps-prov[data-open=true] becomes inline-flex", /\.pagestrap \.ps-prov\[data-open="true"\]\s*\{[^}]*display:\s*inline-flex/.test(html));

// ui handles for the pill
check("ui.pageStrapProv wired", /pageStrapProv: document\.getElementById\("pageStrapProv"\)/.test(html));
check("ui.pageStrapProvLabel wired", /pageStrapProvLabel: document\.getElementById\("pageStrapProvLabel"\)/.test(html));
check("ui.pageStrapProvDismiss wired", /pageStrapProvDismiss: document\.getElementById\("pageStrapProvDismiss"\)/.test(html));

// Provenance JS plumbing
check("noteIrProvenance defined", /function noteIrProvenance\(candidate\)/.test(html));
check("_setProvenancePill defined", /function _setProvenancePill\(state\)/.test(html));
check("initProvenancePill defined", /function initProvenancePill\(\)/.test(html));
check("noteIrProvenance recognises phase4 prime-evolution",
  /p4\.source\s*===\s*"prime-evolution"/.test(html));
check("noteIrProvenance is best-effort (try/catch)",
  /try\s*\{\s*noteIrProvenance\(candidate\)\s*;\s*\}\s*catch/.test(html));
check("compileAndReport clears stale pill",
  /try\s*\{\s*noteIrProvenance\(ir\)\s*;\s*\}\s*catch/.test(html));

// Boot wiring
check("initProvenancePill called on boot",
  /initNetIndicator\(\);\s*\n\s*initProvenancePill\(\);/.test(html));

// Pill is dismissable (the dismiss handler closes the pill)
check("dismiss handler closes the pill",
  /pageStrapProvDismiss[\s\S]{0,200}_setProvenancePill\(null\)/.test(html));

// ------------------------------------------------------------------ (c) ---
// Phase 4 is now actually Hamiltonian: the title and UI claim it, and the math
// behind the claim lives in stepHamiltonian / energyHamiltonian / _computeForces.
// (The numerical conservation property is asserted by phase4_hamiltonian_smoke.js.)

// Title & header tag honestly describe both modes
check("phase4 title now says 'Hamiltonian Flow + PRIME Recurrence'",
  /<title>SVG42 · Phase 4 — Hamiltonian Flow \+ PRIME Recurrence<\/title>/.test(html4));
check("phase4 header tag has id=modeTag (dynamic)",
  /<span class="tag" id="modeTag">/.test(html4));
check("phase4 default header tag describes symplectic flow",
  /hamiltonian flow · symplectic · velocity verlet/.test(html4));

// Mode toggle button + hotkey
check("phase4 has mode toggle button",
  /id="btnMode"/.test(html4));
check("phase4 mode toggle defaults to H",
  /id="btnMode" class="toggle on"[^>]*>mode H · hamiltonian/.test(html4));
check("phase4 'm' hotkey wired in help",
  /class="kbd">m<\/span>\s*mode H↔A/.test(html4));
check("phase4 'm' hotkey wired in handler",
  /ev\.key === "m"/.test(html4));

// Real H(p,q) infrastructure
check("phase4 has stepHamiltonian (velocity Verlet)",
  /stepHamiltonian\(p\)\s*\{/.test(html4));
check("phase4 has energyHamiltonian (returns K, V_pair, V_conf, H)",
  /energyHamiltonian\(p\)\s*\{/.test(html4)
  && /return\s*\{\s*K,\s*V:\s*V_pair\s*\+\s*V_conf,\s*V_pair,\s*V_conf,\s*H:/.test(html4));
check("phase4 has _computeForces (Newton-3rd-law-respecting)",
  /_computeForces\(fx,\s*fy,\s*G,\s*s2,\s*omega2\)\s*\{/.test(html4));
check("phase4 stepHamiltonian uses kick-drift-kick velocity Verlet",
  /Velocity Verlet \(kick-drift-kick\)/.test(html4));

// Mode dispatch in the integration loop
check("phase4 doStep dispatches on PARAMS.mode",
  /const isH = PARAMS\.mode === "H";/.test(html4));
check("phase4 doStep calls stepHamiltonian when isH",
  /STATE\.ensemble\.stepHamiltonian\(PARAMS\)/.test(html4));
check("phase4 doStep falls back to step() when not isH",
  /\}\s*else\s*\{\s*STATE\.ensemble\.step\(PARAMS,\s*RAND\);/.test(html4));

// Storage promoted to Float64 for symplectic accuracy
check("phase4 promotes Float32→Float64 for state arrays",
  /this\.x\s*=\s*new Float64Array\(N\);/.test(html4)
  && /this\.vx\s*=\s*new Float64Array\(N\);/.test(html4));

// Energy strip and metric labels reflect conservation (in mode H)
check("phase4 energy strip header claims conservation",
  /energy · H = K \+ V · conserved \(symplectic, ΔH\/H ~ O\(dt²\)\)/.test(html4));
check("phase4 metric label restored to 'H = K+V'",
  /<span>H = K\+V<\/span>/.test(html4));
check("phase4 has |ΔH/H₀| drift metric",
  /<b id="m-Hdrift">/.test(html4)
  && /<span>\|ΔH \/ H₀\|<\/span>/.test(html4));

// Naming-disclaimer block now honestly describes BOTH modes
check("phase4 disclaimer mentions 'real Hamiltonian system'",
  /This is a real Hamiltonian system\./.test(html4));
check("phase4 disclaimer states the explicit H(p,q) formula",
  /H\(p,\s*q\)\s*=\s*Σ_i\s*\|p_i\|² \/ \(2 m_i\)/.test(html4));
check("phase4 disclaimer mentions Newton's 3rd law for forces",
  /F_ij\s*=\s*−F_ji \(Newton's 3rd law\)/.test(html4));
check("phase4 disclaimer mentions shadow Hamiltonian / O(dt²)",
  /shadow Hamiltonian/.test(html4) && /O\(dt²\)/.test(html4));
check("phase4 disclaimer still labels mode A as not Hamiltonian",
  /Mode A is \*not\* Hamiltonian/.test(html4));
check("phase4 mode-A disclaimer still cites fluctuation-dissipation",
  /fluctuation-dissipation/.test(html4));

// Six mode-H presets registered (12 mode-A + 6 mode-H = 18). Restrict the regex
// to the preset-entry shape `id: N, mode: "X"` so the PARAMS.mode default at
// the top of the script doesn't get double-counted.
check("phase4 has 6 mode-H presets",
  (html4.match(/id:\s*\d+,\s*mode:\s*"H"/g) || []).length === 6);
check("phase4 has 12 mode-A presets",
  (html4.match(/id:\s*\d+,\s*mode:\s*"A"/g) || []).length === 12);
check("phase4 preset panel reflects 12+6 split",
  /Presets · 12 stochastic \+ 6 hamiltonian/.test(html4));
for (const name of ["harmonic-trap", "kepler-ring", "soft-plasma", "gravity-cluster", "breathing-cold", "kicked-rotor"]) {
  check("phase4 H-preset '" + name + "' present", new RegExp('"' + name + '"').test(html4));
}

// IR provenance source unchanged (the bridge feature still works)
check("phase4 IR provenance source unchanged: prime-evolution",
  /source:\s*"prime-evolution"/.test(html4));

// ── Enhancement round: Yoshida 4 + LED + phase-space + invariants ─────────

// PARAMS.order knob and matching UI/handler
check("phase4 PARAMS.order field defaults to 2",
  /order:\s*2,/.test(html4));
check("phase4 has order toggle button",
  /id="btnOrder"/.test(html4));
check("phase4 default order button label is 'order 2 · verlet'",
  />order 2 · verlet</.test(html4));
check("phase4 has setOrder + toggleOrder",
  /function setOrder\(order\)/.test(html4) && /function toggleOrder\(\)/.test(html4));
check("phase4 wires order button to toggleOrder",
  /\$\("btnOrder"\)\.addEventListener\("click", toggleOrder\)/.test(html4));
check("phase4 'y' hotkey wired in help and handler",
  /class="kbd">y<\/span>\s*order 2↔4/.test(html4) && /ev\.key === "y"/.test(html4));

// Yoshida composition with the canonical c, b, c coefficients
check("phase4 stepHamiltonian dispatches on PARAMS.order",
  /const order\s*=\s*\(\+p\.order\s*===\s*4\)\s*\?\s*4\s*:\s*2/.test(html4));
check("phase4 Yoshida composition uses 3 substeps",
  /this\._verletSubstep\(p, c \* dt\);[\s\S]{0,80}this\._verletSubstep\(p, b \* dt\);[\s\S]{0,80}this\._verletSubstep\(p, c \* dt\);/.test(html4));
check("phase4 Yoshida coefficient c = 1 / (2 - 2^{1/3})",
  /c\s*=\s*1\s*\/\s*\(2\s*-\s*cbrt2\)/.test(html4));
check("phase4 Yoshida coefficient b = -2^{1/3} c",
  /b\s*=\s*-cbrt2\s*\*\s*c/.test(html4));
check("phase4 _verletSubstep helper exists",
  /_verletSubstep\(p,\s*h\)\s*\{/.test(html4));

// Conservation LED in the header
check("phase4 has conservation LED",
  /id="ledConserve"/.test(html4));
check("phase4 LED has data-state attribute",
  /id="ledConserve"[^>]*data-state="off"/.test(html4));
check("phase4 LED has CSS rules for off/ok/warn/bad states",
  /\.led\[data-state="off"\]/.test(html4)
  && /\.led\[data-state="ok"\]/.test(html4)
  && /\.led\[data-state="warn"\]/.test(html4)
  && /\.led\[data-state="bad"\]/.test(html4));
check("phase4 LED is driven by energy drift in updateMetrics",
  /led\.dataset\.state\s*=\s*state/.test(html4));

// Phase-space portrait canvas
check("phase4 has phase-space portrait card",
  /id="phaseCard"/.test(html4) && /id="phasePlot"/.test(html4));
check("phase4 phase plot has CSS sizing",
  /#energyPlot,\s*#lyapPlot,\s*#phasePlot\s*\{/.test(html4));
check("phase4 has drawPhasePlot function",
  /function drawPhasePlot\(trail\)/.test(html4));
check("phase4 frame loop calls drawPhasePlot",
  /drawPhasePlot\(STATE\.phaseTrail\)/.test(html4));
check("phase4 phaseTrail samples (q, p) for entity 0 in mode H",
  /STATE\.phaseTrail\.push\(\{ q: STATE\.ensemble\.x\[0\], p: STATE\.ensemble\.vx\[0\] \* Math\.max\(0\.1, STATE\.ensemble\.scale\[0\]\) \}\)/.test(html4));

// Angular momentum & momentum diagnostic
check("phase4 Ensemble.invariants() defined",
  /invariants\(\)\s*\{[\s\S]{0,400}return\s*\{\s*Px,\s*Py,\s*P:\s*Math\.hypot\(Px,\s*Py\),\s*Lz\s*\}/.test(html4));
check("phase4 has L_z drift metric row",
  /<b id="m-Ldrift">/.test(html4));
check("phase4 has |P| metric row",
  /<b id="m-P">/.test(html4));
check("phase4 STATE has lzRef field for drift anchor",
  /lzRef:\s*null/.test(html4));
check("phase4 doStep captures L_z reference on H entry",
  /STATE\.lzRef\s*=\s*inv\.Lz/.test(html4));

// ── Energy decomposition strip plot ──────────────────────────────────────
// V_pair / V_conf are now first-class metric rows and history fields.
check("phase4 has V_pair metric row",
  /<b id="m-Vpair">/.test(html4));
check("phase4 has V_conf metric row",
  /<b id="m-Vconf">/.test(html4));

// ── σ_K / σ_H — symplectic-mechanism ratio promoted to live metric ───────
check("phase4 has σ_K/σ_H metric row (m-symRatio)",
  /<b id="m-symRatio">/.test(html4));
check("phase4 σ_K/σ_H is computed via decomposeStats helper",
  /function decomposeStats\(history, W\)/.test(html4));
check("phase4 σ_K/σ_H is wired in updateMetrics",
  /symEl\s*=\s*\$\("m-symRatio"\)[\s\S]{0,800}stats\.sK\s*\/\s*stats\.sH/.test(html4));

// ── decisive LED tooltip language (no "consider…", "you might want…") ────
check("phase4 V_pair-led verdict uses decisive 'Fix: raise ε' language",
  /V_pair-led[\s\S]{0,300}Fix:\s*raise\s*ε/.test(html4));
check("phase4 K-led verdict uses decisive 'Fix: lower dt or raise order' language",
  /K-led[\s\S]{0,300}Fix:\s*lower dt or raise order/.test(html4));

// ── V_conf-led verdict is gated on H-drift health ────────────────────────
// The verdict body now uses a `stiffFix` variable (order-aware) rather than
// inlining the fix text — so we check the structure separately:
//   1. The V_conf-led drifting-H verdict label exists, and ends with `+ stiffFix`.
//   2. `stiffFix` itself contains the appropriate "lower dt" / "drop to order" text.
check("phase4 V_conf-led verdict has drifting-H branch with stiffFix",
  /V_conf-led with drifting H[\s\S]{0,400}\+\s*stiffFix/.test(html4));
check("phase4 stiffFix order-2 branch suggests 'lower dt'",
  /const stiffFix[\s\S]{0,300}Fix:\s*lower dt/.test(html4));
check("phase4 V_conf-led verdict has healthy-H branch with 'No fix needed'",
  /V_conf-led, H healthy[\s\S]{0,400}No fix needed/.test(html4));
check("phase4 V_conf-led gate uses driftBad threshold",
  /const driftBad\s*=\s*Number\.isFinite\(energyDrift\)[\s\S]{0,80}energyDrift\s*>\s*1e-3/.test(html4));
check("phase4 decomposeDriftHint accepts energyDrift + order parameters",
  /function decomposeDriftHint\(history,\s*last,\s*energyDrift,\s*order\)/.test(html4));
check("phase4 history captures V_pair / V_conf in mode H",
  /STATE\.history\.push\([\s\S]{0,200}V_pair[\s\S]{0,200}V_conf/.test(html4));
check("phase4 drawEnergyPlot has decomposition path (4-line K + V_pair + V_conf + H)",
  /drawSeries\("V_pair",[\s\S]{0,400}drawSeries\("V_conf",[\s\S]{0,400}drawSeries\("H"/.test(html4));
check("phase4 drawEnergyPlot has fallback path (3-line K/V/H for mode A)",
  /if \(decompose\) \{[\s\S]{0,800}\} else \{[\s\S]{0,400}drawSeries\("V",/.test(html4));
check("phase4 strip-card title reflects K + V_pair + V_conf decomposition (mode H)",
  /K \+ V_pair \+ V_conf = H/.test(html4));
check("phase4 has decomposeDriftHint helper for LED tooltip",
  /function decomposeDriftHint\(history,\s*last,\s*energyDrift,\s*order\)/.test(html4));
check("phase4 LED tooltip includes per-subsystem decomposition snapshot",
  /decompBit\s*=\s*decomposeDriftHint/.test(html4));
// New round: copy tightening for V_conf-led + order-4 catastrophic case,
// and K-led copy that distinguishes order-4 stiffness from order-2 cases.
check("phase4 V_conf-led + order-4 catastrophic case suggests dropping order",
  /drop to order 2[\s\S]{0,200}lower dt/.test(html4));
check("phase4 K-led copy is order-aware (kFix branches on ord===4)",
  /const kFix\s*=\s*\(ord === 4\)[\s\S]{0,200}drop to order 2/.test(html4));
check("phase4 decomposeDriftHint receives PARAMS.order",
  /decomposeDriftHint\([^)]*PARAMS\.order\)/.test(html4));
// σ_K/σ_H thresholds documented as multiplicative landmarks (powers of 10).
check("phase4 σ_K/σ_H thresholds documented as multiplicative landmarks",
  /MULTIPLICATIVE landmarks[\s\S]{0,1000}10\s*→\s*neutral|MULTIPLICATIVE landmarks/.test(html4));
check("phase4 energy plot draws inline legend",
  /legendItems\s*=\s*decompose[\s\S]{0,1200}fillText\(label/.test(html4));

const total = pass.length + fail.length;
console.log("PASS " + pass.length + "/" + total);
if (fail.length) {
  console.log("FAIL:");
  fail.forEach((n) => console.log("  - " + n));
  process.exit(1);
}
console.log("BUILDER_BYTES=" + fs.statSync(builder).size);
console.log("PHASE4_BYTES=" + fs.statSync(phase4).size);
