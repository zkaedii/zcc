#!/bin/sh
# Use ZCC: build if needed, then run zcc on the given C file(s).
# Run from repo root, or pass path to .c file.
# Usage: ./scripts/use_zcc.sh <input.c> [-o output.s]
#        ./scripts/use_zcc.sh <input.c> -o out.s && gcc -o out out.s -lm && ./out
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Ensure zcc.c exists (from parts if needed)
if [ ! -f zcc.c ] || [ part1.c -nt zcc.c 2>/dev/null ]; then
  [ -f part1.c ] && cat part1.c part2.c part3.c part4.c part5.c > zcc.c
fi

# Build zcc if missing or older than zcc.c
if [ ! -x ./zcc ] || [ zcc.c -nt ./zcc ]; then
  CC="${CC:-gcc}"
  echo "Building zcc with $CC..."
  $CC -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc.c
fi

./zcc "$@"
