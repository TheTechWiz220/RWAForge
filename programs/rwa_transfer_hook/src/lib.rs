//! RWAForge Token-2022 transfer hook — KYC, sanctions, tier, and mint-level compliance.
//!
//! Must call `initialize_extra_account_meta_list` after setting the transfer hook on a mint.
//! Token-2022 invokes `execute` on every `transfer` / `transfer_checked`.

use anchor_lang::prelude::*;
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("RWAHok1111111111111111111111111111111111111");

/// SPL transfer-hook interface discriminator for `Execute` (not Anchor's default).
const EXECUTE_DISCRIMINATOR: [u8; 8] = ExecuteInstruction::SPL_DISCRIMINATOR;

#[program]
pub mod rwa_transfer_hook {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        initialize_config_handler(ctx)
    }

    pub fn initialize_mint_compliance(
        ctx: Context<InitializeMintCompliance>,
        min_tier: u8,
    ) -> Result<()> {
        initialize_mint_compliance_handler(ctx, min_tier)
    }

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        initialize_extra_account_meta_list_handler(ctx)
    }

    /// Token-2022 CPI entrypoint — uses SPL interface discriminator.
    #[instruction(discriminator = EXECUTE_DISCRIMINATOR)]
    pub fn execute<'info>(
        ctx: Context<'_, '_, '_, 'info, Execute<'info>>,
        amount: u64,
    ) -> Result<()> {
        execute_handler(ctx, amount)
    }

    pub fn register_kyc(
        ctx: Context<RegisterKyc>,
        tier: u8,
        jurisdiction: u16,
        expires_at: i64,
    ) -> Result<()> {
        register_kyc_handler(ctx, tier, jurisdiction, expires_at)
    }

    pub fn revoke_kyc(ctx: Context<RevokeKyc>) -> Result<()> {
        revoke_kyc_handler(ctx)
    }

    pub fn update_mint_compliance(
        ctx: Context<UpdateMintCompliance>,
        transfers_enabled: Option<bool>,
        min_tier: Option<u8>,
    ) -> Result<()> {
        update_mint_compliance_handler(ctx, transfers_enabled, min_tier)
    }

    pub fn set_global_pause(ctx: Context<SetGlobalPause>, paused: bool) -> Result<()> {
        set_global_pause_handler(ctx, paused)
    }
}

pub use instructions::execute::TransferCompliancePassed;
pub use state::*;
