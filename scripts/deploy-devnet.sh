#!/usr/bin/env bash
set -euo pipefail

CLUSTER="${1:-devnet}"
echo "Deploying RWAForge programs to ${CLUSTER}..."

solana config set --url "https://api.${CLUSTER}.solana.com"

anchor build
anchor deploy --provider.cluster "$CLUSTER"

echo ""
echo "Program IDs:"
anchor keys list

echo ""
echo "Copy IDs to Anchor.toml [programs.${CLUSTER}] and frontend/.env.local"
