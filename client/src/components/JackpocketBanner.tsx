import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, Gift, Ticket } from "lucide-react";

const JACKPOCKET_REFERRAL_LINK = "https://lottery.jackpocket.com/r/lotto/russellnomer/LOTTERY/US-NY";

interface JackpocketBannerProps {
  variant?: "floating" | "inline" | "compact";
  onDismiss?: () => void;
}

export default function JackpocketBanner({ variant = "inline", onDismiss }: JackpocketBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const trackAndOpen = async () => {
    try {
      await fetch('/api/affiliate/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner: 'jackpocket',
          source: variant,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error('Tracking error:', e);
    }
    window.open(JACKPOCKET_REFERRAL_LINK, '_blank');
  };

  if (dismissed) return null;

  if (variant === "floating") {
    return (
      <div 
        className="fixed bottom-4 right-4 z-40 max-w-sm bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 text-white shadow-2xl animate-in slide-in-from-bottom-4"
        data-testid="jackpocket-floating-banner"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 rounded-full p-2">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Play on Jackpocket</span>
              <Badge className="bg-yellow-400 text-yellow-900 text-xs">$20 Bonus</Badge>
            </div>
            <p className="text-xs opacity-80">New users get lottery credits!</p>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
          onClick={trackAndOpen}
          data-testid="button-jackpocket-floating"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Get Started Free
        </Button>
        <p className="text-center mt-2 font-bold" style={{ color: "#DC3545", fontSize: "10px" }}>
          #ad Affiliate link: I may earn a commission at no extra cost to you (FTC compliant).
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div 
        className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-3 text-white"
        data-testid="jackpocket-compact-banner"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <span className="text-sm font-medium">Play these numbers on Jackpocket!</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={trackAndOpen}
            data-testid="button-jackpocket-compact"
          >
            Play Now
          </Button>
        </div>
        <p className="mt-1 font-bold" style={{ color: "#FFCCCB", fontSize: "10px" }}>
          #ad Affiliate link: I may earn a commission at no extra cost to you (FTC compliant).
        </p>
      </div>
    );
  }

  return (
    <div 
      className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg"
      data-testid="jackpocket-inline-banner"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <Gift className="h-5 w-5" />
            <Badge className="bg-yellow-400 text-yellow-900">NEW USER BONUS</Badge>
          </div>
          <h3 className="text-xl font-bold mb-1">Ready to Play Your Numbers?</h3>
          <p className="text-sm opacity-90">
            Sign up for Jackpocket and get $20 in lottery credits! Play official lottery games from your phone.
          </p>
        </div>
        <Button
          size="lg"
          className="bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-lg"
          onClick={trackAndOpen}
          data-testid="button-jackpocket-inline"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Get Jackpocket
        </Button>
      </div>
      <p className="text-center mt-3 font-bold" style={{ color: "#FFCCCB", fontSize: "10px" }}>
        #ad Affiliate link: I may earn a commission at no extra cost to you (FTC compliant).
      </p>
    </div>
  );
}
