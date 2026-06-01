$ErrorActionPreference = "Stop"
$Cluster = if ($args[0]) { $args[0] } else { "devnet" }

Write-Host "Deploying RWAForge programs to $Cluster..."

solana config set --url "https://api.$Cluster.solana.com"
anchor build
anchor deploy --provider.cluster $Cluster

Write-Host ""
Write-Host "Program IDs:"
anchor keys list

Write-Host ""
Write-Host "Update IDs in Anchor.toml and frontend/.env.local"
