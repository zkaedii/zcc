#!/bin/bash
# Phase C3: Golden checksum regression gate.
# Build: host cc -> zcc; zcc -> stage1; stage1 -> stage2.
# Require: strip(stage1) and strip(stage2) are identical (cmp).
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
# WSL-friendly: use repo root as-is when run from WSL
if [ -n "$WSL_DISTRO_NAME" ]; then
  ROOT="/mnt/d/__DOWNLOADS/selforglinux"
  cd "$ROOT"
fi

HOST_CC="${CC:-gcc}"
STAGE1="/tmp/golden_stage1"
STAGE2="/tmp/golden_stage2"
ASM1="/tmp/golden_s1.s"
ASM2="/tmp/golden_s2.s"

# Host-built ZCC
$HOST_CC -o /tmp/zcc_golden zcc.c -lm 2>/dev/null || true
if [ ! -x /tmp/zcc_golden ]; then
  echo "golden_checksum: host build failed (gcc -o /tmp/zcc_golden zcc.c)" 1>&2
  exit 2
fi

# Stage1: host-built ZCC compiles zcc.c
/tmp/zcc_golden zcc.c -o "$ASM1" 2>/dev/null || true
$HOST_CC "$ASM1" -o "$STAGE1" -lm 2>/dev/null || true
if [ ! -x "$STAGE1" ]; then
  echo "golden_checksum: stage1 build failed" 1>&2
  exit 2
fi

# Stage2: stage1 compiles zcc.c
"$STAGE1" zcc.c -o "$ASM2" 2>/dev/null || true
$HOST_CC "$ASM2" -o "$STAGE2" -lm 2>/dev/null || true
if [ ! -x "$STAGE2" ]; then
  echo "golden_checksum: stage2 build failed" 1>&2
  exit 2
fi

# Compare stripped binaries
strip -s "$STAGE1" 2>/dev/null || true
strip -s "$STAGE2" 2>/dev/null || true
if cmp -s "$STAGE1" "$STAGE2"; then
  echo "golden_checksum: OK (stage1 == stage2 after strip)"
  exit 0
else
  echo "golden_checksum: FAIL (stage1 != stage2)" 1>&2
  exit 1
fi
