# 🔐 Configuración de Secrets para GitHub Actions

## ¿Dónde configurar los secrets?

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral izquierdo, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agregar cada secret uno por uno

## 🔥 Firebase Secrets

### 1. FIREBASE_PROJECT_ID

**Dónde encontrarlo:**
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Click en el ícono de engranaje ⚙️ → **Project settings**
4. Copia el **Project ID**

**Nombre del secret:** `FIREBASE_PROJECT_ID`  
**Valor de ejemplo:** `mi-blog-12345`

### 2. FIREBASE_SERVICE_ACCOUNT

**Dónde obtenerlo:**
1. En Firebase Console, ve a **Project settings** (⚙️)
2. Pestaña **Service accounts**
3. Click en **Generate new private key**
4. Se descarga un archivo JSON
5. Abre el archivo y **copia TODO su contenido**

**Nombre del secret:** `FIREBASE_SERVICE_ACCOUNT`  
**Valor:** Pega el contenido completo del JSON (ejemplo):

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/..."
}
```

⚠️ **IMPORTANTE:** Nunca compartas este archivo ni lo subas a GitHub.

### 3. Variables Públicas de Firebase

Estas se obtienen de la configuración de tu app web en Firebase:

1. Firebase Console → **Project settings** (⚙️)
2. Scroll hasta **Your apps**
3. Si no tienes app web, click en **Add app** → **Web** (</>) 
4. Verás algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Crea estos secrets con los valores correspondientes:

| Secret Name | Valor del Config |
|------------|------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

## 🐙 GitHub Secrets

### GH_TOKEN

Este token permite que semantic-release cree releases y actualice el código.

**Cómo crearlo:**
1. Ve a GitHub → Click en tu foto de perfil (arriba derecha)
2. **Settings** → **Developer settings** (al final del menú izquierdo)
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token** → **Generate new token (classic)**
5. Nombre: `Semantic Release Token`
6. Expiration: `No expiration` (o el tiempo que prefieras)
7. Selecciona estos permisos:
   - ✅ `repo` (todos los sub-items)
   - ✅ `write:packages`
   - ✅ `read:packages`
8. Click en **Generate token**
9. **¡COPIA EL TOKEN AHORA!** (no podrás verlo después)

**Nombre del secret:** `GH_TOKEN`  
**Valor:** El token que copiaste (ejemplo: `ghp_xxxxxxxxxxxxxxxxxxxx`)

## 🤖 OpenAI Secret (Opcional)

Solo si usas la funcionalidad de AI/ChatBot.

### OPENAI_API_KEY

**Dónde obtenerlo:**
1. Ve a [OpenAI Platform](https://platform.openai.com)
2. Sign in o crea cuenta
3. Click en tu nombre (arriba derecha) → **API keys**
4. **Create new secret key**
5. Copia la clave

**Nombre del secret:** `OPENAI_API_KEY`  
**Valor:** `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Importante:** Esta clave tiene costo de uso. Monitorea tu uso en OpenAI.

## 📋 Checklist de Secrets

Marca los que ya configuraste:

### Obligatorios para Deploy:
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT`
- [ ] `GH_TOKEN`

### Para funcionalidad Firebase (si la usas):
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### Opcional:
- [ ] `OPENAI_API_KEY` (solo si usas AI features)

## 🧪 Verificar que funcionan

Después de configurar los secrets:

1. Crea un PR de prueba
2. Ve a GitHub → Actions
3. Verás el workflow `Pull Request Validation` ejecutándose
4. Si todos los checks pasan ✅, los secrets están bien configurados

## ⚠️ Troubleshooting

### Error: "Secret FIREBASE_SERVICE_ACCOUNT not found"
→ Verifica que el nombre esté exactamente como `FIREBASE_SERVICE_ACCOUNT`  
→ Verifica que pegaste el JSON completo, no solo una parte

### Error: "Invalid firebase service account"
→ El JSON puede estar mal formateado  
→ Asegúrate de copiar TODO el contenido del archivo descargado

### Error: "GH_TOKEN doesn't have permissions"
→ El token necesita permisos `repo` y `write:packages`  
→ Regenera el token con los permisos correctos

### Workflow no se ejecuta
→ Los workflows solo se ejecutan en push a main/develop o en PRs  
→ Verifica que el archivo .yml esté en `.github/workflows/`

## 🔒 Seguridad

✅ **Nunca** compartas los secrets  
✅ **Nunca** los subas a GitHub en el código  
✅ **Nunca** los pongas en archivos .env que estén versionados  
✅ Usa siempre GitHub Secrets para valores sensibles  
✅ Rota los tokens periódicamente (cada 6-12 meses)

---

## 🎯 Orden Recomendado

1. Primero configura `FIREBASE_PROJECT_ID` y `FIREBASE_SERVICE_ACCOUNT`
2. Luego configura `GH_TOKEN`
3. Finalmente, las variables públicas de Firebase
4. Al final, OpenAI si lo necesitas

Una vez configurados, **haz un push a develop** y verifica que el workflow funcione.

---

**Fecha:** 2026-03-05  
**Necesitas ayuda?** Consulta [docs/CI-CD-STRUCTURE.md](./docs/CI-CD-STRUCTURE.md)
