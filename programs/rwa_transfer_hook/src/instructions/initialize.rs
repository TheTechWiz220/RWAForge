use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

use crate::errors::HookError;
use crate::state::{HookConfig, MintCompliance};

/// Initialize global hook configuration.
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + HookConfig::INIT_SPACE,
        seeds = [b"hook_config"],
        bump
    )]
    pub hook_config: Account<'info, HookConfig>,
    /// CHECK: optional separate compliance officer; defaults to authority if same
    pub compliance_officer: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_config_handler(ctx: Context<InitializeConfig>) -> Result<()> {
    let officer = if ctx.accounts.compliance_officer.key() == Pubkey::default() {
        ctx.accounts.authority.key()
    } else {
        ctx.accounts.compliance_officer.key()
    };

    let config = &mut ctx.accounts.hook_config;
    config.authority = ctx.accounts.authority.key();
    config.compliance_officer = officer;
    config.global_pause = false;
    config.bump = ctx.bumps.hook_config;
    Ok(())
}

/// Register per-mint compliance policy (call after RWA mint is created).
#[derive(Accounts)]
pub struct InitializeMintCompliance<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(seeds = [b"hook_config"], bump = hook_config.bump)]
    pub hook_config: Account<'info, HookConfig>,
    /// CHECK: Token-2022 mint pubkey
    pub mint: UncheckedAccount<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + MintCompliance::INIT_SPACE,
        seeds = [b"mint_compliance", mint.key().as_ref()],
        bump
    )]
    pub mint_compliance: Account<'info, MintCompliance>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_mint_compliance_handler(
    ctx: Context<InitializeMintCompliance>,
    min_tier: u8,
) -> Result<()> {
    require!(
        ctx.accounts.hook_config.authority == ctx.accounts.authority.key()
            || ctx.accounts.hook_config.compliance_officer == ctx.accounts.authority.key(),
        HookError::Unauthorized
    );
    require!(min_tier <= 2, HookError::InvalidTier);

    let compliance = &mut ctx.accounts.mint_compliance;
    compliance.mint = ctx.accounts.mint.key();
    compliance.issuer = ctx.accounts.authority.key();
    compliance.transfers_enabled = true;
    compliance.min_tier = min_tier;
    compliance.bump = ctx.bumps.mint_compliance;
    Ok(())
}

/// Initialize TLV extra-account metas on the transfer hook program for a mint.
///
/// Token-2022 `Execute` account layout (indices for seed resolution):
/// 0 = source token account, 1 = mint, 2 = destination token account,
/// 3 = source owner, 4 = destination owner
#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Token-2022 mint with transfer hook pointing to this program
    pub mint: UncheckedAccount<'info>,
    /// CHECK: extra-account-metas PDA (seeds: "extra-account-metas" + mint)
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_metas: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_extra_account_meta_list_handler(
    ctx: Context<InitializeExtraAccountMetaList>,
) -> Result<()> {
    // Source KYC PDA: ["kyc", source_owner, mint]
    let source_kyc_meta = ExtraAccountMeta::new_with_seeds(
        &[
            Seed::Literal {
                bytes: b"kyc".to_vec(),
            },
            Seed::AccountKey { index: 3 },
            Seed::AccountKey { index: 1 },
        ],
        false,
        false,
    )?;

    // Destination KYC PDA: ["kyc", destination_owner, mint]
    let destination_kyc_meta = ExtraAccountMeta::new_with_seeds(
        &[
            Seed::Literal {
                bytes: b"kyc".to_vec(),
            },
            Seed::AccountKey { index: 4 },
            Seed::AccountKey { index: 1 },
        ],
        false,
        false,
    )?;

    // Global hook config PDA: ["hook_config"]
    let hook_config_meta = ExtraAccountMeta::new_with_seeds(
        &[Seed::Literal {
            bytes: b"hook_config".to_vec(),
        }],
        false,
        false,
    )?;

    // Per-mint compliance PDA: ["mint_compliance", mint]
    let mint_compliance_meta = ExtraAccountMeta::new_with_seeds(
        &[
            Seed::Literal {
                bytes: b"mint_compliance".to_vec(),
            },
            Seed::AccountKey { index: 1 },
        ],
        false,
        false,
    )?;

    let account_metas = vec![
        source_kyc_meta,
        destination_kyc_meta,
        hook_config_meta,
        mint_compliance_meta,
    ];
    let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
    let lamports = Rent::get()?.minimum_balance(account_size as usize);

    let mint_key = ctx.accounts.mint.key();
    let metas_info = ctx.accounts.extra_account_metas.to_account_info();

    if metas_info.lamports() == 0 {
        let seeds: &[&[u8]] = &[
            b"extra-account-metas",
            mint_key.as_ref(),
            &[ctx.bumps.extra_account_metas],
        ];
        invoke_signed(
            &anchor_lang::solana_program::system_instruction::create_account(
                ctx.accounts.payer.key,
                metas_info.key,
                lamports,
                account_size,
                ctx.program_id,
            ),
            &[
                ctx.accounts.payer.to_account_info(),
                metas_info.clone(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[seeds],
        )?;
    } else {
        require!(
            metas_info.owner == ctx.program_id,
            HookError::InvalidExtraAccountOwner
        );
    }

    ExtraAccountMetaList::init::<ExecuteInstruction>(
        &mut metas_info.try_borrow_mut_data()?,
        &account_metas,
    )?;

    Ok(())
}
