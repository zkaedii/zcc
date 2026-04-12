#!/bin/bash
# Build and quick-test ZCC. Use from project root (e.g. /mnt/d/__DOWNLOADS/selforglinux).
#
# If you get "No such device" on D::
#   Option A: Copy to home and build there:
#     ./scripts/build_and_quick_test.sh copy
#     cd ~/selforglinux && ./scripts/build_and_quick_test.sh
#   Option B: Build in /tmp (only reads from D:):
#     ./scripts/build_and_quick_test.sh tmp

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ "$1" = "copy" ]; then
  DEST="${2:-$HOME/selforglinux}"
  echo "Copying project to $DEST..."
  mkdir -p "$DEST"
  for f in part1.c part2.c part3.c part4.c part5.c compiler_passes.c zcc_ast_bridge.h hello.c audit; do
    cp -r "$ROOT/$f" "$DEST/" 2>/dev/null || true
  done
  echo "Done. Run: cd $DEST && ./scripts/build_and_quick_test.sh"
  exit 0
fi

if [ "$1" = "tmp" ]; then
  echo "Building in /tmp (read from $ROOT, write to /tmp)..."
  cd "$ROOT"
  cat part1.c part2.c part3.c part4.c part5.c > /tmp/zcc_from_parts.c
  cp compiler_passes.c zcc_ast_bridge.h /tmp/
  cd /tmp
  gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc_from_parts.c compiler_passes.c -lm -I.
  cp "$ROOT/hello.c" "$ROOT/audit/t1_int.c" "$ROOT/audit/t2_flow.c" /tmp/
  ./zcc hello.c -o hello.s && gcc -o hello hello.s -lm && ./hello
  ./zcc t1_int.c -o t1.s && gcc t1.s -o t1 -lm && ./t1
  ./zcc t2_flow.c -o t2.s && gcc t2.s -o t2 -lm && ./t2
  echo "QUICK_TEST_OK (zcc is in /tmp/zcc)"
  exit 0
fi

cd "$ROOT"
echo "Project root: $ROOT"

echo "=== Build ==="
cat part1.c part2.c part3.c part4.c part5.c > zcc_from_parts.c
gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc_from_parts.c compiler_passes.c -lm -I.
echo "BUILD_OK"

echo ""
echo "=== Quick tests ==="
./zcc hello.c -o hello.s && gcc -o hello hello.s -lm && ./hello
./zcc audit/t1_int.c -o /tmp/t1.s && gcc /tmp/t1.s -o /tmp/t1 -lm && /tmp/t1
./zcc audit/t2_flow.c -o /tmp/t2.s && gcc /tmp/t2.s -o /tmp/t2 -lm && /tmp/t2
echo "QUICK_TEST_OK"
