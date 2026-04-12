#!/bin/bash
# Clean rebuild and final test — run from repo root in WSL
set -e
cd /mnt/d/__DOWNLOADS/selforglinux

echo "=== 3 — ASM: lookup_keyword arg (address) ==="
awk '/^next_token:/,/^[a-zA-Z_][a-zA-Z0-9_]*:/' /tmp/zcc_self.s \
  | grep -B3 "call lookup_keyword" | head -10

echo ""
echo "=== 4 — Audit tests 1–8 ==="
for i in 1 2 3 4 5 6 7 8; do
  f=$(ls audit/t${i}_*.c 2>/dev/null | head -1)
  if [ -z "$f" ]; then echo "t${i}: SKIP (no file)"; continue; fi
  if /tmp/zcc_self "$f" -o /tmp/ts${i}.s 2>/dev/null \
     && gcc /tmp/ts${i}.s -o /tmp/ts${i} -lm 2>/dev/null; then
    OUT=$(/tmp/ts${i} 2>/dev/null)
    echo "t${i}: EXIT:0 OUT:$OUT"
  else
    echo "t${i}: FAIL"
  fi
done

echo ""
echo "=== 5 — Three-stage bootstrap ==="
gcc -O0 -w -fno-asynchronous-unwind-tables -o /tmp/zcc_s1 zcc.c -lm
/tmp/zcc_s1 zcc.c -o /tmp/s2.s 2>/dev/null && gcc -O0 -w -fno-asynchronous-unwind-tables /tmp/s2.s -o /tmp/zcc_s2 -lm
/tmp/zcc_s2 zcc.c -o /tmp/s3.s 2>/dev/null && gcc -O0 -w -fno-asynchronous-unwind-tables /tmp/s3.s -o /tmp/zcc_s3 -lm
echo "S2: $(wc -c < /tmp/zcc_s2) bytes"
echo "S3: $(wc -c < /tmp/zcc_s3) bytes"
if diff -q /tmp/zcc_s2 /tmp/zcc_s3 >/dev/null 2>&1; then
  echo "DIFF EMPTY ✅ — SELF-HOSTED"
else
  echo "DIVERGED ❌"
  diff /tmp/zcc_s2 /tmp/zcc_s3 | head -20
fi
