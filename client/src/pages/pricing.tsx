import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Check, X, Zap, Bell, Music, Star, Crown, Shield, Loader2, Lock, ArrowRight, ExternalLink
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import IAPSubscription from "@/components/IAPSubscription";
import { usePlatform } from "@/hooks/usePlatform";
import { shouldShowWebPayments, shouldShowIAP } from "@/lib/compliance";

const FREE_INCLUDED = [
  "Full scratch-off rankings (110+ NY games)",
  "Value Score + Big Prizes Left data",
  "NY lottery number generator (1/day)",
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
  { text: "Unlimited daily number generations", hot: true },
  { text: "Early access to new states (NJ, PA…)", hot: false },
  { text: "Priority support", hot: false },
  { text: "\"Funds new songs\" thank-you page", hot: false },
];

const WHAT_FREE_LOSES = [
  "No email alerts — miss prize drops in real time",
  "No trend charts — fly blind on 30/90-day data",
  "Ads visible throughout the app",
  "Limited to 1 number pick per day",
  "No watchlist — can't save games you're tracking",
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const platform = usePlatform();
  const showWebPayments = shouldShowWebPayments(platform);
  const showIAP = shouldShowIAP(platform);

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

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/subscription/portal', {});
      const data = await res.json();
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Portal Error", description: "No portal URL returned.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Could not open billing portal",
        description: err.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const isPremium = subStatus?.isPremium;

  const monthlyPrice = billingCycle === 'annual' ? '$5.75' : '$7.99';
  const ctaLabel = billingCycle === 'annual' ? 'Go Premium — $69/year' : 'Go Premium — $7.99/month';

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <SEOHead
        title="LotteryPro Premium — $7.99/month | Scratch-Off Alerts & Trends"
        description="Get email alerts when big prizes drop, historical prize trend charts, personal watchlists, and unlimited generations. One simple plan: $7.99/month or $69/year."
        path="/pricing"
        image="https://lotterypro.app/og-pricing.png"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "LotteryPro Premium",
          "description": "Educational lottery number analysis with email alerts, historical trend charts, and unlimited picks for Powerball and Mega Millions.",
          "applicationCategory": "EntertainmentApplication",
          "operatingSystem": "Web, iOS",
          "url": "https://lotterypro.app/pricing",
          "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "7.99",
            "highPrice": "69.00",
            "priceCurrency": "USD",
            "offerCount": "2"
          }
        }}
      />

      {/* ── Page-level grid texture ── */}
      <div className="lp-hero-grid fixed inset-0 pointer-events-none opacity-30" aria-hidden="true" />

      {/* ── Hero header ── */}
      <div className="relative max-w-3xl mx-auto px-4 pt-16 pb-10 text-center">
        {isPremium ? (
          <>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1.5 mb-6 text-sm text-emerald-300 font-medium">
              <Check className="w-3.5 h-3.5" />
              Active subscription
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              You're <span className="text-emerald-400">Premium</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-xl mx-auto">
              All features are unlocked. Thank you for supporting LotteryPro.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 mb-6 text-sm text-amber-300 font-medium">
              <Crown className="w-3.5 h-3.5" />
              One plan. Everything unlocked.
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              Go <span className="text-amber-400">Premium</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-xl mx-auto">
              Alerts, trends, and unlimited picks — everything you need to study lottery patterns seriously.
            </p>

            {/* ── Billing toggle ── */}
            <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1 mt-8 gap-1" role="group" aria-label="Billing cycle">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-150 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-h-[44px] ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-150 text-sm flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 min-h-[44px] ${
                  billingCycle === 'annual'
                    ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
                <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Save $26.88
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Pricing cards ── */}
      <div className="relative max-w-4xl mx-auto px-4 pb-10 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">

        {/* Free card */}
        <div className="lp-card bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col">
          <div className="p-6 pb-0">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Free</p>
            <div className="text-5xl font-extrabold text-white">$0</div>
            <p className="text-gray-500 text-sm mt-2">No credit card. Always free.</p>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What's included</p>
            <div className="space-y-2.5 mb-6">
              {FREE_INCLUDED.map((text, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{text}</span>
                </div>
              ))}
            </div>

            {/* What free users lose */}
            <div className="border border-dashed border-white/10 rounded-xl p-4 mb-6 bg-red-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What you miss without Premium</span>
              </div>
              <div className="space-y-2">
                {WHAT_FREE_LOSES.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <X className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <button
                onClick={() => setLocation('/scratch-offs')}
                className="w-full border border-white/10 text-gray-400 hover:text-white hover:border-white/25 hover:bg-white/5 font-medium text-sm px-4 py-3 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 min-h-[44px]"
              >
                Use Free Tools
              </button>
            </div>
          </div>
        </div>

        {/* Premium card */}
        <div className="lp-card-premium relative bg-gradient-to-br from-amber-500/10 via-orange-500/8 to-transparent border-2 border-amber-500/60 rounded-2xl flex flex-col overflow-hidden">
          {/* Glow behind card */}
          <div className="absolute inset-0 bg-amber-500/5 rounded-2xl pointer-events-none" aria-hidden="true" />
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" aria-hidden="true" />

          <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1 z-10">
            <Star className="w-3 h-3" /> RECOMMENDED
          </div>

          <div className="relative p-6 pb-0 pt-10">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Premium
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white tabular-nums">{monthlyPrice}</span>
              <span className="text-gray-400">/month</span>
            </div>
            {billingCycle === 'annual' ? (
              <p className="text-sm text-emerald-400 font-medium mt-1.5">
                Billed $69/year — save $26.88
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1.5">Billed monthly • Cancel anytime</p>
            )}
          </div>

          <div className="relative p-6 flex-1 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Everything in Free, plus
            </p>
            <div className="space-y-2.5 mb-6 flex-1">
              {PREMIUM_ONLY.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.hot ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className={`text-sm ${f.hot ? 'text-white font-medium' : 'text-gray-300'}`}>{f.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-3">
              {isPremium ? (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 text-center">
                    <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-emerald-300 font-semibold">You're already Premium!</p>
                    <p className="text-sm text-emerald-500 mt-1">All features unlocked.</p>
                  </div>
                  <button
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                    className="w-full border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/5 disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm px-4 py-3 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] flex items-center justify-center gap-2"
                  >
                    {portalMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Opening portal…</>
                    ) : (
                      <><ExternalLink className="w-4 h-4" /> Manage Subscription</>
                    )}
                  </button>
                </div>
              ) : showWebPayments ? (
                <>
                  <button
                    onClick={() => checkoutMutation.mutate(billingCycle)}
                    disabled={checkoutMutation.isPending}
                    className="lp-btn-cta w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-base px-6 py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e] min-h-[52px] flex items-center justify-center gap-2"
                  >
                    {checkoutMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <>{ctaLabel} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                  {/* Trust signals */}
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Shield className="w-3.5 h-3.5 text-gray-600" />
                      Secure checkout via Stripe
                    </span>
                    <span className="text-xs text-gray-600">Cancel anytime</span>
                  </div>
                </>
              ) : showIAP ? (
                <IAPSubscription />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ── Russell's Story — beneath the button, not competing with CTA ── */}
      <div className="relative max-w-3xl mx-auto px-4 pb-10">
        <div className="lp-card bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Music className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-2">
                Built during recovery. Powered by data.
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                LotteryPro was created by <strong className="text-white">Russell Nomer</strong> — an NYC musician, ASCAP member, and author — while recovering from spinal surgery in 2024. With 535 original songs and a lifetime of pattern-thinking, Russell built LotteryPro as an educational tool for serious lottery students. Every subscription directly funds new original music.
              </p>
              <div className="flex gap-3 mt-4 flex-wrap">
                {[
                  { label: "Apple Music", href: "https://music.apple.com/search#q=Russell%20Nomer" },
                  { label: "Spotify", href: "https://open.spotify.com/search/Russell%20Nomer" },
                  { label: "YouTube", href: "https://www.youtube.com/@RussellNomer" },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-full text-gray-400 hover:text-white transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 min-h-[44px] flex items-center"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="relative max-w-2xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold text-white text-center mb-6">Common Questions</h2>
        <div className="space-y-2">
          {[
            { q: "Can I cancel anytime?", a: "Yes — cancel from your Stripe customer portal any time. No questions, no penalties. You keep premium access until the billing period ends." },
            { q: "Do I need to create an account?", a: "Yes, a free account is required to activate premium so we can send your alerts and remember your watchlist." },
            { q: "Is the free tier fully functional?", a: "Absolutely. All 110+ NY scratch-off rankings, the lottery number generator, and the full music catalog are always 100% free." },
            { q: "When are alerts sent?", a: "Within the hour after our hourly NY State data pull detects a new Top Pick or a Value Score crossing 50+ on a game you're watching." },
            { q: "What states are supported?", a: "Currently New York (110+ scratch-off games). Premium subscribers get early access as we add NJ, PA, and more." },
          ].map(({ q, a }, i) => (
            <div key={i} className="lp-faq-item border border-white/8 hover:border-white/15 rounded-xl p-4 transition-colors duration-150">
              <h3 className="font-semibold text-white text-sm mb-1">{q}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 text-xs text-gray-700 border-t border-white/6 pt-6 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          For entertainment and educational use only • Must be 18+ • No lottery outcome claims • Gambling involves risk
        </div>
      </div>
    </div>
  );
}
