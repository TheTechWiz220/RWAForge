# RWAForge

AI-Powered Real World Asset (RWA) Tokenization and Marketplace on Solana.

## Architecture

```
RWAForge/
├── programs/
│   ├── rwa_tokenization/   # Token-2022 mint engine (extensions + metadata)
│   ├── rwa_marketplace/    # Escrow listings, USDC settlement
│   └── rwa_transfer_hook/  # SPL Token-2022 transfer hook (KYC, tiers, sanctions)
├── tests/                  # Anchor integration tests
├── scripts/                # Devnet/mainnet deploy
└── frontend/               # Next.js 15 dApp
```

## Token-2022 Extensions

| Extension | Purpose |
|-----------|---------|
| TokenMetadata | On-chain asset name, symbol, documents URI |
| MetadataPointer | Points metadata to mint account |
| TransferHook | KYC gate on every transfer (SPL `execute` + TLV extra accounts) |
| PermanentDelegate | Issuer compliance control |
| InterestBearingConfig | Yield-bearing RWAs |
| TransferFeeConfig | Platform revenue on transfers |
| DefaultAccountState | Frozen until verified |

## Quick Start

### Prerequisites

- Rust 1.79+, Solana CLI 2.x, Anchor 0.30.1
- Node.js 20+
- Phantom / Solflare / Backpack wallet

### Transfer hook setup (after mint creation)

```bash
# 1. Global config
anchor run initialize_hook_config

# 2. Per mint: mint_compliance + extra_account_meta_list + register_kyc for parties
```

See `programs/rwa_transfer_hook/README.md` for the full compliance flow.

### Programs

```bash
npm install
anchor build
anchor test
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Deploy (Devnet)

```bash
bash scripts/deploy-devnet.sh
# Update program IDs in Anchor.toml + frontend/.env.local
```

## AI Configuration

Set in `frontend/.env.local`:

```
AI_PROVIDER=openai   # openai | anthropic | groq
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

## License

MIT
