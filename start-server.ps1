$port = 8080
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Tiny Villa site running at http://localhost:$port"
Write-Host "Press Ctrl+C to stop."

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $path = $context.Request.Url.LocalPath
  if ($path -eq "/") { $path = "/index.html" }
  $file = Join-Path $root $path.TrimStart("/").Replace("/", "\")
  if (Test-Path $file) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $mime = switch ($ext) {
      ".html" { "text/html" }
      ".css"  { "text/css" }
      ".js"   { "application/javascript" }
      ".webp" { "image/webp" }
      ".png"  { "image/png" }
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