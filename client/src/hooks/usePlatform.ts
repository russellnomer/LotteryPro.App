import { useState, useEffect } from "react";

export type Platform = "web" | "ios";

function detectPlatform(): Platform {
  try {
    const { Capacitor } = require("@capacitor/core");
    const p = Capacitor.getPlatform();
    if (p === "ios") return "ios";
    return "web";
  } catch {
    return "web";
  }
}

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("web");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return platform;
}
