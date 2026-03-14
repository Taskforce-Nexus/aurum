# Reason

Sistema de creación de proyectos guiado por IA. Transforma una idea en un negocio estructurado con consejo asesor, documentos estratégicos y arquitectura de producto.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [VS Code](https://code.visualstudio.com/)
- Extensión de VS Code: **Pencil** (para ver los archivos `.pen` de diseño)
- Git

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Taskforce-Nexus/reason.git
cd reason

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las claves reales

# 4. Levantar el servidor de desarrollo
npm run dev
```

La app corre en **http://localhost:3000**

## Variables de entorno

Copia `.env.example` como `.env.local` y rellena con los valores reales:

```
NEXT_PUBLIC_SUPABASE_URL=        # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Clave pública Supabase
SUPABASE_SERVICE_ROLE_KEY=       # Clave de servicio (solo servidor)
SUPABASE_ACCESS_TOKEN=           # Token CLI de Supabase
NEXT_PUBLIC_APP_URL=             # URL base (http://localhost:3000 en dev)
ANTHROPIC_API_KEY=               # Clave Claude API
CLAUDE_USE_CHEAP=true            # true = Haiku (dev), omitir = Sonnet (prod)
GITHUB_CLIENT_ID=                # OAuth App GitHub
GITHUB_CLIENT_SECRET=            # OAuth App GitHub secret
DEEPGRAM_API_KEY=                # STT (voz)
CARTESIA_API_KEY=                # TTS (voz)
```

## Ver los diseños en Pencil

Los archivos `.pen` contienen los mockups y pantallas del sistema. Para abrirlos:

1. Instala la extensión **Pencil** en VS Code
2. Abre VS Code en la carpeta del proyecto
3. Haz clic derecho sobre `aurum.pen` y selecciona **Abrir con Pencil**

## Estructura del proyecto

```
src/
  app/
    (auth)/              # Login, registro, verify-email, forgot-password
    (dashboard)/         # Panel principal, proyectos, settings
    project/[id]/        # Incubadora, sesión de consejo, Export Center
    api/                 # Rutas de API (chat, session, consultoria, export)
    page.tsx             # Landing page pública
  components/
    auth/                # AuthBrandPanel
    consejo/             # MyBoard (Advisory Board)
    consultoria/         # ConsultoriaView (chat post-sesión)
    dashboard/           # ProjectCard, DashboardClient, UserMenu
    export/              # ExportCenter
    incubadora/          # IncubadoraChat
    seed-session/        # SeedSessionFlow (7 pasos)
    sesion-consejo/      # SesionConsejoView
    settings/            # SettingsBilling, SettingsAccount, SettingsTeam
  lib/
    claude.ts            # Wrapper Claude API
    prompts.ts           # Prompts del sistema
    types.ts             # Tipos TypeScript
```

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page pública |
| `/login` | Inicio de sesión |
| `/register` | Registro |
| `/dashboard` | Lista de proyectos |
| `/project/[id]` | Vista del proyecto (journey 5 etapas) |
| `/project/[id]/incubadora` | Sesión Semilla con Nexo |
| `/project/[id]/export` | Centro de Exportación |
| `/project/[id]/consejo` | Advisory Board |
| `/project/[id]/consultoria` | Consultoría Activa |
| `/settings/cuenta` | Configuración de cuenta |
| `/settings/facturacion` | Facturación y saldo |
| `/settings/equipo` | Equipo |
| `/settings/planes` | Planes |
| `/settings/notificaciones` | Notificaciones |
| `/settings/conexiones` | Integraciones |

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Base de datos:** Supabase (Postgres + Auth + Storage)
- **IA:** Claude API (Anthropic) — Sonnet para producción, Haiku para desarrollo
- **Voz:** Deepgram (STT) + Cartesia (TTS)
- **Diseño:** Pencil (archivos `.pen`)
- **Tests E2E:** Playwright

## Tests E2E

```bash
# Requiere servidor corriendo en localhost:3000
npm run dev

# En otra terminal
npx playwright test --headed
```

Los tests usan el usuario `e2e@reason.test` y generan fixtures automáticamente con `seedTestData()`.
