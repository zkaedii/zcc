---
name: zkaedi-bug-hunter
description: "Supercharged Error Management Squad for production-grade defect hunting. Operationalizes the lucky-coder/lucky-auditor/lucky-catch/lucky-bug-hunter doctrine: every bug is an invariant violation until proven otherwise, every error path is part of the product, every production push requires evidence. v1.1.0 ships 78 domain invariants across 8 categories (15 global + 30 codegen + 16 error-management + 5 IR + 3 docs + 3 tests + 3 security + 3 build), a 50-invariant T0-T7 release-readiness ladder (Must Not Ship → Must Improve the System), 13 production push gates, a 25-agent roster, four workflows (doc_drift_audit, codegen_runtime_bug, error_management_bug, selfhost_regression), and a working CLI runner (bug_hunter.py) that decodes base64 repros, compiles with target+reference, diffs runtime behavior, and emits multi-invariant Finding Reports with status, severity, and ship/hold/needs-evidence verdicts driven by an explicit ship_decision_policy. Trigger on phrases like 'lucky bug-hunter', 'codegen audit', 'invariant violation', 'minimal repro', 'reference judge', 'production push gate', 'is this safe to ship', 'find the codegen bug', 'why does target diverge from gcc', 'add this to the corpus', 'T0/T1/T2 ladder', 'release readiness', 'doc drift audit', 'PHI parallel copy', 'callee-saved clobber', 'selfhost regression'. Pairs with zkaedi-gate-discipline (forensic milestone closure), zkaedi-correctness-floor (pre-generation lift), error-learner (pattern memory), zkaedi-compiler-forge (codegen authoring), and zkaedi-zcc-ir-bridge (ZCC-specific IR work). Use when running ZCC bootstrap audits, hunting CG-IR-### bugs, validating fixes before commit, growing the regression corpus, or staging a release through the T0-T7 ladder."
version: "1.1.0"
last_validated: "2026-05-04"
pairs_with:
  - zkaedi-gate-discipline
  - zkaedi-correctness-floor
  - error-learner
  - zkaedi-compiler-forge
  - zkaedi-zcc-ir-bridge
---

# 🔱 ZKAEDI BUG HUNTER — Supercharged Error Management Squad

> **Operating principle.** Every bug is an invariant violation until proven
> otherwise. Every error path is part of the product. Every recovery path must
> be deterministic, observable, and safe. Every production push requires
> evidence — not vibes.

This skill is the **bug-hunting half** of the loop. `zkaedi-correctness-floor`
lifts generation quality before the gate fires; this lifts *audit* quality
when something has already failed and a fix is in flight. `zkaedi-gate-discipline`
decides whether a milestone closure is real; this decides whether a *defect
fix* is real.

**v1.1.0** adds five new categories (IR, docs, tests, security, build), the
**T0–T7 release-readiness ladder** (a separate orthogonal axis from domain
categories), four explicit workflows, multi-invariant attribution per finding,
and a structured `ship_decision_policy` that drives the verdict.

---

## When to trigger

- "Find the bug." / "What broke this?" / "Why is target diverging from gcc?"
- "Is this safe to ship?" / "Run the production push gates."
- "T0 / T1 / T3 / release readiness." / "Run the ladder."
- Any time a CG-IR-### or similar codegen defect is being filed, fixed,
  reproduced, or claimed-fixed.
- Any time someone says "the bootstrap is stable" without an attached command
  + raw output (Invariant **G-01 / DOC-03 / T0-01** — Evidence Before Belief).
- Any time a fix lands without a regression test (Invariants **G-10 / T3-02**).
- Any time an assembler/linker/subprocess error gets quietly absorbed
  (Invariants **EM-12 / EM-13 / T0-06** — Exit Status Truth).
- Any time docs and the source disagree about a known bug (workflow
  `doc_drift_audit`, Invariants **G-11 / DOC-01 / DOC-03**).

Anti-trigger: prose-only mention of a bug with no command, no input, no error
text, no source pointer. Ask for a reproducer first; do not begin gating an
imaginary defect.

---

## Two orthogonal axes

```
                       DOMAIN AXIS
                  (what kind of bug)
                          │
   ┌─ global  codegen  error_mgmt  ir  docs  tests  security  build ─┐
   │                                                                  │
   │  T0  Must Not Ship                                               │
   │  T1  Must Understand                                             │
   │  T2  Must Patch Safely                                           │
   │  T3  Must Prove and Preserve              ◄── TIER AXIS          │
   │  T4  Must Operate Well                    (release readiness)    │
   │  T5  Must Scale Under Stress                                     │
   │  T6  Must Resist Adversaries                                     │
   │  T7  Must Improve the System                                     │
   └──────────────────────────────────────────────────────────────────┘
```

A finding violates one or more **domain** invariants (e.g. `CG-09` sign-extension
+ `G-09` determinism). The same finding lands at one or more **tiers** that
gate release impact (e.g. T0-04 Artifact Integrity, T3-02 Regression Test).

---

## Hard rules

1. **No PASS without raw output.** Not even bootstrap-stable claims. The
   command and its output go in the finding (G-01 / T0-01 / DOC-03).
2. **No fix without a reproducer.** Either an existing failing test or a new
   minimized one (G-02 / T1-01).
3. **No "should work" reasoning.** Either you ran it and captured the output,
   or it is `suspected`, not `confirmed` (G-15).
4. **No swallowed errors.** Subprocess return codes, malloc failures, IO
   failures, parser errors — all must propagate or fatal (G-05 / EM-01 / T0-02).
5. **No silent successful artifacts on failed compile.** `.o` and `.s` files
   from a failed build are misleading evidence (EM-06 / EM-14 / T0-04).
6. **No claim of fix without regression coverage** added to the corpus or test
   tree (G-10 / T3-02).
7. **Reference compiler is the floor oracle.** Where applicable, target output
   is compared against `cc`/`gcc`. Selfhost identity, ABI spec, sanitizer, and
   fuzzing are stronger oracles when available (TEST-01 / T3-05).
8. **Severity drives ship policy.** P0/P1 with no validation → hold or
   needs-evidence; never ship a P0 on suspicion alone.

---

## What you get

### Files

| Path                            | Purpose                                                   |
|---------------------------------|-----------------------------------------------------------|
| `bug_hunter.py`                 | Stdlib-only Python CLI (run / invariants / gates / tiers / release-policy / workflow / test-matrix / severity / template). |
| `invariants.json`               | Schema v1.1.0 — 8 categories, 78 domain invariants, 50 tier invariants, 13 gates, 25 agents, severity_model, evidence_model, finding_statuses, finding_report_template, workflows, test_matrix, base64_magic_protocol, ship_decision_policy, quick_commands, tiers (T0-T7), release_policy. |
| `corpus/`                       | Reproducer entries: base64 source, target+reference compile/run argv, expected exit, violated invariants. |
| `prompts/codegen_audit.md`      | One-shot Antigravity / agent dispatch prompt for a full audit pass. |
| `README.md`                     | Quickstart and CLI reference.                             |
| `CHANGELOG.md`                  | v1.0.0 → v1.1.0 additions.                                |

### Domain invariants (78 across 8 categories)

| Cat | Count | Range                         | Theme                                                 |
|-----|------:|-------------------------------|-------------------------------------------------------|
| global     | 15 | G-01 … G-15           | Evidence, repro, causal chain, doc sync, no phantom certainty |
| codegen    | 30 | CG-01 … CG-30         | Semantic preservation, ABI, registers, stack, types, branches, returns, frames, IR/AST boundary, bootstrap identity |
| ir         |  5 | IR-01 … IR-05         | CFG, PHI, dominance, reachability, lowering completeness |
| error_mgmt | 16 | EM-01 … EM-16         | No-swallow, diagnostics, partial output, exit-status truth, atomic output, panic context, recovery boundary |
| docs       |  3 | DOC-01 … DOC-03       | Known-bug ledger accuracy, line-number freshness, evidence attachment |
| tests      |  3 | TEST-01 … TEST-03     | Oracle strength, flake resistance, negative coverage |
| security   |  3 | SEC-01 … SEC-03       | Memory safety, hostile source input, toolchain trust boundary |
| build      |  3 | BUILD-01 … BUILD-03   | Clean-build reproducibility, selfhost gate, source-mirror sync |

### Production push gates (13)

```
0  Baseline                  — confirm pre-existing red before changes
1  Minimal Repro             — fix has a minimized failing test
2  Root Cause                — uncertainty marked explicitly if unknown
3  Surgical Fix              — smallest safe change
4  Targeted Validation       — original repro passes
5  Regression Validation     — bug cannot return silently
6  Broad Validation          — build / unit / integration / selfhost / sanitizer
7  Risk Review               — low / medium / high blast radius
8  Ship/Hold                 — evidence-driven verdict
9  Doc Sync                  — BUGS.md / corpus / README aligned with source-of-truth
10 Artifact Hygiene          — no stale generated files driving decisions
11 Adversarial Counterexample — patch not overfit to minimal repro
12 Rollback Plan             — revert / disable / fall-back identified for high-risk pushes
```

### T0–T7 release-readiness ladder (50 tier invariants)

| Tier   | Name                          | Core question                                                       | Ship impact                                |
|--------|-------------------------------|---------------------------------------------------------------------|--------------------------------------------|
| T0/P0  | Must Not Ship                 | Are we lying, corrupting, leaking, or continuing unsafely?          | Hard blocker                               |
| T1/P1  | Must Understand               | Do we know exactly what failed and why?                             | Blocks normal ship                         |
| T2/P2  | Must Patch Safely             | Is the fix narrow, consistent, and semantics-preserving?            | Blocks or risk-accept                      |
| T3/P3  | Must Prove and Preserve       | Did we prove it and prevent recurrence?                             | Required for normal ship                   |
| T4/P4  | Must Operate Well             | Can operators see, recover, and roll back?                          | Required for critical paths                |
| T5/P5  | Must Scale Under Stress       | Does it survive load, latency, concurrency, and degraded deps?      | Required for scale paths                   |
| T6/P6  | Must Resist Adversaries       | Does it fail securely against hostile inputs and environments?      | Required for trust boundaries              |
| T7/P7  | Must Improve the System       | Did the incident make the system stronger?                          | Required after systemic / repeat / high-sev |

Release-policy gates:

- `normal_ship`     — required: T0, T1, T2, T3 · conditional: T4, T5, T6 · post-incident: T7
- `high_risk_ship`  — required: T0, T1, T2, T3, T4, T5, T6 · post-incident: T7
- `emergency_hotfix` — required: T0 + T3-01 (Targeted Proof) + rollback_or_containment ·
  risk-accept-required-for-missing: T1, T2, T3-02, T4, T5, T6 ·
  followup-required: T3-02, T4, T7

Tier invariants reference domain invariants via `mapped_invariants` — e.g.
T0-01 (Evidence Before Belief) maps to G-01 + DOC-03; T0-04 (Artifact Integrity)
maps to G-13 + EM-06 + EM-14.

### Agents (25)

19 from v1.0 plus 6 new:

- **DocSynchronizer** — keep BUGS.md / README / corpus / comments / source aligned.
- **BootstrapMarshal** — own selfhost, byte-identical comparison, stage isolation.
- **IRVerifier** — CFG, PHI, dominance, reachability, liveness, def-use, optimizer safety.
- **ArtifactJanitor** — detect stale generated files, source-tree drift, partial outputs.
- **SecurityLens** — classify exploitability and memory-safety/security impact.
- **OracleDesigner** — pick the strongest validation oracle (reference compiler, ABI spec, selfhost, sanitizer, fuzzer, asm inspection).

### Workflows (4)

| Name                  | Mission                                                              | Key agents |
|-----------------------|----------------------------------------------------------------------|-----------|
| `doc_drift_audit`     | Find/fix stale known-bug docs without falsely claiming runtime defects | DocSynchronizer, ProductionHistorian, Validator |
| `codegen_runtime_bug` | Confirm and fix a semantic / ABI / register / stack / asm defect      | CausalTracer, ABISentinel, RegisterWarden, StackCartographer, ReferenceJudge |
| `error_management_bug`| Fix swallowed errors, bad diagnostics, partial outputs, unsafe recovery | ArtifactJanitor, RegressionArchivist |
| `selfhost_regression` | Investigate bootstrap divergence or self-hosting instability          | BootstrapMarshal, ReferenceJudge, BlastRadiusMapper |

### Severity model (P0–P3)

P0 Production Stopper · P1 High Risk · P2 Medium Risk · P3 Low Risk.
Drives ship policy. P0/P1 without validation → hold or needs-evidence.

### Finding statuses

`suspected`, `confirmed`, `fixed_unverified`, `fixed_verified`, `not_a_bug`,
`doc_drift`, `superseded`, `blocked`.

---

## CLI quickstart

```bash
# List all invariants in a category
python3 bug_hunter.py invariants --category ir
python3 bug_hunter.py invariants --search 'phi'
python3 bug_hunter.py invariants --id CG-25

# T0–T7 ladder
python3 bug_hunter.py tiers                  # full ladder
python3 bug_hunter.py tiers --tier T0        # one tier
python3 bug_hunter.py tiers --id T0-04       # one tier invariant

# Release / workflows / test-matrix / severity
python3 bug_hunter.py release-policy
python3 bug_hunter.py workflow                # all four
python3 bug_hunter.py workflow --name doc_drift_audit
python3 bug_hunter.py test-matrix
python3 bug_hunter.py severity

# Production-push gates as a fillable checklist (0–12)
python3 bug_hunter.py gates

# Run the corpus
python3 bug_hunter.py run corpus/                       \
    --report findings.md --json findings.json           \
    --workdir /tmp/zkaedi-bh

# Blank Finding template (v1.1 schema)
python3 bug_hunter.py template
```

Exit code: `0` if every entry SHIPS, `1` if anything HOLDS or NEEDS-EVIDENCE.

---

## Workflow: classic codegen-bug audit

1. **Reproduce.** Add a corpus entry with `source_base64`, `target_compile_argv`,
   `reference_compile_argv`, `target_run_argv`, `reference_run_argv`,
   `violated_invariants` (multi-list), `severity`. (Gate 1 / Workflow
   `codegen_runtime_bug` step "Minimize source repro.")
2. **Confirm.** Run `bug_hunter.py run`. Either a SHIP (no divergence) or a
   HOLD (divergent) verdict comes back with raw target/reference output. (Gate
   0, Gate 4.)
3. **Trace.** CausalTracer fills the `causal_chain` field: source → AST → IR
   → register allocator → assembly → runtime. (Gate 2.)
4. **Patch.** Smallest fix that restores ABI / sign-extension / stack
   alignment. RegressionArchivist promotes the corpus entry. (Gate 3, Gate 5.)
5. **Validate.** Re-run `bug_hunter.py run` on the corpus. SHIP for the entry.
   Optionally run selfhost (`make selfhost`) for broader codegen patches.
   (Gate 4, Gate 6.)
6. **Doc-sync.** If BUGS.md / CG-IR-### records reference this bug, update
   them to match the new mechanism. (Gate 9 / Workflow `doc_drift_audit`.)
7. **Tier check.** T0 (truth/safety) and T3 (proof/preservation) must clear
   for normal ship. Codegen patches typically also need T4 (operability) and
   T6 (security) considered. (`bug_hunter.py release-policy`.)

## Workflow: doc-drift audit

When a documented "fixed bug" mechanism doesn't match the current source —
default verdict is `doc_drift`, not "runtime corruption regression". Runtime
claims require runtime proof (G-15 / T0-01).

1. Quote the documented claim verbatim.
2. Find the live implementation mechanism in source.
3. If they disagree, classify as `doc_drift` (status) and `P2` (severity)
   unless runtime evidence is also present.
4. Update the doc to reference the source-of-truth file/function (G-12 / G-11).
5. Use the `quick_commands.doc_sync_cg_ir_011` recipe in `invariants.json` as a
   template grep pattern.

## Pairing

- **`zkaedi-gate-discipline`**: this skill produces findings; gate-discipline
  decides whether a milestone-closure that *cites* those findings is honest.
- **`zkaedi-correctness-floor`**: this skill audits *after* the fact;
  correctness-floor lifts generation quality *before* the audit fires.
- **`error-learner`**: corpus entries from this skill feed the error-learner's
  pattern memory; recurring CG-IR-### shapes become predictive.
- **`zkaedi-compiler-forge`**: when a fix is being authored, compiler-forge owns
  the patch; this skill owns the proof.
- **`zkaedi-zcc-ir-bridge`**: ZCC-specific IR knowledge for the IR/AST boundary
  (CG-21), spill-slot isolation (CG-24), PHI parallel copies (CG-25), liveness
  (CG-26), optimizer safety (CG-27), and the `out.ir` schema.

## Evidence model — confidence levels

- **strong**: direct source/runtime/reference evidence proves it.
- **moderate**: multiple signals suggest a defect; minimized repro / runtime
  proof missing.
- **uncertain**: suspicion only; **never** treated as confirmed.

Claim rules: runtime corruption requires runtime/asm/ABI proof. Documentation
drift can be proven by source/doc contradiction alone. PASS requires raw
command output. A suspected violation must name the missing evidence.

## Doctrinal hard rule

Be evidence-bound. Do not paste a finding into BUGS.md, the corpus, or a
release note unless you can also paste the command and its output that prove
the finding. The corpus is sealed by Gate 5 + Gate 9; touching it is the
costliest action — make it earn its cost.
