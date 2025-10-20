import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Music, 
  BookOpen, 
  TrendingUp, 
  CreditCard, 
  Shield, 
  Users, 
  Share2,
  Settings
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/home", icon: Home, label: "Lottery Generator", description: "Generate lottery numbers" },
    { path: "/pools", icon: Users, label: "Community Pools", description: "Join lottery pools" },
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

            <Separator orientation="vertical" className="h-8 bg-white/20" />

            {/* Admin Section */}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link href={item.path} key={item.path}>
                  <Button
                    variant={isActive ? "destructive" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      isActive 
                        ? "bg-red-600 text-white" 
                        : "text-red-200 hover:text-white hover:bg-red-600/20 border border-red-400/30"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden lg:inline">🔑 Admin</span>
                    <Badge variant="outline" className="ml-1 text-xs border-red-300 text-red-200">
                      Russell
                    </Badge>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="border-red-400 text-red-200 hover:bg-red-600">
                🔑 Admin
              </Button>
            </Link>
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
    </nav>
  );
}