param(
  [string]$CloudflareApiToken,
  [string]$CloudflareAccountId
)

$gh = "$env:TEMP\gh-portable\bin\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }

Write-Host "Live site editor setup"
Write-Host "Site: https://roulstone-reed-construction.ashfrancis10.workers.dev/admin.html"
Write-Host ""

$githubToken = & $gh auth token 2>$null
if (-not $githubToken) {
  Write-Host "GitHub not logged in. Run: gh auth login"
  exit 1
}

Write-Host "Setting GitHub secret EDITOR_GITHUB_TOKEN..."
& $gh secret set EDITOR_GITHUB_TOKEN --body $githubToken -R ashfrancis10/roulstone-reed-construction

if (-not $CloudflareApiToken) {
  $CloudflareApiToken = Read-Host "Paste your Cloudflare API token (or press Enter to skip)"
}
if (-not $CloudflareAccountId) {
  $CloudflareAccountId = Read-Host "Paste your Cloudflare Account ID (or press Enter to skip)"
}

if ($CloudflareApiToken -and $CloudflareAccountId) {
  & $gh secret set CLOUDFLARE_API_TOKEN --body $CloudflareApiToken -R ashfrancis10/roulstone-reed-construction
  & $gh secret set CLOUDFLARE_ACCOUNT_ID --body $CloudflareAccountId -R ashfrancis10/roulstone-reed-construction
  Write-Host "Cloudflare deploy secrets saved."
}

Write-Host ""
Write-Host "Triggering deploy..."
& $gh workflow run deploy-cloudflare.yml -R ashfrancis10/roulstone-reed-construction

Write-Host ""
Write-Host "Done. Wait 2 minutes, then edit at:"
Write-Host "https://roulstone-reed-construction.ashfrancis10.workers.dev/admin.html"