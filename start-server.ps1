$port = 8080
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Roulstone Reed site running at http://localhost:$port"
Write-Host "Edit content at http://localhost:$port/admin.html"
Write-Host "Press Ctrl+C to stop."

function Get-AdminPassword {
  $cfgPath = Join-Path $root "admin-config.json"
  if (Test-Path $cfgPath) {
    $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
    return $cfg.password
  }
  return ""
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
      Send-Json $context @{ ok = $true } 200
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