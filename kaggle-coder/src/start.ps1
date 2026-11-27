# Starts YOUR AI helper on YOUR Kaggle account, then hands Cline what it needs.  (Double-click start.cmd.)
#   start.cmd  -> this script            stop.cmd -> this script with -Stop
#   -SetFixed  -> optional permanent address (see fixed-address\README.md)
# Settings live in kaggle-coder\.env (see .env.example). Every one has a safe default. Everything the tool
# makes (log, state, settings card, the Kaggle tool) goes in kaggle-coder\run\. Both are ignored by git.
# Your key is in that file too. It is sent inside your PRIVATE Kaggle notebook (Kaggle's command line
# cannot attach Secrets) and is never printed. Stopping deletes that notebook.
param([switch]$Stop, [switch]$SetFixed)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$ci = [Globalization.CultureInfo]::InvariantCulture
$root = Split-Path -Parent $PSScriptRoot           # the kaggle-coder folder
$home2 = Join-Path $root 'run'
$kaggle = Join-Path $home2 'venv\Scripts\kaggle.exe'
$envFile = Join-Path $root '.env'
$stateFile = Join-Path $home2 'state.json'
$addressPattern = 'https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com'   # the key is only ever sent to this kind of address
$key = $null

# ---------------------------------------------------------------- small helpers
function Say($text) { Write-Host "`n$text" -ForegroundColor Cyan }
function Stop-Here($text) {
    Write-Host "`nSTOP: $text" -ForegroundColor Red
    Write-Doctor
    exit 1
}
# The ONE log file: the server's progress plus, when something stops, a short summary at the end.
# Never contains your key, token or address. logs.cmd shows it live. Corey can read it as-is.
$runLog = Join-Path $home2 'last-run.log'
$cardFile = Join-Path $home2 'cline.txt'   # what Cline needs for the current run (local only: it holds your key)
function Write-Doctor {
    try {
        $st = Get-State
        $lines = @("", "=== why it stopped (summary for Corey) ===",
            "Windows $([Environment]::OSVersion.Version)  PowerShell $($PSVersionTable.PSVersion)  time $(Get-Date -Format s)",
            "setup done: $(Test-Path -LiteralPath (Join-Path $home2 'setup-done.txt'))  kaggle tool: $(Test-Path -LiteralPath $kaggle)",
            "notebook: $($st.notebook)  pushed: $($st.pushedAt)")
        $text = ($lines -join "`r`n") -replace $addressPattern, '[address]' -replace '[A-Za-z0-9_-]{32,}', '[hidden]'
        New-Item -ItemType Directory -Force $home2 | Out-Null
        Add-Content -LiteralPath $runLog -Value $text -Encoding ASCII
        Write-Host "Details for Corey (no key or address in it): $runLog" -ForegroundColor DarkGray
    }
    catch { }
}
function Invoke-Kaggle([string[]]$arguments) {
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    $text = (& $kaggle @arguments 2>&1 | ForEach-Object { "$_" }) -join "`n"
    $code = $LASTEXITCODE
    $ErrorActionPreference = $old
    return [pscustomobject]@{ Code = $code; Text = $text }
}

# ---------------------------------------------------------------- one state file
function Get-State {
    if (Test-Path -LiteralPath $stateFile) { try { return Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json } catch { } }
    return [pscustomobject]@{ user = $null; notebook = $null; pushedAt = 0; notAfter = 0; keyGiven = $false; baseGiven = $null }
}
function Save-State($st) { New-Item -ItemType Directory -Force $home2 | Out-Null; $st | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding ASCII }

# ---------------------------------------------------------------- settings (.env)
# name = default, kind, low, high. Anything else in the file is ignored with a warning.
$spec = [ordered]@{
    IDLE_MINUTES = @('10', 'int', 5, 60); BLOCK_MINUTES = @('ask', 'block', 0, 120); MAX_HOURS = @('2', 'num', 0.5, 6)
    START_WAIT_MINUTES = @('20', 'int', 5, 60); MODEL = @('A', 'enum', 'A', 'A-small'); CONTEXT_TOKENS = @('65536', 'int', 8192, 131072)
    MAX_OUTPUT_TOKENS = @('8192', 'int', 1024, 32768); SELF_TEST = @('0', 'enum', '0', '1') }
$otherNames = 'CODER_API_KEY', 'FIXED_HOST', 'CF_ACCOUNT_ID', 'CF_KV_NAMESPACE_ID', 'CF_KV_TOKEN'
function Read-Settings {
    $S = @{}; foreach ($n in $spec.Keys) { $S[$n] = $spec[$n][0] }
    if (-not (Test-Path -LiteralPath $envFile)) { return $S }
    $no = 0
    foreach ($raw in [IO.File]::ReadAllLines($envFile)) {
        $no++
        $m = [regex]::Match($raw, '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*(?:#.*)?$')
        if (-not $m.Success -or $raw.TrimStart().StartsWith('#')) { continue }
        $n = $m.Groups[1].Value.ToUpper(); $v = $m.Groups[2].Value.Trim('"', "'")
        if ($otherNames -contains $n) { continue }
        if (-not $spec.Contains($n)) { Write-Host "Note: unknown setting $n on line $no of .env (typo?). Ignored." -ForegroundColor Yellow; continue }
        if ($v -eq '') { continue }
        $k = $spec[$n]; $bad = $false
        switch ($k[1]) {
            'int'   { $bad = -not ($v -match '^\d+$' -and [int]$v -ge $k[2] -and [int]$v -le $k[3]) }
            'num'   { $d = 0.0; $bad = -not ([double]::TryParse($v, 'Float', $ci, [ref]$d) -and $d -ge $k[2] -and $d -le $k[3]) }
            'enum'  { $bad = -not ($v -eq $k[2] -or $v -eq $k[3]) }
            'block' { $bad = -not ($v -eq 'ask' -or ($v -match '^\d+$' -and [int]$v -le $k[3])) }
        }
        if ($bad) { Stop-Here "$n=$v (line $no of $envFile) is not valid. Allowed: $(if ($k[1] -eq 'enum') { "$($k[2]) or $($k[3])" } elseif ($k[1] -eq 'block') { "ask, or 0 to $($k[3])" } else { "$($k[2]) to $($k[3])" }). Default: $($k[0]). Fix it or delete the line." }
        $S[$n] = $v
    }
    if ([int]$S.MAX_OUTPUT_TOKENS -ge [int]$S.CONTEXT_TOKENS) { Stop-Here "MAX_OUTPUT_TOKENS must be smaller than CONTEXT_TOKENS (.env)." }
    return $S
}

function Read-Key {
    $have = (Test-Path -LiteralPath $envFile) -and ([IO.File]::ReadAllText($envFile) -match '(?m)^CODER_API_KEY=')
    if (-not $have) {
        $bytes = New-Object byte[] 32
        [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
        New-Item -ItemType Directory -Force $home2 | Out-Null
        [IO.File]::AppendAllText($envFile, "CODER_API_KEY=" + (-join ($bytes | ForEach-Object { $_.ToString('x2') })) + "`r`n")
        $st = Get-State; $st.keyGiven = $false; Save-State $st
    }
    # Only letters, numbers, - and _ are accepted: the value goes into the notebook's settings.
    $found = [regex]::Match([IO.File]::ReadAllText($envFile), '(?m)^CODER_API_KEY=([A-Za-z0-9_-]{32,128})[ \t]*\r?$')
    if (-not $found.Success) { Stop-Here "$envFile needs a line CODER_API_KEY=... of 32 or more letters and numbers. Or delete that line to get a new key." }
    return $found.Groups[1].Value
}

# ---------------------------------------------------------------- optional permanent address
function Get-Fixed($text = $null) {
    if ($null -eq $text) { if (-not (Test-Path -LiteralPath $envFile)) { return $null }; $text = [IO.File]::ReadAllText($envFile) }
    $h = @{}
    foreach ($n in 'FIXED_HOST', 'CF_ACCOUNT_ID', 'CF_KV_NAMESPACE_ID', 'CF_KV_TOKEN') {
        $m = [regex]::Match($text, "(?m)^$n=(\S+)[ \t]*\r?$"); if ($m.Success) { $h[$n] = $m.Groups[1].Value }
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

# What the server at this address answers, with or without our key
function Get-Status($url, [bool]$withKey) {
    $headers = @{}
    if ($withKey) { $headers['Authorization'] = "Bearer $key" }
    try { return [int](Invoke-WebRequest -Uri "$url/v1/models" -Headers $headers -UseBasicParsing -TimeoutSec 15).StatusCode }
    catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode } return 0 }
}

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
    else { Write-Host "The address answered $code (expected 503). Check the Worker, its KV binding named KC, and the custom domain. start.cmd uses the temporary address until it works." -ForegroundColor Yellow }
    exit 0
}

# ---------------------------------------------------------------- Kaggle
if (-not (Test-Path -LiteralPath $kaggle)) { Stop-Here "setup has not run yet. Double-click setup.cmd (in the kaggle-coder folder) first." }

$state = Get-State
if (-not $state.user) {
    $legacy = Join-Path $home2 'username.txt'
    if (Test-Path -LiteralPath $legacy) { $state.user = @(Get-Content -LiteralPath $legacy)[0].Trim(); Save-State $state }
}
if (-not $state.user) {
    $m = [regex]::Match((Invoke-Kaggle @('config', 'view')).Text, '(?m)username\s*[:=]\s*([A-Za-z0-9_-]+)')
    if ($m.Success -and $m.Groups[1].Value -ne 'None') { $state.user = $m.Groups[1].Value }
    else { $state.user = (Read-Host "Your Kaggle username (from your profile address, kaggle.com/<name>)").Trim() }
    if ($state.user -notmatch '^[A-Za-z0-9_-]+$') { Stop-Here "that is not a Kaggle username." }
    Save-State $state
}
# One notebook name, reused: pushing to an existing name makes a new version (Kaggle CLI docs).
$notebook = "$($state.user)/kaggle-coder"
$page = "https://www.kaggle.com/code/$notebook"

function Test-Mine { $s = Get-State; return ($s.notebook -eq $notebook) -and ([long]$s.pushedAt -gt 0) }
function Get-RunState {
    $script:lastStatusText = (Invoke-Kaggle @('kernels', 'status', $notebook)).Text
    $m = [regex]::Match($script:lastStatusText, 'has status "(?:KernelWorkerStatus\.)?(\w+)"')
    return $m.Groups[1].Value.ToUpper()
}
function Get-GpuHours {
    $q = Invoke-Kaggle @('quota')
    $m = [regex]::Match($q.Text, '(?m)^GPU\s+([\d.]+)h\s+([\d.]+)h\s+([\d.]+)h\s+(\S+)')
    if ($q.Code -ne 0 -or -not $m.Success) { return $null }
    return @{ left = [double]::Parse($m.Groups[2].Value, $ci); total = $m.Groups[3].Value; resets = $m.Groups[4].Value }
}
# Only ever called when Test-Mine says yes. Deletes the notebook, then the permanent address's target.
function Remove-Notebook {
    Say "Deleting your Kaggle notebook $notebook. Please wait, and do not press Ctrl+C..."
    $delete = Invoke-Kaggle @('kernels', 'delete', $notebook, '-y')
    $check = (Invoke-Kaggle @('kernels', 'status', $notebook)).Text
    # Kaggle says "Cannot access" for a bad sign-in too, so the delete itself must also have worked.
    $deleted = $delete.Code -eq 0 -and $check -match '(?i)cannot access kernel|not found|404'
    if ($deleted) { $s = Get-State; $s.notebook = $null; $s.pushedAt = 0; Save-State $s; Say "Deleted. Kaggle no longer shows the notebook." }
    Remove-Item -LiteralPath $cardFile -Force -ErrorAction SilentlyContinue   # the settings belong to a run that is gone
    else { Write-Host "COULD NOT CONFIRM the delete. Look at $page and delete it there." -ForegroundColor Red }
    $fx = Get-Fixed
    if ($fx) { [void](Set-Upstream $fx $null) }   # the permanent address stops pointing at this run
    Write-Host "Not proven: deleting may not end a session that is already running."
    Write-Host "Check Active Events on kaggle.com and stop anything listed there."
    return $deleted
}

if ($Stop) {
    if (-not (Test-Mine)) { Stop-Here "this script has no record of making $notebook, so it deletes nothing. If you see it, handle it at $page and check Active Events on kaggle.com." }
    $ok = Remove-Notebook
    $h = Get-GpuHours; if ($h) { Write-Host "GPU hours left this week: $($h.left) of $($h.total)." }
    if ($ok) { exit 0 } else { exit 1 }
}

# ---------------------------------------------------------------- 1. pre-flight (a few seconds, before anything is sent)
# Only ONE start window at a time: two would both follow the run, both clean up, and fight over the clipboard and log.
$lockFile = Join-Path $home2 'start.lock'
if (Test-Path -LiteralPath $lockFile) {
    $other = 0; [void][int]::TryParse("$(@(Get-Content -LiteralPath $lockFile)[0])", [ref]$other)
    $alive = if ($other -and $other -ne $PID) { Get-Process -Id $other -ErrorAction SilentlyContinue } else { $null }
    if ($alive -and $alive.ProcessName -match 'powershell') {
        Write-Host "`nSTOP: another start window is already open (it is the one showing the progress). Use that one, or close it first." -ForegroundColor Red
        exit 1
    }
}
Set-Content -LiteralPath $lockFile -Value $PID -Encoding ASCII   # a lock left by a closed window is ignored next time

Say "Checking everything first..."
Set-Content -LiteralPath $runLog -Value "[start.cmd] run started $(Get-Date -Format s)" -Encoding ASCII   # a fresh log for this run
try { [void](Invoke-WebRequest -Uri 'https://www.kaggle.com' -UseBasicParsing -TimeoutSec 8) }
catch { if (-not $_.Exception.Response) { Stop-Here "no internet. Connect to Wi-Fi and double-click start.cmd again." } }
$hours = Get-GpuHours
if (-not $hours) {
    Stop-Here "Kaggle did not accept your sign-in. Double-click setup.cmd and paste a new token (kaggle.com > Settings > API)."
}
Write-Host ("GPU hours left this week: {0} of {1}. A session is usually 0.5 to 2." -f $hours.left, $hours.total)
if ($hours.left -lt 1) { Stop-Here "you have less than 1 GPU hour left. They refresh at $($hours.resets). Nothing was started." }
$S = Read-Settings
$key = Read-Key
# Rules that Cline reads, refreshed on every start
try {
    $rulesDest = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Cline\Rules\signal-below.md'
    New-Item -ItemType Directory -Force (Split-Path -Parent $rulesDest) | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'cline-rules.md') -Destination $rulesDest -Force
}
catch { Write-Host "Note: the Cline rules were not installed: $($_.Exception.Message)" -ForegroundColor Yellow }

# ---------------------------------------------------------------- 2. send the server (unless a run is already waiting or running)
$startWithin = [int]$S.START_WAIT_MINUTES
$block = if ($S.BLOCK_MINUTES -eq 'ask') { '0' } else { $S.BLOCK_MINUTES }   # asked below when a NEW run is sent

# Sends the server to Kaggle (a new version of the one notebook) and records it. Used for the first push and for retries.
function Push-Run {
    $notAfter = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + 60 * $startWithin
    $cfg = [ordered]@{ key = $key; idle_minutes = [int]$S.IDLE_MINUTES; block_minutes = [int]$block
        max_hours = [double]::Parse($S.MAX_HOURS, $ci); model = $S.MODEL; context_tokens = [int]$S.CONTEXT_TOKENS
        max_output_tokens = [int]$S.MAX_OUTPUT_TOKENS; self_test = [int]$S.SELF_TEST; not_after = $notAfter }
    $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($cfg | ConvertTo-Json -Compress)))
    $work = Join-Path ([IO.Path]::GetTempPath()) ("kc-push-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force $work | Out-Null
    try {
        $code = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'server.py'))
        [IO.File]::WriteAllText((Join-Path $work 'server.py'), "import os`nos.environ['KC_CONFIG_B64'] = '$b64'`n" + $code)
        $meta = [ordered]@{ id = $notebook; title = ($notebook -split '/')[1]; code_file = 'server.py'; language = 'python'
            kernel_type = 'script'; is_private = $true; enable_gpu = $true; enable_internet = $true
            machine_shape = 'NvidiaTeslaT4'; dataset_sources = @(); competition_sources = @(); kernel_sources = @(); model_sources = @() }
        [IO.File]::WriteAllText((Join-Path $work 'kernel-metadata.json'), ($meta | ConvertTo-Json))
        Say "Sending the server to your private Kaggle notebook ($notebook)..."
        # Written BEFORE the push, so a closed window never leaves a run with no record.
        $state = Get-State; $state.notebook = $notebook; $state.pushedAt = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(); $state.notAfter = $notAfter; Save-State $state
        $limit = [int](3600 * [double]::Parse($S.MAX_HOURS, $ci) + 600)   # Kaggle's own hard stop, a backstop
        $push = Invoke-Kaggle @('kernels', 'push', '-p', $work, '--accelerator', 'NvidiaTeslaT4', '-t', "$limit")
        Write-Host $push.Text.Replace($key, '[key]')
        if ($push.Code -ne 0 -or $push.Text -match '(?i)push error|401|403|unauthorized|forbidden') {
            $state.notebook = $null; $state.pushedAt = 0; Save-State $state
            Stop-Here "Kaggle did not accept it. Sign-in problem? Double-click setup.cmd and paste a new token."
        }
    }
    finally { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue }
}

$before = Get-RunState
if (($before -eq 'QUEUED' -or $before -eq 'RUNNING') -and (Test-Mine)) {
    # A run from earlier. Offer a clean restart: delete it, then start fresh. (Nothing on your laptop is touched.)
    $age = [int](([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() - [long](Get-State).pushedAt) / 60)
    Say "A run is already $($before.ToLower()) (sent $age minutes ago)."
    $choice = Read-Host "Press Enter to keep waiting for it, or type r to stop it and start fresh"
    if ($choice -eq 'r') { [void](Remove-Notebook); Start-Sleep -Seconds 15; $before = '' }
}
if ($before -eq 'QUEUED' -or $before -eq 'RUNNING') {
    Write-Host "Connecting to the run that is already there; nothing new is sent."
}
else {
    if ($S.BLOCK_MINUTES -eq 'ask') {
        $answer = Read-Host "How long will you code? Type 30, 45 or 60 (minutes), or press Enter to stop after $($S.IDLE_MINUTES) quiet minutes"
        $block = if ($answer -match '^(30|45|60)$') { $answer } else { '0' }
    }
    if ([int]$block -gt 0) { Write-Host "Coding block: the AI stays up for $block minutes, then stops after $($S.IDLE_MINUTES) quiet minutes." }
    else { Write-Host "The AI stops by itself after $($S.IDLE_MINUTES) minutes without a question." }
    Push-Run
}

# ---------------------------------------------------------------- 3. wait, with one live status line
Write-Host "Closing this window is safe: the AI stops itself. Run stop.cmd to be sure."
$env:PYTHONUNBUFFERED = '1'
$out = Join-Path ([IO.Path]::GetTempPath()) ("kc-log-" + [guid]::NewGuid().ToString('N'))
$state = Get-State
$runId = if ($state.notAfter) { "$($state.notAfter)" } else { $null }   # server.py prints "run id <number>" first
# Developers report Kaggle sometimes leaves a pushed run QUEUED for good with GPUs free, and that a fresh push then
# starts normally. So: if still queued after $retryMinutes, delete and push again, up to $maxTries times.
$retryMinutes = 4; $maxTries = 3; $tries = 1
$attemptStart = [DateTimeOffset]::FromUnixTimeSeconds([long]$state.pushedAt).LocalDateTime
$queueDeadline = $attemptStart.AddMinutes($retryMinutes)
$script:prevStatusText = ''; $script:lastStatusText = ''
$tooLong = (Get-Date) -gt $attemptStart.AddMinutes($startWithin)   # reconnected to a run that is already older than the limit
$loadLimit = 15; $runningSince = $null
if ($before -eq 'RUNNING') { $runningSince = Get-Date }
$t0 = Get-Date; $lastTick = Get-Date; $nextStatus = Get-Date; $failedPolls = 0
$base = $null; $follow = $null; $shown = @{}; $phase = 'Sending'; $stopped = $false; $written = 0
function Show-Line($text) { Write-Host ("`r[{0:mm\:ss}] {1}" -f ((Get-Date) - $t0), $text).PadRight(110) -NoNewline }
try {
    while (-not $base) {
        $gap = ((Get-Date) - $lastTick).TotalSeconds; $lastTick = Get-Date
        if ($gap -gt 120) { $queueDeadline = $queueDeadline.AddSeconds($gap); $nextStatus = Get-Date }   # the PC slept: do not count that
        if (-not $follow -or $follow.HasExited) {
            $follow = Start-Process -FilePath $kaggle -ArgumentList @('kernels', 'logs', $notebook, '--follow', '--interval', '3') -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError "$out.err"
        }
        Start-Sleep -Seconds 3
        $log = ''
        foreach ($f in $out, "$out.err") {
            if (Test-Path -LiteralPath $f) {
                $stream = [IO.File]::Open($f, 'Open', 'Read', 'ReadWrite')
                $log += (New-Object IO.StreamReader($stream)).ReadToEnd(); $stream.Close()
            }
        }
        # Only this run's lines (an older run's output may still be in the log)
        $thisRun = $log
        if ($runId) { $from = $log.LastIndexOf("run id $runId"); $thisRun = if ($from -ge 0) { $log.Substring($from) } else { '' } }
        # Append only the NEW whole lines, so a live view of the file works (never rewrite it).
        if ($thisRun.Length -lt $written) { $written = 0 }
        $cut = $thisRun.LastIndexOf("`n") + 1
        if ($cut -gt $written) {
            try { Add-Content -LiteralPath $runLog -NoNewline -Encoding ASCII -Value (($thisRun.Substring($written, $cut - $written).Replace($key, '[key]')) -replace $addressPattern, '[address]') } catch { }
            $written = $cut
        }
        foreach ($m in [regex]::Matches($thisRun, '(\[kaggle-coder\][^\\"\r\n]*)')) {
            if (-not $shown[$m.Value] -and $m.Value -notmatch 'GiB of') { $shown[$m.Value] = $true; Write-Host ("`r" + (' ' * 110) + "`r" + ($m.Value -replace $addressPattern, '[address]')) }
        }
        # Which phase are we in?
        if ($thisRun -match 'tunnel address received') { $phase = '4/4 Opening the secure address' }
        elseif ($thisRun -match 'llama-server is healthy') { $phase = '4/4 Checking the AI' }
        elseif ($thisRun -match 'starting llama-server') { $phase = '3/4 Loading the AI onto the GPUs (about 1 to 2 minutes)' }
        elseif ($thisRun -match 'downloading') {
            $g = [regex]::Matches($thisRun, '(\d+) GiB of ([\d.]+) so far'); $gb = if ($g.Count) { "$($g[$g.Count - 1].Groups[1].Value) of $($g[$g.Count - 1].Groups[2].Value) GB" } else { 'starting' }
            $phase = "2/4 Downloading the AI ($gb, about 2 minutes)"
        }
        elseif ($runningSince) { $phase = '2/4 Kaggle started your session' }
        else {
            $left = $queueDeadline - (Get-Date); if ($left.TotalSeconds -lt 0) { $left = [TimeSpan]::Zero }
            $phase = ('1/4 Waiting for a Kaggle GPU (try {0} of {1}). Waited {2:mm\:ss} (usually under 5 min). Tries again in {3:mm\:ss}.' -f $tries, $maxTries, ((Get-Date) - $attemptStart), $left)
        }
        Show-Line $phase
        foreach ($m in [regex]::Matches($thisRun, $addressPattern)) {
            # Refuses without a key AND accepts our key = our own server.
            if ((Get-Status $m.Value $false) -eq 401 -and (Get-Status $m.Value $true) -eq 200) { $base = $m.Value; break }
        }
        if ($base) { break }
        if ($thisRun -match 'STOPPED:') {
            $stopped = $true
            $line = [regex]::Match($thisRun, 'STOPPED:[^\\"\r\n]*').Value
            if (Test-Mine) { [void](Remove-Notebook) }
            Stop-Here "the server stopped: $line"
        }
        if ((Get-Date) -gt $nextStatus) {
            $nextStatus = (Get-Date).AddSeconds(30)
            $st = Get-RunState
            # Whatever Kaggle prints about the run (a failure message would show here) goes in the log when it changes.
            if ($script:lastStatusText -ne $script:prevStatusText) {
                try { Add-Content -LiteralPath $runLog -Encoding ASCII -Value ("[kaggle says " + (Get-Date -Format HH:mm:ss) + "] " + ($script:lastStatusText -replace '\s+', ' ')) } catch { }
                $script:prevStatusText = $script:lastStatusText
            }
            if ($st -eq 'RUNNING' -and -not $runningSince) { $runningSince = Get-Date }
            if ($st -eq 'ERROR' -or $st -like 'CANCEL*' -or $st -eq 'COMPLETE') { $failedPolls++ } else { $failedPolls = 0 }
            if ($failedPolls -ge 2) { if (Test-Mine) { [void](Remove-Notebook) }; Stop-Here "the run ended without giving an address. Look at $page" }
            if (-not $runningSince -and (Get-Date) -gt $queueDeadline) {
                if ($tries -lt $maxTries -and -not $tooLong -and ((Get-Date) - $t0).TotalMinutes -lt $startWithin) {
                    $tries++
                    Write-Host ("`r" + (' ' * 110) + "`rStill queued after $retryMinutes minutes. Trying again (try $tries of $maxTries)...") -ForegroundColor Yellow
                    Add-Content -LiteralPath $runLog -Encoding ASCII -Value "[start.cmd] still queued after $retryMinutes minutes: pushing again (try $tries of $maxTries)"
                    if (Test-Mine) { [void](Remove-Notebook) }
                    Start-Sleep -Seconds 10
                    Push-Run
                    $state = Get-State; $runId = "$($state.notAfter)"
                    $attemptStart = Get-Date; $queueDeadline = $attemptStart.AddMinutes($retryMinutes)
                    if ($follow -and -not $follow.HasExited) { try { & taskkill.exe /PID $follow.Id /T /F 2>&1 | Out-Null } catch {} }
                    $follow = $null; Remove-Item -LiteralPath $out, "$out.err" -Force -ErrorAction SilentlyContinue
                    $written = 0; $shown = @{}; $nextStatus = Get-Date
                }
                else {
                    if (Test-Mine) { [void](Remove-Notebook) }
                    Stop-Here "Kaggle did not start your run after $tries tries (about $([int]((Get-Date) - $t0).TotalMinutes) minutes). Nothing is using your hours. Kaggle has had trouble starting sessions lately: try again later."
                }
            }
            if ($runningSince -and ((Get-Date) - $runningSince).TotalMinutes -gt $loadLimit) {
                if (Test-Mine) { [void](Remove-Notebook) }
                Stop-Here "started but no address after $loadLimit minutes. Check Active Events on kaggle.com and stop any session listed."
            }
        }
    }
}
finally {
    # /T also ends the helper's own child processes, which would otherwise keep running.
    if ($follow -and -not $follow.HasExited) { try { & taskkill.exe /PID $follow.Id /T /F 2>&1 | Out-Null } catch {} }
    Remove-Item -LiteralPath $out, "$out.err" -Force -ErrorAction SilentlyContinue
    if (-not $base -and -not $stopped) {
        Write-Host "`nLeft before it was ready. If a session is running it stops itself after $($S.IDLE_MINUTES) quiet minutes." -ForegroundColor Yellow
        Write-Host "To be sure, double-click stop.cmd, then check Active Events on kaggle.com."
    }
}
Write-Host ""

# ---------------------------------------------------------------- 4. optional permanent address
$fixedOn = $false
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

# ---------------------------------------------------------------- 5. everything Cline needs, in one card
Say "READY after $([int]((Get-Date) - $t0).TotalSeconds) seconds."
$cardLines = @("Cline settings for this run (private: this has your key)", "",
    "  API Provider       OpenAI Compatible", "  Base URL           $base/v1", "  API Key            $key",
    "  Model ID           kaggle-coder", "  Context Window     $($S.CONTEXT_TOKENS)", "  Max Output Tokens  $($S.MAX_OUTPUT_TOKENS)",
    "  Also in Cline      Use Compact Prompt = on, every auto-approve = off")
Set-Content -LiteralPath $cardFile -Value $cardLines -Encoding ASCII
Write-Host ""
$cardLines | ForEach-Object { Write-Host $_ -ForegroundColor Green }
Set-Clipboard -Value "$base/v1"
Write-Host "`nThe Base URL is already on your clipboard. Copy the other lines from here, or double-click logs.cmd any time to see this card again."
if (-not $fixedOn) { Write-Host "This address changes every run. A permanent one is optional: see fixed-address\README.md." }
Write-Host "Press S to stop the AI now. Or just leave: it stops by itself after $($S.IDLE_MINUTES) quiet minutes (2 hours at most)."

# ---------------------------------------------------------------- 6. keep watching, and keep the log up to date, until it ends
function Sync-Log {   # copies the server's NEW whole lines into last-run.log; returns this run's log text
    $log = ''
    foreach ($f in $out, "$out.err") {
        if (Test-Path -LiteralPath $f) {
            $stream = [IO.File]::Open($f, 'Open', 'Read', 'ReadWrite')
            $log += (New-Object IO.StreamReader($stream)).ReadToEnd(); $stream.Close()
        }
    }
    $thisRun = $log
    if ($runId) { $from = $log.LastIndexOf("run id $runId"); $thisRun = if ($from -ge 0) { $log.Substring($from) } else { '' } }
    if ($thisRun.Length -lt $script:written) { $script:written = 0 }
    $cut = $thisRun.LastIndexOf("`n") + 1
    if ($cut -gt $script:written) {
        try { Add-Content -LiteralPath $runLog -NoNewline -Encoding ASCII -Value (($thisRun.Substring($script:written, $cut - $script:written).Replace($key, '[key]')) -replace $addressPattern, '[address]') } catch { }
        $script:written = $cut
    }
    return $thisRun
}
function Stop-Follow { if ($follow -and -not $follow.HasExited) { try { & taskkill.exe /PID $follow.Id /T /F 2>&1 | Out-Null } catch {} }; Remove-Item -LiteralPath $out, "$out.err" -Force -ErrorAction SilentlyContinue }
$follow = Start-Process -FilePath $kaggle -ArgumentList @('kernels', 'logs', $notebook, '--follow', '--interval', '5') -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError "$out.err"
$began = Get-Date; $nextCheck = (Get-Date).AddSeconds(60)
while ($true) {
    Show-Line ("The AI is running ({0:N0} min). Press S to stop it. Settings: logs.cmd" -f ((Get-Date) - $began).TotalMinutes)
    Start-Sleep -Seconds 2
    $now = Sync-Log
    if ($now -match 'STOPPED:') {
        $why = [regex]::Match($now, 'STOPPED:[^\\"\r\n]*').Value
        Write-Host "`n`nThe AI has stopped itself. $why`nDouble-click start.cmd for a new one."
        Stop-Follow
        if (Test-Mine) { [void](Remove-Notebook) }   # the finished notebook still holds your key: delete it (this also removes the settings card)
        [Console]::Beep(); break
    }
    try { if ([Console]::KeyAvailable -and ([Console]::ReadKey($true).Key -eq 'S')) { Write-Host ""; Stop-Follow; [void](Remove-Notebook); exit 0 } } catch { }
    if ((Get-Date) -gt $nextCheck) {
        $nextCheck = (Get-Date).AddSeconds(60)
        $st = Get-RunState
        if ($st -and $st -ne 'RUNNING' -and $st -ne 'QUEUED') {
            Write-Host "`n`nThe AI has stopped ($st). Double-click start.cmd for a new one."
            Stop-Follow
            if (Test-Mine) { [void](Remove-Notebook) }
            [Console]::Beep(); break
        }
    }
}
