#!/bin/bash
# Full run: build, golden checksum, 2-stage self-host cmp, layout/trivial/t9/audit 1-8.
# Run from repo root in WSL: ./scripts/full_run.sh
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
if [ -n "$WSL_DISTRO_NAME" ]; then
  ROOT="/mnt/d/__DOWNLOADS/selforglinux"
  cd "$ROOT"
fi

CC="${CC:-gcc}"
echo "=== BUILD ==="
$CC -O0 -w -o zcc zcc.c -lm
echo BUILD_OK

echo ""
echo "=== GOLDEN CHECKSUM ==="
./scripts/golden_checksum.sh

echo ""
echo "=== 2-STAGE BOOTSTRAP + CMP ==="
./zcc zcc.c -o /tmp/s2.s 2>/dev/null
$CC /tmp/s2.s -o /tmp/zcc_s2 -lm && echo S1_OK
/tmp/zcc_s2 zcc.c -o /tmp/s3.s 2>/dev/null
$CC /tmp/s3.s -o /tmp/zcc_s3 -lm && echo S2_OK
strip -s /tmp/zcc_s2 /tmp/zcc_s3 2>/dev/null || true
cmp /tmp/zcc_s2 /tmp/zcc_s3 && echo 'SELF-HOSTED ✅' || { echo 'DIVERGED ❌'; exit 1; }

echo ""
echo "=== ZCC_LAYOUT (zcc zcc2 zcc3) ==="
./zcc audit/t1_int.c -o /tmp/o.s 2>&1 | grep 'sizeof(Compiler)' || true
/tmp/zcc_s2 audit/t1_int.c -o /tmp/o.s 2>&1 | grep 'sizeof(Compiler)' || true
/tmp/zcc_s3 audit/t1_int.c -o /tmp/o.s 2>&1 | grep 'sizeof(Compiler)' || true

echo ""
echo "=== TRIVIAL (zcc3) ==="
echo 'int main(){return 0;}' > /tmp/triv.c
/tmp/zcc_s3 /tmp/triv.c -o /tmp/triv.s 2>/dev/null && $CC /tmp/triv.s -o /tmp/triv -lm
/tmp/triv
echo "triv exit: $?"

echo ""
echo "=== T9 UNSIGNED (gcc vs zcc3) ==="
$CC -O0 -w -o /tmp/t9_gcc audit/t9_unsigned_arith.c 2>/dev/null || true
/tmp/zcc_s3 audit/t9_unsigned_arith.c -o /tmp/t9.s 2>/dev/null && $CC /tmp/t9.s -o /tmp/t9_zcc3 -lm
/tmp/t9_gcc; G=$?; /tmp/t9_zcc3; Z=$?
echo "gcc exit: $G  zcc3 exit: $Z"
test "$G" = 0 && test "$Z" = 0 && echo T9_PASS || true

echo ""
echo "=== AUDIT 1-8 (zcc3) ==="
for i in 1 2 3 4 5 6 7 8; do
  f=$(ls audit/t${i}_*.c 2>/dev/null | head -1)
  /tmp/zcc_s3 "$f" -o /tmp/ta${i}.s 2>/dev/null
  $CC /tmp/ta${i}.s -o /tmp/ta${i} -lm 2>/dev/null
  /tmp/ta${i} >/dev/null 2>&1; e=$?
  echo -n "t${i}:$e "
done
echo ""
echo "FULL RUN DONE ✅"
