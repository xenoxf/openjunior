# Glenker Session Summary

## Objective
Complete a large set of features/fixes for Glenker:
1. Fix Appearance toggle buttons (showTerminalButton, showMiniBrowserButton, showRightSidebarButton)
2. Create standalone "Integraciones" Composio settings page
3. Fix Skills card styling to match MCP cards
4. Implement /goal command (Claude Code-style)
5. Make Composio tools functional with OpenCode via MCP bridge

## Files Modified

### Header.tsx
- `packages/ui/src/components/layout/Header.tsx`
- Removed `showAdvancedControls &&` gate blocking `showMiniBrowserButton` / `showRightSidebarButton`
- Added terminal toggle button using `showTerminalButton`, `toggleBottomTerminal`, `isBottomTerminalOpen`

### IntegracionesPage.tsx (NEW)
- `packages/ui/src/components/sections/connectors/IntegracionesPage.tsx`
- Standalone page with search, connected/available sections, OAuth success modal (Dialog)
- Clickable cards with `onConnect` handler

### ComposioIntegrationCard.tsx
- `packages/ui/src/components/sections/connectors/ComposioIntegrationCard.tsx`
- Added `onConnect` / `isConnecting` props
- Card clickable when `onConnect` provided

### SettingsView.tsx
- `packages/ui/src/components/views/SettingsView.tsx`
- Added `'integrations'` to `ADVANCED_PAGES`
- Separate `case 'integrations':` rendering `<IntegracionesPage />`

### Metadata
- `packages/ui/src/lib/settings/metadata.ts`
- Added `'integrations'` metadata entry with `isAvailable: (ctx) => !ctx.isVSCode`

### ConnectorCard.tsx
- `packages/ui/src/components/sections/connectors/ConnectorCard.tsx`
- Changed skill `TYPE_CONFIG` accent to `'var(--primary-base)'` (matching MCP)

### Magic Prompts
- `packages/ui/src/lib/magicPrompts.ts`
- Added `'session.goal.visible'` and `'session.goal.instructions'` magic prompts

### CommandAutocomplete.tsx
- `packages/ui/src/components/chat/CommandAutocomplete.tsx`
- Added `'glenker:goal'` to `builtInCommands`

### ChatInput.tsx
- `packages/ui/src/components/chat/ChatInput.tsx`
- Added `/goal` handler: reads `goalArg`, sends as hidden instruction with `{{goal}}` placeholder

### i18n - English
- `packages/ui/src/lib/i18n/messages/en.settings.ts` — 11 new keys
- `packages/ui/src/lib/i18n/messages/en.ts` — 2 new keys

### i18n - Spanish
- `packages/ui/src/lib/i18n/messages/es.settings.ts` — 11 new keys
- `packages/ui/src/lib/i18n/messages/es.ts` — 2 new keys

### Composio MCP Server (NEW)
- `packages/web/server/lib/composio/mcp-server.js`
- MCP server implementing tools/list, tools/call, initialize via @composio/core SDK

### Feature Routes Runtime
- `packages/web/server/lib/opencode/feature-routes-runtime.js`
- Auto-registers composio MCP server in opencode.json when COMPOSIO_API_KEY is set

## Pending Work

### i18n — Missing locale keys
All non-en/es locale files need the new keys added. Files to update:
- `packages/ui/src/lib/i18n/messages/fr.ts` — may have syntax issues (single-quote/apostrophe)
- `packages/ui/src/lib/i18n/messages/fr.settings.ts`
- `packages/ui/src/lib/i18n/messages/ko.ts`
- `packages/ui/src/lib/i18n/messages/ko.settings.ts`
- `packages/ui/src/lib/i18n/messages/uk.ts`
- `packages/ui/src/lib/i18n/messages/uk.settings.ts`
- `packages/ui/src/lib/i18n/messages/zh-CN.ts`
- `packages/ui/src/lib/i18n/messages/zh-CN.settings.ts`
- `packages/ui/src/lib/i18n/messages/zh-TW.ts`
- `packages/ui/src/lib/i18n/messages/zh-TW.settings.ts`
- `packages/ui/src/lib/i18n/messages/pt-BR.ts`
- `packages/ui/src/lib/i18n/messages/pt-BR.settings.ts`
- `packages/ui/src/lib/i18n/messages/pl.ts`
- `packages/ui/src/lib/i18n/messages/pl.settings.ts`

### Type-check
- `bun run type-check` in `packages/ui/` will fail until i18n keys are complete
- `bun run type-check` in `packages/web/` to validate composio MCP registration

## Important Notes
- French locale files use single quotes; apostrophes inside values must use double quotes as outer delimiter
- The /goal command sends user goal text as hidden instruction with {{goal}} placeholder
- Composio MCP server uses @composio/core SDK over stdio JSON-RPC
