import { createConfiguredWebAPIs } from './runtimeConfig';
import type { RuntimeAPIs } from '@glenker/ui/lib/api/types';
import '@glenker/ui/index.css';
import '@glenker/ui/styles/fonts';

declare global {
  interface Window {
    __GLENKER_RUNTIME_APIS__?: RuntimeAPIs;
  }
}

window.__GLENKER_RUNTIME_APIS__ = createConfiguredWebAPIs();

void import('@glenker/ui/apps/renderMobileApp')
  .then(({ renderMobileApp }) => {
    renderMobileApp(window.__GLENKER_RUNTIME_APIS__ ?? createConfiguredWebAPIs());
  });
