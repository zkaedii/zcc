#!/usr/bin/env bash
# Run zcc_full on one or more .c files and print frequency-ranked unsupported kinds.
# Usage: ./scripts/unsupported_hits.sh [file.c ...]
# If no args: compiles zcc.c (may fail) and then tests/*.c if present.

set -e
cd "$(dirname "$0")/.."
ZCC="${ZCC:-./zcc_full}"
OUT="${OUT:-/tmp/zcc_out.s}"

compile_one() {
    "$ZCC" "$1" -o "$OUT" 2>&1 || true
}

if [ $# -gt 0 ]; then
    for f in "$@"; do
        [ -f "$f" ] && compile_one "$f"
    done
else
    compile_one zcc.c 2>/dev/null || true
    for f in tests/t*.c tests/*.c; do
        [ -f "$f" ] && compile_one "$f"
    done
fi | grep 'unsupported' | sort | uniq -c | sort -rn
