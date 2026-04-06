import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, AlertCircle, Key, Copy, Mail } from "lucide-react";
import { validateEmail, validateVipCode, sanitizeInput, FormErrors, clearFormError } from "@/lib/formValidation";

interface VipCodeRedemptionProps {
  userEmail?: string;
}

export default function VipCodeRedemption({ userEmail }: VipCodeRedemptionProps) {
  const [vipCode, setVipCode] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const [errors, setErrors] = useState<FormErrors>({});
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
    const newErrors: FormErrors = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }
    
    const codeValidation = validateVipCode(vipCode);
    if (!codeValidation.valid) {
      newErrors.vipCode = codeValidation.error;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    redeemMutation.mutate({ 
      code: sanitizeInput(vipCode), 
      email: sanitizeInput(email) 
    });
  };
  
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(clearFormError(errors, 'email'));
    }
  };
  
  const handleVipCodeChange = (value: string) => {
    setVipCode(value);
    if (errors.vipCode) {
      setErrors(clearFormError(errors, 'vipCode'));
    }
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
          <label htmlFor="vip-email" className="text-sm font-medium">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            <Input
              id="vip-email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              data-testid="input-vip-email"
              aria-label="Email address for VIP code redemption"
              aria-describedby={errors.email ? "vip-email-error" : undefined}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && (
            <p id="vip-email-error" className="text-xs text-red-500 font-medium" data-testid="error-vip-email" role="alert">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="vip-code" className="text-sm font-medium">VIP Code</label>
          <div className="flex space-x-2">
            <Input
              id="vip-code"
              type="text"
              placeholder="VIP-XXXX-XXXX"
              value={vipCode}
              onChange={(e) => handleVipCodeChange(e.target.value)}
              className={`font-mono text-sm ${errors.vipCode ? 'border-red-500' : ''}`}
              data-testid="input-vip-code"
              aria-label="Enter your VIP code"
              aria-describedby={errors.vipCode ? "vip-code-error" : "vip-code-hint"}
              aria-invalid={!!errors.vipCode}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePaste}
              className="px-3 min-h-[44px] min-w-[44px]"
              aria-label="Paste VIP code from clipboard"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
          {errors.vipCode && (
            <p id="vip-code-error" className="text-xs text-red-500 font-medium" data-testid="error-vip-code" role="alert">{errors.vipCode}</p>
          )}
          <p id="vip-code-hint" className="text-xs text-gray-500">
            VIP codes are in format VIP-XXXX-XXXX
          </p>
        </div>

        <Button
          onClick={handleRedeem}
          disabled={redeemMutation.isPending || !vipCode.trim() || !email.trim()}
          className="w-full"
          data-testid="button-redeem-vip"
          aria-label="Redeem VIP Code"
        >
          {redeemMutation.isPending ? (
            "Redeeming..."
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" aria-hidden="true" />
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