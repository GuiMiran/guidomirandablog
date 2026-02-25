# Spec-Driven Development Workflow

## Introducción
Este proyecto implementa Spec-Driven Development (SDD), un enfoque donde las especificaciones son la fuente de verdad y guían todo el proceso de desarrollo.

## Estructura de Especificaciones

```
docs/
├── specs/
│   ├── components/          # Especificaciones de componentes React
│   │   ├── ChatBot.spec.md
│   │   ├── PostCard.spec.md
│   │   └── ...
│   ├── api/                 # Especificaciones de API (OpenAPI)
│   │   ├── chat.spec.yaml
│   │   ├── generate.spec.yaml
│   │   └── ...
│   ├── state-machines/      # Máquinas de estado (XState)
│   │   ├── chat-flow.ts
│   │   ├── auth-flow.ts
│   │   └── ...
│   └── schemas/             # Esquemas de datos (Zod)
│       ├── post.schema.ts
│       ├── comment.schema.ts
│       └── ...
└── user-stories/            # Historias de usuario
    ├── ai-agentica.md
    └── spec-driven-development.md
```

## Workflow de Desarrollo

### 1. Escribir Especificación
Antes de escribir código, crea una especificación detallada:

```bash
# Para componentes
código en: docs/specs/components/[ComponentName].spec.md

# Para APIs
código en: docs/specs/api/[endpoint-name].spec.yaml

# Para esquemas de datos
código en: docs/specs/schemas/[entity].schema.ts
```

### 2. Validar Especificación
```bash
npm run spec:validate
```

Verifica:
- Sintaxis correcta
- Completitud de la especificación
- Consistencia con otras specs

### 3. Generar Tests
```bash
npm run spec:generate-tests
```

Genera automáticamente:
- Tests unitarios desde specs de componentes
- Tests de contrato desde specs de API
- Tests de esquema desde Zod schemas

### 4. Implementar
Desarrolla el código siguiendo la especificación.

### 5. Validar Implementación
```bash
npm run spec:diff
```

Compara la implementación con la especificación y reporta diferencias.

### 6. Ejecutar Tests
```bash
npm test                    # Tests unitarios
npm run test:e2e           # Tests E2E
npm run spec:test          # Validación de cobertura de specs
```

### 7. Generar Documentación
```bash
npm run spec:docs
```

Genera documentación automática desde las especificaciones.

## Comandos Disponibles

### Validación
```bash
npm run spec:validate         # Valida todas las especificaciones
npm run spec:validate:api     # Valida solo specs de API
npm run spec:validate:components  # Valida solo specs de componentes
```

### Generación
```bash
npm run spec:generate-tests   # Genera tests desde specs
npm run spec:generate-types   # Genera tipos TypeScript desde OpenAPI
npm run spec:docs             # Genera documentación
```

### Análisis
```bash
npm run spec:diff             # Compara implementación vs spec
npm run spec:coverage         # Reporta cobertura de especificaciones
npm run spec:check            # Ejecuta todas las validaciones
```

## Plantillas de Especificación

### Componente React
```markdown
# Component Specification: ComponentName

## Overview
Brief description of the component

## Props Interface
\`\`\`typescript
interface ComponentProps {
  // Props definition
}
\`\`\`

## States
- List all possible component states

## Behavior
Detailed description of component behavior

## API Contract (if applicable)
Request/response formats

## Required Tests
- [ ] Test 1
- [ ] Test 2

## Dependencies
List of dependencies

## Performance Considerations
Any performance notes
```

### API Endpoint (OpenAPI)
```yaml
openapi: 3.0.0
info:
  title: API Name
  version: 1.0.0

paths:
  /api/endpoint:
    post:
      summary: Brief description
      requestBody:
        required: true
        content:
          application/json:
            schema:
              # Schema definition
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                # Schema definition
```

### Schema de Datos (Zod)
```typescript
import { z } from 'zod';

export const EntitySchema = z.object({
  id: z.string(),
  // ... fields
});

export type Entity = z.infer<typeof EntitySchema>;

// Validation function
export function validateEntity(data: unknown): Entity {
  return EntitySchema.parse(data);
}
```

## Herramientas Integradas

### 1. TypeScript Compiler
Valida tipos y contratos de interfaces.

### 2. Zod
Validación de esquemas en runtime.

### 3. OpenAPI Tools
- Validación de especificaciones
- Generación de tipos TypeScript
- Generación de documentación Swagger

### 4. Vitest
Testing framework con soporte para:
- Unit tests
- Integration tests
- Component tests

### 5. Playwright
E2E testing basado en especificaciones.

## Beneficios de SDD

### ✅ Documentación Siempre Actualizada
La documentación se genera desde el código y las specs.

### ✅ Menos Bugs
Validación automática previene drift entre spec e implementación.

### ✅ Mejor Colaboración
Especificaciones claras facilitan el trabajo en equipo.

### ✅ Onboarding Más Rápido
Nuevos desarrolladores entienden el sistema más rápido.

### ✅ Tests Más Completos
Tests generados desde specs garantizan cobertura.

### ✅ Refactoring Seguro
Las specs actúan como red de seguridad.

## Reglas de Oro

1. **Spec Primero**: Nunca escribir código sin spec
2. **Spec Como Verdad**: La spec es la fuente de verdad, no el código
3. **Validación Continua**: Validar spec vs implementación en CI/CD
4. **Tests Automáticos**: Generar tests desde specs siempre que sea posible
5. **Documentación Viva**: Mantener docs sincronizadas con specs

## Integración CI/CD

El pipeline valida:
1. ✅ Sintaxis de especificaciones
2. ✅ Implementación cumple con specs
3. ✅ Tests generados pasan
4. ✅ Cobertura de specs al 100%
5. ✅ Documentación generada exitosamente

Si alguna validación falla, el build falla.

## Ejemplos

### Ejemplo 1: Agregar Nuevo Componente
```bash
# 1. Crear especificación
code docs/specs/components/NewComponent.spec.md

# 2. Validar especificación
npm run spec:validate

# 3. Generar tests
npm run spec:generate-tests

# 4. Implementar componente
code src/components/NewComponent.tsx

# 5. Validar implementación
npm run spec:diff

# 6. Ejecutar tests
npm test

# 7. Generar docs
npm run spec:docs
```

### Ejemplo 2: Agregar Nuevo Endpoint
```bash
# 1. Crear especificación OpenAPI
code docs/specs/api/new-endpoint.spec.yaml

# 2. Generar tipos TypeScript
npm run spec:generate-types

# 3. Implementar endpoint
code src/app/api/new-endpoint/route.ts

# 4. Validar contrato
npm run spec:test

# 5. Deploy documentación
npm run spec:docs
```

## Recursos Adicionales

- [OpenAPI Specification](https://swagger.io/specification/)
- [Zod Documentation](https://zod.dev/)
- [XState State Machines](https://xstate.js.org/)
- [Contract Testing Guide](https://martinfowler.com/articles/consumerDrivenContracts.html)

## Soporte

Para preguntas sobre SDD o ayuda con especificaciones:
1. Revisa los ejemplos en `docs/specs/`
2. Consulta las historias de usuario en `docs/user-stories/`
3. Ejecuta `npm run spec:help` para ayuda de comandos
