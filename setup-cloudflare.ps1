param(
  [string]$ApiToken,
  [string]$AccountId
)

$gh = "$env:TEMP\gh-portable\bin\gh.exe"
if (-not (Test-Path $gh)) { $gh = "gh" }

Write-Host "Cloudflare Workers deploy setup"
Write-Host "Live site: https://roulstone-reed-construction.ashfrancis10.workers.dev/"
Write-Host ""
Write-Host "Get your credentials from the Cloudflare dashboard:"
Write-Host "  1. Log in at https://dash.cloudflare.com"
Write-Host "  2. Account ID: shown in the right sidebar on the Workers page"
Write-Host "  3. API token: Profile > API Tokens > Create Token > Edit Cloudflare Workers"
Write-Host ""

if (-not $ApiToken) {
  $ApiToken = Read-Host "Paste your Cloudflare API token"
}
if (-not $AccountId) {
  $AccountId = Read-Host "Paste your Cloudflare Account ID"
}

Set-Location $PSScriptRoot
& $gh secret set CLOUDFLARE_API_TOKEN --body $ApiToken -R ashfrancis10/roulstone-reed-construction
& $gh secret set CLOUDFLARE_ACCOUNT_ID --body $AccountId -R ashfrancis10/roulstone-reed-construction

Write-Host ""
Write-Host "Done. Editor saves will push to GitHub and auto-deploy to Cloudflare."