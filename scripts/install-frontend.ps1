$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\..\frontend"

Write-Host "Removing old node_modules (may take a few minutes on Windows)..."
if (Test-Path node_modules) {
  cmd /c "rmdir /s /q node_modules"
}
if (Test-Path package-lock.json) {
  Remove-Item -Force package-lock.json
}

Write-Host "Installing dependencies..."
npm install

if ($LASTEXITCODE -eq 0) {
  Write-Host "Done. Run: npm run dev"
} else {
  Write-Host "Install failed. Retry on a stable network or run: npm install --registry https://registry.npmjs.org"
  exit $LASTEXITCODE
}
