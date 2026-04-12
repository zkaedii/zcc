#!/bin/bash
# CI: Full bootstrap with IR bridge, then bit-identical binary check (strip && cmp zcc2 zcc3).
# Exits 0 if self-host OK and stripped zcc2 == zcc3; 1 otherwise.
# Run from repo root. WSL-friendly.
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
if [ -n "$WSL_DISTRO_NAME" ]; then
  ROOT="/mnt/d/__DOWNLOADS/selforglinux"
  cd "$ROOT"
fi

CC="${CC:-gcc}"
B_FLAG=""
_scrt=$($CC -print-file-name=Scrt1.o 2>/dev/null) && [ -n "$_scrt" ] && B_FLAG="-B$(dirname "$_scrt")"
LDF="${LDFLAGS_SFRAME:-}"
GCC_FLAGS="-O0 -w -fno-asynchronous-unwind-tables $B_FLAG $LDF"

echo "=== make clean ==="
make -f "$ROOT/Makefile" clean 2>/dev/null || true

echo "=== run_selfhost.sh (bootstrap + cmp zcc2.s zcc3.s) ==="
"$ROOT/run_selfhost.sh"
# run_selfhost already exits 0/1 on cmp zcc2.s zcc3.s

echo "=== build zcc3 binary (match run_selfhost link) ==="
# Use relative paths so strip zcc2/zcc3 yields identical binaries (linker can embed input names).
$CC $GCC_FLAGS -o zcc3 zcc3.s compiler_passes.c -lm

echo "=== strip zcc2 zcc3 ==="
strip -s zcc2 2>/dev/null || true
strip -s zcc3 2>/dev/null || true

echo "=== cmp zcc2 zcc3 ==="
if cmp -s zcc2 zcc3; then
  echo "ci_golden_checksum: OK (strip zcc2 == strip zcc3)"
  exit 0
else
  echo "ci_golden_checksum: FAIL (zcc2 != zcc3 after strip)" 1>&2
  exit 1
fi
