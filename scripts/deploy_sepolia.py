#!/usr/bin/env python3
"""
Deploy ZkaediPrimeTest to Sepolia and verify gas/execution.

Prereqs:
  pip install web3 eth-account py-solc-x
  Sepolia ETH in PRIVATE_KEY account (faucet: https://sepoliafaucet.com/)

Usage:
  export PRIVATE_KEY=0x...
  export SEPOLIA_RPC_URL=https://rpc.sepolia.org   # or your own RPC
  python3 scripts/deploy_sepolia.py

Optional:
  export GAS_LIMIT=200000
  export VERIFY_GAS=1   # call computeOptimalInput after deploy and print gas used
"""

import json
import os
import sys

# Compile Solidity with py-solc-x
try:
    from solcx import install_solc, compile_source, set_solc_version
except ImportError:
    print("Install: pip install py-solc-x", file=sys.stderr)
    sys.exit(1)

try:
    from web3 import Web3
    from eth_account import Account
except ImportError:
    print("Install: pip install web3 eth-account", file=sys.stderr)
    sys.exit(1)

CONTRACT_SOL = """
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
contract ZkaediPrimeTest {
    function computeOptimalInput(uint256 reserveA, uint256 reserveB) external pure returns (uint256 optimalWei) {
        if (reserveA == 0 || reserveB == 0) return 0;
        optimalWei = (reserveA * reserveB) / 1e18;
        if (optimalWei > reserveA) optimalWei = reserveA;
        if (optimalWei > reserveB) optimalWei = reserveB;
        return optimalWei;
    }
}
"""

SEPOLIA_CHAIN_ID = 11155111


def main():
    rpc = os.environ.get("SEPOLIA_RPC_URL", "https://rpc.sepolia.org")
    key = os.environ.get("PRIVATE_KEY")
    if not key:
        print("Set PRIVATE_KEY (with 0x prefix) for the deployer account.", file=sys.stderr)
        sys.exit(1)
    if not key.startswith("0x"):
        key = "0x" + key

    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        print("RPC not connected:", rpc, file=sys.stderr)
        sys.exit(1)

    install_solc("0.8.19")
    set_solc_version("0.8.19")
    compiled = compile_source(CONTRACT_SOL)
    contract_interface = compiled["<stdin>:ZkaediPrimeTest"]
    bytecode = contract_interface["bin"]
    abi = contract_interface["abi"]

    account = Account.from_key(key)
    gas_limit = int(os.environ.get("GAS_LIMIT", "500000"))

    print("Deploying ZkaediPrimeTest to Sepolia...")
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    tx = Contract.constructor().build_transaction({
        "from": account.address,
        "chainId": SEPOLIA_CHAIN_ID,
        "gas": gas_limit,
    })
    tx["nonce"] = w3.eth.get_transaction_count(account.address)

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print("Tx hash:", tx_hash.hex())
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt["status"] != 1:
        print("Deploy failed.", file=sys.stderr)
        sys.exit(1)
    contract_address = receipt["contractAddress"]
    print("Deployed at:", contract_address)
    print("Gas used (deploy):", receipt["gasUsed"])
    print("Explorer: https://sepolia.etherscan.io/address/" + contract_address)

    if os.environ.get("VERIFY_GAS") == "1":
        c = w3.eth.contract(address=contract_address, abi=abi)
        reserve_a, reserve_b = 1000000000, 500000000
        tx_call = c.functions.computeOptimalInput(reserve_a, reserve_b).build_transaction({
            "from": account.address,
            "chainId": SEPOLIA_CHAIN_ID,
        })
        tx_call["nonce"] = w3.eth.get_transaction_count(account.address)
        # estimate only (no send) to get gas
        est = w3.eth.estimate_gas(tx_call)
        print("Est. gas for computeOptimalInput(1e9, 5e8):", est)
        result = c.functions.computeOptimalInput(reserve_a, reserve_b).call()
        print("Result (optimalWei):", result)

    print("Done.")


if __name__ == "__main__":
    main()
