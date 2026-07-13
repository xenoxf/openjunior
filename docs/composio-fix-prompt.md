# Problemas con Composio Integrations

## Contexto

Glenker tiene un sistema de integraciones basado en Composio. Hay un catálogo de apps (Connectors page) donde el usuario descubre y conecta apps vía OAuth o credenciales custom. Y hay una página de Integraciones (bajo Advanced en settings) que debería listar las integraciones ya instaladas y permitir configurarlas.

Actualmente el sistema tiene bugs que impiden que funcione correctamente.

## Problemas a resolver

### 1. Después de hacer OAuth, la app no detecta que la conexión fue exitosa
El usuario abre un popup, hace login y autoriza, el popup se cierra... pero la app no muestra success. El success modal no aparece, o aparece después de mucho tiempo. El usuario no sabe si se conectó o no.

### 2. Las integraciones conectadas no aparecen en el sidebar de Integraciones (Advanced)
El sidebar debería listar las cuentas conectadas para que el usuario pueda seleccionarlas y ver su configuración. Pero no aparecen, o aparecen sin nombre/icono.

### 3. Falta feedback al usuario
No hay notificaciones (toasts) cuando:
- Una conexión OAuth se completa exitosamente
- Una conexión falla
- Se desconecta una integración

## Archivos relevantes

- `packages/ui/src/stores/useComposioStore.ts` — Store de Zustand con apps, connectedAccounts, y acciones
- `packages/ui/src/hooks/useComposioConnect.ts` — Hook para el flujo OAuth (actualmente con polling, parece no funcionar bien)
- `packages/ui/src/components/sections/connectors/IntegracionesSidebar.tsx` — Sidebar que debería listar integraciones conectadas
- `packages/ui/src/components/sections/connectors/IntegracionesPage.tsx` — Página de detalle/configuración de integración seleccionada
- `packages/ui/src/components/sections/connectors/IntegrationsTab.tsx` — Catálogo de apps para descubrir y conectar
- `packages/web/server/lib/composio/routes.js` — API routes de Composio
- `packages/web/server/lib/composio/service.js` — SDK wrapper de Composio

## Lo que debe lograr

1. El usuario hace clic en "Connect" en una app del catálogo → se abre popup OAuth → el usuario autoriza → **inmediatamente** la app debe mostrar un modal de éxito y la app debe aparecer como conectada. Tiempo máximo aceptable desde que se cierra el popup hasta que se muestra el éxito: 1-2 segundos.

2. En el sidebar de Integraciones (Advanced > Integraciones) deben listarse todas las cuentas conectadas, con su nombre e icono correctos.

3. Debe haber toasts de feedback: éxito al conectar, error al conectar, desconectado.

4. El botón "Re-authorize" en la página de detalle de integración debe funcionar igual que el connect.

5. Desconectar debe funcionar: eliminar la conexión, cerrar el diálogo, refrescar la UI.

## Lo que NO debe hacer

- No agregar nuevas dependencias
- No cambiar la arquitectura general (Express REST, Zustand, React hooks)
- No romper el flujo de conexión con credenciales custom (API_KEY, BASIC, etc.)
- No Introducir sistemas complejos (SSE, WebSocket) — mantener llamadas HTTP

## Criterios de aceptación

- Type-check pasa sin errores (los únicos errores permitidos son los pre-existentes en archivos de locale)
- Lint pasa sin errores nuevos
- El flujo completo funciona: conectar OAuth → ver en sidebar → ver detalle → re-authorizar → desconectar
- Toasts aparecen en cada operación
- Sin `setInterval` activo cuando no hay flujo OAuth en curso (cleanup correcto)
