use anchor_lang::prelude::*;

#[error_code]
pub enum HookError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid KYC tier")]
    InvalidTier,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Missing required KYC/extra accounts")]
    MissingKycAccounts,
    #[msg("Invalid extra account owner or data")]
    InvalidExtraAccountOwner,
    #[msg("Global pause is active")]
    GlobalPauseActive,
    #[msg("Transfers are disabled for this mint")]
    TransfersDisabled,
    #[msg("Mint mismatch in compliance record")]
    KycMintMismatch,
    #[msg("Wallet mismatch")]
    KycWalletMismatch,
    #[msg("Invalid token account data")]
    InvalidTokenAccount,
    #[msg("Source wallet is not KYC verified")]
    SourceNotKycVerified,
    #[msg("Source wallet sanctions not cleared")]
    SourceSanctionsNotCleared,
    #[msg("Source wallet tier is insufficient")]
    SourceTierInsufficient,
    #[msg("Source KYC has expired")]
    SourceKycExpired,
    #[msg("Destination wallet is not KYC verified")]
    DestinationNotKycVerified,
    #[msg("Destination wallet sanctions not cleared")]
    DestinationSanctionsNotCleared,
    #[msg("Destination wallet tier is insufficient")]
    DestinationTierInsufficient,
    #[msg("Destination KYC has expired")]
    DestinationKycExpired,
}
