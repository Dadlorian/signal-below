# Starts YOUR AI helper on YOUR Kaggle account, then hands you the two things Cline needs.
# Your key lives in %USERPROFILE%\.kaggle-coder\.env (made on the first run, outside the game folder).
# It is sent inside your PRIVATE Kaggle notebook (and so stays in that notebook's history) because
# Kaggle's command line cannot attach Secrets. It is never printed.
# New key: delete that .env file and run again.  Need the key in Cline again: add  -CopyKey
# Finished? Add  -Stop  to delete the notebook this script made.
# Add  -Status  to see your GPU hours left and your run's state. It starts and changes nothing.
param([switch]$CopyKey, [switch]$Stop, [switch]$Status)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$home2 = Join-Path $env:USERPROFILE '.kaggle-coder'
$venv = Join-Path $home2 'venv'
$kaggle = Join-Path $venv 'Scripts\kaggle.exe'
$userFile = Join-Path $home2 'username.txt'
$addressPattern = 'https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com'   # the key is only ever sent to this kind of address

function Stop-Here($text) { Write-Host "`nSTOP: $text" -ForegroundColor Red; exit 1 }
function Say($text) { Write-Host "`n$text" -ForegroundColor Cyan }

# 1. The Kaggle tool, in its own folder (first run only)
if (-not (Test-Path -LiteralPath $kaggle)) {
    Say "First run: this downloads Kaggle's tool (kaggle 2.2.5 and what it needs) from PyPI into $venv"
    if ((Read-Host "Type y to install") -ne 'y') { Stop-Here "nothing was installed." }
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    foreach ($python in 'python', 'py') {
        if (Get-Command $python -ErrorAction SilentlyContinue) {
            & $python -m venv $venv 2>&1 | Out-Null
            if (Test-Path -LiteralPath (Join-Path $venv 'Scripts\python.exe')) { break }
        }
    }
    $ErrorActionPreference = $old
    if (-not (Test-Path -LiteralPath (Join-Path $venv 'Scripts\python.exe'))) { Stop-Here "could not set up Python. Python 3.11 or newer is needed (close PowerShell and open it again after installing it)." }
    & (Join-Path $venv 'Scripts\python.exe') -m pip install --quiet kaggle==2.2.5 six==1.17.0   # kaggle 2.2.5 needs six but does not install it
    if ($LASTEXITCODE -or -not (Test-Path -LiteralPath $kaggle)) { Stop-Here "the Kaggle tool did not install." }
}

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
    Write-Host "Not proven: deleting may not end a session that is already running."
    Write-Host "Check Active Events on kaggle.com and stop anything listed there."
}

function Show-Quota {
    $quota = Invoke-Kaggle @('quota')
    if ($quota.Code -eq 0) { Write-Host $quota.Text } else { Write-Host "Could not read your Kaggle hours. See kaggle.com/settings" }
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

# Rules that Cline reads, refreshed on every start
$rulesDest = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Cline\Rules\signal-below.md'
try {
    New-Item -ItemType Directory -Force (Split-Path -Parent $rulesDest) | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'cline-rules.md') -Destination $rulesDest -Force
}
catch { Write-Host "Note: the Cline rules were not installed: $($_.Exception.Message)" -ForegroundColor Yellow }

# 3. Your key: read it from .env, or make it the first time
$envFile = Join-Path $home2 '.env'
$keyGiven = Join-Path $home2 'key-given.txt'   # exists once you have pasted the key into Cline
if (-not (Test-Path -LiteralPath $envFile)) {
    Remove-Item -LiteralPath $keyGiven -Force -ErrorAction SilentlyContinue
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    New-Item -ItemType Directory -Force $home2 | Out-Null
    [IO.File]::WriteAllText($envFile, "CODER_API_KEY=" + (-join ($bytes | ForEach-Object { $_.ToString('x2') })) + "`r`n")
}
# Only letters, numbers, - and _ are accepted: the value is written into the server code.
$found = [regex]::Match([IO.File]::ReadAllText($envFile), '(?m)^CODER_API_KEY=([A-Za-z0-9_-]{32,128})[ \t]*\r?$')
if (-not $found.Success) { Stop-Here "$envFile needs a line CODER_API_KEY=... of 32 or more letters and numbers. Or delete the file to get a new one." }
$key = $found.Groups[1].Value

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
        $code = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'server.py'))
        [IO.File]::WriteAllText((Join-Path $work 'server.py'), $header + $code)
        $meta = [ordered]@{ id = $notebook; title = 'kaggle-coder'; code_file = 'server.py'; language = 'python'
            kernel_type = 'script'; is_private = $true; enable_gpu = $true; enable_internet = $true
            machine_shape = 'NvidiaTeslaT4'; dataset_sources = @(); competition_sources = @(); kernel_sources = @(); model_sources = @() }
        [IO.File]::WriteAllText((Join-Path $work 'kernel-metadata.json'), ($meta | ConvertTo-Json))
        Say "Sending the server to your private Kaggle notebook ($notebook)..."
        $push = Invoke-Kaggle @('kernels', 'push', '-p', $work, '--accelerator', 'NvidiaTeslaT4', '-t', '11400')
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
function Get-Status($url, [bool]$withKey) {
    $headers = @{}
    if ($withKey) { $headers['Authorization'] = "Bearer $key" }
    try { return [int](Invoke-WebRequest -Uri "$url/v1/models" -Headers $headers -UseBasicParsing -TimeoutSec 15).StatusCode }
    catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode } return 0 }
}

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
$base = $null; $follow = $null; $shown = @{}; $nextStatus = Get-Date
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
            Start-Sleep -Seconds 10
            $follow = Start-Process -FilePath $kaggle -ArgumentList @('kernels', 'logs', $notebook, '--follow') -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError "$out.err"
        }
        Start-Sleep -Seconds 5
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
                $nextStatus = (Get-Date).AddMinutes(1)
                $statusText = (Invoke-Kaggle @('kernels', 'status', $notebook)).Text
                Write-Host "Kaggle says: $statusText"
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
            Write-Host "`nThe notebook was NOT deleted. To delete it, run:  .\start.ps1 -Stop"
            Write-Host "Also check $page and Active Events on kaggle.com."
        }
    }
}

# 6. Hand Cline what it needs through the clipboard
Say "READY."
if ($CopyKey -or -not (Test-Path -LiteralPath $keyGiven)) {
    Set-Clipboard -Value $key
    Read-Host "Your key is on the clipboard. Paste it into Cline's API Key box, then press Enter here" | Out-Null
    Set-Content -LiteralPath $keyGiven -Value 'yes' -Encoding ASCII
}
Set-Clipboard -Value "$base/v1"
Write-Host "The address is on the clipboard. Paste it into Cline's Base URL box. Then ask Cline something."
Write-Host "`nWhen you finish: run  .\start.ps1 -Stop  (deletes the notebook), then check Active Events on kaggle.com"
Write-Host "and stop anything listed there. (If you forget: it stops itself after 10 idle minutes, and after 3 hours at most.)"
