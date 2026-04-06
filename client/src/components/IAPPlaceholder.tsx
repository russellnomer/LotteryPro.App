import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Apple, Loader2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IAP_PRODUCTS = [
  {
    id: "com.lotterypro.premium.monthly",
    name: "Premium Monthly",
    price: "$7.99",
    period: "/ month",
    description: "Full premium access, billed monthly",
  },
  {
    id: "com.lotterypro.premium.annual",
    name: "Premium Annual",
    price: "$69.00",
    period: "/ year",
    description: "Best value — save 27% vs monthly",
    badge: "Best Value",
  },
];

async function stubPurchase(productId: string): Promise<void> {
  console.log("[IAP stub] purchase initiated for product:", productId);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("[IAP stub] purchase flow complete (no real transaction — stub only)");
}

async function stubRestorePurchases(): Promise<void> {
  console.log("[IAP stub] restore purchases initiated");
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("[IAP stub] restore purchases complete (stub only)");
}

export default function IAPPlaceholder() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (productId: string, name: string) => {
    setLoading(productId);
    try {
      await stubPurchase(productId);
      toast({
        title: "Apple In-App Purchase",
        description: `${name} purchase flow would launch here on a real device. (Stub — no transaction made.)`,
      });
    } catch (err) {
      console.error("[IAP stub] error:", err);
      toast({
        title: "Purchase Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading("restore");
    try {
      await stubRestorePurchases();
      toast({
        title: "Restore Purchases",
        description: "No previous purchases found. (Stub — no real restore performed.)",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Apple className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        <span className="font-semibold text-gray-800 dark:text-gray-200">In-App Purchase</span>
        <Badge variant="secondary" className="text-xs">App Store</Badge>
      </div>

      {IAP_PRODUCTS.map((product) => (
        <Card key={product.id} className="border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <CardDescription className="text-xs">{product.description}</CardDescription>
              </div>
              {product.badge && (
                <Badge className="bg-amber-500 text-white text-xs">{product.badge}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{product.price}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{product.period}</span>
            </div>
            <Button
              className="w-full bg-black hover:bg-gray-800 text-white"
              disabled={loading !== null}
              onClick={() => handlePurchase(product.id, product.name)}
            >
              {loading === product.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Subscribe with Apple
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-gray-500 dark:text-gray-400"
        disabled={loading !== null}
        onClick={handleRestore}
      >
        {loading === "restore" ? (
          <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Restoring...</>
        ) : (
          "Restore Purchases"
        )}
      </Button>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Payment will be charged to your Apple ID. Manage subscriptions in App Store settings.
      </p>
    </div>
  );
}
