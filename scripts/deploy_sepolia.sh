#!/usr/bin/env sh
# Deploy ZkaediPrimeTest to Sepolia with Foundry (forge + cast).
#
# Prereqs: forge install (Foundry), Sepolia ETH in DEPLOYER_PRIVATE_KEY.
# Usage:
#   export DEPLOYER_PRIVATE_KEY=0x...
#   export SEPOLIA_RPC=https://rpc.sepolia.org
#   ./scripts/deploy_sepolia.sh

set -e
cd "$(dirname "$0")/.."
RPC="${SEPOLIA_RPC:-https://rpc.sepolia.org}"
PK="${DEPLOYER_PRIVATE_KEY:?Set DEPLOYER_PRIVATE_KEY}"

if ! command -v forge >/dev/null 2>&1; then
  echo "Foundry (forge) not found. Install: curl -L https://foundry.paradigm.xyz | bash && foundryup"
  exit 1
fi

echo "Building..."
forge build

echo "Deploying to Sepolia..."
DEPLOYED=$(forge create contracts/ZkaediPrimeTest.sol:ZkaediPrimeTest \
  --rpc-url "$RPC" \
  --private-key "$PK" \
  --chain sepolia \
  --json | jq -r '.deployedTo')
echo "Deployed at: $DEPLOYED"
echo "Explorer: https://sepolia.etherscan.io/address/$DEPLOYED"

echo "Gas check: call computeOptimalInput(1e9, 5e8)..."
cast call "$DEPLOYED" "computeOptimalInput(uint256,uint256)(uint256)" 1000000000 500000000 --rpc-url "$RPC"
echo "Estimate gas:"
cast estimate "$DEPLOYED" "computeOptimalInput(uint256,uint256)(uint256)" 1000000000 500000000 --rpc-url "$RPC"
echo "Done."
