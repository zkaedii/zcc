#!/bin/sh
# PGO bootstrap: build instrumented ZCC, run it to harvest profile, rebuild with profile.
# Run from repo root (script will cd there if invoked from elsewhere).
set -e
# Ensure we are in repo root (directory containing part1.c)
case "$0" in */*) _dir="${0%/*}"; ;; *) _dir="."; ;; esac
[ ! -f part1.c ] && [ -d "$_dir/.." ] && cd "$_dir/.." 2>/dev/null || true
if [ -n "$CC" ] && ! command -v "$CC" >/dev/null 2>&1; then
  echo "Warning: $CC not found, using gcc"
  CC=gcc
fi
CC="${CC:-gcc}"
B_FLAG=""
_scrt=$($CC -print-file-name=Scrt1.o 2>/dev/null) && [ -n "$_scrt" ] && B_FLAG="-B$(dirname "$_scrt")"
LDF="${LDFLAGS_SFRAME:-}"

echo "=== 1. Ensure zcc (with compiler_passes) + zcc_pp.c exist ==="
# Always regenerate zcc.c and zcc_pp.c from parts so zcc_pp.c has latest bridge (e.g. node_is_global)
cat part1.c part2.c part3.c part4.c part5.c > zcc.c 2>/dev/null || true
sed '/^_Static_assert/d' zcc.c > zcc_pp.c
sed -e '/#include "zcc_ast_bridge.h"/r zcc_ast_bridge_zcc.h' -e '/#include "zcc_ast_bridge.h"/d' zcc_pp.c > zcc_pp.c.tmp && mv zcc_pp.c.tmp zcc_pp.c
echo "    zcc_pp.c from parts."
$CC -O0 -w -fno-asynchronous-unwind-tables $B_FLAG $LDF -o zcc zcc.c compiler_passes.c -lm
echo "    zcc (with compiler_passes) ready."

echo "=== 2. Build instrumented ZCC (zcc_pgo) ==="
ZCC_IR_BRIDGE=1 ZCC_PGO_INSTRUMENT=1 ./zcc zcc_pp.c -o zcc_pgo.s 2>&1 | tail -5
$CC -O0 -w -fno-asynchronous-unwind-tables $B_FLAG $LDF -o zcc_pgo zcc_pgo.s zcc_pgo_rt.c -lm
echo "    zcc_pgo built."

echo "=== 3. Generate profile (run instrumented ZCC on zcc_pp.c) ==="
./zcc_pgo zcc_pp.c -o zcc_pgo_out.s 2>&1 | tail -5
if [ -f zcc.prof ]; then
  echo "    zcc.prof created ($(wc -l < zcc.prof) lines)"
else
  echo "    ERROR: zcc.prof not found"
  exit 1
fi

echo "=== 4. Rebuild ZCC with profile (PGO-optimized layout) ==="
ZCC_IR_BRIDGE=1 ./zcc zcc_pp.c -o zcc_opt.s -use-profile=zcc.prof 2>&1 | tail -5
$CC -O0 -w -fno-asynchronous-unwind-tables $B_FLAG $LDF -o zcc_opt zcc_opt.s compiler_passes.c -lm
echo "    zcc_opt built."

echo "=== 5. Compare layout: IR baseline (heuristic) vs IR+PGO (zcc_opt.s) ==="
ZCC_IR_BRIDGE=1 ./zcc zcc_pp.c -o zcc_bridge_only.s 2>/dev/null
if diff -q zcc_bridge_only.s zcc_opt.s >/dev/null 2>&1; then
  echo "    No diff (block order identical to heuristic build)"
else
  echo "    Layout differs (PGO reordered blocks vs heuristic):"
  diff -u zcc_bridge_only.s zcc_opt.s | head -80
fi

echo ""
echo "PGO bootstrap done. Run ./zcc_opt for the PGO-optimized compiler."
