import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

import("@capacitor/core").then(async ({ Capacitor }) => {
  if (!Capacitor.isNativePlatform()) return;

  const { App: CapApp } = await import("@capacitor/app");
  CapApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      CapApp.exitApp();
    }
  });

  // Initialize Apple IAP product registration (iOS only)
  const { initIAP } = await import("./lib/iapService");
  initIAP().catch(() => {});
}).catch(() => {});
