/**
 * IAPSubscription — Live Apple In-App Purchase UI for iOS.
 *
 * Loads real product titles and prices from the App Store via the IAP service.
 * Handles purchase, restore, loading, and error states.
 * On web this component is never rendered (compliance layer guards it).
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  getIAPProducts,
  purchaseProduct,
  restorePurchases,
  type IAPProduct,
} from "@/lib/iapService";

interface Props {
  onSuccess?: (tier: string) => void;
}

export default function IAPSubscription({ onSuccess }: Props) {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [succeeded, setSucceeded] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load live product info from App Store on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);

    getIAPProducts()
      .then((prods) => {
        if (!cancelled) {
          setProducts(prods);
          setLoadingProducts(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => { cancelled = true; };
  }, []);

  const handlePurchase = async (productId: string) => {
    setPurchasing(productId);
    setSucceeded(null);

    const result = await purchaseProduct(productId);
    setPurchasing(null);

    if (result.cancelled) {
      // User tapped cancel — silent, no toast
      return;
    }

    if (result.success) {
      setSucceeded(productId);

      // Invalidate auth and subscription caches so the UI reflects premium immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });

      toast({
        title: "Welcome to Premium!",
        description: "Your subscription is now active. All features unlocked.",
      });

      onSuccess?.(result.subscriptionTier || "premium");
    } else {
      toast({
        title: "Purchase Failed",
        description: result.error || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setSucceeded(null);

    const result = await restorePurchases();
    setRestoring(false);

    if (result.success && result.restored > 0) {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });

      toast({
        title: "Purchases Restored",
        description: `${result.restored} subscription${result.restored > 1 ? "s" : ""} restored successfully.`,
      });

      onSuccess?.("premium");
    } else if (result.success && result.restored === 0) {
      toast({
        title: "No Purchases Found",
        description: "No active subscriptions found for your Apple ID.",
      });
    } else {
      toast({
        title: "Restore Failed",
        description: result.error || "Could not restore purchases. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state — fetching product info from App Store
  if (loadingProducts) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <svg className="h-5 w-5 text-gray-800 dark:text-gray-200" viewBox="0 0 814 1000" fill="currentColor">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.8-155.5-127.4C46 790.6 0 663 0 541.8c0-207.5 135.4-317.3 268.5-317.3 99.8 0 176.6 65.7 235.5 65.7 55.8 0 142.9-69.5 254.4-69.5zm-30.1-174.8c28.3-34.1 48.9-81.4 48.9-128.7 0-6.4-.6-12.8-1.9-18.6-46.5 1.9-101.9 31-135.3 71.9-26.9 31.7-51.9 78.9-51.9 127.3 0 7.1 1.3 14.3 1.9 16.5 3.2.6 8.4 1.3 13.6 1.3 41.5 0 93.5-27.7 124.7-69.7z"/>
        </svg>
        <span className="font-semibold text-gray-800 dark:text-gray-200">Subscribe with Apple</span>
        <Badge variant="secondary" className="text-xs">App Store</Badge>
      </div>

      {/* Success state */}
      {succeeded && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Premium activated! All features are now unlocked.
          </p>
        </div>
      )}

      {/* Product cards */}
      {products.length === 0 ? (
        <div className="flex items-start gap-3 border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Store unavailable</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Could not load products from the App Store. Check your connection and try again.
            </p>
          </div>
        </div>
      ) : (
        products.map((product) => {
          const isAnnual = product.productId.includes("annual");
          const isThisLoading = purchasing === product.productId;
          const isThisSucceeded = succeeded === product.productId;
          const anyLoading = purchasing !== null || restoring;

          return (
            <Card
              key={product.productId}
              className={`border transition-colors ${
                isAnnual
                  ? "border-yellow-400 dark:border-yellow-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{product.title}</CardTitle>
                    <CardDescription className="text-xs">{product.description}</CardDescription>
                  </div>
                  {isAnnual && (
                    <Badge className="bg-amber-500 text-white text-xs">Best Value</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {product.price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isAnnual ? "/ year" : "/ month"}
                  </span>
                  {isAnnual && (
                    <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Save 27%
                    </span>
                  )}
                </div>

                {isThisSucceeded ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Active</span>
                  </div>
                ) : (
                  <Button
                    className={`w-full min-h-[44px] font-semibold ${
                      isAnnual
                        ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                        : "bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black"
                    }`}
                    disabled={anyLoading}
                    onClick={() => handlePurchase(product.productId)}
                  >
                    {isThisLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        {isAnnual ? "Subscribe Annually" : "Subscribe Monthly"}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Restore Purchases */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-gray-500 dark:text-gray-400 min-h-[44px]"
        disabled={purchasing !== null || restoring}
        onClick={handleRestore}
      >
        {restoring ? (
          <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Restoring...</>
        ) : (
          <><RotateCcw className="w-3 h-3 mr-2" />Restore Purchases</>
        )}
      </Button>

      {/* Legal copy — required by Apple */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed">
        Payment charged to your Apple ID at purchase confirmation. Subscription renews automatically.
        Manage or cancel in iPhone Settings → Apple ID → Subscriptions.
      </p>
    </div>
  );
}
