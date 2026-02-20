@echo off
echo ====================================================================
echo   GUIDO MIRANDA BLOG - COMPLETE SETUP
echo ====================================================================
echo.
echo This script will:
echo   1. Create all directory structures
echo   2. Install npm dependencies
echo   3. Create all 15 source files
echo.
echo ====================================================================
pause

echo.
echo [Step 1/2] Creating directories and installing dependencies...
echo.
node complete-setup-and-files.js
if errorlevel 1 (
    echo.
    echo ERROR: Step 1 failed!
    echo Please check the error message above.
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo [Step 2/2] Creating all remaining source files...
echo.
node create-all-files.js
if errorlevel 1 (
    echo.
    echo ERROR: Step 2 failed!
    echo Please check the error message above.
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo   ✅ SETUP COMPLETE!
echo ====================================================================
echo.
echo All files have been created successfully!
echo.
echo NEXT STEPS:
echo   1. Copy .env.example to .env
echo   2. Edit .env and add your API keys:
echo      - Firebase credentials
echo      - OpenAI API key
echo   3. Run: npm run dev
echo   4. Open: http://localhost:3000
echo.
echo ====================================================================
echo.
pause
