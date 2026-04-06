/**
 * iOS In-App Purchase service — StoreKit 2 via Capacitor native bridge.
 *
 * This file is safe to import on web — no native plugin is imported statically.
 * On iOS, @capawesome-team/capacitor-purchases registers itself on the global
 * window.Capacitor.Plugins object after `npx cap sync`.
 *
 * Product IDs must match App Store Connect exactly:
 *   com.lotterypro.app.premium.monthly  — $7.99/month
 *   com.lotterypro.app.premium.annual   — $69/year
 *
 * Flow:
 *   1. initIAP()          → registers product IDs with StoreKit (iOS startup)
 *   2. getIAPProducts()   → fetches live titles + prices from App Store
 *   3. purchaseProduct()  → shows Apple payment sheet → verifies with server
 *   4. restorePurchases() → re-verifies active entitlements with server
 */

export const IAP_PRODUCT_IDS = {
  monthly: "com.lotterypro.app.premium.monthly",
  annual: "com.lotterypro.app.premium.annual",
} as const;

export type IAPProductId = (typeof IAP_PRODUCT_IDS)[keyof typeof IAP_PRODUCT_IDS];

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export interface IAPPurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  subscriptionTier?: string;
  expiresAt?: string;
  error?: string;
  cancelled?: boolean;
}

export interface IAPRestoreResult {
  success: boolean;
  restored: number;
  error?: string;
}

// ── Access the native plugin via the Capacitor global (never statically import) ──
// The plugin name "CapawesomePurchases" is set by @capawesome-team/capacitor-purchases
// and registered on the native iOS bridge via `npx cap sync`.
function getNativePlugin(): any | null {
  try {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return null;
    return cap?.Plugins?.CapawesomePurchases ?? null;
  } catch {
    return null;
  }
}

// ── Init ──
// Call once at app startup on iOS. Registers the product IDs with StoreKit.
export async function initIAP(): Promise<void> {
  const plugin = getNativePlugin();
  if (!plugin) return;
  try {
    await plugin.setup({ productIds: Object.values(IAP_PRODUCT_IDS) });
    console.log("[IAP] Initialized with products:", Object.values(IAP_PRODUCT_IDS));
  } catch (err: any) {
    console.warn("[IAP] init failed:", err?.message);
  }
}

// ── Get live product info from the App Store ──
export async function getIAPProducts(): Promise<IAPProduct[]> {
  const plugin = getNativePlugin();

  // Web / simulator without plugin: return hardcoded fallback
  if (!plugin) {
    return [
      {
        productId: IAP_PRODUCT_IDS.monthly,
        title: "Premium Monthly",
        description: "Full premium access, billed monthly",
        price: "$7.99",
        priceAmount: 7.99,
        currency: "USD",
      },
      {
        productId: IAP_PRODUCT_IDS.annual,
        title: "Premium Annual",
        description: "Best value — save 27% vs monthly",
        price: "$69.00",
        priceAmount: 69.0,
        currency: "USD",
      },
    ];
  }

  try {
    const { products } = await plugin.getProducts({
      productIds: Object.values(IAP_PRODUCT_IDS),
    });

    return (products ?? []).map((p: any) => ({
      productId: p.productId,
      title: p.title,
      description: p.description,
      price: p.price,
      priceAmount: typeof p.priceAmount === "number" ? p.priceAmount : 0,
      currency: p.currency || "USD",
    }));
  } catch (err: any) {
    console.warn("[IAP] getProducts failed:", err?.message);
    return [];
  }
}

// ── Purchase a product ──
export async function purchaseProduct(productId: string): Promise<IAPPurchaseResult> {
  const plugin = getNativePlugin();
  if (!plugin) {
    return { success: false, error: "IAP not available on this platform" };
  }

  try {
    const result = await plugin.purchaseProduct({ productId });
    const transaction = result?.transaction;

    if (!transaction) {
      return { success: false, error: "No transaction returned from StoreKit" };
    }

    const signedTransactionInfo =
      transaction.jwsRepresentation ?? transaction.signedTransactionInfo;

    if (!signedTransactionInfo) {
      return {
        success: false,
        error: "No signed transaction info — cannot verify with server",
      };
    }

    return verifyWithServer(signedTransactionInfo);
  } catch (err: any) {
    const msg: string = err?.message ?? "";

    if (
      msg.includes("cancelled") ||
      msg.includes("cancel") ||
      msg.includes("SKErrorPaymentCancelled") ||
      err?.code === "PAYMENT_CANCELLED"
    ) {
      return { success: false, cancelled: true };
    }

    console.error("[IAP] purchaseProduct error:", msg);
    return { success: false, error: msg || "Purchase failed" };
  }
}

// ── Restore purchases ──
export async function restorePurchases(): Promise<IAPRestoreResult> {
  const plugin = getNativePlugin();
  if (!plugin) {
    return { success: false, error: "IAP not available on this platform" };
  }

  try {
    const result = await plugin.restorePurchases();
    const transactions: any[] = result?.transactions ?? [];
    let restoredCount = 0;

    for (const tx of transactions) {
      const signedTransactionInfo =
        tx.jwsRepresentation ?? tx.signedTransactionInfo;
      if (!signedTransactionInfo) continue;

      const r = await verifyWithServer(signedTransactionInfo);
      if (r.success) restoredCount++;
    }

    return { success: true, restored: restoredCount };
  } catch (err: any) {
    console.error("[IAP] restorePurchases error:", err?.message);
    return { success: false, error: err?.message || "Restore failed" };
  }
}

// ── Internal: verify signed JWS token with our server ──
async function verifyWithServer(signedTransactionInfo: string): Promise<IAPPurchaseResult> {
  try {
    const resp = await fetch("/api/apple/verify-iap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ signedTransactionInfo }),
    });

    const data = await resp.json();

    if (!resp.ok || !data.success) {
      console.warn("[IAP] server verification failed:", data.error);
      return { success: false, error: data.error || "Server verification failed" };
    }

    return {
      success: true,
      productId: data.productId,
      transactionId: data.transactionId,
      subscriptionTier: data.subscriptionTier,
      expiresAt: data.expiresAt,
    };
  } catch (err: any) {
    console.error("[IAP] verifyWithServer network error:", err?.message);
    return {
      success: false,
      error:
        "Network error — Apple recorded the purchase. Use Restore Purchases to activate your subscription.",
    };
  }
}
