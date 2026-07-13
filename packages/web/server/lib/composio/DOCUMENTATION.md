# Composio Module

Composio integration for Glenker. Provides access to 1000+ third-party apps
(Gmail, Slack, GitHub, Notion, etc.) through the Composio platform.

## Architecture

```
server/lib/composio/
├── service.js           # Core Composio SDK client wrapper
├── routes.js            # Express API routes
└── DOCUMENTATION.md     # This file
```

## API Key Security

The Composio API key is **NOT hardcoded** and is **NOT read from process.env**.

It is stored in `~/.config/glenker/settings.json` as `composioApiKey`.
Configure it via the Glenker UI at **Settings > Connectors > Composio**.

The API key is:
- Never exposed in API responses (masked as `hasComposioApiKey: boolean`)
- Read from persistent settings at server startup
- Passed directly to the `@composio/core` SDK constructor

## Flow

1. The app reads settings from `~/.config/glenker/settings.json` including `composioApiKey`.
2. The Integrations tab in Settings loads available apps from Composio.
3. User clicks "Connect [App]" which initiates the OAuth flow via Composio.
4. Composio returns a redirect URL; user authenticates with the provider.
5. A `connected_account_id` is created and stored.
6. The agent can execute actions on connected accounts using `composio.tools.execute()`.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/composio/apps                    | List available apps/integrations |
| GET    | /api/composio/apps/:slug              | Get app details |
| GET    | /api/composio/connections             | List connected accounts |
| GET    | /api/composio/connections/:id         | Get connected account details |
| DELETE | /api/composio/connections/:id         | Disconnect an account |
| POST   | /api/composio/apps/:slug/connect      | Initiate OAuth connection for an app |
| POST   | /api/composio/execute                 | Execute an action on a connected account |

## CLI Commands

```
glenker composio list          List available apps/integrations
glenker composio connect <app>  Connect an app
glenker composio status         Show connected accounts
```

The CLI reads the API key from `settings.json` (same as the server).
