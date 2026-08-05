<#
.SYNOPSIS
  Puts the production build behind a public Cloudflare quick tunnel.

.DESCRIPTION
  A demo link without an account anywhere: no card, no SMS, and reachable from
  Iran without a VPN — which is what pushed this over Vercel and Render.

  The site must have been built with NEXT_PUBLIC_SITE_URL empty. Absolute URLs
  then come from the x-forwarded-* headers cloudflared sends, so a new tunnel
  address works without rebuilding. Building with a value baked in would pin
  the bundle to whatever address that run happened to get.

  The tunnel lives as long as this window: closing it, sleeping, or losing the
  network ends the demo, and the next run hands out a different address.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/demo-tunnel.ps1
#>

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$bin = Join-Path $root ".cloudflared"
$exe = Join-Path $bin "cloudflared.exe"
$port = 3000

if (-not (Test-Path $bin)) { New-Item -ItemType Directory -Path $bin | Out-Null }

if (-not (Test-Path $exe)) {
  Write-Host "Downloading cloudflared…" -ForegroundColor Cyan
  Invoke-WebRequest `
    -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" `
    -OutFile $exe -TimeoutSec 600 -UseBasicParsing
}

# The local cluster holds the catalog; `npm start` only fails later without it.
Write-Host "Checking Postgres…" -ForegroundColor Cyan
& npm run --silent db:start | Out-Null

if (-not (Test-Path (Join-Path $root ".next"))) {
  Write-Host "No build found — running next build…" -ForegroundColor Cyan
  $env:NEXT_PUBLIC_SITE_URL = ""
  & npm run build
}

$listening = Test-NetConnection -ComputerName "127.0.0.1" -Port $port -WarningAction SilentlyContinue

<#
  A `next dev` already on this port would be tunnelled instead of the build,
  and the failure is quiet: dev answers /_next/* with 403 unless the requesting
  Origin is in `allowedDevOrigins`, which no tunnel address ever is. Tools that
  omit a Referer still see 200, so the tunnel looks healthy while every real
  browser gets HTML with no CSS and no JS. Refuse rather than serve that.
#>
if ($listening.TcpTestSucceeded) {
  try {
    $probe = (Invoke-WebRequest "http://localhost:$port/" -TimeoutSec 15 -UseBasicParsing).Content
    if ($probe -match "hmr-client|next-devtools") {
      Write-Host "Port $port is running a dev server, which cannot be tunnelled." -ForegroundColor Red
      Write-Host "Stop it (Ctrl+C in that window) and run this script again." -ForegroundColor Red
      exit 1
    }
  } catch {
    Write-Host "Port $port is occupied but not answering — free it and retry." -ForegroundColor Red
    exit 1
  }
}

if (-not $listening.TcpTestSucceeded) {
  Write-Host "Starting the app on port $port…" -ForegroundColor Cyan
  $log = Join-Path $bin "next.log"
  Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm start > `"$log`" 2>&1" `
    -WorkingDirectory $root -WindowStyle Hidden

  $ready = $false
  foreach ($attempt in 1..30) {
    Start-Sleep -Seconds 2
    try {
      Invoke-WebRequest "http://localhost:$port/" -TimeoutSec 10 -UseBasicParsing | Out-Null
      $ready = $true
      break
    } catch { }
  }
  if (-not $ready) {
    Write-Host "The app did not come up. Last lines of $log :" -ForegroundColor Red
    Get-Content $log -Tail 20
    exit 1
  }
} else {
  Write-Host "Port $port already serving — reusing it." -ForegroundColor DarkGray
}

Write-Host "Opening the tunnel…" -ForegroundColor Cyan
$tunnelLog = Join-Path $bin "tunnel.log"
if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force }

# --protocol http2 keeps the edge connection on TCP. The QUIC default rides on
# UDP 7844, which a VPN tends to drop or reorder; that shows up as a stream of
# "datagram handler" and "control stream" errors and a link that dies minutes
# after it was handed out.
$tunnel = Start-Process -FilePath $exe `
  -ArgumentList "tunnel --url http://localhost:$port --protocol http2 --no-autoupdate" `
  -RedirectStandardError $tunnelLog `
  -RedirectStandardOutput (Join-Path $bin "tunnel.out") `
  -WindowStyle Hidden -PassThru

$url = $null
foreach ($attempt in 1..40) {
  Start-Sleep -Seconds 3
  if (Test-Path $tunnelLog) {
    $match = Select-String -Path $tunnelLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($match) { $url = $match.Matches[0].Value; break }
  }
}

if (-not $url) {
  Write-Host "The tunnel did not report an address. Last lines of $tunnelLog :" -ForegroundColor Red
  Get-Content $tunnelLog -Tail 20
  exit 1
}

Write-Host ""
Write-Host "  $url" -ForegroundColor Green
Write-Host ""
Write-Host "  admin    → admin@esmnadareh.com / Admin!2345" -ForegroundColor DarkGray
Write-Host "  customer → customer@esmnadareh.com / Customer!2345" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Leave this window open. Ctrl+C ends the demo." -ForegroundColor Yellow

try {
  Wait-Process -Id $tunnel.Id
} finally {
  if (-not $tunnel.HasExited) { Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue }
}
