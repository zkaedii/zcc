#!/bin/bash
# Build 3-stage bootstrap, then compile audit/t9_unsigned_arith.c with both
# gcc and zcc3; compare exit codes. Confirms shrq/divq correctness through gen-3.
set -e
cd /mnt/d/__DOWNLOADS/selforglinux

echo "Building gcc->zcc->zcc2->zcc3..."
gcc -O0 -w -o zcc zcc.c -lm
./zcc zcc.c -o /tmp/s2.s 2>/dev/null && gcc /tmp/s2.s -o /tmp/zcc_s2 -lm
/tmp/zcc_s2 zcc.c -o /tmp/s3.s 2>/dev/null && gcc /tmp/s3.s -o /tmp/zcc_s3 -lm
/tmp/zcc_s3 zcc.c -o /tmp/s4.s 2>/dev/null && gcc /tmp/s4.s -o /tmp/zcc_s4 -lm
echo "S1 S2 S3 OK"

echo "Compiling audit/t9_unsigned_arith.c with gcc..."
gcc -O0 -w -o /tmp/t9_gcc audit/t9_unsigned_arith.c
echo "Compiling audit/t9_unsigned_arith.c with zcc3..."
/tmp/zcc_s3 audit/t9_unsigned_arith.c -o /tmp/t9.s 2>/dev/null
gcc /tmp/t9.s -o /tmp/t9_zcc3 -lm

echo "Running gcc-built t9..."
/tmp/t9_gcc
GCC_EXIT=$?
echo "Running zcc3-built t9..."
/tmp/t9_zcc3
ZCC_EXIT=$?

echo "gcc exit: $GCC_EXIT  zcc3 exit: $ZCC_EXIT"
if [ "$GCC_EXIT" = "$ZCC_EXIT" ] && [ "$ZCC_EXIT" = "0" ]; then
    echo "PASS: unsigned shift/div match through gen-3"
else
    echo "FAIL: exit code mismatch or non-zero"
    exit 1
fi
