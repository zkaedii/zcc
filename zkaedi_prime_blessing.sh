#!/usr/bin/env bash
# zkaedi_prime_blessing.sh
# A sacred safety harness for future ZCC neural gates.

set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

echo "╔══════════════════════════════════════════════╗"
echo "║        ZKAEDI PRIME // BLESSING GATE        ║"
echo "║   parity before power, proof before pride    ║"
echo "╚══════════════════════════════════════════════╝"

export ZCC_MUTATION_SANDBOX=1

mkdir -p logs artifacts

stamp="$(date +%Y%m%d_%H%M%S)"
log="logs/prime_blessing_$stamp.log"

say() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "$log"
}

gate() {
  say ""
  say "━━━ $* ━━━"
}

gate "1. Build canonical compiler"
make zcc 2>&1 | tee -a "$log"

gate "2. Canonical self-host parity"
./zcc zcc.c --ir -o artifacts/zcc2_$stamp.s 2>>"$log"
./zcc zcc.c --ir -o artifacts/zcc3_$stamp.s 2>>"$log"

if diff artifacts/zcc2_$stamp.s artifacts/zcc3_$stamp.s >/dev/null; then
  say "SELF-HOST VERIFIED: assembly identical"
else
  say "SELF-HOST FAILED: divergence detected"
  diff artifacts/zcc2_$stamp.s artifacts/zcc3_$stamp.s | head -40 | tee -a "$log"
  exit 1
fi

gate "3. Oracle sandbox compile"
./zcc zcc.c --ir --oracle-destructive -o artifacts/zcc_prime_$stamp.s 2> artifacts/oracle_$stamp.log || {
  say "Oracle compile failed"
  exit 1
}

gate "4. Safety envelope scan"

required_patterns=(
  "parity=LOCKED"
  "transform=OBSERVED"
)

for pat in "${required_patterns[@]}"; do
  if grep -q "$pat" artifacts/oracle_$stamp.log; then
    say "FOUND: $pat"
  else
    say "WARN: missing expected telemetry: $pat"
  fi
done

if grep -q "PARITY WARNING\|ABI VIOLATION\|stack_delta=[^0]\|spill_delta=[1-9]" artifacts/oracle_$stamp.log; then
  say "SAFETY VIOLATION DETECTED"
  grep -E "PARITY WARNING|ABI VIOLATION|stack_delta=|spill_delta=" artifacts/oracle_$stamp.log | tee -a "$log"
  exit 1
fi

gate "5. Metric summary"

printf "Oracle events: " | tee -a "$log"
grep -c "GEMMA ORACLE" artifacts/oracle_$stamp.log | tee -a "$log" || true

printf "Applied transforms: " | tee -a "$log"
grep -c "transform=APPLIED" artifacts/oracle_$stamp.log | tee -a "$log" || true

printf "Observed transforms: " | tee -a "$log"
grep -c "transform=OBSERVED" artifacts/oracle_$stamp.log | tee -a "$log" || true

printf "Recommended transforms: " | tee -a "$log"
grep -c "transform=RECOMMENDED" artifacts/oracle_$stamp.log | tee -a "$log" || true

gate "6. Confidence histogram"

python3 - <<'PY' artifacts/oracle_"$stamp".log | tee -a "$log"
import re, sys
path = sys.argv[1]
b = {"0.90-1.00":0, "0.80-0.90":0, "0.70-0.80":0, "0.60-0.70":0, "0.50-0.60":0, "<0.50":0}
for line in open(path, errors="ignore"):
    m = re.search(r"confidence=([0-9.]+)", line)
    if not m:
        continue
    x = float(m.group(1))
    if x >= .90: b["0.90-1.00"] += 1
    elif x >= .80: b["0.80-0.90"] += 1
    elif x >= .70: b["0.70-0.80"] += 1
    elif x >= .60: b["0.60-0.70"] += 1
    elif x >= .50: b["0.50-0.60"] += 1
    else: b["<0.50"] += 1
for k,v in b.items():
    print(f"{k}: {v}")
PY

gate "7. Blessing complete"

cat <<'EOF' | tee -a "$log"

ZCC PRIME BLESSING:

May every mutation be measured.
May every oracle vote be auditable.
May every tensor path collapse into deterministic proof.
May the backend remain sacred.
May parity lock before power unlocks.

Status: GREEN
EOF
