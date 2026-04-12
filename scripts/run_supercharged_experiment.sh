#!/bin/sh
# Supercharged experiment: self-host, large fuzz, zcc_rt smoke, report.
# Run from repo root: ./scripts/run_supercharged_experiment.sh
# Output goes to experiment_report.txt only. To see it in the terminal too, use:
#   TEESTDOUT=1 ./scripts/run_supercharged_experiment.sh
# or after the run: cat experiment_report.txt
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPORT="${REPORT:-experiment_report.txt}"
REPORT="$ROOT/$(basename "$REPORT")"
SHOW_STDOUT="${TEESTDOUT:-}"
if [ -n "$SHOW_STDOUT" ]; then
  exec 3>&1 1> "$REPORT" 2>&1
else
  exec 1> "$REPORT" 2>&1
fi
run() { ( set -e; "$@"; ); }

# Portable timestamp (GNU date -Iseconds not on all systems)
TS=$(date +%Y-%m-%dT%H:%M:%S 2>/dev/null || echo "date-failed")
echo "=== SUPERCHARGED EXPERIMENT $TS ==="
echo "Report file: $REPORT"
echo ""

# 1. Self-host (may fail on some gcc/ld)
echo "--- 1. Self-host (zcc -> zcc2 -> zcc3, cmp) ---"
if [ -f run_selfhost.sh ]; then
  if run ./run_selfhost.sh; then
    echo "PASS: self-host"
  else
    echo "FAIL or SKIP: self-host (check gcc/ld)"
  fi
else
  echo "SKIP: run_selfhost.sh not found"
fi
echo ""

# 2. Fuzz 150 with div + keep-failing + repro
echo "--- 2. Differential fuzz (150 runs, --div --keep-failing --repro) ---"
python3 scripts/zcc_fuzz.py --count 150 --seed 4242 --div --keep-failing --repro || true
echo ""

# 3. zcc_rt smoke: build rt, compile minimal C with ZCC, link with rt, run
echo "--- 3. zcc_rt smoke test ---"
if [ -f zcc_rt.c ]; then
  run gcc -c zcc_rt.c -o zcc_rt.o 2>/dev/null || true
  if [ -f zcc_rt.o ]; then
    echo 'int main(void) { return 0; }' > /tmp/smoke.c
    ( ./zcc /tmp/smoke.c -o /tmp/smoke.s 2>/dev/null && gcc /tmp/smoke.s zcc_rt.o -o /tmp/smoke 2>/dev/null && /tmp/smoke ); ec=$?
    echo "zcc_rt smoke exit: $ec (0 = ok)"
  else
    echo "SKIP: zcc_rt.o build failed"
  fi
else
  echo "SKIP: zcc_rt.c not found"
fi
echo ""

# 4. Stub coverage on a small subset: use a tiny C file with 3 functions
echo "--- 4. Stub coverage (tiny 3-fn file) ---"
cat > /tmp/tiny.c << 'TINY'
int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }
int main(void) { return add(1, 2) + mul(3, 4); }
TINY
( ./zcc /tmp/tiny.c -o /tmp/tiny.s 2>/dev/null && gcc -o /tmp/tiny /tmp/tiny.s 2>/dev/null && /tmp/tiny ); ec=$?
echo "tiny exit: $ec (15 = ok)"
run python3 scripts/stub_functions.py /tmp/tiny.c --coverage --max-size 2 --run-cmd "./zcc %s -o /tmp/stub.s" --no-progress 2>/dev/null || echo "stub_coverage: skip or fail"
echo ""

# 5. Fuzz stress: multiple seeds
echo "--- 5. Multi-seed fuzz (5 seeds x 30 runs = 150) ---"
total_match=0; total_miss=0
for seed in 1 100 1000 10000 12345; do
  out=$(python3 scripts/zcc_fuzz.py --count 30 --seed "$seed" --div 2>/dev/null) || true
  m=$(echo "$out" | grep -o 'match=[0-9]*' | head -1 | cut -d= -f2); total_match=$((total_match + ${m:-0}))
  x=$(echo "$out" | grep -o 'mismatch=[0-9]*' | head -1 | cut -d= -f2); total_miss=$((total_miss + ${x:-0}))
done
echo "Total match=$total_match mismatch=$total_miss"
echo ""

echo "=== END $(date +%Y-%m-%dT%H:%M:%S 2>/dev/null || echo '') ==="
echo "Report written to $REPORT"
if [ -n "$SHOW_STDOUT" ]; then
  echo "" >&3
  echo "--- report dump ---" >&3
  cat "$REPORT" >&3
fi
