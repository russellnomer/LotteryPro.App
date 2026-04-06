import type { Platform } from "@/hooks/usePlatform";

export async function openExternal(url: string, platform: Platform): Promise<void> {
  if (platform === "ios") {
    try {
      const { InAppBrowser } = await import("@capacitor/inappbrowser");
      await InAppBrowser.openInExternalBrowser({ url });
      return;
    } catch (err) {
      console.warn("openInExternalBrowser unavailable, falling back to window.open", err);
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
