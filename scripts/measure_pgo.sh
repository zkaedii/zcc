#!/bin/bash
set -e
cd /mnt/d/__DOWNLOADS/selforglinux

echo "=== Layout diff for next_token ==="
# Capture from next_token until next symbol (line starting with hex address and <)
objdump -d zcc_full | awk '/^[0-9a-f]+ <next_token>/{p=1} p{print} p && /^[0-9a-f]+ </ && !/next_token/{exit}' > /tmp/layout_pgo.txt
objdump -d zcc_no_pgo | awk '/^[0-9a-f]+ <next_token>/{p=1} p{print} p && /^[0-9a-f]+ </ && !/next_token/{exit}' > /tmp/layout_baseline.txt

echo "LINE COUNTS:"
wc -l /tmp/layout_pgo.txt /tmp/layout_baseline.txt

echo ""
echo "LAYOUT DIFF (first 40 lines):"
diff /tmp/layout_pgo.txt /tmp/layout_baseline.txt | head -40

echo ""
echo "=== Timing (5 runs each) ==="
echo "PGO:"
for i in 1 2 3 4 5; do
  start=$(date +%s%N)
  ./zcc_full zcc.c -o /tmp/t.s 2>/dev/null
  end=$(date +%s%N)
  echo "$(( (end - start) / 1000000 ))ms"
done

echo "NO-PGO:"
for i in 1 2 3 4 5; do
  start=$(date +%s%N)
  ./zcc_no_pgo zcc.c -o /tmp/t.s 2>/dev/null
  end=$(date +%s%N)
  echo "$(( (end - start) / 1000000 ))ms"
done
