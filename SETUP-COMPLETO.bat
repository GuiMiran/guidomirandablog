@echo off
echo.
echo ========================================
echo   GUIDO MIRANDA BLOG - SETUP COMPLETO
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado!
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Creando estructura de directorios...
echo.

mkdir .github\workflows 2>nul
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
mkdir public\images 2>nul

echo Estructura creada!
echo.

echo [2/5] Creando workflow de GitHub Actions...
node create-workflow.js
echo.

echo [3/5] Instalando dependencias (esto puede tardar unos minutos)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la instalacion de dependencias
    pause
    exit /b 1
)
echo.

echo [4/5] Creando archivos del proyecto...
if exist RUN-COMPLETE-SETUP.js (
    node RUN-COMPLETE-SETUP.js
) else (
    echo No se encontro RUN-COMPLETE-SETUP.js, continuando...
)
echo.

echo [5/5] Configuracion final...
if not exist .env (
    copy .env.example .env >nul 2>nul
    echo Archivo .env creado. IMPORTANTE: Edita .env con tus credenciales!
)
echo.

echo ========================================
echo   SETUP COMPLETADO CON EXITO!
echo ========================================
echo.
echo Proximos pasos:
echo.
echo 1. Edita el archivo .env con tus credenciales:
echo    - Firebase (consola de Firebase)
echo    - OpenAI API Key
echo.
echo 2. Inicia el servidor de desarrollo:
echo    npm run dev
echo.
echo 3. Abre http://localhost:3000 en tu navegador
echo.
echo 4. Para desplegar:
echo    - Configura Firebase: firebase init
echo    - Configura GitHub Secrets para CI/CD
echo.
echo Documentacion:
echo    - README.md - Guia completa
echo    - INICIO-RAPIDO.md - Inicio rapido
echo.
pause
