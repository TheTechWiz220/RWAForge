use anchor_lang::prelude::*;

use crate::errors::HookError;
use crate::state::{HookConfig, KycRecord, MintCompliance, kyc_tier};

#[derive(Accounts)]
pub struct RegisterKyc<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [b"hook_config"], bump = hook_config.bump)]
    pub hook_config: Account<'info, HookConfig>,
    /// CHECK: wallet receiving KYC approval
    pub wallet: UncheckedAccount<'info>,
    /// CHECK: RWA Token-2022 mint
    pub mint: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + KycRecord::INIT_SPACE,
        seeds = [b"kyc", wallet.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub kyc_record: Account<'info, KycRecord>,
    pub system_program: Program<'info, System>,
}

pub fn register_kyc_handler(
    ctx: Context<RegisterKyc>,
    tier: u8,
    jurisdiction: u16,
    expires_at: i64,
) -> Result<()> {
    require_authority(&ctx.accounts.hook_config, &ctx.accounts.authority)?;
    require!(tier <= kyc_tier::QUALIFIED, HookError::InvalidTier);

    let record = &mut ctx.accounts.kyc_record;
    record.wallet = ctx.accounts.wallet.key();
    record.mint = ctx.accounts.mint.key();
    record.verified = true;
    record.tier = tier;
    record.jurisdiction = jurisdiction;
    record.verified_at = Clock::get()?.unix_timestamp;
    record.expires_at = expires_at;
    record.sanctions_cleared = true;
    record.bump = ctx.bumps.kyc_record;

    emit!(KycRegistered {
        wallet: record.wallet,
        mint: record.mint,
        tier,
        jurisdiction,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RevokeKyc<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [b"hook_config"], bump = hook_config.bump)]
    pub hook_config: Account<'info, HookConfig>,
    #[account(
        mut,
        seeds = [b"kyc", kyc_record.wallet.as_ref(), kyc_record.mint.as_ref()],
        bump = kyc_record.bump
    )]
    pub kyc_record: Account<'info, KycRecord>,
}

pub fn revoke_kyc_handler(ctx: Context<RevokeKyc>) -> Result<()> {
    require_authority(&ctx.accounts.hook_config, &ctx.accounts.authority)?;
    ctx.accounts.kyc_record.verified = false;
    ctx.accounts.kyc_record.sanctions_cleared = false;

    emit!(KycRevoked {
        wallet: ctx.accounts.kyc_record.wallet,
        mint: ctx.accounts.kyc_record.mint,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateMintCompliance<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [b"hook_config"], bump = hook_config.bump)]
    pub hook_config: Account<'info, HookConfig>,
    #[account(
        mut,
        seeds = [b"mint_compliance", mint_compliance.mint.as_ref()],
        bump = mint_compliance.bump
    )]
    pub mint_compliance: Account<'info, MintCompliance>,
}

pub fn update_mint_compliance_handler(
    ctx: Context<UpdateMintCompliance>,
    transfers_enabled: Option<bool>,
    min_tier: Option<u8>,
) -> Result<()> {
    require_authority(&ctx.accounts.hook_config, &ctx.accounts.authority)?;

    let compliance = &mut ctx.accounts.mint_compliance;
    if let Some(enabled) = transfers_enabled {
        compliance.transfers_enabled = enabled;
    }
    if let Some(tier) = min_tier {
        require!(tier <= kyc_tier::QUALIFIED, HookError::InvalidTier);
        compliance.min_tier = tier;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct SetGlobalPause<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"hook_config"], bump = hook_config.bump)]
    pub hook_config: Account<'info, HookConfig>,
}

pub fn set_global_pause_handler(ctx: Context<SetGlobalPause>, paused: bool) -> Result<()> {
    require_authority(&ctx.accounts.hook_config, &ctx.accounts.authority)?;
    ctx.accounts.hook_config.global_pause = paused;
    emit!(GlobalPauseUpdated { paused });
    Ok(())
}

fn require_authority(config: &HookConfig, signer: &Signer) -> Result<()> {
    require!(
        config.authority == signer.key() || config.compliance_officer == signer.key(),
        HookError::Unauthorized
    );
    Ok(())
}

#[event]
pub struct KycRegistered {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub tier: u8,
    pub jurisdiction: u16,
}

#[event]
pub struct KycRevoked {
    pub wallet: Pubkey,
    pub mint: Pubkey,
}

#[event]
pub struct GlobalPauseUpdated {
    pub paused: bool,
}
