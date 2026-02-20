@echo off
echo Creating project structure...

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

echo Structure created successfully!
echo Installing dependencies...
call npm install

echo.
echo Project setup complete!
echo.
echo Next steps:
echo 1. Copy .env.example to .env and add your credentials
echo 2. Run 'npm run dev' to start the development server
echo 3. Configure Firebase project
echo.
