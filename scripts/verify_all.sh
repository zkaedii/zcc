#!/bin/bash
set -e
cd /mnt/h/__DOWNLOADS/selforglinux

echo "=== BUILD ==="
gcc -O0 -w -o zcc zcc.c compiler_passes.c compiler_passes_ir.c -lm
echo BUILD_OK

echo ""
echo "=== 3-GEN BOOTSTRAP ==="
./zcc zcc.c -o /tmp/s2.s 2>/dev/null && gcc /tmp/s2.s compiler_passes.c compiler_passes_ir.c -o /tmp/zcc_s2 -lm && echo S1_OK
/tmp/zcc_s2 zcc.c -o /tmp/s3.s 2>/dev/null && gcc /tmp/s3.s compiler_passes.c compiler_passes_ir.c -o /tmp/zcc_s3 -lm && echo S2_OK
/tmp/zcc_s3 zcc.c -o /tmp/s4.s 2>/dev/null && gcc /tmp/s4.s compiler_passes.c compiler_passes_ir.c -o /tmp/zcc_s4 -lm && echo S3_OK

echo ""
echo "=== ZCC_LAYOUT (zcc zcc2 zcc3) ==="
./zcc audit/t1_int.c -o /tmp/o.s 2>&1 | grep 'sizeof(Compiler)' || true
/tmp/zcc_s2 audit/t1_int.c -o /tmp/o.s 2>&1 | grep 'sizeof(Compiler)' || true
/tmp/zcc_s3 audit/t1_int.c -o /tmp/o.s 2>&1 | grep 'sizeof(Compiler)' || true

echo ""
echo "=== TRIVIAL (zcc3) ==="
echo 'int main(){return 0;}' > /tmp/triv.c
/tmp/zcc_s3 /tmp/triv.c -o /tmp/triv.s 2>/dev/null && gcc /tmp/triv.s -o /tmp/triv -lm
/tmp/triv
echo "triv exit: $?"

echo ""
echo "=== T9 UNSIGNED (gcc vs zcc3) ==="
gcc -O0 -w -o /tmp/t9_gcc audit/t9_unsigned_arith.c
/tmp/zcc_s3 audit/t9_unsigned_arith.c -o /tmp/t9.s 2>/dev/null && gcc /tmp/t9.s -o /tmp/t9_zcc3 -lm
/tmp/t9_gcc; G=$?; /tmp/t9_zcc3; Z=$?
echo "gcc exit: $G  zcc3 exit: $Z"
test "$G" = 0 && test "$Z" = 0 && echo T9_PASS

echo ""
echo "=== AUDIT 1-8 (zcc3) ==="
for i in 1 2 3 4 5 6 7 8; do
  f=$(ls audit/t${i}_*.c 2>/dev/null | head -1)
  /tmp/zcc_s3 "$f" -o /tmp/ta${i}.s 2>/dev/null
  gcc /tmp/ta${i}.s -o /tmp/ta${i} -lm 2>/dev/null
  /tmp/ta${i} >/dev/null 2>&1; e=$?
  echo -n "t${i}:$e "
done
echo ""
echo "VERIFY DONE"
