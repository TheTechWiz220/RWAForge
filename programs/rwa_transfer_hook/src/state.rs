use anchor_lang::prelude::*;

/// Global compliance configuration (platform authority, emergency controls).
#[account]
#[derive(InitSpace)]
pub struct HookConfig {
    pub authority: Pubkey,
    pub compliance_officer: Pubkey,
    /// When true, all transfers blocked except allowlisted ops
    pub global_pause: bool,
    pub bump: u8,
}

/// Per-mint compliance policy bound to an RWA Token-2022 mint.
#[account]
#[derive(InitSpace)]
pub struct MintCompliance {
    pub mint: Pubkey,
    pub issuer: Pubkey,
    pub transfers_enabled: bool,
    /// Minimum KYC tier required (0 = basic, 1 = accredited, 2 = qualified)
    pub min_tier: u8,
    pub bump: u8,
}

/// KYC / AML record for a wallet on a specific mint.
#[account]
#[derive(InitSpace)]
pub struct KycRecord {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub verified: bool,
    /// 0 = retail, 1 = accredited, 2 = qualified purchaser
    pub tier: u8,
    /// ISO 3166-1 numeric country code (e.g. 840 = US)
    pub jurisdiction: u16,
    pub verified_at: i64,
    /// 0 = no expiry
    pub expires_at: i64,
    pub sanctions_cleared: bool,
    pub bump: u8,
}

pub mod kyc_tier {
    pub const RETAIL: u8 = 0;
    pub const ACCREDITED: u8 = 1;
    pub const QUALIFIED: u8 = 2;
}
