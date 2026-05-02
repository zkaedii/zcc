
'use strict';

// ════════════════════════════════════════════════════════════════════════
// MAP — 30 cols × 18 rows. # = wall, . = empty/pellet, ' ' = void
// ════════════════════════════════════════════════════════════════════════
const MAP = [
  "##############################",
  "#............##..............#",
  "#.PHASE 4....##....ZCC.......#",
  "#.W1 W2 W3 W4##.Z1 Z2 Z3 Z4..#",
  "#.. .. .. ...##... .. .. ....#",
  "#.W5 W6 W7 W8##.Z5 Z6 Z7 Z8..#",
  "#.. .. .. ..B##... .. .. ..b.#",
  "#............##..............#",
  "#.##.######...A1######.####..#",
  "#.... DISCIPLINE ............#",
  "#.P1 P2 P3 P4 P5 P6 P7 P8 P9.#",
  "#.. .. .. .. .. .. .. .. ....#",
  "#.##.######.....######.####..#",
  "#............................#",
  "#..OPS  C1   C2   C3   C4....#",
  "#............................#",
  "#..TROPHIES   T1    T2    T3.#",
  "#............................#",
  "#............@...............#",
  "##############################"
];
const COLS = MAP[0].length;
const ROWS = MAP.length;
const TILE = 24;

// ════════════════════════════════════════════════════════════════════════
// CHEATSHEET CONTENT — every collectible's info card
// ════════════════════════════════════════════════════════════════════════
const ITEMS = {
  // Phase 4 witnesses (cyan)
  W1: { kind:'witness', color:'#00ffff', glyph:'1', score:100,
    title:'PHASE 4 W1 — ENERGY CONSERVATION',
    sub:'NUMERICAL KERNEL',
    body:'Symplectic integrators preserve the Hamiltonian to within ULP-bounded drift. Asserts |ΔH/H| ≤ 1e-8 over the integration window.',
    cmd:'node .compat_out/phase4_hamiltonian_smoke.js',
    src:'docs/rigor/PHASE4.md §4 W1' },
  W2: { kind:'witness', color:'#00ffff', glyph:'2', score:100,
    title:'PHASE 4 W2 — DT-HALVING',
    sub:'NUMERICAL KERNEL',
    body:'Error scales as O(dt^p) for an order-p integrator. Halving dt reduces error by 2^p. Catches integrator misuse.',
    cmd:'node .compat_out/phase4_hamiltonian_smoke.js',
    src:'docs/rigor/PHASE4.md §4 W2' },
  W3: { kind:'witness', color:'#00ffff', glyph:'3', score:100,
    title:'PHASE 4 W3 — ANGULAR MOMENTUM',
    sub:'NUMERICAL KERNEL',
    body:'Central-force flows preserve L_z to byte-noise. Asserts |ΔL_z/L_z₀| ≤ 1e-12 — tighter than W1 because it is exact symmetry.',
    cmd:'node .compat_out/phase4_hamiltonian_smoke.js',
    src:'docs/rigor/PHASE4.md §4 W3' },
  W4: { kind:'witness', color:'#00ffff', glyph:'4', score:100,
    title:'PHASE 4 W4 — TIME REVERSIBILITY',
    sub:'NUMERICAL KERNEL',
    body:'Forward-then-reverse integration returns to the start state within ULP. Catches non-symplectic dissipation slipping in.',
    cmd:'node .compat_out/phase4_hamiltonian_smoke.js',
    src:'docs/rigor/PHASE4.md §4 W4' },
  W5: { kind:'witness', color:'#00ffff', glyph:'5', score:100,
    title:"PHASE 4 W5 — NEWTON'S 3RD LAW",
    sub:'NUMERICAL KERNEL',
    body:'Force pairs are equal and opposite. Catches one-sided force assembly that would silently violate momentum conservation.',
    cmd:'node .compat_out/phase4_hamiltonian_smoke.js',
    src:'docs/rigor/PHASE4.md §4 W5' },
  W6: { kind:'witness', color:'#00ffff', glyph:'6', score:100,
    title:'PHASE 4 W6 — CROSS-PORT BIT-IDENTITY',
    sub:'NUMERICAL KERNEL',
    body:'Builder kernel and standalone kernel produce byte-identical state arrays. Two implementations, one shared truth.',
    cmd:'node .compat_out/phase4_prime_bridge.js',
    src:'docs/rigor/PHASE4.md §4 W6' },
  W7: { kind:'witness', color:'#00ffff', glyph:'7', score:100,
    title:'PHASE 4 W7 — PERMUTATION STABILITY',
    sub:'NUMERICAL KERNEL',
    body:'Same input set in any order yields the same sorted output. Catches order-dependent kernel state.',
    cmd:'node .compat_out/phase4_shuffle_determinism.js',
    src:'docs/rigor/PHASE4.md §4 W7' },
  W8: { kind:'witness', color:'#00ffff', glyph:'8', score:100,
    title:'PHASE 4 W8 — MACRO SIGNATURE',
    sub:'NUMERICAL KERNEL',
    body:'Four named DSL macros, each validated through five fields: name → DSL parse → phase-space shape → diagnostic numbers → trajectory hash.',
    cmd:'node .compat_out/phase4_macros_smoke.js',
    src:'docs/rigor/PHASE4.md §4 W8' },

  // ZCC witnesses (green)
  Z1: { kind:'witness', color:'#00ff66', glyph:'1', score:100,
    title:'ZCC W1 — SELF-HOST FIXPOINT',
    sub:'SYSTEMS SOFTWARE',
    body:'Stage 2 and stage 3 produce byte-identical assembly. The compiler is a fixed point of itself.',
    cmd:'make selfhost',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W1' },
  Z2: { kind:'witness', color:'#00ff66', glyph:'2', score:100,
    title:'ZCC W2 — AMALGAM TRIPWIRE',
    sub:'SYSTEMS SOFTWARE',
    body:"part*.c are canonical; zcc.c is generated. Every `make zcc` runs `diff -q .zcc_parts_check.tmp zcc.c` — a manual edit to zcc.c fails the build.",
    cmd:'make zcc  (built into target)',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W2' },
  Z3: { kind:'witness', color:'#00ff66', glyph:'3', score:100,
    title:'ZCC W3 — AST↔IR AGREEMENT',
    sub:'SYSTEMS SOFTWARE',
    body:'AST backend and IR backend produce same exit code and same stdout for every probe. Two backends, one observable behavior.',
    cmd:'make test',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W3' },
  Z4: { kind:'witness', color:'#00ff66', glyph:'4', score:100,
    title:'ZCC W4 — GCC ORACLE',
    sub:'SYSTEMS SOFTWARE',
    body:"GCC and ZCC produce identical stdout on the probe corpus (sign edges, float edges, init edges, narrow ints). External oracle.",
    cmd:'bash run_regression.sh',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W4' },
  Z5: { kind:'witness', color:'#00ff66', glyph:'5', score:100,
    title:'ZCC W5 — DIFFERENTIAL FUZZ',
    sub:'SYSTEMS SOFTWARE',
    body:"Randomly-generated programs (in ZCC's accepted subset) compiled by both GCC and ZCC; outputs compared. stats['fail'] must be 0.",
    cmd:'python3 zcc_fuzz.py',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W5' },
  Z6: { kind:'witness', color:'#00ff66', glyph:'6', score:100,
    title:'ZCC W6 — COMPAT CORPUS',
    sub:'SYSTEMS SOFTWARE',
    body:'.compat_logs/status.json is the canonical CI summary. Schema is exactly {compat_logs, compat_fail_logs}. Pass condition: compat_fail_logs == 0.',
    cmd:'make compat-extended && make compat-report-ci',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W6' },
  Z7: { kind:'witness', color:'#00ff66', glyph:'7', score:100,
    title:'ZCC W7 — PP CRLF',
    sub:'SYSTEMS SOFTWARE',
    body:"Same source compiled with LF and CRLF line endings produces normalized .s files that diff empty (after stripping .file/.loc directives).",
    cmd:'make pp-crlf-gate',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W7' },
  Z8: { kind:'witness', color:'#00ff66', glyph:'8', score:100,
    title:'ZCC W8 — IR-BRIDGE ORTHOGONALITY',
    sub:'SYSTEMS SOFTWARE',
    body:"Parallel selfhost via the IR backend: zcc2_ir.s == zcc3_ir.s. Independent of W1's AST-path selfhost.",
    cmd:'make -f Makefile.ir selfhost_ir',
    src:'docs/rigor/ZCC_WITNESSES.md §3 W8' },

  // Patterns (magenta)
  P1: { kind:'pattern', color:'#ff00ff', glyph:'I', score:120,
    title:'PATTERN 1 — INDEPENDENT WITNESSES',
    sub:'THE METHODOLOGY',
    body:'~8 chains per system. Each has property + assertion + criterion + failure mode + a "natural advocate" (someone who would notice if it broke).',
    src:'docs/rigor/RIGOR.md §"The patterns" #1' },
  P2: { kind:'pattern', color:'#ff00ff', glyph:'II', score:120,
    title:'PATTERN 2 — NEGATIVE-MATCH SMOKES',
    sub:'THE METHODOLOGY',
    body:'Assert ABSENCE of unwanted patterns (e.g., the Lab panel does not maintain hidden state). Catches drift toward bad shapes.',
    src:'docs/rigor/RIGOR.md §"The patterns" #2' },
  P3: { kind:'pattern', color:'#ff00ff', glyph:'III', score:120,
    title:'PATTERN 3 — META-TEST LAYER',
    sub:'THE METHODOLOGY',
    body:'A test that asserts the test suite still has its structure: section counts, threshold values, classifier separations. Fails when the net itself is silently weakened.',
    src:'docs/rigor/RIGOR.md §"The patterns" #3' },
  P4: { kind:'pattern', color:'#ff00ff', glyph:'IV', score:120,
    title:'PATTERN 4 — INTERPRETIVE NOTE',
    sub:'THE METHODOLOGY',
    body:"Top of every smoke: 'what this establishes / what it does NOT.' Recursively applied to meta-tests with 'guard rail not kernel' framing.",
    src:'docs/rigor/RIGOR.md §"The patterns" #4' },
  P5: { kind:'pattern', color:'#ff00ff', glyph:'V', score:120,
    title:'PATTERN 5 — CLASSIFIER-DISTINCTION GUARD',
    sub:'THE METHODOLOGY',
    body:"For near-twin functions answering different questions (e.g., decomposeDriftHint vs classifyExchange). The natural advocate is INVERTED — anyone reading the code wants to consolidate, but consolidation destroys.",
    src:'docs/rigor/RIGOR.md §"The patterns" #5' },
  P6: { kind:'pattern', color:'#ff00ff', glyph:'VI', score:120,
    title:'PATTERN 6 — THRESHOLD INTEGRITY',
    sub:'THE METHODOLOGY',
    body:'Tight numerical thresholds (1e-8, 1e-12) asserted in the meta-test. A "let me bump 1e-12 to 1e-10 to make CI pass" no longer fails open.',
    src:'docs/rigor/RIGOR.md §"The patterns" #6' },
  P7: { kind:'pattern', color:'#ff00ff', glyph:'VII', score:120,
    title:'PATTERN 7 — README ORIENTATION BLOCKS',
    sub:'THE METHODOLOGY',
    body:'Dense ~30-line summary at the top of canonical files. Catches both the editor-from-the-top reader and the view-source reader before they reach the kernel.',
    src:'docs/rigor/RIGOR.md §"The patterns" #7' },
  P8: { kind:'pattern', color:'#ff00ff', glyph:'VIII', score:120,
    title:'PATTERN 8 — SOFT-TIER (GHOST-REF)',
    sub:'THE METHODOLOGY (v2)',
    body:'Tracked-but-not-blocking warnings for temporary doc/tree mismatches. checkGhost() helper, ghost counter, ⚠ GHOST-REF emission, explicit resolution policy.',
    src:'docs/rigor/RIGOR.md §"The patterns" #8' },
  P9: { kind:'pattern', color:'#ff00ff', glyph:'IX', score:120,
    title:'PATTERN 9 — GAP ACKNOWLEDGMENT',
    sub:'THE METHODOLOGY (v2)',
    body:'Explicitly name patterns that DO NOT apply to a system, and why. Prevents false-positive enforcement (inventing near-twin functions just to satisfy Pattern 5).',
    src:'docs/rigor/RIGOR.md §"The patterns" #9' },

  // Power commands (orange)
  C1: { kind:'power', color:'#ffaa00', glyph:'★', score:250,
    title:'★ COMMAND — RUN THE SUITE',
    sub:'POWER PELLET',
    body:'13 smokes, 850 checks, ~3 seconds. The single command that tells you whether everything is still green.',
    cmd:'pwsh .compat_logs/run_suite.ps1',
    src:'docs/rigor/CHEATSHEET.md §"TL;DR"' },
  C2: { kind:'power', color:'#ffaa00', glyph:'★', score:250,
    title:'★ COMMAND — RE-CREDENTIAL ZCC',
    sub:'POWER PELLET',
    body:'End-to-end ZCC credential from a clean tree: W1 + W3 + W6 + W7 + W8 in one line.',
    cmd:'make clean && make selfhost && make test && make compat-extended && make compat-report-ci && make pp-crlf-gate && make -f Makefile.ir selfhost_ir',
    src:'docs/rigor/CHEATSHEET.md §"TL;DR"' },
  C3: { kind:'power', color:'#ffaa00', glyph:'★', score:250,
    title:'★ COMMAND — PHASE 4 QUICK CHECK',
    sub:'POWER PELLET',
    body:'Touching the kernel? Run these three smokes plus the meta-test (covers W1..W6 + W8 + classifier distinction + threshold integrity).',
    cmd:'node .compat_out/phase4_hamiltonian_smoke.js && node .compat_out/phase4_prime_bridge.js && node .compat_out/phase4_macros_smoke.js && node .compat_out/phase4_invariants_under_edit.js',
    src:'docs/rigor/CHEATSHEET.md §"Common recipes"' },
  C4: { kind:'power', color:'#ffaa00', glyph:'★', score:250,
    title:'★ COMMAND — ZCC QUICK CHECK',
    sub:'POWER PELLET',
    body:'Touching the bootstrap? Selfhost + AST/IR + compat + meta-test gives you W1, W3, W6 plus the regression-net guard.',
    cmd:'make selfhost && make test && make compat-extended && make compat-report-ci && node .compat_out/zcc_invariants_under_edit.js',
    src:'docs/rigor/CHEATSHEET.md §"Common recipes"' },

  // Bosses (pink)
  B:  { kind:'boss', color:'#ff3388', glyph:'B', score:500,
    title:'BOSS — phase4_invariants_under_edit.js',
    sub:'PHASE 4 META-TEST',
    body:'120 checks. Asserts the eight Phase 4 witnesses, threshold integrity, classifier-distinction comments, sibling-discipline cross-references (this folder is intact), and the orientation-block contents in both HTML files.',
    cmd:'node .compat_out/phase4_invariants_under_edit.js',
    src:'docs/rigor/CHEATSHEET.md §"The 13-smoke suite"' },
  b:  { kind:'boss', color:'#ff3388', glyph:'B', score:500,
    title:'BOSS — zcc_invariants_under_edit.js',
    sub:'ZCC META-TEST',
    body:'182 hard + 7 GHOST-REF. Asserts ZCC W1..W8, status.json schema, AGENTS.md gate language, RIGOR.md structure, retrospective contents, and PERFORMS A RECURSIVE SELF-CHECK that its own checkGhost helper is intact.',
    cmd:'node .compat_out/zcc_invariants_under_edit.js',
    src:'docs/rigor/CHEATSHEET.md §"The 13-smoke suite"' },

  // ── Trophies (bronze/silver/gold) ──────────────────────────────────────
  // Three-tier reward system. NOT counted in the 31. Locked by default;
  // light up persistently in localStorage as each tier is earned.
  //   BRONZE = collect all 31 pellets
  //   SILVER = all 31 + no lives lost (first-go)
  //   GOLD   = all 31 + no lives lost + no GHOST-REF contact (pristine)
  // Walking onto a locked trophy shows how to earn it; onto a lit one,
  // confirms the credential. Tier rolls up: GOLD implies SILVER+BRONZE.
  T1: { kind:'trophy', tier:'BRONZE', color:'#cd7f32', glyph:'I', score:0,
    title:'★ TIER I — BRONZE · CREDENTIALED',
    sub:'COLLECT ALL 31 PELLETS',
    body:'Walk every witness, every pattern, every command, both bosses. The witness net has been traversed end to end. The foundational tier — earned the first time the discipline is exercised in full. Doesn\'t care how many lives you lost or how many ghost-refs you brushed; just that you finished the round with the net intact.',
    src:'docs/rigor/CHEATSHEET.md §"Tiers"' },
  T2: { kind:'trophy', tier:'SILVER', color:'#c0c0c0', glyph:'II', score:0,
    title:'★★ TIER II — SILVER · FIRST-GO',
    sub:'ALL 31 · NO LIVES LOST',
    body:'All 31 pellets collected without a regression landing. No silent test weakening. No doc-rot drift converted to hard hit. The configuration where the suite tells you the truth on the first try, with no rework round. The "credentialed clean" tier.',
    src:'docs/rigor/CHEATSHEET.md §"Tiers"' },
  T3: { kind:'trophy', tier:'GOLD', color:'#ffd700', glyph:'III', score:0,
    title:'★★★ TIER III — GOLD · PRISTINE',
    sub:'ALL 31 · NO DEATHS · NO GHOST CONTACT',
    body:'All 31 pellets, no lives lost, no GHOST-REF brushes. Every soft-tier reference resolved or routed around. The cleanest possible run — the configuration where the discipline is fully self-consistent and the tree carries no doc rot. The hardest tier to repeat, and the one that says "the discipline does not need a soft-tier escape valve right now."',
    src:'docs/rigor/CHEATSHEET.md §"Tiers"' },

  // ── Novel object: the PRIME ANCHOR ─────────────────────────────────────
  // A standing crystal at the central crossroads. Touch it to invoke
  // W4-style time reversibility on the playfield — ghosts and regressions
  // run at half speed for 5 seconds. One-shot per run; not part of the 31.
  // Bonus +750 score, plus the tactical window. The "novel" piece is the
  // *temporary playfield modifier* — every other pickup is informational
  // or a cosmetic medallion; this one actually changes how the field
  // behaves while it's active.
  A1: { kind:'anchor', color:'#00ffaa', glyph:'⟁', score:750,
    title:'⟁ PRIME ANCHOR — TIME REVERSIBILITY',
    sub:'NOVEL OBJECT · 5-SECOND DILATION',
    body:'A standing crystal of bit-identity, anchored at the crossroads where Phase 4 meets the Discipline panel. Touching it invokes W4-style time reversibility on the playfield: ghosts and regressions slow to half speed for 5 seconds. One-shot per run — choose your moment carefully. Themed on the witness that says "forward-then-reverse integration returns to the start state within ULP."',
    cmd:'(Walk into the crystal — enemies decelerate, you keep your speed.)',
    src:'docs/rigor/PHASE4.md §4 W4 — Time Reversibility' },
};

// GHOST-REF roster (the seven currently-tracked soft references)
const GHOSTS = [
  { name:'run_selfhost.sh',           ref:'AGENTS.md:35,201',
    body:"Documented invocation for the selfhost gate, but the script is not in the tree." },
  { name:'scripts/run_selfhost.ps1',  ref:'AGENTS.md:202',
    body:"PowerShell variant of the selfhost runner. Documented; absent." },
  { name:'fuzz_host.py',              ref:'README.md:254-260',
    body:"Documented as the fuzz harness wrapper; the actual wrapper is now zcc_fuzz.py." },
  { name:'verify_ir_backend.sh',      ref:'zcc_test_suite.sh:353-379',
    body:"Comment block in zcc_test_suite.sh references this script. The work it would do is now inline in --quick mode." },
  { name:'scripts/use_zcc.sh',        ref:'AGENTS.md:197-198',
    body:"Documented helper for using ZCC as the system C compiler. Convention without script." },
  { name:'scripts/use_zcc.ps1',       ref:'AGENTS.md:198',
    body:"Windows variant of the use_zcc helper. Documented; absent." },
  { name:'scripts/stub_functions.py', ref:'AGENTS.md:168,186',
    body:"Documented as the function-stub generator. Function is currently performed manually." },
];
const GHOST_RESOLUTION =
  "RESOLUTION POLICY: either restore the script (the doc reference becomes ground truth) or remove the reference (the absence becomes ground truth). " +
  "While unresolved, this remains a SOFT WARNING — non-blocking, surfaced in CI output, never silently suppressed. " +
  "See docs/rigor/ZCC_WITNESSES.md §6.";

const REGRESSIONS = [
  { name:'silent test weakening',
    body:"A 'let me bump 1e-12 to 1e-10' that escaped review. The meta-test failed closed; the suite is now lying about a property that no longer holds. THIS COSTS A LIFE." },
  { name:'doc rot drift',
    body:"A doc reference that decayed past the SOFT tier without resolution. This is what GHOST-REF prevents — but if it accumulates more than 2-3 retrospectives without action, it converts to a hard regression. THIS COSTS A LIFE." },
];

// ════════════════════════════════════════════════════════════════════════
// PARSE MAP — extract walls, items, spawn points
// ════════════════════════════════════════════════════════════════════════
const grid  = []; // 0=void, 1=wall, 2=floor
const items = {}; // "x,y" -> item key
let playerStart = {x:1, y:1};

const charToItem = {
  '1':null, '2':null, '3':null, '4':null,
  '5':null, '6':null, '7':null, '8':null
};
// We'll re-parse using token reads since W1..W8 / Z1..Z8 / P1..P9 / C1..C4 are 2 chars
const itemPositions = []; // {x,y,key}
for (let y = 0; y < ROWS; y++) {
  grid.push([]);
  for (let x = 0; x < COLS; x++) {
    grid[y].push(0);
  }
}

(function parseMap() {
  for (let y = 0; y < ROWS; y++) {
    const row = MAP[y];
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      // Walls
      if (c === '#') { grid[y][x] = 1; x++; continue; }
      // Player start
      if (c === '@') { grid[y][x] = 2; playerStart = {x, y}; x++; continue; }
      // Floor (pellet by default if it is just .)
      if (c === '.') {
        grid[y][x] = 2;
        items[x + ',' + y] = '.';
        x++; continue;
      }
      // Boss markers
      if (c === 'B' || c === 'b') {
        grid[y][x] = 2;
        items[x + ',' + y] = c;
        itemPositions.push({x,y,key:c});
        x++; continue;
      }
      // Two-character item codes: W1..W8, Z1..Z8, P1..P9, C1..C4, T1..T3, A1..A9
      if (/[WZPCTA]/.test(c) && x + 1 < row.length && /[0-9]/.test(row[x+1])) {
        const key = c + row[x+1];
        if (ITEMS[key]) {
          grid[y][x]   = 2;
          grid[y][x+1] = 2;
          // Anchor item on the digit cell so it has a single coordinate
          items[(x+1) + ',' + y] = key;
          itemPositions.push({x:x+1, y, key});
          x += 2; continue;
        }
      }
      // Power-pellet asterisks
      if (c === '*') {
        grid[y][x] = 2;
        // map ** to two power pellets; we let parseMap handle each char individually
        // We'll repurpose them as decorative — actual C1..C4 anchors carry the cards.
        items[x + ',' + y] = '*';
        x++; continue;
      }
      // Letters that are part of section labels (e.g., "PHASE 4", "ZCC", etc.) — treat as floor, no pellet
      if (/[A-Za-z0-9]/.test(c)) {
        grid[y][x] = 2;
        x++; continue;
      }
      // Whitespace inside chamber = floor without pellet
      if (c === ' ') {
        // void by default; but if it's enclosed we may want it as floor. For now keep as void.
        // We'll do a flood-fill below to convert enclosed voids to floor.
        x++; continue;
      }
      x++;
    }
  }
})();

// Flood-fill from player start to mark all reachable void cells as floor
(function floodFill() {
  const stack = [[playerStart.x, playerStart.y]];
  const seen = new Set();
  while (stack.length) {
    const [x, y] = stack.pop();
    const k = x + ',' + y;
    if (seen.has(k)) continue;
    seen.add(k);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
    if (grid[y][x] === 1) continue;
    grid[y][x] = 2;
    stack.push([x+1,y]); stack.push([x-1,y]);
    stack.push([x,y+1]); stack.push([x,y-1]);
  }
})();

// Collectible total — trophies are tier rewards and anchors are novel
// playfield modifiers; neither is part of the canonical 31.
const totalPellets = Object.keys(ITEMS)
  .filter(k => ITEMS[k].kind !== 'trophy' && ITEMS[k].kind !== 'anchor')
  .length;
let collected = new Set();

// ════════════════════════════════════════════════════════════════════════
// AUDIO — chiptune via WebAudio
// ════════════════════════════════════════════════════════════════════════
let audioCtx = null;
function ac() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(_) { audioCtx = null; }
  }
  return audioCtx;
}
function beep(freq, dur, type, vol) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'square';
  o.frequency.value = freq;
  g.gain.value = vol || 0.06;
  g.gain.setValueAtTime(g.gain.value, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}
function sfxCollect()  { beep(880, 0.07, 'square', 0.05); setTimeout(()=>beep(1320, 0.06, 'square', 0.04), 30); }
function sfxPower()    { beep(220, 0.08); setTimeout(()=>beep(440, 0.08), 60); setTimeout(()=>beep(880, 0.12), 120); }
function sfxBoss()     { beep(110, 0.10, 'sawtooth', 0.07); setTimeout(()=>beep(220, 0.10, 'sawtooth', 0.07), 80); setTimeout(()=>beep(330, 0.20, 'sawtooth', 0.07), 160); }
function sfxGhost()    { beep(180, 0.05, 'triangle', 0.04); setTimeout(()=>beep(140, 0.05, 'triangle', 0.04), 50); }
function sfxHurt()     { beep(220, 0.08, 'sawtooth', 0.08); setTimeout(()=>beep(110, 0.18, 'sawtooth', 0.08), 80); }
function sfxStart()    { beep(523, 0.08); setTimeout(()=>beep(659, 0.08), 80); setTimeout(()=>beep(784, 0.08), 160); setTimeout(()=>beep(1047, 0.16), 240); }
// Anchor "time-bend" — descending then ascending triangle wave, evokes
// the W4 forward-then-reverse motif. Distinct from sfxPower (squares).
function sfxAnchor() {
  const seq = [1568, 1318, 1047, 784, 659, 523, 659, 784, 1047, 1318, 1568];
  seq.forEach((f, i) => setTimeout(()=>beep(f, 0.10, 'triangle', 0.06), i * 55));
}
function sfxWin()      { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => setTimeout(()=>beep(f, 0.12), i * 110)); }
function sfxLose()     { [330, 261, 220, 165].forEach((f, i) => setTimeout(()=>beep(f, 0.18, 'sawtooth', 0.07), i * 140)); }
// Tier-specific fanfares — each tier gets a longer, brighter chord progression.
// BRONZE: short triadic flourish. SILVER: extends to the octave. GOLD:
// extends to the dominant + super-octave with a triplet finish.
function sfxTierBronze() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(()=>beep(f, 0.14, 'square', 0.06), i * 95));
}
function sfxTierSilver() {
  [523, 659, 784, 1047, 1318, 1568].forEach((f, i) => setTimeout(()=>beep(f, 0.13, 'square', 0.07), i * 88));
}
function sfxTierGold() {
  const seq = [523, 659, 784, 1047, 784, 1047, 1318, 1568, 1976, 2093];
  seq.forEach((f, i) => setTimeout(()=>beep(f, 0.14, 'square', 0.075), i * 82));
  // sparkle tail
  setTimeout(() => { [2349, 2637, 3136].forEach((f, i) => setTimeout(()=>beep(f, 0.10, 'triangle', 0.05), i * 70)); }, seq.length * 82 + 50);
}
function sfxTierFanfare(tier) {
  if (tier === 'GOLD') sfxTierGold();
  else if (tier === 'SILVER') sfxTierSilver();
  else sfxTierBronze();
}

// ════════════════════════════════════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════════════════════════════════════
const state = {
  mode: 'title',  // 'title' | 'play' | 'paused' | 'win' | 'over' | 'card'
  player: { x: playerStart.x, y: playerStart.y, fx: playerStart.x*TILE, fy: playerStart.y*TILE, dir: 0, mouth: 0 },
  ghosts: [],
  regs: [],
  score: 0,
  lives: 3,
  hi: parseInt(localStorage.getItem('witnessNet.hi') || '0', 10),
  invuln: 0,
  // Tier-tracking counters — feed computeTier() at win time
  livesLost: 0,
  ghostHits: 0,
  lastTile: null,
  // PRIME ANCHOR time-dilation. Frames remaining of slowed-enemy mode;
  // decrements once per play-frame. 0 = inactive, 300 = full 5-second window.
  dilation: 0,
};

// Spawn ghosts in corridors (between chambers, in lower OPS area, etc.)
function pickSpawn() {
  // Find a floor cell distant from player start
  let best = null, bestD = -1;
  for (let y = 1; y < ROWS-1; y++) {
    for (let x = 1; x < COLS-1; x++) {
      if (grid[y][x] !== 2) continue;
      const d = Math.abs(x - playerStart.x) + Math.abs(y - playerStart.y);
      if (d > bestD && Math.random() < 0.5) { bestD = d; best = {x, y}; }
    }
  }
  return best || {x: playerStart.x + 5, y: playerStart.y};
}

function initGhosts() {
  state.ghosts = GHOSTS.map((g, i) => {
    // Spread ghosts across reachable corridors
    const corridorRows = [7, 8, 12, 13, 15];
    const ry = corridorRows[i % corridorRows.length];
    let rx = 2 + (i * 4) % (COLS - 4);
    // Walk to find the nearest floor cell
    while (rx < COLS - 1 && grid[ry][rx] !== 2) rx++;
    if (grid[ry][rx] !== 2) { const sp = pickSpawn(); return {...g, x:sp.x, y:sp.y, fx:sp.x*TILE, fy:sp.y*TILE, dir:Math.floor(Math.random()*4), wob:Math.random()*Math.PI*2}; }
    return { ...g, x: rx, y: ry, fx: rx*TILE, fy: ry*TILE, dir: Math.floor(Math.random()*4), wob: Math.random()*Math.PI*2 };
  });
  state.regs = REGRESSIONS.map((r, i) => {
    const sp = pickSpawn();
    return { ...r, x: sp.x, y: sp.y, fx: sp.x*TILE, fy: sp.y*TILE, dir: Math.floor(Math.random()*4) };
  });
}

initGhosts();

// ════════════════════════════════════════════════════════════════════════
// INPUT
// ════════════════════════════════════════════════════════════════════════
const keys = {};
let queuedDir = -1;
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (state.mode === 'title' && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault();
    state.mode = 'play';
    document.getElementById('screen').classList.add('hidden');
    sfxStart();
    return;
  }
  if (state.mode === 'card' && (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter')) {
    e.preventDefault();
    closeCard();
    return;
  }
  if (state.mode === 'win' || state.mode === 'over') {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      restart();
      return;
    }
  }
  if (state.mode === 'play' || state.mode === 'paused') {
    if (e.key === 'Escape') { state.mode = state.mode === 'play' ? 'paused' : 'play'; e.preventDefault(); return; }
    if (e.key === 'r' || e.key === 'R') { restart(); e.preventDefault(); return; }
  }
  if (state.mode === 'play') {
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') queuedDir = 0;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') queuedDir = 1;
    else if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') queuedDir = 2;
    else if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') queuedDir = 3;
    if (queuedDir >= 0) e.preventDefault();
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ════════════════════════════════════════════════════════════════════════
// MOVEMENT — tile-based, smooth interp
// ════════════════════════════════════════════════════════════════════════
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]]; // L R U D
function canEnter(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  return grid[y][x] === 2;
}

function tryMove(actor, dir) {
  const [dx, dy] = DIRS[dir];
  const nx = actor.x + dx, ny = actor.y + dy;
  if (canEnter(nx, ny)) {
    actor.x = nx; actor.y = ny; actor.dir = dir;
    return true;
  }
  return false;
}

let moveTick = 0;
function stepPlayer() {
  // Snap fx, fy toward target tile position. Player is decisively faster
  // than ghosts/regressions — sp=6 over a 24px tile is ~4 frames/tile,
  // i.e. ~67ms per square at 60fps. Snappy without outrunning the input
  // queue.
  const tx = state.player.x * TILE;
  const ty = state.player.y * TILE;
  const sp = 6;
  if (state.player.fx < tx) state.player.fx = Math.min(tx, state.player.fx + sp);
  else if (state.player.fx > tx) state.player.fx = Math.max(tx, state.player.fx - sp);
  if (state.player.fy < ty) state.player.fy = Math.min(ty, state.player.fy + sp);
  else if (state.player.fy > ty) state.player.fy = Math.max(ty, state.player.fy - sp);

  // If we've arrived at the tile, accept new direction
  if (state.player.fx === tx && state.player.fy === ty) {
    if (queuedDir >= 0) {
      if (tryMove(state.player, queuedDir)) {
        // ok
      }
    }
  }
}

let ghostTick = 0;
function stepGhost(g) {
  const tx = g.x * TILE, ty = g.y * TILE;
  const sp = 2;
  if (g.fx < tx) g.fx = Math.min(tx, g.fx + sp);
  else if (g.fx > tx) g.fx = Math.max(tx, g.fx - sp);
  if (g.fy < ty) g.fy = Math.min(ty, g.fy + sp);
  else if (g.fy > ty) g.fy = Math.max(ty, g.fy - sp);
  if (g.fx === tx && g.fy === ty) {
    // pick a new dir; prefer continuing
    const candidates = [g.dir, ...[0,1,2,3].filter(d => d !== g.dir)];
    let moved = false;
    if (Math.random() < 0.20) candidates.reverse();
    for (const d of candidates) {
      const [dx, dy] = DIRS[d];
      if (canEnter(g.x + dx, g.y + dy)) {
        g.x += dx; g.y += dy; g.dir = d;
        moved = true; break;
      }
    }
    if (!moved) g.dir = (g.dir + 1) % 4;
  }
  g.wob = (g.wob || 0) + 0.15;
}

function stepReg(r) {
  // Regressions move slightly slower and chase toward player crudely
  const tx = r.x * TILE, ty = r.y * TILE;
  const sp = 1.5;
  if (r.fx < tx) r.fx = Math.min(tx, r.fx + sp);
  else if (r.fx > tx) r.fx = Math.max(tx, r.fx - sp);
  if (r.fy < ty) r.fy = Math.min(ty, r.fy + sp);
  else if (r.fy > ty) r.fy = Math.max(ty, r.fy - sp);
  if (r.fx === tx && r.fy === ty) {
    // Bias toward player
    const dx = Math.sign(state.player.x - r.x);
    const dy = Math.sign(state.player.y - r.y);
    const order = [];
    if (Math.random() < 0.6 && dx !== 0) order.push(dx > 0 ? 1 : 0);
    if (dy !== 0) order.push(dy > 0 ? 3 : 2);
    [0,1,2,3].forEach(d => { if (!order.includes(d)) order.push(d); });
    let moved = false;
    for (const d of order) {
      const [ddx, ddy] = DIRS[d];
      if (canEnter(r.x + ddx, r.y + ddy)) { r.x += ddx; r.y += ddy; r.dir = d; moved = true; break; }
    }
    if (!moved) r.dir = (r.dir + 1) % 4;
  }
}

// ════════════════════════════════════════════════════════════════════════
// COLLISION & PICKUP
// ════════════════════════════════════════════════════════════════════════
function pickup() {
  const k = state.player.x + ',' + state.player.y;
  const isNewTile = k !== state.lastTile;
  state.lastTile = k;
  if (items[k]) {
    const v = items[k];
    if (ITEMS[v]) {
      const it = ITEMS[v];
      // Trophies live outside the 31-pellet collected set: walking onto
      // one only shows its locked/unlocked card. Re-fire only when the
      // player has actually stepped onto a NEW tile (so dismissing the
      // card and standing still doesn't loop the popup).
      if (it.kind === 'trophy') {
        if (isNewTile) {
          beep(it.tier === 'GOLD' ? 1568 : it.tier === 'SILVER' ? 1175 : 880, 0.10, 'square', 0.05);
          showTrophyCard(v);
        }
        return;
      }
      if (!collected.has(v)) {
        collected.add(v);
        state.score += it.score;
        if (it.kind === 'power') sfxPower();
        else if (it.kind === 'boss') sfxBoss();
        else if (it.kind === 'anchor') {
          // Trigger 5-second time-dilation. Ghosts and regressions step
          // at half rate while state.dilation > 0 (see loop()).
          state.dilation = 300;
          sfxAnchor();
        }
        else sfxCollect();
        showCard(v);
        if (collected.size >= totalPellets) {
          setTimeout(() => triggerWin(), 600);
        }
      }
    }
  }
}

function checkGhostCollision() {
  if (state.invuln > 0) return;
  for (const g of state.ghosts) {
    if (Math.abs(g.fx - state.player.fx) < TILE * 0.6 && Math.abs(g.fy - state.player.fy) < TILE * 0.6) {
      // Soft tier — show resolution card, don't kill, give brief invuln.
      // Counts as a ghost-ref contact for GOLD-tier disqualification.
      sfxGhost();
      state.ghostHits++;
      showGhostCard(g);
      state.invuln = 60;
      return;
    }
  }
  for (const r of state.regs) {
    if (Math.abs(r.fx - state.player.fx) < TILE * 0.55 && Math.abs(r.fy - state.player.fy) < TILE * 0.55) {
      // Hard hit — costs a life and disqualifies SILVER/GOLD this run
      sfxHurt();
      state.lives--;
      state.livesLost++;
      state.invuln = 120;
      showRegressionCard(r);
      state.player.x = playerStart.x;
      state.player.y = playerStart.y;
      state.player.fx = playerStart.x * TILE;
      state.player.fy = playerStart.y * TILE;
      if (state.lives <= 0) {
        setTimeout(() => triggerLose(), 1200);
      }
      return;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// CARD UI
// ════════════════════════════════════════════════════════════════════════
const cardEl = document.getElementById('card');
function showCard(key) {
  const it = ITEMS[key];
  document.getElementById('cTtl').textContent  = it.title;
  document.getElementById('cSub').textContent  = it.sub;
  document.getElementById('cBody').textContent = it.body;
  const cmd = document.getElementById('cCmd');
  cmd.textContent = it.cmd || '';
  cmd.style.display = it.cmd ? 'block' : 'none';
  document.getElementById('cSrc').textContent = '⟶ ' + (it.src || '');
  cardEl.classList.remove('ghost', 'regression', 'hidden');
  state.mode = 'card';
}
function showGhostCard(g) {
  document.getElementById('cTtl').textContent  = '⚠ GHOST-REF — ' + g.name;
  document.getElementById('cSub').textContent  = 'SOFT TIER · NON-BLOCKING';
  document.getElementById('cBody').textContent = g.body;
  const cmd = document.getElementById('cCmd');
  cmd.textContent  = 'Referenced in: ' + g.ref;
  cmd.style.display = 'block';
  document.getElementById('cSrc').textContent = '⟶ ' + GHOST_RESOLUTION;
  cardEl.classList.remove('regression');
  cardEl.classList.add('ghost');
  cardEl.classList.remove('hidden');
  state.mode = 'card';
}
function showRegressionCard(r) {
  document.getElementById('cTtl').textContent  = '▲ REGRESSION — ' + r.name;
  document.getElementById('cSub').textContent  = 'HARD HIT · -1 LIFE';
  document.getElementById('cBody').textContent = r.body;
  const cmd = document.getElementById('cCmd');
  cmd.textContent = 'Failure mode: silent erosion of the witness net.';
  cmd.style.display = 'block';
  document.getElementById('cSrc').textContent = '⟶ See docs/rigor/RIGOR.md §"Failure modes of the discipline itself"';
  cardEl.classList.remove('ghost');
  cardEl.classList.add('regression');
  cardEl.classList.remove('hidden');
  state.mode = 'card';
}
function closeCard() {
  cardEl.classList.add('hidden');
  cardEl.classList.remove('ghost', 'regression');
  state.mode = 'play';
}

// ════════════════════════════════════════════════════════════════════════
// TROPHY / TIER SYSTEM
// ────────────────────────────────────────────────────────────────────────
// Three tiers of completion. Stored in localStorage as a comma-separated
// list of earned tier names. Higher tiers imply lower (GOLD ⇒ SILVER+BRONZE).
// computeTier() reads the live counters; awardTier() persists; getTrophies()
// reads back. The on-map T1/T2/T3 medallions render lit-or-locked off this.
// ════════════════════════════════════════════════════════════════════════
const TROPHY_KEY = 'witnessNet.trophies';
const TIER_COLOR = { BRONZE:'#cd7f32', SILVER:'#c0c0c0', GOLD:'#ffd700' };
const TIER_STARS = { BRONZE:'★', SILVER:'★★', GOLD:'★★★' };
const TIER_ROMAN = { BRONZE:'I', SILVER:'II', GOLD:'III' };
const TIER_BONUS = { BRONZE: 500, SILVER: 2000, GOLD: 5000 };
const TIER_NAME  = { BRONZE:'CREDENTIALED', SILVER:'FIRST-GO', GOLD:'PRISTINE' };
function getTrophies() {
  try {
    const raw = localStorage.getItem(TROPHY_KEY) || '';
    return new Set(raw.split(',').filter(Boolean));
  } catch(_) { return new Set(); }
}
function saveTrophies(s) {
  try { localStorage.setItem(TROPHY_KEY, [...s].join(',')); } catch(_) {}
}
function computeTier() {
  // Caller has already verified collected.size === totalPellets
  if (state.livesLost === 0 && state.ghostHits === 0) return 'GOLD';
  if (state.livesLost === 0) return 'SILVER';
  return 'BRONZE';
}
function awardTier(tier) {
  // Tier rolls up — earning GOLD also lights SILVER and BRONZE
  const trophies = getTrophies();
  trophies.add('BRONZE');
  if (tier === 'SILVER' || tier === 'GOLD') trophies.add('SILVER');
  if (tier === 'GOLD') trophies.add('GOLD');
  saveTrophies(trophies);
  return trophies;
}
function trophyBadgeRow(trophies) {
  // Inline HTML for the three-medal trophy case
  const fmt = t => `<span style="color:${trophies.has(t) ? TIER_COLOR[t] : '#444'}; ` +
    `text-shadow:${trophies.has(t) ? '0 0 8px '+TIER_COLOR[t] : 'none'}">` +
    `${TIER_STARS[t]} ${t}</span>`;
  return fmt('BRONZE') + ' &nbsp;·&nbsp; ' + fmt('SILVER') + ' &nbsp;·&nbsp; ' + fmt('GOLD');
}
function showTrophyCard(key) {
  const it = ITEMS[key];
  const trophies = getTrophies();
  const earned = trophies.has(it.tier);
  document.getElementById('cTtl').textContent = it.title;
  document.getElementById('cSub').textContent = it.sub + (earned ? ' · UNLOCKED' : ' · LOCKED');
  document.getElementById('cBody').textContent = it.body;
  const cmd = document.getElementById('cCmd');
  cmd.textContent = earned
    ? '✓ EARNED — this medallion is lit. The ' + it.tier + ' tier has been credentialed at least once.'
    : '✗ LOCKED — finish a ' + it.tier + ' run to light this medallion. Stays lit forever once earned.';
  cmd.style.display = 'block';
  document.getElementById('cSrc').textContent = '⟶ ' + (it.src || '');
  cardEl.classList.remove('ghost', 'regression', 'hidden');
  state.mode = 'card';
}
function renderTitleTrophies() {
  // Inject the trophy case into the title-screen lore once on load
  const lore = document.getElementById('sLore');
  if (!lore || lore.dataset.trophiesRendered === '1') return;
  const trophies = getTrophies();
  lore.insertAdjacentHTML('beforeend',
    `<div style="margin-top:16px; font-size:15px; letter-spacing:0.3em">` +
      trophyBadgeRow(trophies) +
    `</div>` +
    `<div style="margin-top:6px; font-size:10px; color:#88aaaa; letter-spacing:0.15em">` +
      `bronze = all 31 &nbsp;·&nbsp; silver = first-go &nbsp;·&nbsp; gold = pristine, no ghost-ref contact` +
    `</div>`);
  lore.dataset.trophiesRendered = '1';
}

// ════════════════════════════════════════════════════════════════════════
// WIN / LOSE / RESTART
// ════════════════════════════════════════════════════════════════════════
function triggerWin() {
  state.mode = 'win';
  // Tier evaluation — reads livesLost / ghostHits accumulated this run
  const tier = computeTier();
  const before = getTrophies();
  const isFirstTime = !before.has(tier);
  const trophies = awardTier(tier);
  const bonus = TIER_BONUS[tier];
  state.score += bonus;
  if (state.score > state.hi) { state.hi = state.score; localStorage.setItem('witnessNet.hi', String(state.hi)); }
  // Tier-specific fanfare. New tier? Layer the win jingle underneath for extra weight.
  sfxTierFanfare(tier);
  if (isFirstTime) setTimeout(() => sfxWin(), 250);
  const s = document.getElementById('screen');
  s.classList.remove('hidden');
  // First-time-earn flash, in the tier's color. Only fires when the trophy
  // case actually changes — repeat earns get the fanfare but no flash.
  s.classList.remove('flash-bronze', 'flash-silver', 'flash-gold');
  if (isFirstTime) {
    void s.offsetWidth; // restart CSS animation
    s.classList.add('flash-' + tier.toLowerCase());
  }

  document.getElementById('sBig').textContent = '◤ DISCIPLINE CREDENTIALED ◥';
  document.getElementById('sSmall').innerHTML =
    `<span style="color:${TIER_COLOR[tier]}; font-size:18px; letter-spacing:0.4em; ` +
    `text-shadow:0 0 12px ${TIER_COLOR[tier]}">` +
    `${TIER_STARS[tier]} TIER ${TIER_ROMAN[tier]} · ${tier} · ${TIER_NAME[tier]} ${TIER_STARS[tier]}` +
    `</span>`;
  const flavor = tier === 'GOLD'
    ? 'Every soft-tier reference resolved or routed around. Pristine.'
    : tier === 'SILVER'
      ? 'No regression landed. Try a no-ghost-contact run for GOLD.'
      : 'Foundational tier earned. A clean run (no deaths) lights SILVER; a pristine run (no ghost contact) lights GOLD.';
  document.getElementById('sLore').innerHTML =
    `Final score: <span style="color:#ffff00">${state.score}</span> ` +
      `<span style="color:#888">(includes <span style="color:${TIER_COLOR[tier]}">+${bonus} ${tier} bonus</span>)</span><br>` +
    `Lives lost this run: <span style="color:${state.livesLost === 0 ? '#00ff66' : '#ff2222'}">${state.livesLost}</span><br>` +
    `Ghost-ref contacts: <span style="color:${state.ghostHits === 0 ? '#00ff66' : '#ffaa00'}">${state.ghostHits}</span><br>` +
    `High score: <span style="color:#ff00ff">${state.hi}</span><br><br>` +
    (isFirstTime
      ? `<span style="color:${TIER_COLOR[tier]}; font-weight:bold; font-size:14px; letter-spacing:0.3em">` +
        `⚡ NEW TROPHY UNLOCKED · ${tier} ⚡` +
        `</span><br><br>`
      : `<span style="color:#888">(already earned this tier — trophy stays lit)</span><br><br>`) +
    `<div style="font-size:14px; letter-spacing:0.3em; margin:8px 0">` +
      trophyBadgeRow(trophies) +
    `</div>` +
    `<i style="font-size:11px; color:#aaccff">${flavor}</i>`;
  document.getElementById('sBlink').textContent = '> PRESS [SPACE] TO PLAY AGAIN <';
}
function triggerLose() {
  state.mode = 'over';
  if (state.score > state.hi) { state.hi = state.score; localStorage.setItem('witnessNet.hi', String(state.hi)); }
  sfxLose();
  const s = document.getElementById('screen');
  s.classList.remove('hidden');
  document.getElementById('sBig').textContent = '▼ GAME OVER ▼';
  document.getElementById('sSmall').textContent = 'YOUR DISCIPLINE DRIFTED';
  document.getElementById('sLore').innerHTML =
    `Score: <span style="color:#ffff00">${state.score}</span> &nbsp;·&nbsp; ` +
    `Pellets: <span style="color:#00ffff">${collected.size} / ${totalPellets}</span><br>` +
    `High score: <span style="color:#ff00ff">${state.hi}</span><br><br>` +
    `<i>The regression caught up. The witness net is now lying about a property it once defended.</i><br><br>` +
    `<span style="color:#ff2222">Hint:</span> ghosts are SOFT — touching them is fine.<br>` +
    `<span style="color:#ff2222">▲ regressions</span> are the actual enemy.`;
  document.getElementById('sBlink').textContent = '> PRESS [SPACE] TO RETRY <';
}
function restart() {
  state.score = 0;
  state.lives = 3;
  state.invuln = 0;
  state.livesLost = 0;
  state.ghostHits = 0;
  state.lastTile = null;
  state.dilation = 0;
  state.player.x = playerStart.x;
  state.player.y = playerStart.y;
  state.player.fx = playerStart.x * TILE;
  state.player.fy = playerStart.y * TILE;
  state.player.dir = 1;
  collected = new Set();
  initGhosts();
  cardEl.classList.add('hidden');
  cardEl.classList.remove('ghost', 'regression');
  const s = document.getElementById('screen');
  s.classList.add('hidden');
  s.classList.remove('flash-bronze', 'flash-silver', 'flash-gold');
  state.mode = 'play';
  sfxStart();
}

// ════════════════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════════════════
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
cv.width = COLS * TILE;
cv.height = ROWS * TILE;

// ── SVG sprites: <symbol> + <defs> → self-contained SVG → raster Image ──
// Upgraded path (v2):
//   1) DOMParser.parseFromString (well-formed, catches bad markup)
//   2) Prefix every id + rewrite url(#…) refs so each blob is collision-free
//      and filters/gradients resolve in isolation
//   3) XMLSerializer (Unicode-safe vs raw string concat)
//   4) Blob → createObjectURL (avoids huge data: URLs; revoke after decode)
//   5) optional image.decode() for crisper first paint on supporting browsers
const SPR = { wall: null, player: null, ghost: null, regression: null, star: null, boss: null };
function applySvgIdPrefix(svgEl, pfx) {
  const idMap = Object.create(null);
  const nodes = svgEl.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i], old = el.getAttribute('id');
    if (!old) continue;
    idMap[old] = pfx + old;
    el.setAttribute('id', pfx + old);
  }
  function fixAttrVal(s) {
    if (!s || s.indexOf('url(') === -1) return s;
    return s.replace(/url\(\s*#([^\s)]+)\s*\)/g, function(_m, name) {
      return 'url(#' + (idMap[name] || pfx + name) + ')';
    });
  }
  const all = svgEl.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i], attrs = el.attributes;
    for (let j = 0; j < attrs.length; j++) {
      const a = attrs[j];
      if (a.name === 'id') continue;
      const nv = fixAttrVal(a.value);
      if (nv !== a.value) el.setAttribute(a.name, nv);
    }
  }
}
function buildRasterSvgString(sheetId, symbolId) {
  const sheet = document.getElementById(sheetId);
  const sym = document.getElementById(symbolId);
  if (!sheet || !sym) return null;
  const defs = sheet.querySelector('defs');
  const vb = sym.getAttribute('viewBox') || '0 0 24 24';
  const src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '">' +
    (defs ? defs.outerHTML : '') + '<g class="raster">' + sym.innerHTML + '</g></svg>';
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') return null;
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;
  const pfx = 's' + (Date.now() % 0x7fff).toString(16) + '-' +
    (Math.random().toString(16).slice(2, 10)) + '-';
  applySvgIdPrefix(doc.documentElement, pfx);
  return new XMLSerializer().serializeToString(doc.documentElement);
}
function loadSymbolAsImageLegacy(symbolId, cb) {
  const root = document.getElementById('arcade-sprites');
  const sym = document.getElementById(symbolId);
  if (!root || !sym) { cb(null); return; }
  const defs = root.querySelector('defs');
  const vb = sym.getAttribute('viewBox') || '0 0 24 24';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '">' +
    (defs ? defs.outerHTML : '') + sym.innerHTML + '</svg>';
  const u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const im = new Image();
  im.onload = function() { cb(im); };
  im.onerror = function() { cb(null); };
  im.src = u;
}
function loadSymbolAsImage(symbolId, cb) {
  const xml = buildRasterSvgString('arcade-sprites', symbolId);
  if (!xml) { loadSymbolAsImageLegacy(symbolId, cb); return; }
  let burl;
  let isBlob = false;
  try {
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    burl = URL.createObjectURL(blob);
    isBlob = burl && burl.indexOf('blob:') === 0;
  } catch (_) {
    burl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  }
  const img = new Image();
  const cleanup = function() {
    if (isBlob && burl) { try { URL.revokeObjectURL(burl); } catch (_) {} }
  };
  img.onload = function() { cleanup(); cb(img); };
  img.onerror = function() { cleanup(); loadSymbolAsImageLegacy(symbolId, cb); };
  img.src = burl;
  if (img.decode) { img.decode().catch(function() { /* ignore */ }); }
}
(function initArcadeSprites() {
  const list = [
    ['sprite-wall', 'wall'],
    ['sprite-player', 'player'],
    ['sprite-ghost', 'ghost'],
    ['sprite-regression', 'regression'],
    ['sprite-star', 'star'],
    ['sprite-boss', 'boss'],
  ];
  for (const [sid, key] of list) {
    loadSymbolAsImage(sid, im => { SPR[key] = im; });
  }
}());

function drawWall(x, y) {
  const px = x * TILE, py = y * TILE;
  if (SPR.wall && SPR.wall.complete && SPR.wall.naturalWidth) {
    ctx.drawImage(SPR.wall, px, py, TILE, TILE);
    return;
  }
  ctx.fillStyle = '#000814';
  ctx.fillRect(px, py, TILE, TILE);
  ctx.strokeStyle = '#1144ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#3366ff';
  ctx.shadowBlur = 6;
  ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
  ctx.shadowBlur = 0;
}
function drawFloor(x, y) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
}

function drawItem(x, y, key) {
  const it = ITEMS[key];
  if (!it) return;
  if (collected.has(key)) return;
  const cx = x*TILE + TILE/2;
  const cy = y*TILE + TILE/2;
  ctx.save();
  ctx.shadowColor = it.color;
  ctx.shadowBlur = 10;
  if (it.kind === 'power') {
    if (SPR.star && SPR.star.complete && SPR.star.naturalWidth) {
      ctx.shadowBlur = 0;
      ctx.drawImage(SPR.star, cx - TILE / 2, cy - TILE / 2, TILE, TILE);
    } else {
      const t = Date.now()/200;
      const r = 7 + Math.sin(t)*1.5;
      ctx.fillStyle = it.color;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 - Math.PI/2;
        const rr = i%2 === 0 ? r : r/2;
        ctx.lineTo(cx + Math.cos(ang)*rr, cy + Math.sin(ang)*rr);
      }
      ctx.closePath();
      ctx.fill();
    }
  } else if (it.kind === 'boss') {
    if (SPR.boss && SPR.boss.complete && SPR.boss.naturalWidth) {
      ctx.shadowBlur = 0;
      ctx.drawImage(SPR.boss, cx - TILE / 2, cy - TILE / 2, TILE, TILE);
    } else {
      ctx.fillStyle = it.color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 9);
      ctx.lineTo(cx + 9, cy);
      ctx.lineTo(cx, cy + 9);
      ctx.lineTo(cx - 9, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', cx, cy);
    }
  } else if (it.kind === 'anchor') {
    // Rotating hexagonal crystal with an inset rotating triangle and
    // three orbiting motes. Cyan-green to mark it as kin to the W4
    // time-reversibility witness rather than a regular collectible.
    const t = Date.now() / 600;
    const hexR = 9;
    ctx.shadowColor = it.color;
    ctx.shadowBlur = 14;
    // Outer hexagon, slowly rotating
    ctx.fillStyle = it.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = t + (i / 6) * Math.PI * 2;
      const px = cx + Math.cos(ang) * hexR;
      const py = cy + Math.sin(ang) * hexR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // Dark inner hex so the triangle reads
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#001a14';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = t + (i / 6) * Math.PI * 2;
      const px = cx + Math.cos(ang) * hexR * 0.6;
      const py = cy + Math.sin(ang) * hexR * 0.6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // Counter-rotating inner triangle (the W4 forward-then-reverse motif)
    ctx.fillStyle = it.color;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ang = -t * 1.7 + (i / 3) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(ang) * hexR * 0.45;
      const py = cy + Math.sin(ang) * hexR * 0.45;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // Three orbiting motes — strong "this is novel / interactive" hint
    ctx.shadowColor = it.color;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
      const ang = t * 2.1 + (i / 3) * Math.PI * 2;
      const px = cx + Math.cos(ang) * (hexR + 3);
      const py = cy + Math.sin(ang) * (hexR + 3);
      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (it.kind === 'trophy') {
    // Lit medallion (earned) vs locked padlock (unearned).
    // Read straight off localStorage so the state is always live.
    const trophies = getTrophies();
    const earned = trophies.has(it.tier);
    if (earned) {
      const t = Date.now() / 280;
      const pulse = 1 + Math.sin(t) * 0.07;
      const r = 9;
      // Ribbon (translucent V hanging below the medal)
      ctx.shadowBlur = 0;
      ctx.fillStyle = it.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + r * 0.55);
      ctx.lineTo(cx,     cy + r + 3);
      ctx.lineTo(cx + 4, cy + r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      // Outer pulsing rim
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = it.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
      ctx.fill();
      // Dark inner well so the numeral reads
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a0d00';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
      // Tier numeral, glowing in tier color
      ctx.fillStyle = it.color;
      ctx.shadowColor = it.color;
      ctx.shadowBlur = 6;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.glyph, cx, cy + 0.5);
    } else {
      // Locked: padlock silhouette (shackle + body + keyhole). No glow.
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      // Shackle (semicircle)
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 4, Math.PI, 0);
      ctx.stroke();
      // Body (rounded rect)
      ctx.fillStyle = '#1a1a1a';
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.rect(cx - 5, cy - 3, 10, 9);
      ctx.fill();
      ctx.stroke();
      // Keyhole
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(cx, cy + 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 0.5, cy + 1, 1, 3);
    }
  } else {
    // Witness/Pattern: glyph in colored circle
    ctx.fillStyle = it.color;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(it.glyph, cx, cy + 0.5);
  }
  ctx.restore();
}

function drawPlayer() {
  const p = state.player;
  const cx = p.fx + TILE/2, cy = p.fy + TILE/2;
  ctx.save();
  if (state.invuln > 0 && Math.floor(Date.now()/80) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  if (SPR.player && SPR.player.complete && SPR.player.naturalWidth) {
    // Sprite faces +x; rotate to match movement dir
    const ang = p.dir === 0 ? Math.PI : p.dir === 1 ? 0 : p.dir === 2 ? -Math.PI/2 : Math.PI/2;
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.drawImage(SPR.player, -TILE/2, -TILE/2, TILE, TILE);
  } else {
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffff00';
    p.mouth = (p.mouth + 0.18) % (Math.PI*2);
    const mouthOpen = (Math.sin(p.mouth) + 1) / 2 * 0.55;
    let baseAng = 0;
    if (p.dir === 0) baseAng = Math.PI;
    else if (p.dir === 1) baseAng = 0;
    else if (p.dir === 2) baseAng = -Math.PI/2;
    else baseAng = Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, TILE*0.45, baseAng + mouthOpen, baseAng + Math.PI*2 - mouthOpen);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGhost(g) {
  const cx = g.fx + TILE/2, cy = g.fy + TILE/2;
  ctx.save();
  if (SPR.ghost && SPR.ghost.complete && SPR.ghost.naturalWidth) {
    ctx.translate(cx, cy + Math.sin(g.wob) * 0.6);
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
    ctx.drawImage(SPR.ghost, -TILE/2, -TILE/2, TILE, TILE);
  } else {
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffaa00';
    const r = TILE * 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r - 2);
    const waves = 4;
    const ww = (r*2) / waves;
    for (let i = 0; i < waves; i++) {
      const xx = cx + r - i*ww;
      ctx.lineTo(xx - ww/2, cy + r - 5 + Math.sin(g.wob + i)*1.5);
      ctx.lineTo(xx - ww,   cy + r - 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx - 4, cy - 3, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy - 3, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx - 4 + (g.dir===1?1:g.dir===0?-1:0), cy - 3 + (g.dir===3?1:g.dir===2?-1:0), 1.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4 + (g.dir===1?1:g.dir===0?-1:0), cy - 3 + (g.dir===3?1:g.dir===2?-1:0), 1.2, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawReg(r) {
  const cx = r.fx + TILE/2, cy = r.fy + TILE/2;
  ctx.save();
  if (SPR.regression && SPR.regression.complete && SPR.regression.naturalWidth) {
    ctx.shadowBlur = 0;
    ctx.drawImage(SPR.regression, cx - TILE/2, cy - TILE/2, TILE, TILE);
  } else {
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i/6)*Math.PI*2 - Math.PI/2;
      const rr = i%2 === 0 ? 9 : 5;
      ctx.lineTo(cx + Math.cos(ang)*rr, cy + Math.sin(ang)*rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▲', cx, cy);
  }
  ctx.restore();
}

function drawZoneLabels() {
  ctx.save();
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 4;
  ctx.fillText('PHASE 4', 1*TILE + 6, 2*TILE + 14);
  ctx.fillStyle = '#00ff66';
  ctx.shadowColor = '#00ff66';
  ctx.fillText('Z C C',   16*TILE + 8, 2*TILE + 14);
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = '#ff00ff';
  ctx.fillText('DISCIPLINE', 2*TILE, 9*TILE + 14);
  ctx.fillStyle = '#ffaa00';
  ctx.shadowColor = '#ffaa00';
  ctx.fillText('OPS', 2*TILE, 14*TILE + 14);
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.fillText('TROPHIES', 2*TILE, 16*TILE + 14);
  ctx.restore();
}

function drawDilationOverlay() {
  // Active only during a PRIME ANCHOR window. A pulsing cyan edge
  // vignette + a top-center countdown so the player feels the slowed
  // time and knows how long they have left.
  if (state.dilation <= 0) return;
  ctx.save();
  const t = Date.now() / 200;
  const alpha = 0.30 + Math.sin(t) * 0.15;
  ctx.strokeStyle = '#00ffaa';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00ffaa';
  ctx.shadowBlur = 14;
  ctx.globalAlpha = alpha;
  ctx.strokeRect(2, 2, cv.width - 4, cv.height - 4);
  ctx.globalAlpha = 1;
  // Countdown label
  ctx.fillStyle = '#00ffaa';
  ctx.shadowColor = '#00ffaa';
  ctx.shadowBlur = 8;
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const secs = (state.dilation / 60).toFixed(1);
  ctx.fillText('⟁ TIME-DILATE  ' + secs + 's', cv.width / 2, 6);
  ctx.restore();
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cv.width, cv.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === 1) drawWall(x, y);
      else if (grid[y][x] === 2) drawFloor(x, y);
    }
  }

  drawZoneLabels();

  // Items
  for (const pos of itemPositions) {
    drawItem(pos.x, pos.y, pos.key);
  }

  // Ghosts and regressions
  for (const g of state.ghosts) drawGhost(g);
  for (const r of state.regs) drawReg(r);

  drawPlayer();

  // Active-modifier overlay (drawn last so it sits on top of everything)
  drawDilationOverlay();
}

// ════════════════════════════════════════════════════════════════════════
// HUD
// ════════════════════════════════════════════════════════════════════════
function currentEligibility() {
  // Live tier-eligibility based on counters accumulated this run.
  // Downgrades GOLD → SILVER → BRONZE as hits land. Never upgrades.
  if (state.livesLost === 0 && state.ghostHits === 0) return 'GOLD';
  if (state.livesLost === 0) return 'SILVER';
  return 'BRONZE';
}
function updateHUD() {
  document.getElementById('hScore').textContent = String(state.score).padStart(5, '0');
  document.getElementById('hLives').textContent =
    '◉'.repeat(Math.max(0, state.lives)) + '◯'.repeat(Math.max(0, 3 - state.lives));
  document.getElementById('hPellets').textContent =
    String(collected.size).padStart(2, '0') + ' / ' + totalPellets;
  document.getElementById('hHi').textContent = String(state.hi).padStart(5, '0');
  // Live tier indicator — colored to the eligibility level. Visible feedback
  // that taking a ghost contact closes the GOLD path; taking a regression
  // closes SILVER too.
  const tEl = document.getElementById('hTier');
  if (tEl) {
    const tier = currentEligibility();
    tEl.textContent = TIER_STARS[tier] + ' ' + tier;
    tEl.style.color = TIER_COLOR[tier];
    tEl.style.textShadow = '0 0 6px ' + TIER_COLOR[tier];
  }
}

// ════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ════════════════════════════════════════════════════════════════════════
function loop() {
  if (state.mode === 'play') {
    stepPlayer();
    moveTick++;
    // While the PRIME ANCHOR is active, ghosts and regressions tick at
    // half their normal rate. Player keeps full speed → big tactical gap.
    const ghostMod = state.dilation > 0 ? 4 : 2;
    const regMod   = state.dilation > 0 ? 6 : 3;
    if (moveTick % ghostMod === 0) {
      for (const g of state.ghosts) stepGhost(g);
    }
    if (moveTick % regMod === 0) {
      for (const r of state.regs) stepReg(r);
    }
    pickup();
    checkGhostCollision();
    if (state.invuln > 0) state.invuln--;
    if (state.dilation > 0) state.dilation--;
  }
  render();
  if (state.mode === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 12;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▌▌  PAUSED  ▌▌', cv.width/2, cv.height/2);
    ctx.font = '12px monospace';
    ctx.fillText('PRESS [ESC] TO RESUME', cv.width/2, cv.height/2 + 28);
    ctx.restore();
  }
  updateHUD();
  requestAnimationFrame(loop);
}

// Initial title screen state — render the persistent trophy case below
// the lore so a returning player sees what they've already earned before
// they press SPACE.
state.mode = 'title';
renderTitleTrophies();
loop();
