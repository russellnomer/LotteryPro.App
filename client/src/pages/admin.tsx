import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminDashboard from "@/components/AdminDashboard";
import VipCodeRedemption from "@/components/VipCodeRedemption";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, AlertTriangle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const { data: sessionData, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/session'],
    refetchOnWindowFocus: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('POST', '/api/admin/login', { password });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/session'] });
      setError("");
    },
    onError: (error: any) => {
      setError(error.message || "Invalid password");
      setPassword("");
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/admin/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/session'] });
      setLocation("/");
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!sessionData?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <p className="text-gray-500 text-sm mt-2">
              This area is restricted to authorized administrators only.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                  data-testid="input-admin-password"
                  disabled={loginMutation.isPending}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                data-testid="button-admin-login"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Access Admin Panel
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => setLocation("/")} className="text-gray-500">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          data-testid="button-admin-logout"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Logout"}
        </Button>
      </div>
      
      <AdminDashboard />
      
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold text-center mb-6">Test VIP Code Redemption</h2>
        <VipCodeRedemption userEmail="test@example.com" />
      </div>
    </div>
  );
}
