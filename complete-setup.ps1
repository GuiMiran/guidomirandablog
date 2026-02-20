# Complete Setup Script for Windows PowerShell
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Complete Project Setup Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Creating directory structure..." -ForegroundColor Yellow

$directories = @(
    "src\app\api\ai\chat",
    "src\app\api\ai\generate",
    "src\app\api\ai\summarize",
    "src\app\blog\[slug]",
    "src\components\ui",
    "src\components\blog",
    "src\components\ai",
    "src\lib\firebase",
    "src\lib\openai",
    "src\types",
    "src\utils",
    "content\posts",
    "tests\unit",
    "tests\e2e",
    ".github\workflows",
    "public\images"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "   Created: $dir" -ForegroundColor Green
}

Write-Host "   Directory structure created successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] Installing dependencies..." -ForegroundColor Yellow
try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "   Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[3/3] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "1. Source files will be created next"
Write-Host "2. Copy .env.example to .env and add credentials"
Write-Host "3. Run: npm run dev"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
