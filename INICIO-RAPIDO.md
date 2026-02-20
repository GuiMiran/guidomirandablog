# 🚀 INICIO RÁPIDO - EJECUTA ESTOS COMANDOS

## ⚠️ IMPORTANTE: PowerShell 6+ No Detectado

Tu sistema no tiene PowerShell 6+ instalado. Puedes usar CMD (símbolo del sistema) en su lugar.

## 📋 Pasos para Inicializar el Proyecto

### Opción 1: Usar CMD (Recomendado para Windows 10/11)

Abre CMD (Símbolo del sistema) en esta carpeta y ejecuta:

\`\`\`cmd
node create-dirs.js
npm install
node RUN-COMPLETE-SETUP.js
\`\`\`

### Opción 2: Crear Estructura Manualmente

Si Node.js no está instalado, sigue estos pasos:

1. **Instala Node.js** desde https://nodejs.org/ (versión 18 o superior)

2. **Abre CMD** en esta carpeta (Shift + Click derecho → "Abrir ventana de comandos aquí")

3. **Ejecuta estos comandos uno por uno:**

\`\`\`cmd
rem Crear estructura de directorios
mkdir src\\app\\api\\ai\\chat 2>nul
mkdir src\\app\\api\\ai\\generate 2>nul
mkdir src\\app\\api\\ai\\summarize 2>nul
mkdir src\\app\\blog\\[slug] 2>nul
mkdir src\\components\\ui 2>nul
mkdir src\\components\\blog 2>nul
mkdir src\\components\\ai 2>nul
mkdir src\\lib\\firebase 2>nul
mkdir src\\lib\\openai 2>nul
mkdir src\\types 2>nul
mkdir src\\utils 2>nul
mkdir content\\posts 2>nul
mkdir tests\\unit 2>nul
mkdir tests\\e2e 2>nul
mkdir .github\\workflows 2>nul
mkdir public\\images 2>nul

rem Instalar dependencias
npm install

rem Crear archivos del proyecto
node RUN-COMPLETE-SETUP.js
\`\`\`

## 🔧 Configuración Post-Instalación

### 1. Configura Variables de Entorno

\`\`\`cmd
copy .env.example .env
\`\`\`

Luego edita `.env` con tus credenciales:

- **Firebase**: Obtén las credenciales de https://console.firebase.google.com/
- **OpenAI**: Crea una API key en https://platform.openai.com/

### 2. Inicializa Firebase

\`\`\`cmd
npm install -g firebase-tools
firebase login
firebase init
\`\`\`

Selecciona:
- Hosting
- Firestore
- Storage
- Functions (opcional)

### 3. Inicia el Servidor de Desarrollo

\`\`\`cmd
npm run dev
\`\`\`

Abre http://localhost:3000 en tu navegador

## 🧪 Ejecutar Tests

\`\`\`cmd
rem Tests unitarios
npm run test

rem Tests E2E (instala navegadores primero)
npx playwright install
npm run test:e2e
\`\`\`

## 🚀 Despliegue

### Configurar GitHub Actions

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agrega estos secrets:
   - \`FIREBASE_SERVICE_ACCOUNT\`
   - \`FIREBASE_PROJECT_ID\`
   - \`NEXT_PUBLIC_FIREBASE_API_KEY\`
   - \`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\`
   - \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\`
   - \`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\`
   - \`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\`
   - \`NEXT_PUBLIC_FIREBASE_APP_ID\`
   - \`OPENAI_API_KEY\`
   - \`GH_TOKEN\` (Personal Access Token para releases)

### Despliegue Manual

\`\`\`cmd
npm run build
firebase deploy
\`\`\`

## 📚 Documentación Adicional

- **README.md** - Documentación completa del proyecto
- **SETUP_GUIDE.md** - Guía detallada de configuración
- **.env.example** - Variables de entorno requeridas

## ❓ Problemas Comunes

### Error: "node no se reconoce como comando"
- Instala Node.js desde https://nodejs.org/
- Reinicia CMD después de la instalación

### Error: "npm no se reconoce como comando"
- Node.js incluye npm, reinstala Node.js
- Asegúrate de que esté en el PATH del sistema

### Error al crear directorios
- Ejecuta CMD como Administrador
- Verifica permisos de escritura en la carpeta

### Firebase no conecta
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el proyecto Firebase esté activo

## 🆘 Soporte

Si encuentras problemas:

1. Revisa la documentación en README.md
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que Node.js 18+ esté instalado
4. Comprueba que las variables de entorno estén configuradas

## ✅ Verificación de la Instalación

Después de ejecutar los comandos, deberías tener:

- ✅ Carpeta `node_modules/` con dependencias
- ✅ Carpeta `src/` con código fuente
- ✅ Carpeta `.next/` después del primer build
- ✅ Archivo `.env` con tus credenciales
- ✅ Servidor corriendo en http://localhost:3000

---

**¡Listo! Tu blog con IA está configurado y funcionando** 🎉
