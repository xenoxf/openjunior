import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.glenker.app',
  appName: 'Glenker',
  webDir: '../web/dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    // The OpenCode engine (lildax, a 121MB musl ARM64 binary) is bundled as a
    // native lib. Force a single-ABI build so the binary ships in every APK.
    buildOptions: {
      // uncomment to customize
    },
  },
};

export default config;
