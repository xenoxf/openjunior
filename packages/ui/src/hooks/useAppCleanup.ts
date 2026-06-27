import { useEffect } from 'react';
import { disposeTerminalInputTransport } from '@/lib/terminalApi';
import { resetStreamingState } from '@/sync/streaming';

export function useAppCleanup(): void {
  useEffect(() => {
    const cleanup = () => {
      disposeTerminalInputTransport();
      resetStreamingState();
    };

    window.addEventListener('pagehide', cleanup);
    window.addEventListener('beforeunload', cleanup);

    return () => {
      window.removeEventListener('pagehide', cleanup);
      window.removeEventListener('beforeunload', cleanup);
    };
  }, []);
}
