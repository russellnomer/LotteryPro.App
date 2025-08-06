import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, AlertCircle, Key, Copy, Mail } from "lucide-react";

interface VipCodeRedemptionProps {
  userEmail?: string;
}

export default function VipCodeRedemption({ userEmail }: VipCodeRedemptionProps) {
  const [vipCode, setVipCode] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const { toast } = useToast();

  const redeemMutation = useMutation({
    mutationFn: async ({ code, email }: { code: string; email: string }) => {
      const response = await apiRequest('POST', '/api/vip/redeem', { 
        code: code.trim(), 
        userEmail: email.trim() 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "VIP Code Redeemed Successfully!",
          description: `Your account has been upgraded to ${data.newTier} tier.`,
        });
        setVipCode("");
      } else {
        toast({
          title: "Redemption Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem VIP code",
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    if (!vipCode.trim()) {
      toast({
        title: "Missing VIP Code",
        description: "Please enter a VIP code to redeem",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Missing Email",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    redeemMutation.mutate({ code: vipCode, email });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setVipCode(text.trim());
      toast({
        title: "Code Pasted",
        description: "VIP code has been pasted from clipboard",
      });
    } catch (error) {
      toast({
        title: "Paste Failed",
        description: "Unable to read from clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-8 h-8 text-white" />
        </div>
        <CardTitle>Redeem VIP Code</CardTitle>
        <p className="text-sm text-gray-600">
          Enter your secure VIP code to upgrade your account tier
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">VIP Code</label>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Nomerati123456abc12345"
              value={vipCode}
              onChange={(e) => setVipCode(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePaste}
              className="px-3"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            VIP codes start with "Nomerati" and are account-specific
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Security Features:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Account-specific email binding</li>
              <li>• 5-minute expiration window</li>
              <li>• Google Authenticator TOTP verification</li>
              <li>• Cannot be hacked or reused</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleRedeem}
          disabled={redeemMutation.isPending || !vipCode.trim() || !email.trim()}
          className="w-full"
        >
          {redeemMutation.isPending ? (
            "Redeeming..."
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Redeem VIP Code
            </>
          )}
        </Button>

        {redeemMutation.isPending && (
          <div className="text-center text-sm text-gray-600">
            Verifying VIP code security...
          </div>
        )}
      </CardContent>
    </Card>
  );
}