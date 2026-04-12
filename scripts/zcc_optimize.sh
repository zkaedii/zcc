#!/bin/bash
# ZKAEDI PRIME - Full Compiler Toolchain Hook
# Usage: ./scripts/zcc_optimize.sh <target.c>
set -e

SOURCE_FILE=$1
if [ -z "$SOURCE_FILE" ]; then
    echo "Usage: $0 <target.c>"
    exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=================================================="
echo " 🔱 ZKAEDI Ouroboros - Compiler Optimization Bridge"
echo "=================================================="
echo "🎯 Analyzing target: $SOURCE_FILE"

# 1. Compile with ZCC to generate zcc_ir.json
if ! ./zcc "$SOURCE_FILE" -o /tmp/zcc_out.s; then
    echo "❌ Error: ZCC Compilation failed."
    exit 1
fi

if [ ! -f "zcc_ir.json" ]; then
    echo "❌ Error: zcc_ir.json was not generated."
    exit 1
fi

# 2. Execute ZCC Internal DCE (Pass 0)
echo "[1/3] Executing structural Dead Code Elimination (zcc_dce.py)..."
if [ -f "zcc_dce.py" ]; then
    python3 zcc_dce.py zcc_ir.json zcc_ir_optimized.json
else
    echo "⚠️  zcc_dce.py not found. Pass 0 bypassed."
    cat zcc_ir.json > zcc_ir_optimized.json
fi

# 3. Execute ZCC Advanced IR Pipelines (Passes 1-6)
echo "[2/3] Cascading 6-Pass Advanced Optimization Pipeline (zcc_ir_opts.py)..."
python3 zcc_ir_opts.py zcc_ir_optimized.json zcc_ir_final.json

echo "[3/3] Target primed for Ouroboros parsing."
echo "=================================================="
