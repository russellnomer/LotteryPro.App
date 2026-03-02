import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Home, 
  Music, 
  BookOpen, 
  TrendingUp, 
  CreditCard, 
  Shield, 
  Users, 
  Share2,
  Settings,
  Lock,
  Loader2,
  FileText,
  Ticket
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const { toast } = useToast();
  
  const { data: sessionData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/session'],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });
  
  const isAdminAuthenticated = sessionData?.isAdmin === true;

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('POST', '/api/admin/login', { password });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/session'] });
      setAdminDialogOpen(false);
      setAdminPassword("");
      setLoginError("");
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard!",
      });
      setLocation("/admin");
    },
    onError: (error: any) => {
      setLoginError(error.message || "Invalid password");
      setAdminPassword("");
    }
  });

  const handleAdminLogin = () => {
    if (!adminPassword.trim()) {
      setLoginError("Please enter the admin password");
      return;
    }
    loginMutation.mutate(adminPassword);
  };

  const openAdminDialog = () => {
    setLoginError("");
    setAdminPassword("");
    setAdminDialogOpen(true);
  };

  const navItems = [
    { path: "/home", icon: Home, label: "Lottery Generator", description: "Generate lottery numbers" },
    { path: "/scratch-offs", icon: Ticket, label: "Scratch-Off Helper", description: "Best scratch-offs to buy" },
    { path: "/pricing", icon: CreditCard, label: "Go Premium — $7.99/mo", description: "Unlock alerts & history" },
    { path: "/pools", icon: Users, label: "Community Pools", description: "Join lottery pools" },
    { path: "/blog", icon: FileText, label: "Blog", description: "Tips & strategies" },
    { path: "/music", icon: Music, label: "Russell's Music", description: "ASCAP artist catalog" },
    { path: "/books", icon: BookOpen, label: "Books", description: "35-book collection" },
    { path: "/performance", icon: TrendingUp, label: "Performance", description: "Track record & stats" },
    { path: "/subscription", icon: CreditCard, label: "Subscription", description: "Upgrade your tier" },
    { path: "/social-marketing", icon: Share2, label: "Social Marketing", description: "Replit referrals" },
    { path: "/privacy", icon: Shield, label: "Privacy", description: "Privacy policy" },
  ];

  const adminItems = [
    { path: "/admin", icon: Settings, label: "Admin Dashboard", description: "Russell's control panel" },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black">
                LP
              </div>
              <div>
                <h1 className="text-xl font-bold">LotteryPro</h1>
                <p className="text-xs text-blue-200">Russell Nomer Platform</p>
              </div>
            </div>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link href={item.path} key={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Admin Section - Always visible */}
            <Separator orientation="vertical" className="h-8 bg-white/20" />
            {isAdminAuthenticated ? (
              <Link href="/admin">
                <Button
                  variant={location === "/admin" ? "destructive" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    location === "/admin" 
                      ? "bg-red-600 text-white" 
                      : "text-red-200 hover:text-white hover:bg-red-600/20 border border-red-400/30"
                  }`}
                  data-testid="nav-admin-link"
                >
                  <Settings size={16} />
                  <span className="hidden lg:inline">🔑 Admin</span>
                  <Badge variant="outline" className="ml-1 text-xs border-red-300 text-red-200">
                    Russell
                  </Badge>
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-amber-200 hover:text-white hover:bg-amber-600/20 border border-amber-400/30"
                data-testid="nav-admin-login-button"
                onClick={openAdminDialog}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openAdminDialog();
                }}
              >
                <Lock size={16} />
                <span className="hidden lg:inline">Admin</span>
              </Button>
            )}
          </div>

          {/* Mobile Admin Button - Always visible */}
          <div className="md:hidden">
            {isAdminAuthenticated ? (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-red-400 text-red-200 hover:bg-red-600" data-testid="mobile-admin-link">
                  🔑 Admin
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-400 text-amber-200 hover:bg-amber-600"
                data-testid="mobile-admin-login-button"
                onClick={openAdminDialog}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openAdminDialog();
                }}
              >
                <Lock size={14} className="mr-1" />
                Admin
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-2 gap-2">
            {navItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link href={item.path} key={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`w-full justify-start ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon size={14} className="mr-2" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Login Dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              Admin Access
            </DialogTitle>
            <DialogDescription>
              Enter the admin password to access the control panel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <Input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdminLogin();
                }
              }}
              className="text-center text-lg"
              data-testid="input-admin-dialog-password"
              disabled={loginMutation.isPending}
              autoFocus
            />
            <button
              type="button"
              className="w-full inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-3 text-sm font-medium text-white shadow hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50"
              data-testid="button-admin-dialog-submit"
              disabled={loginMutation.isPending}
              onClick={handleAdminLogin}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAdminLogin();
              }}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Access Admin Panel
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
