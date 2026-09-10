# Starts the local MySQL server for Dealer Desk if it isn't already running.
# Safe to run repeatedly — it checks port 3306 first and no-ops if something
# is already listening there.
#
# This exists because MySQL was installed via `winget install Oracle.MySQL`
# without admin rights, so it could not be registered as a proper Windows
# service (that requires an elevated session). This script is the
# workaround: register it as a scheduled task (see register-autostart.ps1)
# so MySQL comes up on login without needing Claude Code or any particular
# terminal to stay open.

$ErrorActionPreference = 'Stop'

$mysqld = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
$basedir = 'C:\Program Files\MySQL\MySQL Server 8.4'
$datadir = 'C:\Users\admin\.mysql-dealerdesk\data'
$logfile = 'C:\Users\admin\.mysql-dealerdesk\mysqld.log'

$portInUse = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
  Write-Host "MySQL already listening on port 3306 — nothing to do."
  exit 0
}

if (-not (Test-Path $datadir)) {
  Write-Error "Data directory not found at $datadir — run mysqld --initialize-insecure first (see server/README.md)."
  exit 1
}

Write-Host "Starting mysqld..."
Start-Process -FilePath $mysqld `
  -ArgumentList "--datadir=`"$datadir`"", "--basedir=`"$basedir`"", "--port=3306", "--standalone" `
  -WindowStyle Hidden `
  -RedirectStandardOutput $logfile `
  -RedirectStandardError "$logfile.err"

Start-Sleep -Seconds 3
$nowUp = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if ($nowUp) {
  Write-Host "MySQL is up on port 3306."
} else {
  Write-Warning "MySQL did not come up — check $logfile.err"
}
