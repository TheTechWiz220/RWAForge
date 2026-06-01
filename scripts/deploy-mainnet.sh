#!/usr/bin/env bash
set -euo pipefail

echo "WARNING: Mainnet deployment. Ensure audit complete and wallet funded."
read -r -p "Continue? [y/N] " confirm
[[ "$confirm" == "y" ]] || exit 1

CLUSTER="mainnet-beta"
solana config set --url "https://api.mainnet-beta.solana.com"

anchor build
anchor deploy --provider.cluster "$CLUSTER"

anchor keys list
