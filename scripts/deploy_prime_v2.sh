#!/bin/bash
# ZKAEDI PRIME - Full Etherscan to EVM AI Training Pipeline
# Usage: ./scripts/deploy_prime_v2.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CORPUS_JSON="training_corpus.json"
PRIME_JSON="prime_training_data.json"
EPOCHS=100

echo "=================================================="
echo " 🔱 ZKAEDI PRIME: EVM Training Pipeline v2 Initialization"
echo "=================================================="

# 1. Verification of Corpus
if [ ! -f "$CORPUS_JSON" ]; then
    echo "⚠️  [WARNING] $CORPUS_JSON not found!"
    echo "   You must run etherscan_batch_fetch.ts using your Etherscan API key first."
    echo "   Example: ETHERSCAN_API_KEY=xxx npx ts-node etherscan_batch_fetch.ts"
    echo "   (If you are just validating locally, run python3 test_pipeline_e2e.py instead.)"
    exit 1
fi
echo "[1/3] Verified Etherscan training corpus ($CORPUS_JSON) is present."

# 2. Extract PRIME Features
echo "[2/3] Extracting structural AST features and mapping to 23-D PRIME Vectors..."
python3 etherscan_to_prime.py "$CORPUS_JSON" "$PRIME_JSON"
if [ ! -f "$PRIME_JSON" ]; then
    echo "❌ Error: Etherscan extraction failed to generate $PRIME_JSON."
    exit 1
fi

# 3. Train the Model
echo "[3/3] Engaging PyTorch AdamW Classifier with PRIME LR Modulator..."
# The script will try to use the PyTorch environment if available.
python3 train_evm_v2.py "$PRIME_JSON" --epochs $EPOCHS --use-prime

echo "=================================================="
echo "🔱 PRIME EVM Pipeline Execution Completed."
echo "=================================================="
