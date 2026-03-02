import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Check, X, Zap, Bell, Music, Star, Crown, Shield, Loader2, Lock
} from "lucide-react";
import SEOHead from "@/components/SEOHead";

const FREE_INCLUDED = [
  "Full scratch-off rankings (110+ NY games)",
  "Value Score + Big Prizes Left data",
  "NY lottery number generator",
  "Daily Lucky Spin",
  "Community pools access",
  "Russell Nomer's 535-song music catalog",
  "Real-time prize data (hourly updates)",
  "Price & big prize filters",
];

const PREMIUM_ONLY = [
  { text: "Email alerts when Value Score hits 50+", hot: true },
  { text: "30/90-day historical trend charts", hot: true },
  { text: "Personal game watchlist + CSV export", hot: false },
  { text: "Ad-free experience", hot: false },
  { text: "Unlimited daily number generations", hot: false },
  { text: "Early access to new states (NJ, PA…)", hot: true },
  { text: "Priority support", hot: false },
  { text: "\"Funds new songs\" thank-you page", hot: false },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: subStatus } = useQuery<{ isPremium: boolean; tier: string }>({
    queryKey: ['/api/subscription/status'],
    staleTime: 60000,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (plan: 'monthly' | 'annual') => {
      const res = await apiRequest('POST', '/api/subscription/checkout', { plan });
      const data = await res.json();
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Checkout Error", description: "No checkout URL returned.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Checkout Error",
        description: err.message || "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isPremium = subStatus?.isPremium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <SEOHead
        title="LotteryPro Premium — $7.99/month | Scratch-Off Alerts & Trends"
        description="Get email alerts when big prizes drop, historical prize trend charts, personal watchlists, and unlimited generations. One simple plan: $7.99/month or $69/year."
        url="https://lotterypro.app/pricing"
      />

      {/* ── Header ── */}
      <div className="text-center pt-14 pb-10 px-4">
        <Badge className="bg-yellow-500 text-black font-bold text-sm mb-4 px-4 py-1">
          <Star className="w-3.5 h-3.5 mr-1 inline" /> Simple Pricing — One Plan
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Go Premium for <span className="text-yellow-400">$7.99</span>/month
        </h1>
        <p className="text-lg text-gray-300 max-w-xl mx-auto">
          Get alerts when big prizes drop, historical trends, and unlimited access.
          <br className="hidden sm:block" /> Cancel anytime. No contracts. Instant access.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center bg-gray-800 border border-gray-700 rounded-full p-1 mt-8 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full font-medium transition-all text-sm ${
              billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-full font-medium transition-all text-sm flex items-center gap-2 ${
              billingCycle === 'annual' ? 'bg-yellow-400 text-gray-900 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual
            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Save 27%</span>
          </button>
        </div>
      </div>

      {/* ── Pricing cards ── */}
      <div className="max-w-4xl mx-auto px-4 pb-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

        {/* Free card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl flex flex-col">
          <div className="p-6 pb-0">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Free</p>
            <div className="text-5xl font-extrabold text-white">$0</div>
            <p className="text-gray-400 text-sm mt-2">No credit card. Always free.</p>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What's included</p>
            <div className="space-y-2.5 mb-6">
              {FREE_INCLUDED.map((text, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{text}</span>
                </div>
              ))}
            </div>

            <div className="border border-dashed border-gray-600 rounded-xl p-4 mb-6 bg-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Premium only</span>
              </div>
              <div className="space-y-1.5">
                {PREMIUM_ONLY.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <X className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-500">{f.text}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-600 pl-5 mt-1">+{PREMIUM_ONLY.length - 3} more premium features</p>
              </div>
            </div>

            <div className="mt-auto">
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setLocation('/scratch-offs')}
              >
                Use Free Tools
              </Button>
            </div>
          </div>
        </div>

        {/* Premium card */}
        <div className="bg-gradient-to-br from-yellow-500/15 to-orange-600/15 border-2 border-yellow-500 rounded-2xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
            <Crown className="w-3 h-3" /> MOST POPULAR
          </div>

          <div className="p-6 pb-0 pt-8">
            <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Premium
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">
                {billingCycle === 'annual' ? '$5.75' : '$7.99'}
              </span>
              <span className="text-gray-300">/month</span>
            </div>
            {billingCycle === 'annual' ? (
              <p className="text-sm text-emerald-400 font-medium mt-1.5">Billed $69/year — save $26.88</p>
            ) : (
              <p className="text-sm text-gray-400 mt-1.5">Billed $7.99/month • Cancel anytime</p>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Everything in Free, plus</p>
            <div className="space-y-2.5 mb-6 flex-1">
              {PREMIUM_ONLY.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.hot ? 'text-yellow-400' : 'text-emerald-400'}`} />
                  <span className={`text-sm ${f.hot ? 'text-white font-medium' : 'text-gray-300'}`}>{f.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              {isPremium ? (
                <div className="bg-emerald-500/20 border border-emerald-500 rounded-xl p-4 text-center">
                  <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-emerald-300 font-semibold">You're already Premium!</p>
                  <p className="text-sm text-emerald-400 mt-1">All features unlocked.</p>
                </div>
              ) : (
                <Button
                  onClick={() => checkoutMutation.mutate(billingCycle)}
                  disabled={checkoutMutation.isPending}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base py-6 shadow-lg shadow-yellow-500/20"
                  size="lg"
                >
                  {checkoutMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                    : `Subscribe Now — ${billingCycle === 'annual' ? '$69/year' : '$7.99/month'}`
                  }
                </Button>
              )}
              <p className="text-center text-xs text-gray-500 mt-3">
                Secure checkout via Stripe • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Music tie-in ── */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-purple-900/40 border border-purple-700 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Music className="w-10 h-10 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-purple-200 mb-1">
                Your subscription funds independent music
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                LotteryPro is built by <strong className="text-white">Russell Nomer</strong>, an independent NYC
                musician and ASCAP member with a 535-song catalog. Every subscription directly funds
                new original songs.
              </p>
              <div className="flex gap-3 mt-4 flex-wrap">
                {[
                  { label: "Apple Music", href: "https://music.apple.com/search#q=Russell%20Nomer" },
                  { label: "Spotify", href: "https://open.spotify.com/search/Russell%20Nomer" },
                  { label: "YouTube", href: "https://www.youtube.com/@RussellNomer" },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                     className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-gray-300 transition-colors">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-2xl mx-auto px-4 pb-16 text-gray-300">
        <h2 className="text-xl font-bold text-white text-center mb-6">Common Questions</h2>
        <div className="space-y-3">
          {[
            { q: "Can I cancel anytime?", a: "Yes — cancel from your Stripe customer portal any time. No questions, no penalties. You keep premium access until the billing period ends." },
            { q: "Do I need to create an account?", a: "Yes, a free account is required to activate premium so we can send your alerts and remember your watchlist." },
            { q: "Is the free tier fully functional?", a: "Absolutely. All 110+ NY scratch-off rankings, the lottery number generator, daily spin, and the full music catalog are always 100% free." },
            { q: "When are alerts sent?", a: "Within the hour after our hourly NY State data pull detects a new Top Pick or a Value Score crossing 50+ on a game you're watching." },
            { q: "What states are supported?", a: "Currently New York (110+ scratch-off games). Premium subscribers get early access as we add NJ, PA, and more." },
          ].map(({ q, a }, i) => (
            <div key={i} className="border border-gray-700 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">{q}</h3>
              <p className="text-sm text-gray-400">{a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 text-xs text-gray-600 border-t border-gray-800 pt-6">
          <Shield className="w-4 h-4 inline mr-1" />
          For entertainment and educational use only • Must be 18+ • No lottery outcome claims • Gambling involves risk
        </div>
      </div>
    </div>
  );
}
