# rwa_transfer_hook

SPL Token-2022 transfer hook for RWAForge compliance.

## Setup (per RWA mint)

1. `initialize_config` — once per deployment
2. `initialize_mint_compliance` — per Token-2022 mint (min KYC tier)
3. Set transfer hook on mint to this program (`rwa_tokenization::initialize_mint_with_extensions`)
4. `initialize_extra_account_meta_list` — TLV account for CPI account resolution
5. `register_kyc` — per wallet + mint before transfers

## Execute checks

On every transfer, `execute` validates:

- Global pause off
- Mint transfers enabled
- Source & destination `KycRecord`: verified, sanctions cleared, tier ≥ mint minimum, not expired
- Owners match token accounts

## Instructions

| Instruction | Purpose |
|-------------|---------|
| `initialize_config` | Platform authority + compliance officer |
| `initialize_mint_compliance` | Per-mint policy (min tier, enable/disable) |
| `initialize_extra_account_meta_list` | TLV extra accounts for Token-2022 CPI |
| `execute` | SPL transfer hook (auto-invoked) |
| `register_kyc` | Approve wallet for mint |
| `revoke_kyc` | Revoke approval |
| `update_mint_compliance` | Update tier gate / pause mint |
| `set_global_pause` | Emergency stop all transfers |
