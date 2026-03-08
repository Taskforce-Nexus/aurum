# AURUM — Seguridad y Variables de Entorno

## Variables de entorno requeridas

Todas las credenciales viven en `.env.local` — nunca en el código.

El archivo `.env.local` está en `.gitignore` y nunca debe commitearse.

Usa `.env.example` como referencia de qué variables configurar:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CLAUDE_USE_CHEAP=
```

## Reglas para el Builder Agent (Faber)

- Nunca commitear `.env.local` ni ningún archivo con credenciales reales
- Nunca hardcodear API keys, tokens o secrets en código fuente
- Nunca exponer SUPABASE_SERVICE_ROLE_KEY en código cliente
- Variables con prefijo `NEXT_PUBLIC_` son visibles en el browser — solo datos no sensibles
- Antes de cualquier push verificar que no hay credenciales en los archivos modificados

## Reglas para el equipo

- Rotar credenciales inmediatamente si se detecta exposición accidental
- Supabase RLS (Row Level Security) debe estar activo en todas las tablas
- El modelo Claude por defecto se configura en `.env.local` — nunca en código

## Archivos excluidos del repo (`.gitignore`)

- `.env*.local` — variables de entorno locales
- `.env.local` — credenciales de desarrollo
- `node_modules/` — dependencias
- `.next/` — build de Next.js
- `.claude/` — configuración interna de Claude Code
- `.kiro/` — configuración interna de Kiro
