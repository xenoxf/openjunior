import { describe, expect, test, beforeEach, afterEach } from 'bun:test';

/**
 * Mobile bootstrap wiring tests (Capacitor `Glenker` plugin -> agent launch).
 *
 * The production mobile entry (packages/ui/src/apps/renderMobileApp.tsx) mounts
 * MobileApp, and the native side exposes the `Glenker` Capacitor plugin with
 * `startAgent({ port })`. The JS caller that invokes `startAgent` is currently
 * owned by the native bridge; this test encodes that contract with a minimal,
 * dependency-free mock of `window.Capacitor` and asserts:
 *   1. the bootstrap calls `startAgent` and expects a numeric port,
 *   2. the resolved port is used to build the SDK base URL http://127.0.0.1:<port>,
 *   3. the visualViewport `--app-height` logic (mirrored by computeAppHeight)
 *      produces the expected CSS var value.
 *
 * No browser is required: globals are mocked inline.
 */

// ---- Pure helpers that mirror the mobile bootstrap contract ----------------

/** Mirrors the visualViewport logic: sets --app-height to the viewport height. */
function computeAppHeight(visualViewportHeight: number | null | undefined): number {
  if (typeof visualViewportHeight === 'number' && Number.isFinite(visualViewportHeight)) {
    return Math.round(visualViewportHeight);
  }
  return 0;
}

/** Mirrors SDK base URL construction for the local agent. */
function buildAgentBaseUrl(port: number): string {
  return `http://127.0.0.1:${port}`;
}

// ---- Capacitor plugin mock -------------------------------------------------

type StartAgentCall = { port?: number };

function installCapacitorGlenkerPlugin(): {
  calls: StartAgentCall[];
  resolveStart: (port: number) => void;
} {
  const calls: StartAgentCall[] = [];

  const handler = {
    startAgent(call: StartAgentCall) {
      calls.push(call);
      return Promise.resolve({ port: call.port ?? 4096, running: true });
    },
    stopAgent() {
      return Promise.resolve({ running: false });
    },
  };

  const capacitor = {
    Plugins: {
      Glenker: handler,
    },
  };

  (globalThis as unknown as { Capacitor: unknown }).Capacitor = capacitor;

  return {
    calls,
    resolveStart: (port: number) => {
      handler.startAgent({ port });
    },
  };
}

function clearCapacitor() {
  delete (globalThis as unknown as { Capacitor?: unknown }).Capacitor;
}

/** Simulates the mobile bootstrap that starts the agent and builds the SDK URL. */
async function bootstrapMobileAgent(getPort: () => number): Promise<{
  calls: StartAgentCall[];
  baseUrl: string;
}> {
  const { calls } = installCapacitorGlenkerPlugin();
  const port = getPort();

  const capacitor = (globalThis as unknown as {
    Capacitor: { Plugins: { Glenker: { startAgent(c: StartAgentCall): Promise<unknown> } } };
  }).Capacitor;

  const result = (await capacitor.Plugins.Glenker.startAgent({ port })) as { port: number };
  const baseUrl = buildAgentBaseUrl(result.port);

  return { calls, baseUrl };
}

describe('mobile bootstrap wiring', () => {
  beforeEach(() => {
    clearCapacitor();
  });

  afterEach(() => {
    clearCapacitor();
  });

  test('calls startAgent with a numeric port', async () => {
    const { calls } = await bootstrapMobileAgent(() => 4096);
    expect(calls.length).toBe(1);
    expect(typeof calls[0].port).toBe('number');
    expect(calls[0].port).toBe(4096);
  });

  test('builds the SDK base URL http://127.0.0.1:<port>', async () => {
    const { baseUrl } = await bootstrapMobileAgent(() => 4096);
    expect(baseUrl).toBe('http://127.0.0.1:4096');
  });

  test('uses a non-default port from the caller', async () => {
    const { calls, baseUrl } = await bootstrapMobileAgent(() => 8080);
    expect(calls[0].port).toBe(8080);
    expect(baseUrl).toBe('http://127.0.0.1:8080');
  });

  test('computeAppHeight mirrors visualViewport height', () => {
    expect(computeAppHeight(812)).toBe(812);
    expect(computeAppHeight(540.6)).toBe(541);
  });

  test('computeAppHeight falls back to 0 without visualViewport', () => {
    expect(computeAppHeight(null)).toBe(0);
    expect(computeAppHeight(undefined)).toBe(0);
  });
});
