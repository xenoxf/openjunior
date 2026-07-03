import { beforeEach, describe, expect, mock, test } from 'bun:test';

let lastFetchUrl = '';
let fetchResponse = { ok: true, json: () => Promise.resolve({ connected: false, email: '' }) };

mock.module('@/lib/runtime-fetch', () => ({
  runtimeFetch: (url: string) => {
    lastFetchUrl = url;
    return Promise.resolve(fetchResponse);
  },
}));

const { useServiceAuthStore } = await import('./useServiceAuthStore');

describe('useServiceAuthStore', () => {
  beforeEach(() => {
    useServiceAuthStore.setState({ services: {}, isLoading: {} });
    lastFetchUrl = '';
    fetchResponse = { ok: true, json: () => Promise.resolve({ connected: false, email: '' }) };
  });

  test('setStatus stores service status', () => {
    useServiceAuthStore.getState().setStatus('google', {
      connected: true,
      email: 'test@example.com',
    });
    const state = useServiceAuthStore.getState();
    expect(state.services.google?.connected).toBe(true);
    expect(state.services.google?.email).toBe('test@example.com');
  });

  test('setStatus with null resets to disconnected', () => {
    useServiceAuthStore.getState().setStatus('google', {
      connected: true,
      email: 'test@example.com',
    });
    useServiceAuthStore.getState().setStatus('google', null);
    const state = useServiceAuthStore.getState();
    expect(state.services.google?.connected).toBe(false);
    expect(state.services.google?.email).toBe(undefined);
  });

  test('setStatus does not affect other services', () => {
    useServiceAuthStore.getState().setStatus('google', { connected: true });
    useServiceAuthStore.getState().setStatus('slack', { connected: false });
    const state = useServiceAuthStore.getState();
    expect(state.services.google?.connected).toBe(true);
    expect(state.services.slack?.connected).toBe(false);
  });

  test('isLoading tracks loading state per service', () => {
    useServiceAuthStore.setState({ isLoading: { google: true } });
    expect(useServiceAuthStore.getState().isLoading.google).toBe(true);
    expect(useServiceAuthStore.getState().isLoading.slack).toBe(undefined);
  });

  test('refreshStatus returns cached status when already connected', async () => {
    useServiceAuthStore.getState().setStatus('google', {
      connected: true,
      email: 'test@example.com',
    });
    const result = await useServiceAuthStore.getState().refreshStatus('google');
    expect(result?.connected).toBe(true);
    expect(result?.email).toBe('test@example.com');
    // Should NOT have called fetch since already connected
    expect(lastFetchUrl).toBe('');
  });

  test('refreshStatus fetches status when not connected', async () => {
    fetchResponse = {
      ok: true,
      json: () => Promise.resolve({ connected: true, email: 'fetched@example.com' }),
    };
    const result = await useServiceAuthStore.getState().refreshStatus('slack');
    expect(lastFetchUrl).toBe('/api/auth/slack/status');
    expect(result).not.toBeNull();
    expect(result?.connected).toBe(true);
    expect(result?.email).toBe('fetched@example.com');
  });
});
