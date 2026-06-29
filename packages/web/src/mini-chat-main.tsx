import { createConfiguredWebAPIs } from './runtimeConfig';
import type { RuntimeAPIs } from '@openjunior/ui/lib/api/types';
import '@openjunior/ui/index.css';
import '@openjunior/ui/styles/fonts';

declare global {
  interface Window {
    __OPENJUNIOR_RUNTIME_APIS__?: RuntimeAPIs;
  }
}

window.__OPENJUNIOR_RUNTIME_APIS__ = createConfiguredWebAPIs();

void import('@openjunior/ui/apps/renderElectronMiniChatApp')
  .then(({ renderElectronMiniChatApp }) => {
    renderElectronMiniChatApp(window.__OPENJUNIOR_RUNTIME_APIS__ ?? createConfiguredWebAPIs());
  });
