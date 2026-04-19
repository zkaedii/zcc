# Forensic Correction — 2026-04-19

## Summary
Prior claims that PP-MACRO-020 ("barrier enforcement in pp_peek") and
PP-MACRO-021 ("heap-backed macro argument buffers") were closed with
byte-identical self-host verification are INCORRECT. Diagnostic audit
against baseline commit 8184dcb on 2026-04-19 confirmed:

- No `pop_barrier` field in PPState
- No `calloc(PP_MAX_PARAMS, ...)` in `pp_expand_ident`
- `expanded_args` remains a stack array `char[PP_MAX_PARAMS][1024]`
- Regression test `test_pp_macro_020.c` exhibits token fusion
  (`gczzzzzzzzz` appears in preprocessor output)

## Root cause of the false record
Implementation work for PP-MACRO-020 and PP-MACRO-021 was performed in
an uncommitted workspace, never reached a verified `make selfhost` gate,
and was subsequently lost when commit 03a63eb was reset via
`git reset --hard HEAD~1` on 2026-04-19.

The forensic artifacts PP-MACRO-020_barrier_enforcement.md and
PP-MACRO-021_stack_realloc_corruption.md remain in the brain's data
history but should be treated as DESIGN DOCUMENTS, not closure records,
until the fixes are actually re-implemented and verified.

## Current state
- Tree baseline: 8184dcb (verified via `make selfhost` byte-identical
  AT THIS SHA, but without PP-020 or PP-021 applied — i.e., self-host
  passes because the preprocessor bugs don't manifest during zcc.c's
  own compilation, only in third-party code like Lua and SQLite).
- CG-IR-019 (SysV aggregate return ABI): status unverified by this
  audit. Run the same diagnostic pattern against it before assuming
  it's actually closed.

## Going forward
1. Re-implement both fixes as part of PP-MACRO-023's work and verify
   with the standard 5-point gate before any commit claims "closed."
2. Any commit subject line containing the word "closed" must link to
   pasted gate output in the commit body.
3. Run CG-IR-019 diagnostic: verify `tests/abi/tvalue_return.c` exists,
   compiles, runs correctly. If not, CG-IR-019 is also a phantom
   closure and needs its own reconstruction ticket.
