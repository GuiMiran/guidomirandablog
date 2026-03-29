# Guido Miranda Blog - Estructura y Workflows CI/CD

## 📁 Estructura de Carpetas Organizada

```
guidomirandablog/
├── .github/
│   └── workflows/
│       ├── pr-validation.yml           # Validación de PRs
│       ├── release-candidate-develop.yml  # Release Candidate en develop
│       ├── production-deploy.yml       # Deploy a producción
│       └── spec-driven-pipeline.yml    # Validación de especificaciones
├── content/
│   └── posts/                          # Posts del blog en Markdown
│       ├── sdd-org-chart.md
│       └── *.md                        # Tus posts aquí
├── docs/                               # Documentación del proyecto
├── public/
│   └── images/                         # Imágenes estáticas
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── blog/
│   │   │   ├── page.tsx               # Lista de posts
│   │   │   └── [slug]/
│   │   │       └── page.tsx           # Detalle del post
│   │   └── api/                       # API routes
│   ├── components/                     # Componentes React
│   │   ├── ai/
│   │   ├── blog/
│   │   └── ui/
│   ├── lib/                           # Lógica de negocio
│   │   ├── posts.ts                   # ✨ Funciones para leer posts
│   │   ├── agents/                    # Agentes AI
│   │   ├── protocols/
│   │   └── skills/
│   └── types/                         # Definiciones TypeScript
└── tests/                             # Tests unitarios y E2E
```

## 🔄 Flujo de CI/CD

### 1️⃣ Pull Request (PR) → main o develop

**Workflow:** `pr-validation.yml`

Cuando creas un PR, se ejecutan automáticamente:

✅ **Validación de Changelog**
- Verifica que `CHANGELOG.md` fue actualizado
- Comenta en el PR si falta

✅ **Análisis de Calidad de Código**
- TypeScript type checking
- ESLint
- Prettier

✅ **Testing Completo**
- Tests unitarios (Vitest)
- Tests E2E (Playwright)
- Cobertura de código

✅ **Validación de Especificaciones**
- Ejecuta `npm run spec:check`
- Verifica alineación con specs

✅ **Verificación de Build**
- Compila la aplicación
- Analiza el tamaño del build

### 2️⃣ Merge a develop → Release Candidate

**Workflow:** `release-candidate-develop.yml`

Cuando haces merge a `develop`:

1. **Validación y Tests**
   - Ejecuta linter y tests

2. **Build de la Aplicación**
   - Compila para preview

3. **Deploy a Firebase Preview**
   - Despliega en canal `develop`
   - URL: `https://PROJECT_ID--develop-HASH.web.app`

4. **Crea Release Candidate**
   - Tag: `vX.Y.Z-rc.N`
   - Release en GitHub (prerelease)
   - Genera notas de la versión

### 3️⃣ Merge a main → Producción

**Workflow:** `production-deploy.yml`

Cuando haces merge a `main`:

1. **Validación Completa**
   - Type checking
   - Linter
   - Tests unitarios y E2E

2. **Build de Producción**
   - Optimizado para producción
   - Análisis de tamaño

3. **Deploy a Firebase Production**
   - Despliega en canal `live`
   - URL: `https://PROJECT_ID.web.app`

4. **Crea Release de Producción**
   - Usa semantic-release
   - Actualiza CHANGELOG.md
   - Crea tag `vX.Y.Z`
   - Release en GitHub

5. **Verificación Post-Deploy**
   - Health check de la URL
   - Smoke tests

6. **Notificación al Equipo**
   - Resumen del deployment

## 📝 Cómo Agregar un Nuevo Post

### Opción 1: Crear archivo Markdown (Recomendado)

1. Crea un archivo en `content/posts/`:
   ```bash
   content/posts/mi-nuevo-post.md
   ```

2. Agrega el frontmatter:
   ```markdown
   ---
   title: "Título de mi Post"
   excerpt: "Descripción corta del post"
   author: "Guido Miranda"
   publishedAt: "2026-03-05"
   tags: ["tag1", "tag2", "tag3"]
   imageUrl: "/images/mi-post.jpg"
   ---
   
   # Contenido del Post
   
   Tu contenido en Markdown aquí...
   ```

3. El post aparecerá automáticamente en `/blog`

### Opción 2: Usar HTML
Coloca el archivo HTML en `content/posts/`, pero considera convertirlo a Markdown para mejor mantenimiento.

## 🚀 Comandos Útiles

```bash
# Desarrollo local
npm run dev                    # Inicia servidor local en http://localhost:3000

# Tests
npm run test                   # Tests unitarios
npm run test:watch             # Tests en modo watch
npm run test:e2e              # Tests end-to-end
npm run test:e2e:ui           # Tests E2E con UI

# Validación de specs
npm run spec:validate         # Valida specs
npm run spec:coverage         # Cobertura de specs
npm run spec:check            # Validación completa

# Build
npm run build                 # Build de producción
npm run start                 # Inicia app en modo producción
npm run lint                  # Ejecuta ESLint
```

## 🔐 Secrets Necesarios en GitHub

Configura estos secrets en GitHub Settings → Secrets:

### Firebase
- `FIREBASE_SERVICE_ACCOUNT` - Credenciales de servicio
- `FIREBASE_PROJECT_ID` - ID del proyecto

### Configuración de App
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `OPENAI_API_KEY`

### GitHub
- `GH_TOKEN` - Token con permisos de write:packages
- `NPM_TOKEN` - Token de npm (opcional)

## 📊 Estrategia de Branches

```
main (producción)
  ← develop (staging/RC)
      ← feature/* (nuevas features)
      ← fix/* (bug fixes)
```

### Reglas:
- Nunca hacer commit directo a `main` o `develop`
- Siempre usar PRs
- PRs requieren pasar todas las validaciones
- `develop` → Release Candidate
- `main` → Producción

## 🎯 Mejores Prácticas

1. **Commits Semánticos**
   ```
   feat: nueva funcionalidad
   fix: corrección de bug
   docs: cambios en documentación
   chore: tareas de mantenimiento
   test: agregar o modificar tests
   ```

2. **Actualizar CHANGELOG.md**
   - Siempre documenta tus cambios
   - El PR validation lo verificará

3. **Tests**
   - Escribe tests para nuevas features
   - Mantén cobertura > 80%

4. **Especificaciones**
   - Mantén las specs actualizadas
   - Ejecuta `npm run spec:check` antes de crear PR

## 🌐 URLs del Proyecto

- **Desarrollo Local:** http://localhost:3000
- **Preview (develop):** https://PROJECT_ID--develop-HASH.web.app
- **Producción:** https://PROJECT_ID.web.app

---

**Última actualización:** 2026-03-05
