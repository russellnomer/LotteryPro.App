import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Cookie, X, Shield, Ban } from "lucide-react";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("cookie_consent", JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem("cookie_consent", JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  const rejectAll = () => {
    localStorage.setItem("cookie_consent", JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      rejected: true,
      timestamp: new Date().toISOString(),
    }));
    
    document.cookie = "analytics_disabled=true; max-age=31536000; path=/; SameSite=Lax";
    document.cookie = "marketing_disabled=true; max-age=31536000; path=/; SameSite=Lax";
    
    const adElements = document.querySelectorAll('[data-ad-slot], .adsbygoogle, ins.adsbygoogle');
    adElements.forEach(el => el.remove());
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_personalization: 'denied',
        ad_user_data: 'denied',
      });
    }
    
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                We use cookies to enhance your experience, analyze site usage, and assist with our 
                marketing efforts. You can choose to accept all cookies, essential cookies only, 
                or reject non-essential cookies entirely. See our{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{" "}for details.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={rejectAll}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-reject-cookies"
            >
              <Ban className="w-4 h-4 mr-1" />
              Reject All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={acceptEssential}
              data-testid="button-essential-cookies"
            >
              Essential Only
            </Button>
            <Button 
              size="sm" 
              onClick={acceptAll}
              data-testid="button-accept-cookies"
            >
              <Shield className="w-4 h-4 mr-2" />
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
