import { create } from 'zustand';
import { runtimeFetch } from '@/lib/runtime-fetch';

export type ServiceAuthStatus = {
  connected: boolean;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  error?: string;
};

type ServiceAuthStore = {
  services: Record<string, ServiceAuthStatus>;
  isLoading: Record<string, boolean>;
  setStatus: (service: string, status: ServiceAuthStatus | null) => void;
  refreshStatus: (service: string) => Promise<ServiceAuthStatus | null>;
};

const fetchServiceStatus = async (service: string): Promise<ServiceAuthStatus> => {
  const response = await runtimeFetch(`/api/auth/${service}/status`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const payload = (await response.json().catch(() => null)) as ServiceAuthStatus | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error || response.statusText || `Failed to load ${service} status`);
  }
  return payload;
};

export const useServiceAuthStore = create<ServiceAuthStore>((set, get) => ({
  services: {},
  isLoading: {},
  setStatus: (service, status) =>
    set((state) => ({
      services: { ...state.services, [service]: status ?? { connected: false } },
    })),
  refreshStatus: async (service) => {
    const { services } = get();
    const existing = services[service];
    if (existing && existing.connected) {
      return existing;
    }

    set((state) => ({ isLoading: { ...state.isLoading, [service]: true } }));
    try {
      const status = await fetchServiceStatus(service);
      set((state) => ({
        services: { ...state.services, [service]: status },
        isLoading: { ...state.isLoading, [service]: false },
      }));
      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status: ServiceAuthStatus = { connected: false, error: message };
      set((state) => ({
        services: { ...state.services, [service]: status },
        isLoading: { ...state.isLoading, [service]: false },
      }));
      return null;
    }
  },
}));
