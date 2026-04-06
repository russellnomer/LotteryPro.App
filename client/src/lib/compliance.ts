import type { Platform } from "@/hooks/usePlatform";

export function shouldShowWebPayments(platform: Platform): boolean {
  return platform === "web";
}

export function shouldShowIAP(platform: Platform): boolean {
  return platform === "ios";
}
