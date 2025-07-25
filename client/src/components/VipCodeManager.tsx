import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CrownIcon, PlusIcon, GiftIcon, TrashIcon, EyeIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { VipCode } from "@shared/schema";

interface VipCodeManagerProps {
  userEmail: string;
}

export default function VipCodeManager({ userEmail }: VipCodeManagerProps) {
  const [newCode, setNewCode] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is Russell (god-mode)
  const isRussell = userEmail.toLowerCase() === "russell@russellnomer.com";

  // Fetch Russell's VIP codes (only for Russell)
  const { data: vipCodes, isLoading } = useQuery({
    queryKey: ['/api/vip/my-codes'],
    queryFn: async () => {
      if (!isRussell) return [];
      const response = await fetch('/api/vip/my-codes');
      if (!response.ok) throw new Error('Failed to fetch VIP codes');
      return response.json().then(data => data.vipCodes) as Promise<VipCode[]>;
    },
    enabled: isRussell
  });

  // Create VIP code mutation (Russell only)
  const createMutation = useMutation({
    mutationFn: async (data: { code: string; subscriptionTier: string; expiresAt?: string }) => {
      const response = await fetch('/api/vip/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create VIP code');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "VIP Code Created",
        description: "Your VIP code has been created successfully",
      });
      setNewCode("");
      setSelectedTier("");
      setExpiresAt("");
      queryClient.invalidateQueries({ queryKey: ['/api/vip/my-codes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create VIP code",
        variant: "destructive",
      });
    }
  });

  // Redeem VIP code mutation (all users)
  const redeemMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/vip/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to redeem VIP code');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "VIP Code Redeemed!",
        description: `You now have ${data.subscriptionTier} access!`,
      });
      setRedeemCode("");
      // Refresh user data to show new subscription tier
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem VIP code",
        variant: "destructive",
      });
    }
  });

  const handleCreateCode = () => {
    if (!newCode.trim() || !selectedTier) {
      toast({
        title: "Error",
        description: "Please enter a code and select a subscription tier",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      code: newCode.trim(),
      subscriptionTier: selectedTier,
      expiresAt: expiresAt || undefined
    });
  };

  const handleRedeemCode = () => {
    if (!redeemCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a VIP code",
        variant: "destructive",
      });
      return;
    }

    redeemMutation.mutate(redeemCode.trim());
  };

  return (
    <div className="space-y-6">
      {/* VIP Code Redemption (All Users) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GiftIcon className="h-5 w-5 text-purple-600" />
            Redeem VIP Code
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Have a VIP code? Redeem it here for instant premium access
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter VIP code"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRedeemCode()}
              />
            </div>
            <Button 
              onClick={handleRedeemCode}
              disabled={redeemMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Russell's God-Mode VIP Management */}
      {isRussell && (
        <>
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CrownIcon className="h-5 w-5 text-yellow-600" />
                God-Mode: VIP Code Creation
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Russell Only
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create VIP codes to grant premium access to selected users
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vip-code">VIP Code</Label>
                  <Input
                    id="vip-code"
                    placeholder="e.g. RUSSELL2025VIP"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Subscription Tier</Label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic ($4.99/month)</SelectItem>
                      <SelectItem value="pro">Pro ($9.99/month)</SelectItem>
                      <SelectItem value="premium">Premium ($19.99/month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="expires">Expiration Date (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateCode}
                disabled={createMutation.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {createMutation.isPending ? "Creating..." : "Create VIP Code"}
              </Button>
            </CardContent>
          </Card>

          {/* Russell's VIP Codes List */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-blue-600" />
                Your VIP Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading VIP codes...</p>
                </div>
              ) : !vipCodes || vipCodes.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">
                  No VIP codes created yet
                </p>
              ) : (
                <div className="space-y-3">
                  {vipCodes.map((code) => (
                    <div 
                      key={code.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-gray-800"
                    >
                      <div className="flex-1">
                        <div className="font-mono font-medium text-sm">
                          {code.code}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={code.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {code.subscriptionTier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {code.usedBy ? 'Used' : 'Active'}
                          </span>
                          {code.expiresAt && (
                            <span className="text-xs text-orange-600">
                              Expires: {new Date(code.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(code.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}