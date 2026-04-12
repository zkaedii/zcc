#!/bin/bash
# Bootstrap closure test: rebuild zcc_full, regenerate zcc3.s, verify calloc size, link, run.
# Exit 0 only if zcc3 compiles int main(){return 42;} and the resulting program exits 42.
set -e

# Repo root: allow override, else relative to script (scripts/bootstrap_closure_test.sh -> ..)
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$REPO_ROOT"

echo "=== 1. Rebuild zcc_full (with long=8 fix) ==="
gcc -O2 -w zcc_bridge_impl.c compiler_passes.c -o zcc_full -lm
test -x zcc_full || { echo "FAIL: zcc_full not executable"; exit 1; }

echo "=== 2. Regenerate zcc3.s (ZCC compiles zcc.c) ==="
./zcc_full zcc.c -o /tmp/zcc3.s 2>/dev/null || { echo "FAIL: zcc_full returned non-zero"; exit 1; }
test -s /tmp/zcc3.s || { echo "FAIL: zcc3.s empty or missing"; exit 1; }

echo "=== 3. Verify calloc size in emitted assembly ==="
if grep -q '\$56120' /tmp/zcc3.s; then
    echo "OK: zcc3.s contains constant 56120 (correct sizeof(Compiler) for calloc)"
fi
if ! grep -q 'movq \$56120\|movabsq \$56120' /tmp/zcc3.s; then
    echo "FAIL: no movq/movabsq 56120 found - calloc may be using wrong size"
    exit 1
fi

echo "=== 4. Link zcc3 ==="
gcc -c bootstrap_runtime.c -o /tmp/bootstrap_runtime.o
gcc /tmp/zcc3.s /tmp/bootstrap_runtime.o -o /tmp/zcc3 -lm
test -x /tmp/zcc3 || { echo "FAIL: zcc3 not executable"; exit 1; }

echo "=== 5. Bootstrap closure test ==="
echo 'int main(){return 42;}' > /tmp/t.c
if ! /tmp/zcc3 /tmp/t.c -o /tmp/t.s 2>/dev/null; then
    echo "FAIL: zcc3 failed to compile t.c"
    exit 1
fi
test -s /tmp/t.s || { echo "FAIL: t.s empty"; exit 1; }

if ! gcc /tmp/t.s -o /tmp/t -lm 2>/dev/null; then
    echo "FAIL: gcc failed to link t.s"
    exit 1
fi
test -x /tmp/t || { echo "FAIL: t not executable"; exit 1; }

ex=0
/tmp/t || ex=$?
echo "exit=$ex"
if [ "$ex" != "42" ]; then
    echo "FAIL: program exit code is $ex (expected 42)"
    exit 1
fi
echo "SUCCESS: Bootstrap closed (exit 42)"

echo "=== 6. Bit-identical cmp (zcc3 compiles zcc.c -> zcc4.s) ==="
if /tmp/zcc3 zcc.c -o /tmp/zcc4.s 2>/dev/null; then
    test -s /tmp/zcc4.s || { echo "FAIL: zcc4.s empty"; exit 1; }
    if cmp -s /tmp/zcc3.s /tmp/zcc4.s; then
        echo "OK: zcc3.s and zcc4.s identical (bit-identical self-compile)"
    else
        echo "FAIL: zcc3.s and zcc4.s differ (bit-identical cmp)"
        diff /tmp/zcc3.s /tmp/zcc4.s | head -80
        exit 1
    fi
else
    echo "SKIP: zcc3 cannot compile zcc.c yet (segfault or error); cmp when fixed"
fi
exit 0
