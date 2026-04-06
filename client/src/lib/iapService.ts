/**
 * iOS In-App Purchase service — StoreKit 2 via a custom Capacitor plugin.
 *
 * Architecture:
 * - JavaScript side: uses registerPlugin() from @capacitor/core to call the
 *   native Swift plugin (LotteryProIAPPlugin) which is registered in the iOS
 *   Xcode project under ios/App/App/Plugins/LotteryProIAP/.
 * - On web, registerPlugin() returns a no-op implementation so all calls
 *   gracefully return empty results.
 * - The signed JWS transaction token from StoreKit 2 is sent to the server
 *   at /api/apple/verify-iap for verification and tier upgrade.
 *
 * Product IDs (must match App Store Connect exactly):
 *   com.lotterypro.app.premium.monthly  — $7.99/month
 *   com.lotterypro.app.premium.annual   — $69/year
 */

import { registerPlugin } from "@capacitor/core";

// ── Typed interface for the native Swift plugin ──
export interface LotteryProIAPPlugin {
  /** Register product IDs with StoreKit. Call once at startup. */
  setup(options: { productIds: string[] }): Promise<void>;

  /** Fetch live product info from the App Store. */
  getProducts(options: {
    productIds: string[];
  }): Promise<{ products: NativeProduct[] }>;

  /** Show the Apple payment sheet for a given product. */
  purchaseProduct(options: {
    productId: string;
  }): Promise<{ transaction: NativeTransaction }>;

  /** Re-verify all active entitlements for the signed-in Apple ID. */
  restorePurchases(): Promise<{ transactions: NativeTransaction[] }>;
}

/** Shape of a product returned by the native StoreKit plugin. */
export interface NativeProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

/** Shape of a transaction returned by the native StoreKit plugin. */
export interface NativeTransaction {
  productId: string;
  transactionId: string;
  /** StoreKit 2 signed JWS token for server-side verification. */
  jwsRepresentation: string;
}

/** Plugin name must match the class name registered in Swift. */
const LotteryProIAP = registerPlugin<LotteryProIAPPlugin>("LotteryProIAP");

// ── Public types ──

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

// ── Service functions ──

/** Call once at app startup (iOS only) to register products with StoreKit. */
export async function initIAP(): Promise<void> {
  try {
    await LotteryProIAP.setup({
      productIds: Object.values(IAP_PRODUCT_IDS),
    });
    console.log("[IAP] Initialized products:", Object.values(IAP_PRODUCT_IDS));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[IAP] init failed:", msg);
  }
}

/** Fetch live product titles and prices from the App Store. */
export async function getIAPProducts(): Promise<IAPProduct[]> {
  try {
    const { products } = await LotteryProIAP.getProducts({
      productIds: Object.values(IAP_PRODUCT_IDS),
    });

    if (products && products.length > 0) {
      return products.map((p) => ({
        productId: p.productId,
        title: p.title,
        description: p.description,
        price: p.price,
        priceAmount: p.priceAmount,
        currency: p.currency,
      }));
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[IAP] getProducts failed (using fallback):", msg);
  }

  // Web or plugin not available: return hardcoded fallback matching App Store Connect
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

/** Show the Apple payment sheet and verify with the server on success. */
export async function purchaseProduct(productId: string): Promise<IAPPurchaseResult> {
  try {
    const { transaction } = await LotteryProIAP.purchaseProduct({ productId });

    if (!transaction?.jwsRepresentation) {
      return {
        success: false,
        error: "No signed transaction received from StoreKit",
      };
    }

    return verifyWithServer(transaction.jwsRepresentation);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // Detect user-cancelled — not a real error
    if (
      msg.includes("cancelled") ||
      msg.includes("cancel") ||
      msg.includes("SKErrorPaymentCancelled") ||
      msg.includes("PAYMENT_CANCELLED")
    ) {
      return { success: false, cancelled: true };
    }

    // Plugin not available on web
    if (
      msg.includes("not implemented") ||
      msg.includes("unimplemented")
    ) {
      return { success: false, error: "IAP is only available in the iOS app" };
    }

    console.error("[IAP] purchaseProduct error:", msg);
    return { success: false, error: msg || "Purchase failed" };
  }
}

/** Re-validate all active entitlements and restore premium access. */
export async function restorePurchases(): Promise<IAPRestoreResult> {
  try {
    const { transactions } = await LotteryProIAP.restorePurchases();
    let restoredCount = 0;

    for (const tx of transactions) {
      if (!tx.jwsRepresentation) continue;
      const result = await verifyWithServer(tx.jwsRepresentation);
      if (result.success) restoredCount++;
    }

    return { success: true, restored: restoredCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("not implemented") || msg.includes("unimplemented")) {
      return { success: false, error: "IAP is only available in the iOS app" };
    }

    console.error("[IAP] restorePurchases error:", msg);
    return { success: false, error: msg || "Restore failed" };
  }
}

// ── Internal: verify a StoreKit 2 JWS token with our server ──
async function verifyWithServer(signedTransactionInfo: string): Promise<IAPPurchaseResult> {
  try {
    const resp = await fetch("/api/apple/verify-iap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ signedTransactionInfo }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      console.warn("[IAP] server verification failed:", errorData.error);
      return {
        success: false,
        error: (errorData as { error?: string }).error || "Server verification failed",
      };
    }

    const data = await resp.json() as {
      success: boolean;
      error?: string;
      productId?: string;
      transactionId?: string;
      subscriptionTier?: string;
      expiresAt?: string;
    };

    if (!data.success) {
      return { success: false, error: data.error || "Verification rejected by server" };
    }

    return {
      success: true,
      productId: data.productId,
      transactionId: data.transactionId,
      subscriptionTier: data.subscriptionTier,
      expiresAt: data.expiresAt,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[IAP] verifyWithServer network error:", msg);
    return {
      success: false,
      error: "Network error — Apple recorded your purchase. Use Restore Purchases to activate.",
    };
  }
}
