#!/bin/bash
# PGO profile round-trip: generate a .prof from default branch_probs, then recompile with -use-profile=.
# Run from repo root (or WSL: /mnt/d/__DOWNLOADS/selforglinux). Requires: make zcc_full, zcc_pp.c.
# Usage: ./scripts/pgo_roundtrip.sh
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
if [ -n "$WSL_DISTRO_NAME" ]; then
  ROOT="/mnt/d/__DOWNLOADS/selforglinux"
  cd "$ROOT"
fi

if [ ! -f zcc_pp.c ] || [ ! -x ./zcc ]; then
  echo "pgo_roundtrip: need zcc and zcc_pp.c (run ./run_selfhost.sh once or make zcc_full + build zcc_pp.c)" 1>&2
  exit 2
fi

PROF="${1:-$ROOT/zcc.prof}"
rm -f "$PROF"

echo "=== 1) Generate profile (default branch_probs) ==="
ZCC_IR_BRIDGE=1 ZCC_GEN_PROFILE="$PROF" ./zcc zcc_pp.c -o "$ROOT/tmp_pgo.s" 2>/dev/null || true
rm -f "$ROOT/tmp_pgo.s"
if [ ! -s "$PROF" ]; then
  echo "pgo_roundtrip: no profile generated (run from repo root after make zcc_full and ./run_selfhost.sh once)" 1>&2
  exit 2
fi
echo "Generated $PROF ($(wc -l < "$PROF") lines)"

echo ""
echo "=== 2) Recompile with -use-profile=$PROF ==="
ZCC_IR_BRIDGE=1 ./zcc zcc_pp.c -o "$ROOT/tmp_pgo2.s" -use-profile="$PROF" 2>&1 | grep -E '\[PGO\]|\[PGO-BBR\]' || true
rm -f "$ROOT/tmp_pgo2.s"
echo "Done. Edit $PROF (block_name p0 p1) to simulate hot paths and re-run step 2."
