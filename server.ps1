# 诗阵 · 本地测试服务器
# 用法：powershell -ExecutionPolicy Bypass -File server.ps1
# 然后浏览器打开 http://localhost:8765/

$port = 8765
$root = $PSScriptRoot

Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "诗阵本地服务器已启动" -ForegroundColor Green
Write-Host "请在浏览器打开: http://localhost:$port/" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止" -ForegroundColor Yellow
Write-Host ""

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  $path = $request.Url.AbsolutePath
  if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
  $filePath = Join-Path $root ($path.TrimStart("/"))

  if (Test-Path $filePath -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($filePath)
    $mimeType = $mimeTypes[$ext]
    if (-not $mimeType) { $mimeType = "application/octet-stream" }

    $content = [System.IO.File]::ReadAllBytes($filePath)
    $response.ContentType = $mimeType
    $response.ContentLength64 = $content.Length
    $response.OutputStream.Write($content, 0, $content.Length)
    Write-Host "200 $path" -ForegroundColor Green
  } else {
    $response.StatusCode = 404
    Write-Host "404 $path" -ForegroundColor Red
  }

  $response.Close()
}
