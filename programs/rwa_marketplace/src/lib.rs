use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint as TokenMintClassic, Token, TokenAccount, Transfer};
use anchor_spl::token_2022::{self as token_2022, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount as InterfaceTokenAccount, TokenInterface};

declare_id!("RWAmkt11111111111111111111111111111111111111");

#[program]
pub mod rwa_marketplace {
    use super::*;

    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        platform_fee_bps: u16,
    ) -> Result<()> {
        require!(platform_fee_bps <= 10_000, MarketplaceError::InvalidFee);
        let market = &mut ctx.accounts.marketplace;
        market.authority = ctx.accounts.authority.key();
        market.platform_fee_bps = platform_fee_bps;
        market.treasury = ctx.accounts.treasury.key();
        market.total_volume = 0;
        market.listing_count = 0;
        market.listing_counter = 0;
        market.bump = ctx.bumps.marketplace;
        Ok(());
    }

    /// Seller escrows RWA tokens; listing priced in payment mint (USDC)
    pub fn create_listing(
        ctx: Context<CreateListing>,
        price: u64,
        amount: u64,
    ) -> Result<()> {
        require!(price > 0 && amount > 0, MarketplaceError::InvalidAmount);

        // Transfer RWA to escrow
        token_2022::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::TransferChecked {
                    from: ctx.accounts.seller_token_account.to_account_info(),
                    mint: ctx.accounts.rwa_mint.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.rwa_mint.decimals,
        )?;

        // Initialize listing
        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.rwa_mint = ctx.accounts.rwa_mint.key();
        listing.payment_mint = ctx.accounts.payment_mint.key();
        listing.price = price;
        listing.amount = amount;
        listing.active = true;
        listing.created_at = Clock::get()?.unix_timestamp;
        listing.bump = ctx.bumps.listing;
        listing.escrow_bump = ctx.bumps.escrow_authority;
        listing.listing_id = ctx.accounts.marketplace.listing_counter;

        // Update counters
        ctx.accounts.marketplace.listing_counter = ctx
            .accounts
            .marketplace
            .listing_counter
            .checked_add(1)
            .ok_or(MarketplaceError::MathOverflow)?;

        ctx.accounts.marketplace.listing_count = ctx
            .accounts
            .marketplace
            .listing_count
            .checked_add(1)
            .ok_or(MarketplaceError::MathOverflow)?;

        emit!(ListingCreated {
            listing: listing.key(),
            seller: listing.seller,
            rwa_mint: listing.rwa_mint,
            price,
            amount,
        });
        Ok(())
    }

    /// Buyer pays USDC/USDT; receives RWA tokens; platform fee to treasury
    pub fn buy_listing(ctx: Context<BuyListing>) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.active, MarketplaceError::ListingInactive);

        let total_price = listing.price;
        let fee = (total_price as u128)
            .checked_mul(ctx.accounts.marketplace.platform_fee_bps as u128)
            .ok_or(MarketplaceError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(MarketplaceError::MathOverflow)? as u64;

        let seller_proceeds = total_price
            .checked_sub(fee)
            .ok_or(MarketplaceError::MathOverflow)?;

        // Payment: buyer -> seller
        token::transfer(
            CpiContext::new(
                ctx.accounts.payment_token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_payment_account.to_account_info(),
                    to: ctx.accounts.seller_payment_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            seller_proceeds,
        )?;

        // Platform fee
        if fee > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.payment_token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer_payment_account.to_account_info(),
                        to: ctx.accounts.treasury_payment_account.to_account_info(),
                        authority: ctx.accounts.buyer.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        // RWA: escrow -> buyer
        let seeds = &[
            b"escrow",
            ctx.accounts.seller.key().as_ref(),   // Use seller instead of listing.key()
            ctx.accounts.rwa_mint.key().as_ref(),
            &listing.listing_id.to_le_bytes(),
        ];

        token_2022::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::TransferChecked {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    mint: ctx.accounts.rwa_mint.to_account_info(),
                    to: ctx.accounts.buyer_rwa_account.to_account_info(),
                    authority: ctx.accounts.escrow_authority.to_account_info(),
                },
                &[seeds],
            ),
            listing.amount,
            ctx.accounts.rwa_mint.decimals,
        )?;

        ctx.accounts.listing.active = false;
        ctx.accounts.marketplace.total_volume = ctx
            .accounts
            .marketplace
            .total_volume
            .checked_add(total_price)
            .ok_or(MarketplaceError::MathOverflow)?;

        emit!(ListingFilled {
            listing: ctx.accounts.listing.key(),
            buyer: ctx.accounts.buyer.key(),
            price: total_price,
            fee,
        });
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        require!(ctx.accounts.listing.active, MarketplaceError::ListingInactive);
        require_keys_eq!(
            ctx.accounts.listing.seller,
            ctx.accounts.seller.key(),
            MarketplaceError::Unauthorized
        );

        let seeds = &[
            b"escrow",
            ctx.accounts.seller.key().as_ref(),
            ctx.accounts.rwa_mint.key().as_ref(),
            &ctx.accounts.listing.listing_id.to_le_bytes(),
        ];

        token_2022::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::TransferChecked {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    mint: ctx.accounts.rwa_mint.to_account_info(),
                    to: ctx.accounts.seller_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_authority.to_account_info(),
                },
                &[seeds],
            ),
            ctx.accounts.listing.amount,
            ctx.accounts.rwa_mint.decimals,
        )?;

        ctx.accounts.listing.active = false;
        emit!(ListingCancelled {
            listing: ctx.accounts.listing.key(),
        });
        Ok(())
    }

    pub fn update_listing_price(ctx: Context<UpdateListing>, new_price: u64) -> Result<()> {
        require!(new_price > 0, MarketplaceError::InvalidAmount);
        require!(ctx.accounts.listing.active, MarketplaceError::ListingInactive);
        require_keys_eq!(
            ctx.accounts.listing.seller,
            ctx.accounts.seller.key(),
            MarketplaceError::Unauthorized
        );
        ctx.accounts.listing.price = new_price;
        Ok(())
    }
}

// ==================== ACCOUNTS ====================

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Marketplace::INIT_SPACE,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(price: u64, amount: u64)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(mut, seeds = [b"marketplace"], bump = marketplace.bump)]
    pub marketplace: Account<'info, Marketplace>,

    #[account(
        init,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [
            b"listing",
            seller.key().as_ref(),
            rwa_mint.key().as_ref(),
            &marketplace.listing_counter.to_le_bytes()
        ],
        bump
    )]
    pub listing: Account<'info, Listing>,

    pub rwa_mint: InterfaceAccount<'info, Mint>,
    pub payment_mint: Account<'info, TokenMintClassic>,

    #[account(mut)]
    pub seller_token_account: InterfaceAccount<'info, InterfaceTokenAccount>,

    #[account(
        init,
        payer = seller,
        associated_token::mint = rwa_mint,
        associated_token::authority = escrow_authority,
        associated_token::token_program = token_program,
    )]
    pub escrow_token_account: InterfaceAccount<'info, InterfaceTokenAccount>,

    #[account(
        seeds = [
            b"escrow",
            seller.key().as_ref(),
            rwa_mint.key().as_ref(),
            &marketplace.listing_counter.to_le_bytes()
        ],
        bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyListing<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut, seeds = [b"marketplace"], bump = marketplace.bump)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub listing: Account<'info, Listing>,
    pub rwa_mint: InterfaceAccount<'info, Mint>,
    pub payment_mint: Account<'info, TokenMintClassic>,
    #[account(mut)]
    pub buyer_payment_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_payment_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub treasury_payment_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: InterfaceAccount<'info, InterfaceTokenAccount>,
    #[account(
        seeds = [
            b"escrow",
            seller.key().as_ref(),           // Changed here too
            rwa_mint.key().as_ref(),
            &listing.listing_id.to_le_bytes()
        ],
        bump = listing.escrow_bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = rwa_mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_rwa_account: InterfaceAccount<'info, InterfaceTokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub payment_token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    pub seller: Signer<'info>,
    #[account(mut)]
    pub listing: Account<'info, Listing>,
    pub rwa_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub seller_token_account: InterfaceAccount<'info, InterfaceTokenAccount>,
    #[account(mut)]
    pub escrow_token_account: InterfaceAccount<'info, InterfaceTokenAccount>,
    #[account(
        seeds = [
            b"escrow",
            seller.key().as_ref(),
            rwa_mint.key().as_ref(),
            &listing.listing_id.to_le_bytes()
        ],
        bump = listing.escrow_bump
    )]
    pub escrow_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct UpdateListing<'info> {
    pub seller: Signer<'info>,
    #[account(mut)]
    pub listing: Account<'info, Listing>,
}

// State remains the same
#[account]
#[derive(InitSpace)]
pub struct Marketplace {
    pub authority: Pubkey,
    pub platform_fee_bps: u16,
    pub treasury: Pubkey,
    pub total_volume: u64,
    pub listing_count: u64,
    pub listing_counter: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub seller: Pubkey,
    pub rwa_mint: Pubkey,
    pub payment_mint: Pubkey,
    pub price: u64,
    pub amount: u64,
    pub active: bool,
    pub created_at: i64,
    pub listing_id: u64,
    pub bump: u8,
    pub escrow_bump: u8,
}

#[event]
pub struct ListingCreated {
    pub listing: Pubkey,
    pub seller: Pubkey,
    pub rwa_mint: Pubkey,
    pub price: u64,
    pub amount: u64,
}

#[event]
pub struct ListingFilled {
    pub listing: Pubkey,
    pub buyer: Pubkey,
    pub price: u64,
    pub fee: u64,
}

#[event]
pub struct ListingCancelled {
    pub listing: Pubkey,
}

#[error_code]
pub enum MarketplaceError {
    #[msg("Invalid fee")]
    InvalidFee,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Listing inactive")]
    ListingInactive,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
}