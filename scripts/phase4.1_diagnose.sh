#!/bin/sh
# Phase 4.1 — run in WSL after: ./zcc zcc.c -o /tmp/zcc_self.s and gcc -O0 -S zcc.c -o /tmp/zcc_gcc.s
# Saves output to docs/phase41_*.txt for inspection.
set -e
cd "$(dirname "$0")/.."
OUT=docs

echo "=== Block 1: lookup_keyword/tk_text in zcc_self.s ==="
grep -n "lookup_keyword\|tk_text\|call.*lookup" /tmp/zcc_self.s 2>/dev/null | head -30 || true

echo ""
echo "=== Block 2: next_token diff (first 80 lines of each) ==="
awk '/^next_token:/,/^[a-zA-Z_][a-zA-Z0-9_]*:/' /tmp/zcc_self.s 2>/dev/null | head -80 > /tmp/nt_zcc.s || true
awk '/^next_token:/,/^[a-zA-Z_][a-zA-Z0-9_]*:/' /tmp/zcc_gcc.s 2>/dev/null | head -80 > /tmp/nt_gcc.s || true
diff /tmp/nt_gcc.s /tmp/nt_zcc.s 2>/dev/null || true

echo ""
echo "=== Lines around 'call lookup_keyword' in zcc_self.s (offset used for 1st arg) ==="
grep -n "call lookup_keyword" /tmp/zcc_self.s
sed -n '4765,4795p' /tmp/zcc_self.s 2>/dev/null || true

echo ""
echo "=== Same in zcc_gcc.s ==="
grep -n "call lookup_keyword" /tmp/zcc_gcc.s
LINE=$(grep -n "call lookup_keyword" /tmp/zcc_gcc.s | head -1 | cut -d: -f1)
sed -n "$((LINE-25)),$((LINE+5))p" /tmp/zcc_gcc.s 2>/dev/null || true

echo ""
echo "=== Block 4: subq (stack frames) ZCC vs GCC (first 25 each) ==="
grep -B2 "subq.*%rsp" /tmp/zcc_self.s 2>/dev/null | head -30 || true
echo "---"
grep -B2 "subq.*%rsp" /tmp/zcc_gcc.s 2>/dev/null | head -30 || true
