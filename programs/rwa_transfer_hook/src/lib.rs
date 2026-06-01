use anchor_lang::prelude::*;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

declare_id!("RWAHok1111111111111111111111111111111111111");

#[program]
pub mod rwa_transfer_hook {
    use super::*;

    /// Initialize extra account metas required for transfer hook CPI resolution
    pub fn initialize_extra_account_metas(
        ctx: Context<InitializeExtraAccountMetas>,
    ) -> Result<()> {
        let account_metas = vec![
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal {
                        bytes: b"kyc".to_vec(),
                    },
                    Seed::AccountKey { index: 0 }, // source token account owner
                    Seed::AccountKey { index: 1 }, // mint
                ],
                false,
                false,
            )?,
        ];

        let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
        let lamports = Rent::get()?.minimum_balance(account_size as usize);

        let mint = ctx.accounts.mint.key();
        let extra_metas = &ctx.accounts.extra_account_metas;
        let seeds: &[&[u8]] = &[
            b"extra-account-metas",
            mint.as_ref(),
            &[ctx.bumps.extra_account_metas],
        ];

        anchor_lang::system_program::create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: extra_metas.to_account_info(),
                },
                &[seeds],
            ),
            lamports,
            account_size,
            ctx.program_id,
        )?;

        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_metas.try_borrow_mut_data()?,
            &account_metas,
        )?;

        Ok(())
    }

    /// Transfer hook: block transfers unless sender and receiver are KYC-verified
    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        let instruction = TransferHookInstruction::Execute { amount };
        instruction.discriminant().log();

        let source_owner = ctx.accounts.owner.key();
        let destination_owner = ctx.accounts.destination_owner.key();
        let mint = ctx.accounts.mint.key();

        // Sender must be KYC'd
        require!(
            ctx.accounts.source_kyc.verified,
            HookError::SourceNotKycVerified
        );
        // Receiver must be KYC'd
        require!(
            ctx.accounts.destination_kyc.verified,
            HookError::DestinationNotKycVerified
        );

        // Per-mint KYC binding
        require_keys_eq!(ctx.accounts.source_kyc.mint, mint, HookError::KycMintMismatch);
        require_keys_eq!(
            ctx.accounts.destination_kyc.mint,
            mint,
            HookError::KycMintMismatch
        );
        require_keys_eq!(
            ctx.accounts.source_kyc.wallet,
            source_owner,
            HookError::KycWalletMismatch
        );
        require_keys_eq!(
            ctx.accounts.destination_kyc.wallet,
            destination_owner,
            HookError::KycWalletMismatch
        );

        Ok(())
    }

    /// Platform registers a wallet as KYC-verified for a specific RWA mint
    pub fn register_kyc(ctx: Context<RegisterKyc>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.platform_authority.key(),
            HookError::Unauthorized
        );
        let kyc = &mut ctx.accounts.kyc_record;
        kyc.wallet = ctx.accounts.wallet.key();
        kyc.mint = ctx.accounts.mint.key();
        kyc.verified = true;
        kyc.bump = ctx.bumps.kyc_record;
        kyc.verified_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Revoke KYC for a wallet
    pub fn revoke_kyc(ctx: Context<RevokeKyc>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.platform_authority.key(),
            HookError::Unauthorized
        );
        ctx.accounts.kyc_record.verified = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetas<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: mint for hook
    pub mint: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 2048,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    /// CHECK: extra account metas PDA
    pub extra_account_metas: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// CHECK: source token account
    #[account(token::token_program = token_program)]
    pub source_token: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,
    /// CHECK: destination token account
    pub destination_token: UncheckedAccount<'info>,
    /// CHECK: owner of source
    pub owner: UncheckedAccount<'info>,
    /// CHECK: owner of destination
    pub destination_owner: UncheckedAccount<'info>,
    #[account(
        seeds = [b"kyc", owner.key().as_ref(), mint.key().as_ref()],
        bump = source_kyc.bump
    )]
    pub source_kyc: Account<'info, KycRecord>,
    #[account(
        seeds = [b"kyc", destination_owner.key().as_ref(), mint.key().as_ref()],
        bump = destination_kyc.bump
    )]
    pub destination_kyc: Account<'info, KycRecord>,
    pub token_program: Interface<'info, anchor_spl::token_interface::TokenInterface>,
}

#[derive(Accounts)]
pub struct RegisterKyc<'info> {
    pub authority: Signer<'info>,
    /// CHECK: platform authority from tokenization program
    pub platform_authority: UncheckedAccount<'info>,
    /// CHECK: wallet to verify
    pub wallet: UncheckedAccount<'info>,
    /// CHECK: RWA mint
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

#[derive(Accounts)]
pub struct RevokeKyc<'info> {
    pub authority: Signer<'info>,
    /// CHECK: platform authority
    pub platform_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"kyc", kyc_record.wallet.as_ref(), kyc_record.mint.as_ref()],
        bump = kyc_record.bump
    )]
    pub kyc_record: Account<'info, KycRecord>,
}

#[account]
#[derive(InitSpace)]
pub struct KycRecord {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub verified: bool,
    pub verified_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum HookError {
    #[msg("Source wallet not KYC verified")]
    SourceNotKycVerified,
    #[msg("Destination wallet not KYC verified")]
    DestinationNotKycVerified,
    #[msg("KYC record mint mismatch")]
    KycMintMismatch,
    #[msg("KYC record wallet mismatch")]
    KycWalletMismatch,
    #[msg("Unauthorized")]
    Unauthorized,
}
