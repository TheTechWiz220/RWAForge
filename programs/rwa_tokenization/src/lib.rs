use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_spl::token_2022::spl_token_2022;
use anchor_spl::token_2022::spl_token_2022::extension::{
    default_account_state::instruction as default_state_ix,
    interest_bearing_mint::instruction as interest_ix,
    metadata_pointer::instruction as metadata_pointer_ix,
    permanent_delegate::instruction as permanent_delegate_ix,
    transfer_fee::instruction as transfer_fee_ix,
    transfer_hook::instruction as transfer_hook_ix,
    ExtensionType,
};
use anchor_spl::token_2022::spl_token_2022::instruction::{
    initialize_mint2, set_authority, AuthorityType,
};
use anchor_spl::token_2022::spl_token_2022::state::Mint;
use anchor_spl::token_2022::{self, Token2022};

declare_id!("RWATkn1111111111111111111111111111111111111");

pub const MAX_NAME_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_URI_LEN: usize = 200;

#[program]
pub mod rwa_tokenization {
    use super::*;

    /// Initialize global platform configuration (fee recipient, hook program, etc.)
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

    /// Create Token-2022 mint with RWA extensions and register asset metadata.
    pub fn initialize_mint_with_extensions(
        ctx: Context<InitializeMintWithExtensions>,
        args: InitializeMintArgs,
    ) -> Result<()> {
        require!(args.decimals <= 9, RwaError::InvalidDecimals);
        require!(args.name.len() <= MAX_NAME_LEN, RwaError::StringTooLong);
        require!(args.symbol.len() <= MAX_SYMBOL_LEN, RwaError::StringTooLong);
        require!(args.uri.len() <= MAX_URI_LEN, RwaError::StringTooLong);

        let mint_info = ctx.accounts.mint.to_account_info();
        let token_program = ctx.accounts.token_program.to_account_info();

        // Permanent delegate — issuer retains control for compliance
        invoke_signed(
            &permanent_delegate_ix::initialize(
                &spl_token_2022::id(),
                mint_info.key,
                Some(&ctx.accounts.issuer.key()),
            )?,
            &[mint_info.clone(), token_program.clone()],
            &[],
        )?;

        // Transfer hook — KYC/compliance via rwa_transfer_hook program
        invoke_signed(
            &transfer_hook_ix::initialize(
                &spl_token_2022::id(),
                mint_info.key,
                Some(ctx.accounts.transfer_hook_program.key),
            )?,
            &[
                mint_info.clone(),
                token_program.clone(),
                ctx.accounts.transfer_hook_program.to_account_info(),
            ],
            &[],
        )?;

        // Transfer fee — platform revenue on secondary transfers
        invoke_signed(
            &transfer_fee_ix::initialize_transfer_fee_config(
                &spl_token_2022::id(),
                mint_info.key,
                Some(&ctx.accounts.platform_config.key()),
                Some(&ctx.accounts.platform_config.fee_recipient),
                args.transfer_fee_basis_points,
                u64::MAX,
            )?,
            &[mint_info.clone(), token_program.clone()],
            &[],
        )?;

        // Interest-bearing — yield-bearing RWAs (rate in basis points per year)
        invoke_signed(
            &interest_ix::initialize(
                &spl_token_2022::id(),
                mint_info.key,
                Some(&ctx.accounts.issuer.key()),
                args.interest_rate_bps,
            )?,
            &[mint_info.clone(), token_program.clone()],
            &[],
        )?;

        // Default account state — frozen until KYC verified
        invoke_signed(
            &default_state_ix::initialize(
                &spl_token_2022::id(),
                mint_info.key,
                &ctx.accounts.issuer,
                spl_token_2022::state::AccountState::Frozen,
            )?,
            &[
                mint_info.clone(),
                token_program.clone(),
                ctx.accounts.issuer.to_account_info(),
            ],
            &[],
        )?;

        // Metadata pointer → mint holds metadata
        invoke_signed(
            &metadata_pointer_ix::initialize(
                &spl_token_2022::id(),
                mint_info.key,
                Some(&ctx.accounts.issuer.key()),
                Some(mint_info.key),
            )?,
            &[
                mint_info.clone(),
                token_program.clone(),
                ctx.accounts.issuer.to_account_info(),
            ],
            &[],
        )?;

        // Initialize mint (issuer is mint + freeze authority)
        invoke_signed(
            &initialize_mint2(
                &spl_token_2022::id(),
                mint_info.key,
                &ctx.accounts.issuer.key(),
                Some(&ctx.accounts.issuer.key()),
                args.decimals,
            )?,
            &[
                mint_info.clone(),
                ctx.accounts.rent.to_account_info(),
                ctx.accounts.issuer.to_account_info(),
            ],
            &[],
        )?;

        // On-chain TokenMetadata extension (name, symbol, uri)
        invoke(
            &spl_token_metadata_interface::instruction::initialize(
                &spl_token_2022::id(),
                mint_info.key,
                &ctx.accounts.issuer.key(),
                mint_info.key,
                &ctx.accounts.issuer.key(),
                args.name.clone(),
                args.symbol.clone(),
                args.uri.clone(),
            ),
            &[
                mint_info.clone(),
                ctx.accounts.issuer.to_account_info(),
                token_program.clone(),
            ],
        )?;

        // Register RWA asset PDA
        let asset = &mut ctx.accounts.rwa_asset;
        asset.issuer = ctx.accounts.issuer.key();
        asset.mint = ctx.accounts.mint.key();
        asset.asset_type = args.asset_type;
        asset.name = args.name;
        asset.symbol = args.symbol;
        asset.uri = args.uri;
        asset.total_supply = 0;
        asset.redeemed_supply = 0;
        asset.verified = false;
        asset.interest_rate_bps = args.interest_rate_bps;
        asset.transfer_fee_basis_points = args.transfer_fee_basis_points;
        asset.bump = ctx.bumps.rwa_asset;

        emit!(AssetRegistered {
            mint: asset.mint,
            issuer: asset.issuer,
            asset_type: asset.asset_type,
        });

        Ok(())
    }

    /// Mark asset as verified (issuer/platform). Enables minting to KYC'd wallets.
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

    /// Mint tokens to recipient (only after verification). Recipient ATA should be thawed client-side.
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

        ctx.accounts.rwa_asset.total_supply = ctx
            .accounts
            .rwa_asset
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

    /// Update off-chain metadata URI and on-chain symbol/name via issuer
    pub fn update_metadata(ctx: Context<UpdateMetadata>, args: UpdateMetadataArgs) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.rwa_asset.issuer,
            ctx.accounts.issuer.key(),
            RwaError::Unauthorized
        );
        if let Some(uri) = args.uri {
            require!(uri.len() <= MAX_URI_LEN, RwaError::StringTooLong);
            ctx.accounts.rwa_asset.uri = uri;
        }
        if let Some(name) = args.name {
            require!(name.len() <= MAX_NAME_LEN, RwaError::StringTooLong);
            ctx.accounts.rwa_asset.name = name;
        }
        emit!(MetadataUpdated {
            mint: ctx.accounts.rwa_asset.mint,
        });
        Ok(())
    }

    /// Redeem/burn tokens back to issuer (RWA redemption flow)
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

    /// Revoke mint authority after full issuance (optional finalization)
    pub fn finalize_mint(ctx: Context<FinalizeMint>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.rwa_asset.issuer,
            ctx.accounts.issuer.key(),
            RwaError::Unauthorized
        );
        invoke_signed(
            &set_authority(
                &spl_token_2022::id(),
                ctx.accounts.mint.to_account_info().key,
                None,
                AuthorityType::MintTokens,
                &ctx.accounts.issuer.key(),
                &[],
            )?,
            &[
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.issuer.to_account_info(),
            ],
            &[],
        )?;
        Ok(())
    }
}

// ─── Accounts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"platform"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    /// CHECK: fee recipient wallet
    pub fee_recipient: UncheckedAccount<'info>,
    /// CHECK: transfer hook program id
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
    /// Token-2022 mint account pre-allocated with extension space by client
    #[account(mut)]
    /// CHECK: validated during extension initialization
    pub mint: UncheckedAccount<'info>,
    #[account(
        init,
        payer = issuer,
        space = 8 + RwaAsset::INIT_SPACE,
        seeds = [b"rwa_asset", mint.key().as_ref()],
        bump
    )]
    pub rwa_asset: Account<'info, RwaAsset>,
    /// CHECK: transfer hook program
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
    #[account(
        mut,
        seeds = [b"rwa_asset", mint.key().as_ref()],
        bump = rwa_asset.bump
    )]
    pub rwa_asset: Account<'info, RwaAsset>,
    /// CHECK: mint pubkey stored on asset
    pub mint: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    pub issuer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"rwa_asset", mint.key().as_ref()],
        bump = rwa_asset.bump
    )]
    pub rwa_asset: Account<'info, RwaAsset>,
    #[account(mut)]
    /// CHECK: Token-2022 mint
    pub mint: UncheckedAccount<'info>,
    /// CHECK: recipient wallet
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub recipient_token_account: InterfaceAccount<'info, token_2022::TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    pub issuer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"rwa_asset", mint.key().as_ref()],
        bump = rwa_asset.bump
    )]
    pub rwa_asset: Account<'info, RwaAsset>,
    /// CHECK: mint
    pub mint: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    pub holder: Signer<'info>,
    #[account(
        mut,
        seeds = [b"rwa_asset", mint.key().as_ref()],
        bump = rwa_asset.bump
    )]
    pub rwa_asset: Account<'info, RwaAsset>,
    #[account(mut)]
    /// CHECK: Token-2022 mint
    pub mint: UncheckedAccount<'info>,
    #[account(mut)]
    pub holder_token_account: InterfaceAccount<'info, token_2022::TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct FinalizeMint<'info> {
    pub issuer: Signer<'info>,
    #[account(seeds = [b"rwa_asset", mint.key().as_ref()], bump = rwa_asset.bump)]
    pub rwa_asset: Account<'info, RwaAsset>,
    #[account(mut)]
    /// CHECK: Token-2022 mint
    pub mint: UncheckedAccount<'info>,
}

// ─── State ──────────────────────────────────────────────────────────────────

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

// Asset type enum (stored as u8)
pub mod asset_type {
    pub const REAL_ESTATE: u8 = 0;
    pub const INVOICE: u8 = 1;
    pub const COLLECTIBLE: u8 = 2;
    pub const COMMODITY: u8 = 3;
    pub const EQUITY: u8 = 4;
    pub const DEBT: u8 = 5;
}

// ─── Args & Events ──────────────────────────────────────────────────────────

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

// ─── Errors ─────────────────────────────────────────────────────────────────

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

/// Helper: calculate required mint account size for Token-2022 extensions
pub fn required_mint_space() -> Result<usize> {
    let extension_types = [
        ExtensionType::PermanentDelegate,
        ExtensionType::TransferHook,
        ExtensionType::TransferFeeConfig,
        ExtensionType::InterestBearingConfig,
        ExtensionType::DefaultAccountState,
        ExtensionType::MetadataPointer,
        ExtensionType::TokenMetadata,
    ];
    Ok(ExtensionType::try_calculate_account_len::<Mint>(&extension_types)?)
}
