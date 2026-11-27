# Shows what you need for Cline, then the AI helper's log live. Double-click logs.cmd. Close the window any time: nothing stops.
$dir = Join-Path (Split-Path -Parent $PSScriptRoot) 'run'
$log = Join-Path $dir 'last-run.log'
$card = Join-Path $dir 'cline.txt'
if (Test-Path -LiteralPath $card) {
    Write-Host ""
    Get-Content -LiteralPath $card | ForEach-Object { Write-Host $_ -ForegroundColor Green }
    Write-Host "  (Keep this window private: it shows your key. Select a line and press Enter to copy it.)" -ForegroundColor DarkGray
}
else { Write-Host "`nNo run yet. Cline's settings appear here when the AI is READY." -ForegroundColor Yellow }
Write-Host "`nLive log of your AI helper (key and address are hidden in it). Close this window any time." -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $log)) {
    Write-Host "No log yet. It appears as soon as you double-click start.cmd. Waiting..." -ForegroundColor Yellow
    while (-not (Test-Path -LiteralPath $log)) { Start-Sleep -Seconds 2 }
}
Get-Content -LiteralPath $log -Wait -Tail 40
