# Starts the local MySQL server for Dealer Desk if it isn't already running.
# Safe to run repeatedly - it checks port 3306 first and no-ops if something
# is already listening there.
#
# This exists because MySQL was installed via `winget install Oracle.MySQL`
# without admin rights, so it could not be registered as a proper Windows
# service (that requires an elevated session).
#
# Primary trigger: server/package.json's "predev" npm script runs this
# automatically before every `npm run dev`, which is deterministic and does
# not depend on any Windows scheduling infrastructure.
#
# Secondary trigger: a logon-triggered scheduled task (register-autostart.ps1)
# also runs this. Treat it as best-effort only - in this dev environment,
# Task Scheduler tasks (even a trivial one with no MySQL involved at all)
# got stuck reporting "Running" forever and never actually executed, so it
# cannot be relied on here. It may still work on a normal interactive Windows
# logon; the npm predev hook is what actually guarantees MySQL comes up.
#
# Uses -NoNewWindow rather than -WindowStyle Hidden for Start-Process, since
# the latter combined with redirected stdout/stderr can hang when launched
# from a non-interactive session (creating a hidden window still requires a
# window station) - a good practice here regardless of which trigger fires.

$ErrorActionPreference = 'Stop'

$mysqld = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
$basedir = 'C:\Program Files\MySQL\MySQL Server 8.4'
$datadir = 'C:\Users\admin\.mysql-dealerdesk\data'
$logfile = 'C:\Users\admin\.mysql-dealerdesk\mysqld.log'
$statuslog = 'C:\Users\admin\.mysql-dealerdesk\autostart.log'

function Write-Status($message) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $message"
  Add-Content -Path $statuslog -Value $line -ErrorAction SilentlyContinue
  Write-Host $message
}

$portInUse = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
  Write-Status "MySQL already listening on port 3306 - nothing to do."
  exit 0
}

if (-not (Test-Path $datadir)) {
  Write-Status "ERROR: data directory not found at $datadir - run mysqld --initialize-insecure first (see server/README.md)."
  exit 1
}

Write-Status "Starting mysqld..."
Start-Process -FilePath $mysqld `
  -ArgumentList "--datadir=`"$datadir`"", "--basedir=`"$basedir`"", "--port=3306", "--standalone" `
  -NoNewWindow `
  -RedirectStandardOutput $logfile `
  -RedirectStandardError "$logfile.err"

# Poll instead of a single fixed sleep - a cold start (fresh boot, disk
# contention) can take longer than a few seconds.
$nowUp = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Seconds 1
  if (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue) {
    $nowUp = $true
    break
  }
}

if ($nowUp) {
  Write-Status "MySQL is up on port 3306 (after $($i + 1)s)."
} else {
  Write-Status "WARNING: MySQL did not come up within 20s - check $logfile.err"
}
