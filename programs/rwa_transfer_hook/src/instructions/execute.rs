use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::extension::{
    BaseStateWithExtensions, StateWithExtensions,
};
use anchor_spl::token_2022::spl_token_2022::state::Account as TokenAccountState;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::HookError;
use crate::state::{HookConfig, KycRecord, MintCompliance};

/// SPL Token-2022 transfer hook `Execute` accounts.
///
/// Additional accounts resolved via `extra-account-metas` TLV (in order):
/// 1. source `KycRecord`, 2. destination `KycRecord`,
/// 3. `HookConfig`, 4. `MintCompliance`
#[derive(Accounts)]
pub struct Execute<'info> {
    #[account(token::token_program = token_program, token::mint = mint)]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(token::token_program = token_program, token::mint = mint)]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: Must match source token account owner
    pub owner: UncheckedAccount<'info>,
    /// CHECK: Must match destination token account owner
    pub destination_owner: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn execute_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, Execute<'info>>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, HookError::InvalidAmount);

    let remaining = ctx.remaining_accounts;
    require!(remaining.len() >= 4, HookError::MissingKycAccounts);

    let hook_config =
        Account::<HookConfig>::try_from(&remaining[2]).map_err(|_| error!(HookError::InvalidExtraAccountOwner))?;
    let mint_compliance = Account::<MintCompliance>::try_from(&remaining[3])
        .map_err(|_| error!(HookError::InvalidExtraAccountOwner))?;

    require!(!hook_config.global_pause, HookError::GlobalPauseActive);
    require!(mint_compliance.transfers_enabled, HookError::TransfersDisabled);

    let mint_key = ctx.accounts.mint.key();
    require_keys_eq!(mint_compliance.mint, mint_key, HookError::KycMintMismatch);

    let source_owner = get_token_account_owner(&ctx.accounts.source_token.to_account_info())?;
    let destination_owner =
        get_token_account_owner(&ctx.accounts.destination_token.to_account_info())?;

    require_keys_eq!(ctx.accounts.owner.key(), source_owner, HookError::KycWalletMismatch);
    require_keys_eq!(
        ctx.accounts.destination_owner.key(),
        destination_owner,
        HookError::KycWalletMismatch
    );

    let min_tier = mint_compliance.min_tier;
    let now = Clock::get()?.unix_timestamp;

    let source_kyc = validate_kyc_account(
        &remaining[0],
        source_owner,
        mint_key,
        min_tier,
        now,
        true,
    )?;

    let dest_kyc = validate_kyc_account(
        &remaining[1],
        destination_owner,
        mint_key,
        min_tier,
        now,
        false,
    )?;

    emit!(TransferCompliancePassed {
        mint: mint_key,
        source: source_owner,
        destination: destination_owner,
        amount,
        source_tier: source_kyc.tier,
        destination_tier: dest_kyc.tier,
    });

    Ok(())
}

fn get_token_account_owner(token_account: &AccountInfo) -> Result<Pubkey> {
    let data = token_account.try_borrow_data()?;
    let account = StateWithExtensions::<TokenAccountState>::unpack(&data)
        .map_err(|_| error!(HookError::InvalidAmount))?;
    Ok(account.base.owner)
}

fn validate_kyc_account(
    account_info: &AccountInfo,
    expected_wallet: Pubkey,
    expected_mint: Pubkey,
    min_tier: u8,
    now: i64,
    is_source: bool,
) -> Result<KycRecord> {
    require!(
        account_info.owner == &crate::ID,
        HookError::InvalidExtraAccountOwner
    );

    let kyc: Account<KycRecord> = Account::try_from(account_info)?;

    require_keys_eq!(kyc.wallet, expected_wallet, HookError::KycWalletMismatch);
    require_keys_eq!(kyc.mint, expected_mint, HookError::KycMintMismatch);

    if is_source {
        require!(kyc.verified, HookError::SourceNotKycVerified);
        require!(kyc.sanctions_cleared, HookError::SourceSanctionsNotCleared);
        require!(kyc.tier >= min_tier, HookError::SourceTierInsufficient);
        if kyc.expires_at > 0 {
            require!(now <= kyc.expires_at, HookError::SourceKycExpired);
        }
    } else {
        require!(kyc.verified, HookError::DestinationNotKycVerified);
        require!(kyc.sanctions_cleared, HookError::DestinationSanctionsNotCleared);
        require!(kyc.tier >= min_tier, HookError::DestinationTierInsufficient);
        if kyc.expires_at > 0 {
            require!(now <= kyc.expires_at, HookError::DestinationKycExpired);
        }
    }

    Ok(kyc)
}

#[event]
pub struct TransferCompliancePassed {
    pub mint: Pubkey,
    pub source: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub source_tier: u8,
    pub destination_tier: u8,
}
