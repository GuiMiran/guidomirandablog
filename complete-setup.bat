@echo off
echo ============================================
echo Complete Project Setup Script
echo ============================================
echo.

echo [1/3] Creating directory structure...
mkdir src\app\api\ai\chat 2>nul
mkdir src\app\api\ai\generate 2>nul
mkdir src\app\api\ai\summarize 2>nul
mkdir src\app\blog\[slug] 2>nul
mkdir src\components\ui 2>nul
mkdir src\components\blog 2>nul
mkdir src\components\ai 2>nul
mkdir src\lib\firebase 2>nul
mkdir src\lib\openai 2>nul
mkdir src\types 2>nul
mkdir src\utils 2>nul
mkdir content\posts 2>nul
mkdir tests\unit 2>nul
mkdir tests\e2e 2>nul
mkdir .github\workflows 2>nul
mkdir public\images 2>nul
echo    Directory structure created successfully!
echo.

echo [2/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo    ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo    Dependencies installed successfully!
echo.

echo [3/3] Setup complete!
echo.
echo ============================================
echo Next Steps:
echo ============================================
echo 1. Run: copilot "create all source files"
echo 2. Copy .env.example to .env and add credentials
echo 3. Run: npm run dev
echo ============================================
echo.
pause
