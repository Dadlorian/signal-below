# Starts YOUR AI helper on YOUR Kaggle account, then hands you the two things Cline needs.
# Your key lives in %USERPROFILE%\.kaggle-coder\.env (made on the first run, outside the game folder).
# It is sent inside your PRIVATE Kaggle notebook (and so stays in that notebook's history) because
# Kaggle's command line cannot attach Secrets. It is never printed.
# New key: delete that .env file and run again.  Need the key in Cline again: add  -CopyKey
# Finished? Add  -Stop  to delete the notebook this script made.
# Add  -Status  to see your GPU hours left and your run's state. It starts and changes nothing.
# Kaggle keeps your run waiting? Add  -Web  to run the server in a notebook you start on the website.
# Add  -PrepModel  ONCE (free, no GPU hours) to store the model on Kaggle, so every later start skips the 18 GB download.
# Add  -DryRun  for a free check (no GPU hours) that the stored model is found and how fast it reads.
# Add  -SetFixed  once, to use your own permanent address (see fixed-address\README.md). Optional.
# Add  -Test    on a start to also measure the prompt cache (the first run after setup).
param([switch]$CopyKey, [switch]$Stop, [switch]$Status, [switch]$Web, [switch]$PrepModel, [switch]$DryRun, [switch]$Test, [switch]$SetFixed)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$home2 = Join-Path $env:USERPROFILE '.kaggle-coder'
$venv = Join-Path $home2 'venv'
$kaggle = Join-Path $venv 'Scripts\kaggle.exe'
$userFile = Join-Path $home2 'username.txt'
$addressPattern = 'https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com'   # the key is only ever sent to this kind of address

function Stop-Here($text) { Write-Host "`nSTOP: $text" -ForegroundColor Red; exit 1 }
function Say($text) { Write-Host "`n$text" -ForegroundColor Cyan }

function Install-Rules {
    # Rules that Cline reads, refreshed on every start
    $rulesDest = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Cline\Rules\signal-below.md'
    try {
        New-Item -ItemType Directory -Force (Split-Path -Parent $rulesDest) | Out-Null
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'cline-rules.md') -Destination $rulesDest -Force
    }
    catch { Write-Host "Note: the Cline rules were not installed: $($_.Exception.Message)" -ForegroundColor Yellow }
}

# Your key: read it from .env, or make it the first time
$envFile = Join-Path $home2 '.env'
$keyGiven = Join-Path $home2 'key-given.txt'   # exists once you have pasted the key into Cline
function Read-Key {
    $have = (Test-Path -LiteralPath $envFile) -and ([IO.File]::ReadAllText($envFile) -match '(?m)^CODER_API_KEY=')
    if (-not $have) {
        Remove-Item -LiteralPath $keyGiven -Force -ErrorAction SilentlyContinue
        $bytes = New-Object byte[] 32
        [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
        New-Item -ItemType Directory -Force $home2 | Out-Null
        [IO.File]::AppendAllText($envFile, "CODER_API_KEY=" + (-join ($bytes | ForEach-Object { $_.ToString('x2') })) + "`r`n")
    }
    # Only letters, numbers, - and _ are accepted: the value is written into the server code.
    $found = [regex]::Match([IO.File]::ReadAllText($envFile), '(?m)^CODER_API_KEY=([A-Za-z0-9_-]{32,128})[ \t]*\r?$')
    if (-not $found.Success) { Stop-Here "$envFile needs a line CODER_API_KEY=... of 32 or more letters and numbers. Or delete the file to get a new one." }
    return $found.Groups[1].Value
}

# What the server at this address answers, with or without our key
function Get-Status($url, [bool]$withKey) {
    $headers = @{}
    if ($withKey) { $headers['Authorization'] = "Bearer $key" }
    try { return [int](Invoke-WebRequest -Uri "$url/v1/models" -Headers $headers -UseBasicParsing -TimeoutSec 15).StatusCode }
    catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode } return 0 }
}

# Optional permanent address (a Cloudflare Worker, see fixed-address\README.md). Nothing secret goes to Kaggle.
$fixedOn = $false
function Get-Fixed($text = $null) {
    if ($null -eq $text) { if (-not (Test-Path -LiteralPath $envFile)) { return $null }; $text = [IO.File]::ReadAllText($envFile) }
    $t = $text; $h = @{}
    foreach ($n in 'FIXED_HOST', 'CF_ACCOUNT_ID', 'CF_KV_NAMESPACE_ID', 'CF_KV_TOKEN') {
        $m = [regex]::Match($t, "(?m)^$n=(\S+)[ \t]*\r?$"); if ($m.Success) { $h[$n] = $m.Groups[1].Value }
    }
    if (-not $h.FIXED_HOST) { return $null }   # not set up: the normal case, say nothing
    if ($h.FIXED_HOST -match '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$' -and $h.CF_ACCOUNT_ID -match '^[0-9a-f]{32}$' -and
        $h.CF_KV_NAMESPACE_ID -match '^[0-9a-f]{32}$' -and $h.CF_KV_TOKEN -match '^[A-Za-z0-9_-]{20,100}$') { return $h }
    Write-Host "Note: the FIXED_HOST lines in .env are incomplete, so the temporary address is used." -ForegroundColor Yellow
    return $null
}
# $value $null clears the stored address. Returns $true when Cloudflare accepted it.
function Set-Upstream($fx, $value) {
    $uri = "https://api.cloudflare.com/client/v4/accounts/$($fx.CF_ACCOUNT_ID)/storage/kv/namespaces/$($fx.CF_KV_NAMESPACE_ID)/values/upstream"
    $headers = @{ Authorization = "Bearer $($fx.CF_KV_TOKEN)" }
    try {
        if ($null -eq $value) { Invoke-RestMethod -Method Delete -Uri $uri -Headers $headers -TimeoutSec 20 | Out-Null }
        else { Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body $value -ContentType 'text/plain' -TimeoutSec 20 | Out-Null }
        return $true
    }
    catch { Write-Host "Cloudflare did not accept the update: $($_.Exception.Message.Replace($fx.CF_KV_TOKEN, '[token]'))" -ForegroundColor Yellow; return $false }
}

function Send-ToCline($base) {
    $baseGiven = Join-Path $home2 'base-given.txt'
    if ($script:fixedOn -and (Test-Path -LiteralPath $baseGiven) -and (@(Get-Content -LiteralPath $baseGiven)[0] -eq $base)) {
        Say "READY."
        Write-Host "Your fixed address is already in Cline. Ask Cline something."
        return
    }
    Say "READY."
    if ($CopyKey -or -not (Test-Path -LiteralPath $keyGiven)) {
        Set-Clipboard -Value $key
        # A stray extra Enter (from pasting the address) must not skip this step.
        try { $Host.UI.RawUI.FlushInputBuffer() } catch {}
        do { $done = Read-Host "Your key is on the clipboard. Paste it into Cline's API Key box, then type y here and press Enter" } until ($done -eq 'y')
        Set-Content -LiteralPath $keyGiven -Value 'yes' -Encoding ASCII
    }
    Set-Clipboard -Value "$base/v1"
    Write-Host "The address is on the clipboard. Paste it into Cline's Base URL box."
    Read-Host "Pasted? Press Enter (this clears the clipboard)" | Out-Null
    if ($script:fixedOn) { Set-Content -LiteralPath $baseGiven -Value $base -Encoding ASCII }
    Set-Clipboard -Value ' '
    Write-Host "Now ask Cline something small. Remember to run stop.cmd when you finish."
}

if ($Web) {
    Install-Rules
    $key = Read-Key
    $code = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'server.py'))
    $cellText = ("import os`nos.environ['KC_SESSION_KEY'] = '$key'`nos.environ['KC_IDLE_MINUTES'] = '30'`nos.environ.pop('KC_NOT_AFTER', None)  # left over from an upload run`n" + $code)
    # A notebook file to import on Kaggle, so nothing depends on the clipboard. It holds your key.
    $nbFile = Join-Path $home2 'kaggle-helper.ipynb'
    $lines = @(($cellText -replace "`r", '') -split "`n")
    $source = @(for ($i = 0; $i -lt $lines.Count; $i++) { if ($i -lt $lines.Count - 1) { $lines[$i] + "`n" } else { $lines[$i] } })
    $nb = [ordered]@{
        cells = @([ordered]@{ cell_type = 'code'; execution_count = $null; metadata = @{}; outputs = @(); source = $source })
        metadata = @{ kernelspec = @{ name = 'python3'; display_name = 'Python 3'; language = 'python' }; language_info = @{ name = 'python' } }
        nbformat = 4; nbformat_minor = 4 }
    [IO.File]::WriteAllText($nbFile, ($nb | ConvertTo-Json -Depth 8 -Compress))
    Set-Clipboard -Value $nbFile
    Say "1. Your notebook file is ready (its location is on your clipboard):"
    Write-Host "   $nbFile"
    Write-Host "   It contains your key: never share the file, and keep the notebook PRIVATE."
    Write-Host "   On kaggle.com: New Notebook > File > Import Notebook > choose that file."
    Write-Host "   Then set Accelerator GPU T4 x2 and Internet on, and run the cell. If it waits for a GPU, let it."
    Write-Host "2. Wait for the line  Address: https://....trycloudflare.com  (the model download comes first)."
    $base = $null
    while (-not $base) {
        $typed = Read-Host "3. Paste that Address line here (or q to quit)"
        if ($typed -eq 'q') { Stop-Here "stopped. Turn the Kaggle session OFF with its power button." }
        $m = [regex]::Match([string]$typed, $addressPattern)
        if (-not $m.Success) { Write-Host "That has no trycloudflare.com address in it. Try again."; continue }
        $without = Get-Status $m.Value $false
        if ($without -eq 0 -or $without -ge 500) { Write-Host "The address is not ready yet (answer $without). Wait 30 seconds, then paste it again. Your key was not sent."; continue }
        if ($without -ne 401) { Write-Host "Not accepted: without your key it answered $without (it must refuse with 401). Your key was not sent."; continue }
        $with = Get-Status $m.Value $true
        if ($with -ne 200) { Write-Host "Not accepted: with your key it answered $with. Is this the notebook you just ran?"; continue }
        $base = $m.Value
    }
    Send-ToCline $base
    Write-Host "`nIMPORTANT: on the website, the GPU keeps counting until YOU turn the session off"
    Write-Host "(power button, or Active Events), even after the server stops itself."
    exit 0
}

# 1. The Kaggle tool is installed by setup.cmd
if (-not (Test-Path -LiteralPath $kaggle)) { Stop-Here "setup has not run yet. Double-click setup.cmd (in the kaggle-coder folder) first." }

function Invoke-Kaggle([string[]]$arguments) {
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    $text = (& $kaggle @arguments 2>&1 | ForEach-Object { "$_" }) -join "`n"
    $ErrorActionPreference = $old
    return [pscustomobject]@{ Code = $LASTEXITCODE; Text = $text }
}

# 2. Who you are on Kaggle (asked once if the tool does not say)
$user = $null
if (Test-Path -LiteralPath $userFile) { $user = (Get-Content -LiteralPath $userFile -Raw).Trim() }
if (-not $user) {
    $m = [regex]::Match((Invoke-Kaggle @('config', 'view')).Text, '(?m)username\s*[:=]\s*([A-Za-z0-9_-]+)')
    if ($m.Success -and $m.Groups[1].Value -ne 'None') { $user = $m.Groups[1].Value }
    else { $user = (Read-Host "Your Kaggle username (from your profile address, kaggle.com/<name>)").Trim() }
    if ($user -notmatch '^[A-Za-z0-9_-]+$') { Stop-Here "that is not a Kaggle username." }
    New-Item -ItemType Directory -Force $home2 | Out-Null
    Set-Content -LiteralPath $userFile -Value $user -Encoding ASCII
}
$notebook = "$user/kaggle-coder"
$page = "https://www.kaggle.com/code/$notebook"
$startWithinMinutes = 20   # not started by then: the notebook is deleted (and a late run quits at once)
$marker = Join-Path $home2 'pushed.txt'   # written after our own push: only then may we delete

function Test-Mine { return (Test-Path -LiteralPath $marker) -and (@(Get-Content -LiteralPath $marker)[0] -eq $notebook) }
function Get-RunState {
    $m = [regex]::Match((Invoke-Kaggle @('kernels', 'status', $notebook)).Text, 'has status "(?:KernelWorkerStatus\.)?(\w+)"')
    return $m.Groups[1].Value.ToUpper()
}
# Only ever called after Test-Mine said yes.
function Remove-Notebook {
    Say "Deleting your Kaggle notebook $notebook. Please wait, and do not press Ctrl+C..."
    $delete = Invoke-Kaggle @('kernels', 'delete', $notebook, '-y')
    Write-Host $delete.Text
    $check = (Invoke-Kaggle @('kernels', 'status', $notebook)).Text
    # Kaggle can say "Cannot access" for a bad sign-in too, so the delete itself must also have worked.
    $script:deleted = $delete.Code -eq 0 -and $check -match '(?i)cannot access kernel|not found|404'
    if ($script:deleted) {
        Remove-Item -LiteralPath $marker -Force
        Say "Deleted. Checked: Kaggle no longer shows the notebook."
    }
    else { Write-Host "COULD NOT CONFIRM the delete. Look at $page and delete it there." -ForegroundColor Red }
    $fx = Get-Fixed
    if ($fx) { [void](Set-Upstream $fx $null) }   # the permanent address stops pointing at this run
    Write-Host "Not proven: deleting may not end a session that is already running."
    Write-Host "Check Active Events on kaggle.com and stop anything listed there."
}

function Show-Quota {
    $quota = Invoke-Kaggle @('quota')
    $q = [regex]::Match($quota.Text, '(?m)^GPU\s+([\d.]+)h\s+([\d.]+)h\s+([\d.]+)h')
    if ($quota.Code -eq 0 -and $q.Success) { Write-Host ("GPU hours left this week: {0} of {1}. A run is about 0.1 to 2 hours." -f $q.Groups[2].Value, $q.Groups[3].Value) }
    else { Write-Host "Could not read your Kaggle hours. See kaggle.com/settings" }
}

if ($Status) {
    Say "Your Kaggle hours this week:"
    Show-Quota
    $reply = (Invoke-Kaggle @('kernels', 'status', $notebook)).Text
    $m = [regex]::Match($reply, 'has status "(?:KernelWorkerStatus\.)?(\w+)"')
    $state = $m.Groups[1].Value.ToUpper()
    if ($state) { Say "Your helper run: $state"; Write-Host $reply }
    else { Say "No helper run found (or Kaggle sign-in failed)." }
    if (($state -eq 'QUEUED' -or $state -eq 'RUNNING') -and (Test-Mine)) {
        $minutes = ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() - [long]@(Get-Content -LiteralPath $marker)[1]) / 60
        Write-Host ("Sent {0:N0} minutes ago. This script asks for GPU T4 x2." -f $minutes)
    }
    Write-Host "QUEUED = waiting for a Kaggle machine.  RUNNING = started (the model may still be downloading)."
    Write-Host "This cannot list other running sessions: check Active Events on kaggle.com."
    exit 0
}

if ($Stop) {
    if (-not (Test-Mine)) { Stop-Here "this script has no record of making $notebook, so it deletes nothing. If you see it, handle it at $page and check Active Events on kaggle.com." }
    if ((Read-Host "Delete $notebook from Kaggle? Type y") -ne 'y') { Stop-Here "nothing was deleted." }
    Remove-Notebook
    if ($deleted) { exit 0 } else { exit 1 }
}

# A free CPU run on Kaggle (no GPU hours). $mode goes to server.py.
function Invoke-CpuRun([string]$slug, [string]$envLines, [string[]]$sources, [int]$timeoutSeconds, [int]$giveUpMinutes) {
    $work = Join-Path ([IO.Path]::GetTempPath()) ("kc-cpu-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force $work | Out-Null
    try {
        [IO.File]::WriteAllText((Join-Path $work 'server.py'), ("import os`n$envLines`n" + [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'server.py'))))
        $meta = [ordered]@{ id = $slug; title = ($slug -split '/')[1]; code_file = 'server.py'; language = 'python'
            kernel_type = 'script'; is_private = $true; enable_gpu = $false; enable_internet = $true
            dataset_sources = @(); competition_sources = @(); kernel_sources = @($sources); model_sources = @() }
        [IO.File]::WriteAllText((Join-Path $work 'kernel-metadata.json'), ($meta | ConvertTo-Json))
        $push = Invoke-Kaggle @('kernels', 'push', '-p', $work, '-t', "$timeoutSeconds")
        Write-Host $push.Text
        if ($push.Code -ne 0) { Stop-Here "Kaggle did not accept it." }
    }
    finally { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
    $t0 = Get-Date
    while ($true) {
        Start-Sleep -Seconds 20
        $text = (Invoke-Kaggle @('kernels', 'status', $slug)).Text
        $st = [regex]::Match($text, 'has status "(?:KernelWorkerStatus\.)?(\w+)"').Groups[1].Value.ToUpper()
        Write-Host ("[{0:mm\:ss}] {1}: {2}" -f ((Get-Date) - $t0), ($slug -split '/')[1], $st)
        if ($st -eq 'COMPLETE') { return }
        if ($st -eq 'ERROR' -or $st -like 'CANCEL*') { Stop-Here "that run failed. Look at https://www.kaggle.com/code/$slug" }
        if (((Get-Date) - $t0).TotalMinutes -gt $giveUpMinutes) { Stop-Here "took too long. Look at https://www.kaggle.com/code/$slug" }
    }
}
$modelSlug = "$user/kaggle-coder-model"
$binSlug = "$user/kaggle-coder-bin"
$modelFile = Join-Path $home2 'model-stored.txt'
$binFile = Join-Path $home2 'bin-stored.txt'
function Get-Stored { return @(@($modelFile, $binFile) | Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object { (Get-Content -LiteralPath $_)[0] }) }

if ($SetFixed) {
    Say "Permanent address (optional). Do the dashboard steps in fixed-address\README.md first."
    $hostName = (Read-Host "Address, for example kaggle.gamelab.link (Enter to cancel)").Trim().ToLower()
    if (-not $hostName) { Stop-Here "cancelled. Nothing was saved." }
    $acct = (Read-Host "Cloudflare Account ID").Trim()
    $ns = (Read-Host "KV Namespace ID").Trim()
    $tok = [Net.NetworkCredential]::new('', (Read-Host "Cloudflare token (hidden)" -AsSecureString)).Password.Trim()
    $old = if (Test-Path -LiteralPath $envFile) { [IO.File]::ReadAllText($envFile) } else { '' }
    $kept = (($old -split "\r?\n") | Where-Object { $_ -and $_ -notmatch '^(FIXED_HOST|CF_ACCOUNT_ID|CF_KV_NAMESPACE_ID|CF_KV_TOKEN)=' }) -join "`r`n"
    $new = ($(if ($kept) { $kept + "`r`n" } else { '' })) + "FIXED_HOST=$hostName`r`nCF_ACCOUNT_ID=$acct`r`nCF_KV_NAMESPACE_ID=$ns`r`nCF_KV_TOKEN=$tok`r`n"
    $fx = Get-Fixed $new
    if (-not $fx) { Stop-Here "those values do not look right, so nothing was saved." }
    New-Item -ItemType Directory -Force $home2 | Out-Null
    [IO.File]::WriteAllText($envFile, $new)
    if (-not (Set-Upstream $fx $null)) { Stop-Here "Cloudflare refused the token. Check it has Workers KV Storage: Edit." }
    Start-Sleep -Seconds 3
    $code = Get-Status "https://$hostName" $false
    if ($code -eq 503) { Say "Works: $hostName answers 'the AI is not running'. start.cmd will use it from now on." }
    else { Write-Host "The address answered $code (expected 503). Check the Worker, its KV binding named KC, and the custom domain. start.cmd will fall back to the temporary address until it works." -ForegroundColor Yellow }
    exit 0
}

function Invoke-DryRun {
    $src = Get-Stored
    if (-not $src) { Stop-Here "nothing is stored yet. Run start.cmd -PrepModel first." }
    Say "Free check (no GPU hours): can a Kaggle notebook see the stored model, and how fast does it read?"
    $slug = "$user/kaggle-coder-dryrun"
    Invoke-CpuRun $slug "os.environ['KC_DRYRUN'] = '1'" $src 1800 20
    $log = (Invoke-Kaggle @('kernels', 'logs', $slug)).Text
    foreach ($m in [regex]::Matches($log, '(\[kaggle-coder\][^\\"\r\n]*)')) { Write-Host $m.Value }
    [void](Invoke-Kaggle @('kernels', 'delete', $slug, '-y'))
}

if ($PrepModel) {
    Say "One-time: storing the AI on your private Kaggle account. These are CPU runs: they use NO GPU hours."
    Write-Host "Step 1 of 2 takes about 5 minutes, step 2 about 10 to 30. You can do something else meanwhile."
    Invoke-CpuRun $binSlug "os.environ['KC_PREP'] = 'bin'" @() 3600 30
    $files = (Invoke-Kaggle @('kernels', 'files', $binSlug)).Text
    if ($files -notmatch 'llama\.tar\.gz' -or $files -notmatch 'cloudflared') { Stop-Here "the program files were not saved. Look at https://www.kaggle.com/code/$binSlug" }
    Set-Content -LiteralPath $binFile -Value $binSlug -Encoding ASCII
    Write-Host "Step 1 done: the programs are stored."
    Invoke-CpuRun $modelSlug "os.environ['KC_PREP'] = 'model'" @() 7200 90
    $files = (Invoke-Kaggle @('kernels', 'files', $modelSlug)).Text
    $g = [regex]::Match($files, '(\S+\.gguf)\s+(\d+)')
    if (-not $g.Success -or $g.Groups[2].Value -ne '18556689568') {
        Stop-Here "the model was not saved at the right size (Kaggle's output limit may be too small). Tell Corey. Starts still work: they just download it each time."
    }
    Set-Content -LiteralPath $modelFile -Value $modelSlug -Encoding ASCII
    Say "Stored (18556689568 bytes, checked). Now a free check that Kaggle can use it..."
    Invoke-DryRun
    Say "All set. Double-click start.cmd."
    exit 0
}

if ($DryRun) { Invoke-DryRun; exit 0 }

Install-Rules

# 3. Your key
$key = Read-Key

# 4. Push the server to your private notebook, unless a run is already waiting or running
#    (a second one would only use more of your weekly GPU time)
$before = Get-RunState
if ($before -eq 'QUEUED' -or $before -eq 'RUNNING') {
    Say "A run is already queued or running, so nothing new is sent. Connecting to it..."
}
else {
    Say "Your Kaggle hours this week:"
    Show-Quota
    $work = Join-Path ([IO.Path]::GetTempPath()) ("kc-push-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force $work | Out-Null
    try {
        $notAfter = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + [int](60 * $startWithinMinutes)
        $header = "import os`nos.environ['KC_SESSION_KEY'] = '$key'`nos.environ['KC_NOT_AFTER'] = '$notAfter'`n"
        if ($Test) { $header += "os.environ['KC_CHECK_CACHE'] = '1'`n" }
        $code = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'server.py'))
        [IO.File]::WriteAllText((Join-Path $work 'server.py'), $header + $code)
        $stored = Get-Stored
        if ($stored.Count) { Write-Host "Using your stored model and programs: no big download." }
        else { Write-Host "Tip: run start.cmd -PrepModel once (free), and every start after it gets much faster." }
        $meta = [ordered]@{ id = $notebook; title = 'kaggle-coder'; code_file = 'server.py'; language = 'python'
            kernel_type = 'script'; is_private = $true; enable_gpu = $true; enable_internet = $true
            machine_shape = 'NvidiaTeslaT4'; dataset_sources = @(); competition_sources = @(); kernel_sources = $stored; model_sources = @() }
        [IO.File]::WriteAllText((Join-Path $work 'kernel-metadata.json'), ($meta | ConvertTo-Json))
        Say "Sending the server to your private Kaggle notebook ($notebook)..."
        $push = Invoke-Kaggle @('kernels', 'push', '-p', $work, '--accelerator', 'NvidiaTeslaT4', '-t', '7800')
        Write-Host $push.Text.Replace($key, '[key]')
        if ($push.Code -ne 0 -or $push.Text -match '(?i)push error|401|403|unauthorized|forbidden') {
            Stop-Here "Kaggle did not accept it. Sign-in problem? Make an API token at https://www.kaggle.com/settings/api and save it as $env:USERPROFILE\.kaggle\access_token"
        }
        Set-Content -LiteralPath $marker -Value $notebook, ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()), $notAfter -Encoding ASCII
        Say "Cline settings (set these once):"
        Write-Host "  API Provider:        OpenAI Compatible`n  Model ID:            kaggle-coder`n  Context Window Size: 65536`n  Max Output Tokens:   8192`n  Auto-approve:        off"
    }
    finally { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
}

# 5. Follow the notebook's output until our server's address shows up
Say "Waiting for the server. After Kaggle starts it, the model download can take a long time."
Write-Host "Not started after $startWithinMinutes minutes? The notebook is deleted. To give up, press Ctrl+C (do not just close the window)."
$env:PYTHONUNBUFFERED = '1'
$out = Join-Path ([IO.Path]::GetTempPath()) ("kc-log-" + [guid]::NewGuid().ToString('N'))
# The start limit counts from our push, also when you run this again later.
$secondsLeft = 60 * $startWithinMinutes
if (Test-Mine) { $secondsLeft += [long]@(Get-Content -LiteralPath $marker)[1] - [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() }
$deadline = (Get-Date).AddSeconds($secondsLeft)
$started = $before -eq 'RUNNING'
if ($started) { $deadline = (Get-Date).AddMinutes(45) }
$serverStopped = $false
$failedPolls = 0
# server.py prints "run id <number>" first. With it, an older run's STOPPED line is ignored.
$runId = $null
if ((Test-Mine) -and @(Get-Content -LiteralPath $marker).Count -ge 3) { $runId = @(Get-Content -LiteralPath $marker)[2] }
$base = $null; $follow = $null; $shown = @{}; $nextStatus = Get-Date; $t0 = Get-Date; $phase = 'Sending'
try {
    while (-not $base) {
        if ((Get-Date) -gt $deadline) {
            $state = ''
            if (-not $started) { $state = Get-RunState }
            if ($state -eq 'RUNNING') { $started = $true; $deadline = (Get-Date).AddMinutes(45) }
            elseif ($state -eq 'QUEUED') { Stop-Here "Kaggle did not start your run within $startWithinMinutes minutes." }
            else { Stop-Here "no address in time. Look at $page" }
        }
        if (-not $follow -or $follow.HasExited) {
            $follow = Start-Process -FilePath $kaggle -ArgumentList @('kernels', 'logs', $notebook, '--follow') -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError "$out.err"
        }
        Start-Sleep -Seconds 3
        $log = ''
        foreach ($f in $out, "$out.err") {
            if (Test-Path -LiteralPath $f) {
                $stream = [IO.File]::Open($f, 'Open', 'Read', 'ReadWrite')
                $log += (New-Object IO.StreamReader($stream)).ReadToEnd(); $stream.Close()
            }
        }
        foreach ($m in [regex]::Matches($log, '(\[kaggle-coder\][^\\"\r\n]*)')) {
            if (-not $shown[$m.Value]) { $shown[$m.Value] = $true; Write-Host ($m.Value -replace $addressPattern, '[address]') }
        }
        foreach ($m in [regex]::Matches($log, $addressPattern)) {
            # Refuses without a key AND accepts our key = our own server.
            if ((Get-Status $m.Value $false) -eq 401 -and (Get-Status $m.Value $true) -eq 200) { $base = $m.Value; break }
        }
        if (-not $base) {
            # While QUEUED nothing has run yet, so a STOPPED line then is from an older run.
            $thisRun = $log
            if ($runId) {
                $from = $log.LastIndexOf("run id $runId")
                $thisRun = if ($from -ge 0) { $log.Substring($from) } else { '' }
            }
            if ($thisRun -match 'STOPPED:' -and (Get-RunState) -ne 'QUEUED') {
                $serverStopped = $true
                [IO.File]::WriteAllText((Join-Path $home2 'last-stop.log'), $log.Replace($key, '[key]'))
                Stop-Here "the server stopped. The reason is in the lines above (full log: $home2\last-stop.log)."
            }
            if ((Get-Date) -gt $nextStatus) {
                $nextStatus = (Get-Date).AddSeconds(30)
                $statusText = (Invoke-Kaggle @('kernels', 'status', $notebook)).Text
                $phase = if ($statusText -match 'QUEUED') { 'Waiting for a Kaggle GPU' } elseif ($statusText -match 'RUNNING') { 'Started: loading the model' } else { 'Checking' }
                Write-Host ("[{0:mm\:ss}] {1}" -f ((Get-Date) - $t0), $phase)
                # Two checks in a row, so a status left over from the previous run does not count.
                if ($statusText -match 'has status "(KernelWorkerStatus\.)?(ERROR|CANCEL\w*|COMPLETE)') { $failedPolls++ } else { $failedPolls = 0 }
                if ($failedPolls -ge 2) { Stop-Here "the run ended without giving an address. Look at $page" }
                if (-not $started -and $statusText -match 'has status "(KernelWorkerStatus\.)?RUNNING') {
                    $started = $true   # allow time for the download once it has really started
                    $deadline = (Get-Date).AddMinutes(45)
                }
            }
        }
    }
}
finally {
    # /T also ends the helper's own child processes, which would otherwise keep running.
    # try/catch: "process not found" must never skip the cleanup below.
    if ($follow -and -not $follow.HasExited) { try { & taskkill.exe /PID $follow.Id /T /F 2>&1 | Out-Null } catch {} }
    Remove-Item -LiteralPath $out, "$out.err" -Force -ErrorAction SilentlyContinue
    # Leaving without a server (time limit, STOPPED, Ctrl+C or an error): clean up.
    if (-not $base) {
        if ((Test-Mine) -and ($serverStopped -or (-not $started -and (Get-RunState) -eq 'QUEUED'))) { Remove-Notebook }
        else {
            Write-Host "`nWARNING: Kaggle may STILL be using your GPU hours." -ForegroundColor Red
            Write-Host "Open kaggle.com, look at Active Events, and stop the session (power button)." -ForegroundColor Red
            Write-Host "Also double-click stop.cmd to delete the notebook. Page: $page"
        }
    }
}

# 5b. Optional permanent address: point it at this run, and use it only once it really works
$fx = Get-Fixed
if ($fx) {
    Say "Connecting your permanent address $($fx.FIXED_HOST) ..."
    $fixedUrl = "https://$($fx.FIXED_HOST)"
    if (Set-Upstream $fx $base) {
        for ($i = 0; $i -lt 18 -and -not $fixedOn; $i++) {
            if ((Get-Status $fixedUrl $false) -eq 401 -and (Get-Status $fixedUrl $true) -eq 200) { $fixedOn = $true } else { Start-Sleep -Seconds 5 }
        }
    }
    if ($fixedOn) { $base = $fixedUrl }
    else { Write-Host "The permanent address is not working yet, so the temporary one is used this time." -ForegroundColor Yellow }
}

# 6. Hand Cline what it needs through the clipboard
Send-ToCline $base
Write-Host "`nWhen you finish: double-click stop.cmd (deletes the notebook), then check Active Events on kaggle.com"
Write-Host "and stop anything listed there. (If you forget: it stops itself after 10 idle minutes, and after 3 hours at most.)"
