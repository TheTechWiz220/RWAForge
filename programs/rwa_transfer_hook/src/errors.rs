use anchor_lang::prelude::*;

#[error_code]
pub enum HookError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Global compliance pause is active")]
    GlobalPauseActive,
    #[msg("Transfers disabled for this mint")]
    TransfersDisabled,
    #[msg("Invalid transfer amount")]
    InvalidAmount,
    #[msg("Source wallet not KYC verified")]
    SourceNotKycVerified,
    #[msg("Destination wallet not KYC verified")]
    DestinationNotKycVerified,
    #[msg("Source KYC record expired")]
    SourceKycExpired,
    #[msg("Destination KYC record expired")]
    DestinationKycExpired,
    #[msg("Source failed sanctions screening")]
    SourceSanctionsNotCleared,
    #[msg("Destination failed sanctions screening")]
    DestinationSanctionsNotCleared,
    #[msg("Source KYC tier below mint minimum")]
    SourceTierInsufficient,
    #[msg("Destination KYC tier below mint minimum")]
    DestinationTierInsufficient,
    #[msg("KYC record mint mismatch")]
    KycMintMismatch,
    #[msg("KYC record wallet mismatch")]
    KycWalletMismatch,
    #[msg("Missing extra account: KYC records")]
    MissingKycAccounts,
    #[msg("Invalid extra account owner")]
    InvalidExtraAccountOwner,
    #[msg("Invalid KYC tier")]
    InvalidTier,
    #[msg("Mint compliance already initialized")]
    MintComplianceAlreadyInit,
}
