# 🚀 CÓMO VER TU BLOG - GUÍA RÁPIDA

## 📍 OPCIÓN 1: Ver en Local (Tu Computadora)

### ⚡ Forma Rápida (1 comando)

1. **Abre CMD** en esta carpeta (Shift + Click derecho → "Abrir ventana de comandos aquí")

2. **Ejecuta:**
   ```cmd
   INICIAR.bat
   ```

3. **Espera** 3-5 minutos mientras se instala todo

4. **Abre tu navegador** en: http://localhost:3000

¡Listo! Tu blog está corriendo en tu computadora 🎉

---

### 🔧 Forma Manual (paso a paso)

Si `INICIAR.bat` no funciona, ejecuta estos comandos uno por uno:

```cmd
rem 1. Crear directorios
node create-dirs.js

rem 2. Crear workflow
node create-workflow.js

rem 3. Instalar dependencias (toma 2-3 minutos)
npm install

rem 4. Copiar archivo de configuración
copy .env.example .env

rem 5. IMPORTANTE: Edita .env con tus credenciales
notepad .env

rem 6. Iniciar el servidor
npm run dev
```

Luego abre: **http://localhost:3000**

---

## 🌐 OPCIÓN 2: Ver en la Web (Público)

Para que tu blog esté visible en Internet, necesitas desplegarlo:

### A) Despliegue con Firebase Hosting (Recomendado)

#### 1. Instala Firebase CLI
```cmd
npm install -g firebase-tools
```

#### 2. Login a Firebase
```cmd
firebase login
```

#### 3. Crea un proyecto en Firebase
- Ve a: https://console.firebase.google.com
- Click en "Agregar proyecto"
- Sigue los pasos
- **Guarda el Project ID**

#### 4. Inicializa Firebase
```cmd
firebase init
```

Selecciona:
- [x] Hosting
- [x] Firestore
- [x] Storage

Usa estas opciones:
- ¿Qué carpeta usar como public? → **out**
- ¿Configurar como SPA? → **Yes**
- ¿Configurar deploys automáticos con GitHub? → **Yes** (si quieres CI/CD)

#### 5. Build y Deploy
```cmd
npm run build
firebase deploy
```

**¡Tu blog estará en:** `https://tu-proyecto.web.app`

---

### B) Despliegue con Vercel (Alternativa Fácil)

Vercel es más simple para Next.js:

#### 1. Instala Vercel CLI
```cmd
npm install -g vercel
```

#### 2. Deploy
```cmd
vercel
```

Sigue las instrucciones en pantalla.

**¡Tu blog estará en:** `https://tu-blog.vercel.app`

---

### C) Despliegue Automático con GitHub Actions

Ya está configurado! Solo necesitas:

#### 1. Crea un repositorio en GitHub
```cmd
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

#### 2. Configura Secrets en GitHub

Ve a: `Settings → Secrets and variables → Actions`

Agrega estos secrets:

**Para Firebase:**
- `FIREBASE_SERVICE_ACCOUNT` - JSON completo del service account
- `FIREBASE_PROJECT_ID` - ID de tu proyecto
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Para OpenAI:**
- `OPENAI_API_KEY`

**Para Releases:**
- `GH_TOKEN` - Personal Access Token con permisos de repo

#### 3. Push a main
```cmd
git push origin main
```

GitHub Actions automáticamente:
- ✅ Ejecutará los tests
- ✅ Hará el build
- ✅ Desplegará a Firebase
- ✅ Creará un release

**Tu blog estará en:** `https://tu-proyecto.web.app`

---

## 🔑 Configurar Credenciales (.env)

Antes de ver tu blog, necesitas configurar las credenciales:

### 1. Edita el archivo .env

```env
# Firebase - Obtén de https://console.firebase.google.com
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# OpenAI - Obtén de https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...
```

### 2. Cómo obtener las credenciales de Firebase:

1. Ve a https://console.firebase.google.com
2. Crea o selecciona tu proyecto
3. Click en ⚙️ (Configuración) → "Configuración del proyecto"
4. Scroll hasta "Tus apps"
5. Click en "Web" (icono </>)
6. Copia todas las credenciales al .env

### 3. Cómo obtener la API Key de OpenAI:

1. Ve a https://platform.openai.com
2. Inicia sesión o regístrate
3. Ve a "API Keys"
4. Click en "Create new secret key"
5. Copia la key al .env

---

## ✅ Verificar que Funciona

### En Local:
1. Ejecuta: `npm run dev`
2. Abre: http://localhost:3000
3. Deberías ver tu página de inicio

### En la Web:
1. Abre la URL de tu deploy
2. Verifica que carga correctamente
3. Prueba las funciones de IA (necesitas OpenAI configurado)

---

## 🆘 Problemas Comunes

### Error: "node no se reconoce"
**Solución:** Instala Node.js desde https://nodejs.org/

### Error: "Cannot find module"
**Solución:** 
```cmd
rm -rf node_modules
npm install
```

### Error: "Port 3000 already in use"
**Solución:** Detén otros servidores o usa otro puerto:
```cmd
set PORT=3001 && npm run dev
```

### No se ven los cambios
**Solución:** Limpia la cache:
```cmd
rm -rf .next
npm run dev
```

### Firebase no conecta
**Solución:** Verifica que .env tenga las credenciales correctas

---

## 🎯 Resumen Rápido

### Para ver en LOCAL (desarrollo):
```cmd
INICIAR.bat
```
→ Abre: http://localhost:3000

### Para ver en la WEB (producción):
```cmd
npm run build
firebase deploy
```
→ Abre: https://tu-proyecto.web.app

---

## 📚 Comandos Útiles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Inicia servidor local (desarrollo) |
| `npm run build` | Compila para producción |
| `npm start` | Inicia servidor de producción |
| `firebase deploy` | Despliega a Firebase |
| `vercel` | Despliega a Vercel |
| `npm run test` | Ejecuta tests |
| `npm run lint` | Verifica el código |

---

## 🎉 ¡Listo!

Ahora puedes:
- ✅ Ver tu blog en local: http://localhost:3000
- ✅ Desplegarlo en la web con Firebase o Vercel
- ✅ Configurar CI/CD automático con GitHub Actions

**¿Dudas?** Revisa:
- README.md - Documentación completa
- LEEME-PRIMERO.md - Guía detallada
