#!/bin/bash
set -e
cd /mnt/d/__DOWNLOADS/selforglinux

# Stage 1: gcc-built zcc compiles itself → zcc_s2
./zcc zcc.c -o /tmp/s2.s 2>/dev/null
gcc /tmp/s2.s -o /tmp/zcc_s2 -lm && echo S1_OK

# Stage 2: zcc_s2 compiles itself → zcc_s3
/tmp/zcc_s2 zcc.c -o /tmp/s3.s 2>/dev/null
gcc /tmp/s3.s -o /tmp/zcc_s3 -lm && echo S2_OK

# Stage 3: diff the two self-compiled binaries
cmp /tmp/zcc_s2 /tmp/zcc_s3 && echo 'SELF-HOSTED ✅' || echo 'DIVERGED ❌'

# Bonus: run all 8 audit tests through zcc_s2
for i in 1 2 3 4 5 6 7 8; do
  f=$(ls audit/t${i}_*.c 2>/dev/null | head -1)
  /tmp/zcc_s2 "$f" -o /tmp/ts${i}.s 2>/dev/null
  gcc /tmp/ts${i}.s -o /tmp/ts${i} -lm 2>/dev/null
  OUT=$(/tmp/ts${i} 2>/dev/null)
  echo "t${i}: OUT=[$OUT]"
done
