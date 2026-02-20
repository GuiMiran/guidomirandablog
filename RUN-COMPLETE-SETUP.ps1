# Complete Setup Script - PowerShell Version
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  GUIDO MIRANDA BLOG - COMPLETE SETUP" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor White
Write-Host "  1. Create all directory structures" -ForegroundColor White
Write-Host "  2. Install npm dependencies" -ForegroundColor White
Write-Host "  3. Create all 15 source files" -ForegroundColor White
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"

Write-Host ""
Write-Host "[Step 1/2] Creating directories and installing dependencies..." -ForegroundColor Yellow
Write-Host ""

try {
    & node complete-setup-and-files.js
    if ($LASTEXITCODE -ne 0) {
        throw "Step 1 failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Step 1 failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "[Step 2/2] Creating all remaining source files..." -ForegroundColor Yellow
Write-Host ""

try {
    & node create-all-files.js
    if ($LASTEXITCODE -ne 0) {
        throw "Step 2 failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Step 2 failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All files have been created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Copy .env.example to .env" -ForegroundColor White
Write-Host "  2. Edit .env and add your API keys:" -ForegroundColor White
Write-Host "     - Firebase credentials" -ForegroundColor Gray
Write-Host "     - OpenAI API key" -ForegroundColor Gray
Write-Host "  3. Run: npm run dev" -ForegroundColor White
Write-Host "  4. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
