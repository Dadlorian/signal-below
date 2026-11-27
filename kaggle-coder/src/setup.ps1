# One-time setup for the AI helper. Double-click setup.cmd (start.cmd runs it for you the first time).
# Installs only: Git, VS Code, Python (via winget, for your user only), Kaggle's tool, and the Cline extension.
# It never asks for an admin password. If Windows asks for one, say no and ask Corey.
$ErrorActionPreference = 'Stop'
$home2 = Join-Path $env:USERPROFILE '.kaggle-coder'
$venv = Join-Path $home2 'venv'
$kaggle = Join-Path $venv 'Scripts\kaggle.exe'
function Say($t) { Write-Host "`n$t" -ForegroundColor Cyan }
function Stop-Here($t) { Write-Host "`nSTOP: $t" -ForegroundColor Red; exit 1 }
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }

Say "Setup (about 5 minutes the first time). Nothing here needs your password."
Refresh-Path

# 1. Programs. Versions are the ones Corey chose.
$wanted = @(
    @{ cmd = 'git';    id = 'Git.Git';                       version = '2.56.1' },
    @{ cmd = 'code';   id = 'Microsoft.VisualStudioCode';    version = '1.146.0' },
    @{ cmd = 'python'; id = 'Python.Python.3.13';            version = $null } )
foreach ($w in $wanted) {
    $found = Get-Command $w.cmd -ErrorAction SilentlyContinue
    if ($w.cmd -eq 'python' -and $found -and $found.Source -like '*WindowsApps*') { $found = $null }   # the Store stub is not Python
    if ($found) { Write-Host "ok: $($w.cmd) is already installed"; continue }
    Say "Installing $($w.id) ..."
    $args2 = @('install', '--id', $w.id, '-e', '--scope', 'user', '--accept-package-agreements', '--accept-source-agreements')
    if ($w.version) { $args2 += @('--version', $w.version) }
    & winget @args2
    Refresh-Path
    if (-not (Get-Command $w.cmd -ErrorAction SilentlyContinue)) { Stop-Here "$($w.id) did not install. Send Corey the last red line." }
}

# 2. Kaggle's tool in its own folder
if (-not (Test-Path -LiteralPath $kaggle)) {
    Say "Setting up Kaggle's tool ..."
    $py = $null
    foreach ($c in 'python', 'py') {
        $cmd = Get-Command $c -ErrorAction SilentlyContinue
        if ($cmd -and $cmd.Source -notlike '*WindowsApps*') { $py = $cmd.Source; break }
    }
    if (-not $py) { Stop-Here "Python was not found. Close this window, double-click setup.cmd again." }
    New-Item -ItemType Directory -Force $home2 | Out-Null
    & $py -m venv $venv
    & (Join-Path $venv 'Scripts\python.exe') -m pip install --quiet kaggle==2.2.5 six==1.17.0   # kaggle 2.2.5 needs six but does not install it
    if ($LASTEXITCODE -or -not (Test-Path -LiteralPath $kaggle)) { Stop-Here "Kaggle's tool did not install." }
}

# 3. Your Kaggle token (hidden). Checked by asking Kaggle for your GPU hours.
$tokenDir = Join-Path $env:USERPROFILE '.kaggle'
$tokenFile = Join-Path $tokenDir 'access_token'
function Test-Login { $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'; $t = (& $kaggle quota 2>&1 | ForEach-Object { "$_" }) -join "`n"; $ErrorActionPreference = $old; return @{ ok = ($LASTEXITCODE -eq 0 -and $t -match 'GPU'); text = $t } }
$login = if (Test-Path -LiteralPath $tokenFile) { Test-Login } else { @{ ok = $false } }
$tries = 0
while (-not $login.ok) {
    if ($tries++ -ge 3) { Stop-Here "Kaggle did not accept the token 3 times. Check you are phone-verified, then run setup again." }
    Say "On kaggle.com open Settings > API, make a token, copy it. Never share it."
    $s = Read-Host "Paste your Kaggle token here and press Enter (nothing shows while you paste)" -AsSecureString
    $plain = [Net.NetworkCredential]::new('', $s).Password.Trim()
    if (-not $plain) { Write-Host "Nothing was pasted. Try again."; continue }
    New-Item -ItemType Directory -Force $tokenDir | Out-Null
    [IO.File]::WriteAllText($tokenFile, $plain)
    $login = Test-Login
    if (-not $login.ok) { Write-Host "Kaggle said no. Check you copied the whole token." -ForegroundColor Yellow }
}
Write-Host "ok: Kaggle accepted your token."

# 4. Cline in VS Code
Say "Installing the Cline extension ..."
& code --install-extension saoudrizwan.claude-dev@4.1.26 --force
if ($LASTEXITCODE) { Write-Host "Cline did not install. In VS Code open Extensions and install 'Cline' by hand, or ask Corey." -ForegroundColor Yellow }

Set-Content -LiteralPath (Join-Path $home2 'setup-done.txt') -Value (Get-Date -Format s) -Encoding ASCII
Say "Setup is done."
Write-Host "Next: double-click start.cmd. It checks everything, starts the AI, and tells you when it is ready."
