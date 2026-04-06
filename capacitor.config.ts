import type { CapacitorConfig } from '@capacitor/cli';

// Build steps before running `npx cap sync` on macOS:
// 1. Run `npm run build` — this produces the Vite output in dist/public/
// 2. Run `npx cap sync` — copies dist/public into the native iOS project
// 3. Run `npx cap open ios` to open Xcode (macOS only)

const config: CapacitorConfig = {
  appId: 'com.lotterypro.app',
  appName: 'LotteryPro',
  webDir: 'dist/public',
};

export default config;
