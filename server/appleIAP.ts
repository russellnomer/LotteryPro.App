/**
 * Apple In-App Purchase verification using StoreKit 2 server-side validation.
 *
 * Product IDs registered in App Store Connect:
 *   com.lotterypro.app.premium.monthly  →  subscriptionTier = 'premium'
 *   com.lotterypro.app.premium.annual   →  subscriptionTier = 'premium'
 *
 * After verification the caller updates userAccounts via storage — no separate IAP table.
 */

import {
  AppStoreServerAPIClient,
  Environment,
  SignedDataVerifier,
  VerificationStatus,
} from "@apple/app-store-server-library";

// ── Product → tier mapping ──
const PRODUCT_TIER_MAP: Record<string, string> = {
  "com.lotterypro.app.premium.monthly": "premium",
  "com.lotterypro.app.premium.annual": "premium",
};

// ── Build the Apple root CA certificate list for SignedDataVerifier ──
// The library ships them; we read them from the package at runtime.
async function getAppleRootCerts(): Promise<Uint8Array[]> {
  const fs = await import("fs");
  const path = await import("path");

  // @apple/app-store-server-library ships root CAs in its own directory
  const libDir = path.join(
    process.cwd(),
    "node_modules",
    "@apple",
    "app-store-server-library"
  );

  // Common locations the library ships the certs
  const candidates = [
    path.join(libDir, "models", "rootCAs"),
    path.join(libDir, "rootCAs"),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(".cer") || f.endsWith(".pem"));
      if (files.length > 0) {
        return files.map((f: string) =>
          new Uint8Array(fs.readFileSync(path.join(dir, f)))
        );
      }
    }
  }

  // Fallback: return empty array — SignedDataVerifier will use its own defaults
  return [];
}

// ── Lazy-built verifier singleton ──
let _verifier: SignedDataVerifier | null = null;

async function getVerifier(): Promise<SignedDataVerifier> {
  if (_verifier) return _verifier;

  const bundleId = process.env.APPLE_BUNDLE_ID || "com.lotterypro.app";
  const envStr = process.env.APPLE_ENVIRONMENT || "Sandbox";
  const environment =
    envStr === "Production" ? Environment.PRODUCTION : Environment.SANDBOX;

  const rootCerts = await getAppleRootCerts();

  _verifier = new SignedDataVerifier(rootCerts, true, environment, bundleId, undefined);
  return _verifier;
}

// ── Build the App Store Server API client (for history lookups) ──
function getAPIClient(): AppStoreServerAPIClient | null {
  const issuerId = process.env.APPLE_ISSUER_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APPLE_BUNDLE_ID || "com.lotterypro.app";
  const envStr = process.env.APPLE_ENVIRONMENT || "Sandbox";
  const environment =
    envStr === "Production" ? Environment.PRODUCTION : Environment.SANDBOX;

  if (!issuerId || !keyId || !privateKey) {
    console.warn("[AppleIAP] Missing Apple credentials — API client not available");
    return null;
  }

  return new AppStoreServerAPIClient(
    privateKey,
    keyId,
    issuerId,
    bundleId,
    environment
  );
}

// ── Public types ──

export interface IAPVerificationResult {
  valid: boolean;
  productId?: string;
  subscriptionTier?: string;
  transactionId?: string;
  originalTransactionId?: string;
  expiresAt?: Date;
  environment?: string;
  error?: string;
}

// ── Main verification function ──
// signedTransactionInfo comes from StoreKit 2 `Transaction.currentEntitlements` on the client.
export async function verifyAppleTransaction(
  signedTransactionInfo: string
): Promise<IAPVerificationResult> {
  try {
    const verifier = await getVerifier();
    const transaction = await verifier.verifyAndDecodeTransaction(signedTransactionInfo);

    const productId = transaction.productId;
    if (!productId) {
      return { valid: false, error: "No productId in transaction" };
    }

    const subscriptionTier = PRODUCT_TIER_MAP[productId];
    if (!subscriptionTier) {
      return {
        valid: false,
        error: `Unknown productId: ${productId}`,
      };
    }

    const expiresAtMs = transaction.expiresDate;
    const expiresAt = expiresAtMs ? new Date(expiresAtMs) : undefined;

    // Reject if subscription is already expired
    if (expiresAt && expiresAt < new Date()) {
      return {
        valid: false,
        productId,
        subscriptionTier,
        transactionId: transaction.transactionId,
        originalTransactionId: transaction.originalTransactionId,
        expiresAt,
        error: "Subscription expired",
      };
    }

    return {
      valid: true,
      productId,
      subscriptionTier,
      transactionId: transaction.transactionId,
      originalTransactionId: transaction.originalTransactionId,
      expiresAt,
      environment: transaction.environment,
    };
  } catch (err: any) {
    console.error("[AppleIAP] verifyAndDecodeTransaction failed:", err.message);
    return {
      valid: false,
      error: err.message || "Transaction verification failed",
    };
  }
}

// ── Apple App Store Server Notifications (version 2) ──
// These arrive at /api/apple/notifications (POST) and keep subscription
// status in sync automatically (renewals, cancellations, refunds, etc.).

export interface AppleNotificationResult {
  notificationType?: string;
  subtype?: string;
  originalTransactionId?: string;
  productId?: string;
  subscriptionTier?: string;
  expiresAt?: Date;
  revoked?: boolean;
  error?: string;
}

export async function decodeAppleNotification(
  signedPayload: string
): Promise<AppleNotificationResult> {
  try {
    const verifier = await getVerifier();
    const notification = await verifier.verifyAndDecodeNotification(signedPayload);

    const notificationType = notification.notificationType;
    const subtype = notification.subtype;

    // Dig into the transaction within the notification
    const renewalInfo = notification.data?.signedRenewalInfo
      ? await verifier.verifyAndDecodeRenewalInfo(notification.data.signedRenewalInfo)
      : null;

    const transactionInfo = notification.data?.signedTransactionInfo
      ? await verifier.verifyAndDecodeTransaction(notification.data.signedTransactionInfo)
      : null;

    const productId = transactionInfo?.productId ?? renewalInfo?.productId;
    const subscriptionTier = productId ? PRODUCT_TIER_MAP[productId] : undefined;
    const expiresAtMs = transactionInfo?.expiresDate;
    const expiresAt = expiresAtMs ? new Date(expiresAtMs) : undefined;
    const originalTransactionId = transactionInfo?.originalTransactionId;

    // Mark as revoked for REFUND / REVOKE / EXPIRED events
    const revokeTypes = ["REFUND", "REVOKE", "EXPIRED"];
    const revoked = notificationType
      ? revokeTypes.includes(notificationType)
      : false;

    return {
      notificationType,
      subtype,
      originalTransactionId,
      productId,
      subscriptionTier,
      expiresAt,
      revoked,
    };
  } catch (err: any) {
    console.error("[AppleIAP] decodeAppleNotification failed:", err.message);
    return { error: err.message || "Notification decode failed" };
  }
}

export { getAPIClient };
