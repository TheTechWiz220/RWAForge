#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self as token_2022, Token2022};
use anchor_spl::token_interface::TokenAccount;

declare_id!("RWATkn1111111111111111111111111111111111111");

pub const MAX_NAME_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_URI_LEN: usize = 200;

#[program]
pub mod rwa_tokenization {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        fee_basis_points: u16,
    ) -> Result<()> {
        require!(fee_basis_points <= 10_000, RwaError::InvalidFee);

        let config = &mut ctx.accounts.platform_config;
        config.authority = ctx.accounts.authority.key();
        config.fee_basis_points = fee_basis_points;
        config.fee_recipient = ctx.accounts.fee_recipient.key();
        config.transfer_hook_program = ctx.accounts.transfer_hook_program.key();
        config.bump = ctx.bumps.platform_config;
        Ok(())
    }

    pub fn initialize_mint_with_extensions(
        ctx: Context<InitializeMintWithExtensions>,
        args: InitializeMintArgs,
    ) -> Result<()> {
        require!(args.decimals <= 9, RwaError::InvalidDecimals);
        require!(args.name.len() <= MAX_NAME_LEN, RwaError::StringTooLong);
        require!(args.symbol.len() <= MAX_SYMBOL_LEN, RwaError::StringTooLong);
        require!(args.uri.len() <= MAX_URI_LEN, RwaError::StringTooLong);

        let asset = &mut ctx.accounts.rwa_asset;
        asset.issuer = ctx.accounts.issuer.key();
        asset.mint = ctx.accounts.mint.key();
        asset.asset_type = args.asset_type;
        asset.name = args.name.clone();           // <-- clone here
        asset.symbol = args.symbol;
        asset.uri = args.uri;
        asset.total_supply = 0;
        asset.redeemed_supply = 0;
        asset.verified = false;
        asset.interest_rate_bps = args.interest_rate_bps;
        asset.transfer_fee_basis_points = args.transfer_fee_basis_points;
        asset.bump = ctx.bumps.rwa_asset;

        msg!("RWA Mint initialized: {}", args.name); // now safe

        emit!(AssetRegistered {
            mint: asset.mint,
            issuer: asset.issuer,
            asset_type: asset.asset_type,
        });

        Ok(())
    }

    pub fn verify_asset(ctx: Context<VerifyAsset>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.platform_config.authority,
            ctx.accounts.authority.key(),
            RwaError::Unauthorized
        );

        ctx.accounts.rwa_asset.verified = true;

        emit!(AssetVerified {
            mint: ctx.accounts.rwa_asset.mint,
        });
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, RwaError::InvalidAmount);
        let asset = &ctx.accounts.rwa_asset;

        require!(asset.verified, RwaError::AssetNotVerified);
        require_keys_eq!(asset.issuer, ctx.accounts.issuer.key(), RwaError::Unauthorized);

        token_2022::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.issuer.to_account_info(),
                },
            ),
            amount,
        )?;

        let asset = &mut ctx.accounts.rwa_asset;
        asset.total_supply = asset
            .total_supply
            .checked_add(amount)
            .ok_or(RwaError::MathOverflow)?;

        emit!(TokensMinted {
            mint: ctx.accounts.mint.key(),
            recipient: ctx.accounts.recipient.key(),
            amount,
        });

        Ok(())
    }

    pub fn update_metadata(ctx: Context<UpdateMetadata>, args: UpdateMetadataArgs) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.rwa_asset.issuer,
            ctx.accounts.issuer.key(),
            RwaError::Unauthorized
        );

        let rwa_asset = &mut ctx.accounts.rwa_asset;

        if let Some(name) = args.name {
            require!(name.len() <= MAX_NAME_LEN, RwaError::StringTooLong);
            rwa_asset.name = name;
        }

        if let Some(uri) = args.uri {
            require!(uri.len() <= MAX_URI_LEN, RwaError::StringTooLong);
            rwa_asset.uri = uri;
        }

        emit!(MetadataUpdated {
            mint: rwa_asset.mint,
        });

        Ok(())
    }

    pub fn redeem(ctx: Context<Redeem>, amount: u64) -> Result<()> {
        require!(amount > 0, RwaError::InvalidAmount);

        let asset = &mut ctx.accounts.rwa_asset;

        require!(
            amount <= asset.total_supply.saturating_sub(asset.redeemed_supply),
            RwaError::InsufficientSupply
        );

        token_2022::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.holder_token_account.to_account_info(),
                    authority: ctx.accounts.holder.to_account_info(),
                },
            ),
            amount,
        )?;

        asset.redeemed_supply = asset
            .redeemed_supply
            .checked_add(amount)
            .ok_or(RwaError::MathOverflow)?;

        emit!(TokensRedeemed {
            mint: asset.mint,
            holder: ctx.accounts.holder.key(),
            amount,
        });

        Ok(())
    }

    pub fn finalize_mint(ctx: Context<FinalizeMint>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.rwa_asset.issuer,
            ctx.accounts.issuer.key(),
            RwaError::Unauthorized
        );
        // TODO: Add logic if needed (e.g. freeze mint authority)
        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Account Contexts
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + PlatformConfig::INIT_SPACE, seeds = [b"platform"], bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub fee_recipient: UncheckedAccount<'info>,
    pub transfer_hook_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: InitializeMintArgs)]
pub struct InitializeMintWithExtensions<'info> {
    #[account(mut)]
    pub issuer: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    /// CHECK: This should be the mint being initialized with extensions
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    #[account(init, payer = issuer, space = 8 + RwaAsset::INIT_SPACE, seeds = [b"rwa_asset", mint.key().as_ref()], bump)]
    pub rwa_asset: Account<'info, RwaAsset>,
    pub transfer_hook_program: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyAsset<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [b"platform"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut, seeds = [b"rwa_asset", mint.key().as_ref()], bump = rwa_asset.bump)]
    pub rwa_asset: Account<'info, RwaAsset>,
    pub mint: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    pub issuer: Signer<'info>,
    #[account(mut, seeds = [b"rwa_asset", mint.key().as_ref()], bump = rwa_asset.bump)]
    pub rwa_asset: Account<'info, RwaAsset>,
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
#[instruction(args: UpdateMetadataArgs)]
pub struct UpdateMetadata<'info> {
    pub issuer: Signer<'info>,
    #[account(mut, seeds = [b"rwa_asset", mint.key().as_ref()], bump = rwa_asset.bump)]
    pub rwa_asset: Account<'info, RwaAsset>,
    pub mint: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    pub holder: Signer<'info>,
    #[account(mut, seeds = [b"rwa_asset", mint.key().as_ref()], bump = rwa_asset.bump)]
    pub rwa_asset: Account<'info, RwaAsset>,
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    #[account(mut)]
    pub holder_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct FinalizeMint<'info> {
    pub issuer: Signer<'info>,
    #[account(seeds = [b"rwa_asset", mint.key().as_ref()], bump = rwa_asset.bump)]
    pub rwa_asset: Account<'info, RwaAsset>,
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
}

// ─────────────────────────────────────────────────────────────────────────────
// State, Args, Events, Errors
// ─────────────────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub fee_basis_points: u16,
    pub fee_recipient: Pubkey,
    pub transfer_hook_program: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RwaAsset {
    pub issuer: Pubkey,
    pub mint: Pubkey,
    pub asset_type: u8,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub uri: String,
    pub total_supply: u64,
    pub redeemed_supply: u64,
    pub verified: bool,
    pub interest_rate_bps: u16,
    pub transfer_fee_basis_points: u16,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeMintArgs {
    pub decimals: u8,
    pub asset_type: u8,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub interest_rate_bps: u16,
    pub transfer_fee_basis_points: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateMetadataArgs {
    pub name: Option<String>,
    pub uri: Option<String>,
}

// Events
#[event]
pub struct AssetRegistered {
    pub mint: Pubkey,
    pub issuer: Pubkey,
    pub asset_type: u8,
}

#[event]
pub struct AssetVerified {
    pub mint: Pubkey,
}

#[event]
pub struct TokensMinted {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TokensRedeemed {
    pub mint: Pubkey,
    pub holder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct MetadataUpdated {
    pub mint: Pubkey,
}

#[error_code]
pub enum RwaError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid fee basis points")]
    InvalidFee,
    #[msg("Invalid decimals")]
    InvalidDecimals,
    #[msg("String exceeds max length")]
    StringTooLong,
    #[msg("Asset not verified")]
    AssetNotVerified,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient supply for redemption")]
    InsufficientSupply,
}
