# One-shot, idempotent local database bootstrap for Dealer Desk.
#
# Does everything needed to go from "nothing" to "a fully migrated, seeded
# dealer_desk database" on a machine without admin rights (MySQL installed
# via `winget install Oracle.MySQL`, run standalone rather than as a Windows
# service - see start-mysql.ps1 for why). Safe to re-run any time: every step
# checks current state first and no-ops if it's already done.
#
# Steps:
#   1. Initialize the MySQL data directory, if it doesn't exist yet.
#   2. Start mysqld (delegates to start-mysql.ps1), if it isn't running.
#   3. Create the dealer_desk database and dealerdesk user, if missing.
#   4. Apply all Prisma migrations.
#   5. Seed development master data + the dev admin/staff/dealer accounts.
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-db.ps1

$ErrorActionPreference = 'Stop'

$mysqld    = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
$mysqlCli  = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
$basedir   = 'C:\Program Files\MySQL\MySQL Server 8.4'
$datadir   = 'C:\Users\admin\.mysql-dealerdesk\data'
$dbName    = 'dealer_desk'
$dbUser    = 'dealerdesk'
$dbPass    = 'dealerdesk'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Split-Path -Parent $scriptDir

function Step($message) {
  Write-Host "==> $message" -ForegroundColor Cyan
}

# --- 1. Initialize the data directory if it doesn't exist -------------------
if (-not (Test-Path $datadir)) {
  Step "No data directory at $datadir - initializing a fresh MySQL instance..."
  New-Item -ItemType Directory -Force -Path $datadir | Out-Null
  & $mysqld --initialize-insecure --datadir="$datadir" --basedir="$basedir"
  if ($LASTEXITCODE -ne 0) { throw "mysqld --initialize-insecure failed (exit $LASTEXITCODE)" }
  Step "Data directory initialized (root has no password yet - local dev only, never expose this port)."
} else {
  Step "Data directory already exists at $datadir - skipping initialization."
}

# --- 2. Start MySQL if it isn't already running ------------------------------
$portInUse = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if (-not $portInUse) {
  Step "MySQL not running - starting it..."
  & (Join-Path $scriptDir 'start-mysql.ps1')
  Start-Sleep -Seconds 2
} else {
  Step "MySQL already listening on port 3306."
}

# --- 3. Create the database + app user (idempotent) --------------------------
Step "Ensuring database '$dbName' and user '$dbUser' exist..."
$sql = @"
CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$dbUser'@'localhost' IDENTIFIED BY '$dbPass';
GRANT ALL PRIVILEGES ON $dbName.* TO '$dbUser'@'localhost';
FLUSH PRIVILEGES;
"@
$sql | & $mysqlCli -u root
if ($LASTEXITCODE -ne 0) { throw "Database or user creation failed (exit $LASTEXITCODE)" }
Step "Database and user ready."

# --- 4. Apply migrations ------------------------------------------------------
Step "Applying Prisma migrations..."
Push-Location $serverDir
try {
  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy failed (exit $LASTEXITCODE)" }

  # --- 5. Seed development data ---------------------------------------------
  Step "Seeding development data..."
  npm run seed
  if ($LASTEXITCODE -ne 0) { throw "npm run seed failed (exit $LASTEXITCODE)" }
} finally {
  Pop-Location
}

Step "Done. Dev login: admin@dealer.com / ChangeMe123!"
Step "Dev dealer-portal login: portal@autoprime.com / ChangeMe123!"
