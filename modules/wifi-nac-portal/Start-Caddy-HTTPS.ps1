$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Caddyfile = Join-Path $ProjectRoot 'Caddyfile'

Write-Host 'Validating Caddyfile...'
caddy validate --config $Caddyfile
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Starting Caddy HTTPS proxy for NAC WiFi Portal...'
Write-Host 'Important: Apache/XAMPP must be listening on 127.0.0.1:8080 before Caddy starts.'
Write-Host 'Open: https://192.168.88.133:8443/nac_wifi_xampp'
Write-Host ''

caddy run --config $Caddyfile
