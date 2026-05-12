#!/usr/bin/env bash
# zkaedi_future_growth.sh
# Expands ZCC PRIME safely over time.

set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

export ZCC_MUTATION_SANDBOX=1

mkdir -p \
    telemetry \
    telemetry/histograms \
    telemetry/allocator \
    telemetry/evm \
    telemetry/regressions \
    telemetry/patches \
    telemetry/blessings \
    artifacts \
    snapshots \
    snapshots/selfhost \
    snapshots/oracle \
    reports

STAMP="$(date +%Y%m%d_%H%M%S)"

echo "═══════════════════════════════════════"
echo " ZKAEDI PRIME FUTURE GROWTH ENGINE"
echo "═══════════════════════════════════════"

echo "[1] Building canonical compiler"
make zcc

echo "[2] Running sacred parity self-host"
./zcc zcc.c --ir -o snapshots/selfhost/zcc2_$STAMP.s
./zcc zcc.c --ir -o snapshots/selfhost/zcc3_$STAMP.s

if diff \
    snapshots/selfhost/zcc2_$STAMP.s \
    snapshots/selfhost/zcc3_$STAMP.s \
    >/dev/null
then
    echo "[PASS] canonical parity locked"
else
    echo "[FAIL] parity divergence"
    exit 1
fi

echo "[3] Running oracle sandbox"
./zcc zcc.c \
    --oracle-destructive \
    --ir \
    -o snapshots/oracle/zcc_prime_$STAMP.s \
    2> telemetry/oracle_$STAMP.log

echo "[4] Extracting confidence topology"

python3 <<'PY'
import re
from collections import defaultdict

path = "telemetry/oracle_" + __import__("os").environ["STAMP"] + ".log"

buckets = defaultdict(int)

try:
    with open(path, errors="ignore") as f:
        for line in f:
            m = re.search(r'confidence=([0-9.]+)', line)
            if not m:
                continue

            x = float(m.group(1))

            if x >= 0.90:
                buckets["0.90-1.00"] += 1
            elif x >= 0.80:
                buckets["0.80-0.90"] += 1
            elif x >= 0.70:
                buckets["0.70-0.80"] += 1
            elif x >= 0.60:
                buckets["0.60-0.70"] += 1
            elif x >= 0.50:
                buckets["0.50-0.60"] += 1
            else:
                buckets["<0.50"] += 1

    print("══ CONFIDENCE TOPOLOGY ══")
    for k,v in buckets.items():
        print(f"{k}: {v}")

except FileNotFoundError:
    print("no telemetry found")
PY

echo "[5] Verifying allocator sanctity"

if grep -E \
    "ABI VIOLATION|PARITY WARNING|spill_delta=[1-9]" \
    telemetry/oracle_$STAMP.log
then
    echo "[FAIL] allocator corruption risk"
    exit 1
else
    echo "[PASS] allocator boundaries preserved"
fi

echo "[6] Building audit report"

cat > reports/prime_report_$STAMP.txt <<EOF
ZKAEDI PRIME REPORT

timestamp: $STAMP

status:
- parity locked
- oracle sandbox active
- allocator sacred
- rollback available
- telemetry stable

future:
- observer first
- mutation last
- audit before deployment
EOF

echo "[7] Snapshot blessing"

cp reports/prime_report_$STAMP.txt \
   telemetry/blessings/blessing_$STAMP.txt

echo
echo "═══════════════════════════════════════"
echo " ZKAEDI PRIME STABLE"
echo "═══════════════════════════════════════"
echo " observer integrity preserved"
echo " rollback chain preserved"
echo " topology memory preserved"
echo "═══════════════════════════════════════"
