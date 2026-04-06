import type { CapacitorConfig } from '@capacitor/cli';

// Build steps before running `npx cap sync` on macOS:
// 1. Run `npm run build` — this produces the Vite output in dist/public/
// 2. Run `npx cap sync` — copies dist/public into the native iOS project
// 3. Run `npx cap open ios` to open Xcode (macOS only)

const config: CapacitorConfig = {
  appId: 'com.lotterypro.app',
  appName: 'LotteryPro',
  webDir: 'dist/public',
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
  },
  plugins: {
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#1e3a5f',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
    },
  },
};

export default config;
