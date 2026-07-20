import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  startAgentTeam,
  listAgents,
  buildAgentBaseUrl,
  computeAppHeight,
  type AgentSummary,
} from '../lib/mobile';

/**
 * Mobile bootstrap wiring tests (Capacitor `Glenker` plugin -> agent launch).
 *
 * The production mobile entry (packages/ui/src/apps/renderMobileApp.tsx) mounts
 * MobileApp, and the native side exposes the `Glenker` Capacitor plugin with
 * `startAgent({ port })` / `startTeam({ agents })` / `listAgents()`. The JS
 * callers that invoke them live in the native bridge; this test encodes that
 * contract with a minimal, dependency-free mock of `window.Capacitor` and
 * asserts:
 *   1. the bootstrap calls `startAgent` and expects a numeric port,
 *   2. the resolved port is used to build the SDK base URL http://127.0.0.1:<port>,
 *   3. the visualViewport `--app-height` logic (mirrored by computeAppHeight)
 *      produces the expected CSS var value,
 *   4. the multi-agent `startTeam` / `listAgents` contract fans out N agents.
 *
 * No browser is required: globals are mocked inline.
 */

// ---- Capacitor plugin mock -------------------------------------------------

type StartAgentCall = { port?: number };
type StartTeamCall = { agents: Array<{ id: string; port?: number }> };

function installCapacitorGlenkerPlugin(): {
  agentCalls: StartAgentCall[];
  teamCalls: StartTeamCall[];
  lastTeamAgents: AgentSummary[];
} {
  const agentCalls: StartAgentCall[] = [];
  const teamCalls: StartTeamCall[] = [];
  let lastTeamAgents: AgentSummary[] = [];

  const handler = {
    startAgent(call: StartAgentCall) {
      agentCalls.push(call);
      return Promise.resolve({ port: call.port ?? 4096, running: true });
    },
    startTeam(call: StartTeamCall) {
      teamCalls.push(call);
      const agents: AgentSummary[] = call.agents.map((a, i) => ({
        id: a.id,
        port: a.port ?? 4096 + i,
        running: true,
      }));
      lastTeamAgents = agents;
      return Promise.resolve({ count: agents.length, running: true, agents });
    },
    listAgents() {
      return Promise.resolve({ agents: lastTeamAgents });
    },
    stopAgent() {
      return Promise.resolve({ stopped: true });
    },
    stopAll() {
      return Promise.resolve({ running: false });
    },
  };

  const capacitor = {
    Plugins: {
      Glenker: handler,
    },
  };

  (globalThis as unknown as { Capacitor: unknown }).Capacitor = capacitor;

  return { agentCalls, get teamCalls() { return teamCalls; }, get lastTeamAgents() { return lastTeamAgents; } };
}

function clearCapacitor() {
  delete (globalThis as unknown as { Capacitor?: unknown }).Capacitor;
}

/** Simulates the mobile bootstrap that starts the agent and builds the SDK URL. */
async function bootstrapMobileAgent(getPort: () => number): Promise<{
  calls: StartAgentCall[];
  baseUrl: string;
}> {
  const { agentCalls } = installCapacitorGlenkerPlugin();
  const port = getPort();

  const capacitor = (globalThis as unknown as {
    Capacitor: { Plugins: { Glenker: { startAgent(c: StartAgentCall): Promise<{ port: number }> } } };
  }).Capacitor;

  const result = (await capacitor.Plugins.Glenker.startAgent({ port })).port;
  const baseUrl = buildAgentBaseUrl(result);

  return { calls: agentCalls, baseUrl };
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

  describe('multi-agent team contract', () => {
    test('startAgentTeam calls startTeam once with 3 agents', async () => {
      const { teamCalls } = installCapacitorGlenkerPlugin();
      await startAgentTeam([{ id: 'primary' }, { id: 'research' }, { id: 'coder' }]);
      expect(teamCalls.length).toBe(1);
      expect(teamCalls[0].agents.length).toBe(3);
    });

    test('startAgentTeam returns a TeamResult with distinct ports', async () => {
      installCapacitorGlenkerPlugin();
      const result = await startAgentTeam([
        { id: 'primary' },
        { id: 'research' },
        { id: 'coder' },
      ]);

      expect(result.count).toBe(3);
      expect(result.running).toBe(true);
      const agents = (result as unknown as { agents: AgentSummary[] }).agents;
      expect(agents.length).toBe(3);

      for (const agent of agents) {
        expect(typeof agent.port).toBe('number');
      }

      const ports = agents.map((a) => a.port);
      expect(new Set(ports).size).toBe(ports.length);
    });

    test('buildAgentBaseUrl matches the first agent port', async () => {
      installCapacitorGlenkerPlugin();
      const result = await startAgentTeam([
        { id: 'primary' },
        { id: 'research' },
        { id: 'coder' },
      ]);
      const agents = (result as unknown as { agents: AgentSummary[] }).agents;
      expect(buildAgentBaseUrl(agents[0].port)).toBe(
        `http://127.0.0.1:${agents[0].port}`,
      );
    });

    test('listAgents returns the started agents', async () => {
      installCapacitorGlenkerPlugin();
      const started = await startAgentTeam([
        { id: 'primary' },
        { id: 'research' },
        { id: 'coder' },
      ]);
      const startedAgents = (started as unknown as { agents: AgentSummary[] }).agents;

      const listed = await listAgents();
      expect(listed.length).toBe(startedAgents.length);
      for (let i = 0; i < startedAgents.length; i++) {
        expect(listed[i].id).toBe(startedAgents[i].id);
        expect(listed[i].port).toBe(startedAgents[i].port);
      }
    });

    test('listAgents returns empty when no team started', async () => {
      const listed = await listAgents();
      expect(listed).toEqual([]);
    });
  });
});
