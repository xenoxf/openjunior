/**
 * Mobile-only runtime helpers for the dedicated Capacitor / /mobile.html path.
 *
 * These are intentionally dependency-free: @capacitor/* is not a dependency of
 * @glenker/ui, so haptics fall back to the Web Vibration API. Visual viewport
 * sizing keeps 100vh/100% layouts correct under the Android software keyboard
 * and collapsible URL bar (works alongside the `interactive-widget` viewport
 * meta already set in the mobile HTML).
 */

/* --------------------------------------------------------------------------
 * Native agent bridge (Capacitor `Glenker` plugin)
 *
 * The native Android side runs the real OpenCode engine (lildax) as one or
 * more local subprocesses, each bound to its own loopback port. The JS layer
 * launches them through the `Glenker` Capacitor plugin. Multi-agent "team"
 * execution is supported: `startAgentTeam` fires a single `startTeam` call
 * that the native side fans out into N parallel subprocesses.
 * ------------------------------------------------------------------------ */

export interface AgentHandle {
  id: string;
  port: number;
  running: boolean;
}

export interface AgentSummary {
  id: string;
  port: number;
  running: boolean;
}

/** Result of starting a team: the count plus each agent's loopback port. */
export interface TeamResult {
  count: number;
  running: boolean;
  agents: AgentSummary[];
}

interface GlenkerPlugin {
  startAgent(opts: { id?: string; port?: number }): Promise<{ id?: string; port: number; running: boolean }>;
  startTeam(opts: { agents: Array<{ id: string; port?: number }> }): Promise<TeamResult>;
  stopAgent(opts: { id: string }): Promise<{ stopped: boolean }>;
  stopAll(): Promise<{ running: boolean }>;
  agentStatus(opts: { id: string }): Promise<{ id: string; running: boolean }>;
  listAgents(): Promise<{ agents: AgentSummary[] }>;
}

/** Returns the `Glenker` plugin when running inside Capacitor, else null. */
function getGlenkerPlugin(): GlenkerPlugin | null {
  const cap = (globalThis as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } }).Capacitor;
  const plugin = cap?.Plugins?.Glenker as GlenkerPlugin | undefined;
  return plugin ?? null;
}

/** True when running inside the native Capacitor shell (Android). */
export function isNativeAgentAvailable(): boolean {
  return getGlenkerPlugin() !== null;
}

/** Starts a single agent and resolves with its handle (auto-allocated port). */
export async function startAgent(opts: { id?: string; port?: number } = {}): Promise<AgentHandle> {
  const plugin = getGlenkerPlugin();
  if (!plugin) {
    return { id: opts.id ?? 'agent', port: opts.port ?? 4096, running: false };
  }
  const res = await plugin.startAgent(opts);
  return { id: res.id ?? opts.id ?? 'agent', port: res.port, running: res.running };
}

/**
 * Starts a team of agents in parallel via a single native `startTeam` call.
 * The native side launches every agent concurrently. Returns the count and the
 * per-agent port map for building SDK base URLs.
 */
export async function startAgentTeam(
  agents: Array<{ id: string; port?: number }>,
): Promise<TeamResult> {
  const plugin = getGlenkerPlugin();
  if (!plugin) {
    return {
      count: agents.length,
      running: false,
      agents: agents.map((a) => ({ id: a.id, port: a.port ?? 4096, running: false })),
    };
  }
  return plugin.startTeam({ agents });
}

/** Stops one agent by id. */
export async function stopAgent(id: string): Promise<boolean> {
  const plugin = getGlenkerPlugin();
  if (!plugin) return false;
  const res = await plugin.stopAgent({ id });
  return res.stopped;
}

/** Stops all agents. */
export async function stopAllAgents(): Promise<void> {
  const plugin = getGlenkerPlugin();
  if (!plugin) return;
  await plugin.stopAll();
}

/** Reports whether a given agent is currently running. */
export async function agentStatus(id: string): Promise<boolean> {
  const plugin = getGlenkerPlugin();
  if (!plugin) return false;
  const res = await plugin.agentStatus({ id });
  return res.running;
}

/** Lists live agents with their ports. */
export async function listAgents(): Promise<AgentSummary[]> {
  const plugin = getGlenkerPlugin();
  if (!plugin) return [];
  const res = await plugin.listAgents();
  return res.agents;
}

/** Builds the local SDK base URL for an agent port. Mirrors the test contract. */
export function buildAgentBaseUrl(port: number): string {
  return `http://127.0.0.1:${port}`;
}

/** Mirrors the visualViewport height logic used by `initAppHeight`. */
export function computeAppHeight(visualViewportHeight: number | null | undefined): number {
  if (typeof visualViewportHeight === 'number' && Number.isFinite(visualViewportHeight)) {
    return Math.round(visualViewportHeight);
  }
  return 0;
}


/** Light haptic tick. No-op where the Vibration API is unavailable (iOS Safari). */
export function haptic(pattern: number | number[] = 8): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when vibration is blocked by permissions policy.
  }
}

/**
 * Publishes `--app-height` on :root from the current visual viewport height and
 * keeps it fresh across orientation changes, keyboard show/hide, and resize.
 * Returns a disposer that removes the listeners. Safe to call once at boot.
 */
export function initAppHeight(): () => void {
  if (typeof window === 'undefined') return () => {};

  const apply = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    if (height > 0) {
      document.documentElement.style.setProperty('--app-height', `${height}px`);
    }
  };

  apply();

  window.visualViewport?.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('scroll', apply);
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);

  return () => {
    window.visualViewport?.removeEventListener('resize', apply);
    window.visualViewport?.removeEventListener('scroll', apply);
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
  };
}
