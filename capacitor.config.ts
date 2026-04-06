import type { CapacitorConfig } from '@capacitor/cli';

// iOS build steps (run on macOS with Xcode installed):
// 1. npm run build          → produces Vite output in dist/public/
// 2. npx cap add ios        → creates ios/ native project (first time only)
// 3. npx cap sync           → copies dist/public/ into iOS project + installs plugins
// 4. npx cap open ios       → opens Xcode for signing, archiving, TestFlight upload
//
// App icons: all sizes pre-generated in ios/App/App/Assets.xcassets/AppIcon.appiconset/
// Splash:    2732×2732 PNG in ios/App/App/Assets.xcassets/Splash.imageset/

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
      backgroundColor: '#4F46E5',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
