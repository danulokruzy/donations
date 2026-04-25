param(
  [switch]$NoPause,
  [ValidateSet("menu", "setup", "site", "dashboard")]
  [string]$Mode = "menu"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $root "app"

function Write-Section([string]$text) {
  Write-Host ""
  Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Ensure-AppDirectory {
  if (-not (Test-Path -LiteralPath $appDir)) {
    throw "Folder 'app' not found. Expected path: $appDir"
  }
}

function Ensure-NodeModules {
  Ensure-AppDirectory
  $envLocal = Join-Path $appDir ".env.local"
  if (-not (Test-Path -LiteralPath $envLocal)) {
    @(
      "NEXT_PUBLIC_PROJECT_ID="
    ) | Set-Content -LiteralPath $envLocal -Encoding UTF8
    Write-Host "Created .env.local with starter values." -ForegroundColor Yellow
  }

  $nodeModules = Join-Path $appDir "node_modules"
  if (-not (Test-Path -LiteralPath $nodeModules)) {
    Write-Section "Installing dependencies"
    Push-Location $appDir
    try {
      npm install
    } finally {
      Pop-Location
    }
  }
}

function Ensure-Database {
  Ensure-AppDirectory
  Push-Location $appDir
  try {
    Write-Section "Preparing SQLite database"
    npm run db:generate
    npm run db:push
    npm run db:seed
  } finally {
    Pop-Location
  }
}

function Start-Site {
  Ensure-AppDirectory
  Ensure-NodeModules
  $dbFile = Join-Path $appDir "prisma\dev.db"
  if (-not (Test-Path -LiteralPath $dbFile)) {
    Ensure-Database
  }
  Write-Section "Starting public donation site"
  Write-Host "URL: http://localhost:3000" -ForegroundColor Green
  Push-Location $appDir
  try {
    npm run dev:site
  } finally {
    Pop-Location
  }
}

function Start-Dashboard {
  Ensure-AppDirectory
  Ensure-NodeModules
  $dbFile = Join-Path $appDir "prisma\dev.db"
  if (-not (Test-Path -LiteralPath $dbFile)) {
    Ensure-Database
  }
  Write-Section "Starting dashboard mode"
  Write-Host "URL: http://localhost:3000/dashboard" -ForegroundColor Green
  Push-Location $appDir
  try {
    npm run dev:dashboard
  } finally {
    Pop-Location
  }
}

if ($Mode -eq "setup") {
  Write-Section "Setup"
  Ensure-NodeModules
  Ensure-Database
  Write-Host "Dependencies are ready." -ForegroundColor Green
  exit 0
}

if ($Mode -eq "site") {
  Start-Site
  exit 0
}

if ($Mode -eq "dashboard") {
  Start-Dashboard
  exit 0
}

while ($true) {
  Clear-Host
  Write-Host "Stream Project Launcher" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "1. Setup project dependencies"
  Write-Host "2. Run public donation page"
  Write-Host "3. Run dashboard page"
  Write-Host "0. Exit"
  Write-Host ""

  $choice = Read-Host "Choose option (0-3)"

  switch ($choice) {
    "1" {
      Write-Section "Setup"
      Ensure-NodeModules
      Ensure-Database
      Write-Host "Dependencies are ready." -ForegroundColor Green
      if (-not $NoPause) { Read-Host "Press Enter to continue" | Out-Null }
    }
    "2" {
      Start-Site
      break
    }
    "3" {
      Start-Dashboard
      break
    }
    "0" {
      break
    }
    default {
      Write-Host "Invalid option. Use 0, 1, 2, or 3." -ForegroundColor Red
      Start-Sleep -Seconds 1
    }
  }
}
