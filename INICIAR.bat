@echo off
echo.
echo ========================================
echo   INICIANDO TU BLOG - GUIDO MIRANDA
echo ========================================
echo.

REM Paso 1: Crear estructura
echo [1/4] Creando directorios...
call node create-dirs.js

REM Paso 2: Crear workflow
echo.
echo [2/4] Creando GitHub Actions workflow...
call node create-workflow.js

REM Paso 3: Instalar dependencias
echo.
echo [3/4] Instalando dependencias (esto toma 2-3 minutos)...
echo.
call npm install

REM Paso 4: Copiar .env
echo.
echo [4/4] Configurando variables de entorno...
if not exist .env (
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales:
    echo     - Firebase: https://console.firebase.google.com
    echo     - OpenAI: https://platform.openai.com/api-keys
    echo.
)

echo.
echo ========================================
echo   ✅ SETUP COMPLETO!
echo ========================================
echo.
echo Ahora debes:
echo 1. Editar .env con tus credenciales
echo 2. Ejecutar: npm run dev
echo 3. Abrir: http://localhost:3000
echo.
echo ¿Quieres iniciar el servidor ahora? (S/N)
set /p start="Respuesta: "

if /i "%start%"=="S" (
    echo.
    echo Iniciando servidor de desarrollo...
    echo Abre http://localhost:3000 en tu navegador
    echo.
    echo Presiona Ctrl+C para detener el servidor
    echo.
    npm run dev
) else (
    echo.
    echo Para iniciar el servidor más tarde, ejecuta: npm run dev
    echo.
)

pause
