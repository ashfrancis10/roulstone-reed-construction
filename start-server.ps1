$port = 8080
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Roulstone Reed site running at http://localhost:$port"
Write-Host "Edit content at http://localhost:$port/admin.html"
Write-Host "Press Ctrl+C to stop."

function Get-AdminConfig {
  $cfgPath = Join-Path $root "admin-config.json"
  $default = @{
    password = "password"
    publishToGitHub = $true
    liveSiteUrl = "https://roulstone-reed-construction.ashfrancis10.workers.dev/"
  }
  if (Test-Path $cfgPath) {
    $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
    return @{
      password = if ([string]$cfg.password) { $cfg.password.Trim() } else { $default.password }
      publishToGitHub = if ($null -ne $cfg.publishToGitHub) { [bool]$cfg.publishToGitHub } else { $true }
      liveSiteUrl = if ([string]$cfg.liveSiteUrl) { $cfg.liveSiteUrl.Trim() } else { $default.liveSiteUrl }
    }
  }
  return $default
}

function Get-AdminPassword {
  return (Get-AdminConfig).password
}

function Get-GitExe {
  $git = Join-Path $env:LOCALAPPDATA "Programs\Git\cmd\git.exe"
  if (Test-Path $git) { return $git }
  return "git"
}

function Publish-ToGitHub {
  $git = Get-GitExe
  Push-Location $root
  try {
    & $git add content.json 2>&1 | Out-Null
    if (Test-Path (Join-Path $root "images")) {
      & $git add images/ 2>&1 | Out-Null
    }
    $changes = & $git status --porcelain content.json images/
    if (-not $changes) {
      return @{ published = $false; message = "No GitHub changes to publish" }
    }
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    & $git commit -m "Update site content from editor ($stamp)" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Git commit failed" }
    $push = & $git push origin main 2>&1
    if ($LASTEXITCODE -ne 0) { throw ($push -join " ") }
    return @{ published = $true; message = "Published — live site updates in 1-2 minutes" }
  } finally {
    Pop-Location
  }
}

function Send-Json($context, $obj, $code) {
  $json = $obj | ConvertTo-Json -Depth 20 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $context.Response.StatusCode = $code
  $context.Response.ContentType = "application/json"
  $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $context.Response.Close()
}

function Read-Body($context) {
  $reader = New-Object System.IO.StreamReader($context.Request.InputStream, $context.Request.ContentEncoding)
  $reader.ReadToEnd()
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $path = $context.Request.Url.LocalPath
  $method = $context.Request.HttpMethod

  if ($path -eq "/") { $path = "/index.html" }

  if ($path -eq "/api/health" -and $method -eq "GET") {
    Send-Json $context @{ ok = $true; editor = $true } 200
    continue
  }

  if ($path -eq "/api/content" -and $method -eq "POST") {
    $pw = $context.Request.Headers["X-Admin-Password"]
    if ($pw -ne (Get-AdminPassword)) {
      Send-Json $context @{ error = "Unauthorized" } 401
      continue
    }
    try {
      $body = Read-Body $context
      $parsed = $body | ConvertFrom-Json
      if (-not $parsed.meta) { throw "Invalid content: missing meta section" }
      $formatted = $parsed | ConvertTo-Json -Depth 20
      $outPath = Join-Path $root "content.json"
      [System.IO.File]::WriteAllText($outPath, $formatted, [System.Text.UTF8Encoding]::new($false))
      $response = @{ ok = $true; saved = $true }
      $cfg = Get-AdminConfig
      $response.liveSiteUrl = $cfg.liveSiteUrl
      if ($cfg.publishToGitHub) {
        try {
          $pub = Publish-ToGitHub
          $response.published = [bool]$pub.published
          $response.message = $pub.message
          if ($pub.published) { $response.message += " " + $cfg.liveSiteUrl }
        } catch {
          $response.published = $false
          $response.publishError = $_.Exception.Message
          $response.message = "Saved locally, but GitHub publish failed"
        }
      } else {
        $response.published = $false
        $response.message = "Saved locally"
      }
      Send-Json $context $response 200
    } catch {
      Send-Json $context @{ error = $_.Exception.Message } 500
    }
    continue
  }

  if ($path -eq "/api/upload-image" -and $method -eq "POST") {
    $pw = $context.Request.Headers["X-Admin-Password"]
    if ($pw -ne (Get-AdminPassword)) {
      Send-Json $context @{ error = "Unauthorized" } 401
      continue
    }
    try {
      $body = Read-Body $context | ConvertFrom-Json
      $imagesDir = Join-Path $root "images"
      if (-not (Test-Path $imagesDir)) { New-Item -ItemType Directory -Path $imagesDir | Out-Null }
      $safeName = [System.IO.Path]::GetFileName($body.filename) -replace '[^a-zA-Z0-9._-]', '-'
      if (-not $safeName) { $safeName = "upload.jpg" }
      $filePath = Join-Path $imagesDir $safeName
      $bytes = [Convert]::FromBase64String($body.data)
      [System.IO.File]::WriteAllBytes($filePath, $bytes)
      $webPath = "images/" + $safeName
      Send-Json $context @{ path = $webPath } 200
    } catch {
      Send-Json $context @{ error = $_.Exception.Message } 500
    }
    continue
  }

  $file = Join-Path $root $path.TrimStart("/").Replace("/", "\")
  if (Test-Path $file -PathType Leaf) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $mime = switch ($ext) {
      ".html" { "text/html; charset=utf-8" }
      ".css"  { "text/css; charset=utf-8" }
      ".js"   { "application/javascript; charset=utf-8" }
      ".json" { "application/json; charset=utf-8" }
      ".jpg"  { "image/jpeg" }
      ".jpeg" { "image/jpeg" }
      ".png"  { "image/png" }
      ".webp" { "image/webp" }
      ".svg"  { "image/svg+xml" }
      default { "application/octet-stream" }
    }
    $context.Response.ContentType = $mime
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $context.Response.StatusCode = 404
  }
  $context.Response.Close()
}