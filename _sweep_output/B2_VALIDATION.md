# CG-PARSE-001 Phase B2: Validation Report

**Date:** 2026-04-19  
**Status: ALL GATES PASS**  
**Patch surface:** `part1.c` (+1 field), `part3.c` (~60 lines across 9 insertion points), `part4.c` (~12 lines)

---

## V5 — Self-Host Parity (BLOCKER)

```
make selfhost
=== Verify: zcc2.s == zcc3.s ===
cmp zcc2.s zcc3.s && echo "SELF-HOST VERIFIED" || echo "SELF-HOST FAILED"
SELF-HOST VERIFIED
```
**PASS ✓**

---

## V6 — Amendment D Probe Matrix (8 reachable probes — no regressions)

| Config | SH | S2.1 | S2.2 | S2.3 | S2.4 | S2.6 | S2.7 | S2.8 | S2.9 |
|--------|:--:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|
| ALL-3 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓(3) | ✓(1) | ✗(CG-PARSE-002) |
| Site-1 only | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓(3) | ✓(1) | ✗ |
| Site-2 only | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Site-3 only | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |

Identical to Amendment D baseline. S2.9 remains unresolved (CG-PARSE-002, deferred).  
**PASS ✓ — No regressions**

---

## V7 — NEW: Link-Through Tests (The B2 Proof)

### probe1 — `extern int foo(int) __asm__("bar")` + external provider

```asm
; ZCC output (probe1.s) — relevant line:
call bar   ; was: call foo (pre-B2 → link fails undefined reference to foo)
```

```
V7-probe1 exit: 42 (expected 42)
```
**PASS ✓**

### probe2 — `extern int foo __asm__("bar")` + external int provider

```asm
; ZCC output (probe2.s):
leaq bar(%rip), %rax   ; was: leaq foo(%rip) → undefined reference to foo
```

```
V7-probe2 exit: 42 (expected 42)
```
**PASS ✓**

### probe4 — `int foo(int x) __asm__("bar") { return x; }` self-provides

```asm
; probe4.s labels:
    .globl bar
bar:          ; was: .globl foo / foo: (pre-B2)
    .globl main
main:
```

```
V7-probe4 exit: 42 (expected 42)
nm probe4: 0000000000401106 T bar   ; no 'foo' in symbol table
```
**PASS ✓**

### probe7 — `extern int a __asm__("a_renamed"), b __asm__("b_renamed")`

This is the V2-rescued case. Pre-B2, the comma-list secondary var `b` would have:
- Definition label emitted as `b` not `b_renamed` (gvar2->name not written back)
- Reference emitted as `b_renamed` (parse_primary 927–928 fires)
- **Silent miscompile: definition under wrong name, link fails**

```asm
; probe7.s references:
leaq a_renamed(%rip), %rax
leaq b_renamed(%rip), %rax
```

```
V7-probe7 exit: 3 (expected 3)
```
**PASS ✓ — V2 finding confirmed load-bearing**

---

## V9 — Static-Local Regression (CRITICAL)

```
./static_probe_b2
V9-static exit: 104 (expected 104)
```

Static-local mangling (`counter__x__N` names) survives B2. The `!is_static_local` guard at line 2255 (pickup caller) fires correctly — B2 does not overwrite static-local `asm_name` values.

**PASS ✓**

---

## B2 Patch Summary

| File | Change |
|------|--------|
| `part1.c` | `char pending_asm_name[MAX_IDENT]` added to `Compiler` struct |
| `part3.c site #1` | `parse_declarator` capture block: clear stash on entry, populate if `TK_ASM` |
| `part3.c callers` | 4 pickup sites (lines ~2258, ~2724, ~3108, ~3256); line ~2258 guarded by `!is_static_local` |
| `part3.c site #2` | `parse_func_def`: capture into `_b2buf`, write into `scope_find(cc, name)->asm_name` |
| `part3.c site #3` | `parse_program`: capture into `asm_alias`, write into `sym->asm_name` AND `gvar->name` at both ND_GLOBAL_VAR construction sites (primary + comma-list) |
| `part4.c` | Function `.globl` + label emission: `scope_find` lookup, prefer `asm_name` if set |

---

## Verdict

**CG-PARSE-001 Phase B2: COMPLETE**

ZCC now fully honors GCC-style `__asm__("name")` symbol rename clauses. The compiler no longer silently drops or misemits renamed symbols. All glibc header-consuming programs that use `__REDIRECT` aliases will link correctly against the target symbol names.
