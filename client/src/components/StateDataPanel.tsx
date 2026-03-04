import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  MapPin, Zap, ExternalLink, Copy, Check, Mail,
  Globe, AlertCircle, Users, TrendingUp, Bell
} from "lucide-react";
import { type StateConfig, SAMPLE_LETTER_TEMPLATE } from "@shared/stateConfig";

interface Props {
  stateConfig: StateConfig;
  onNotifyRequest?: (email: string) => void;
}

export default function StateDataPanel({ stateConfig, onNotifyRequest }: Props) {
  const [copied, setCopied] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySent, setNotifySent] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const letter = SAMPLE_LETTER_TEMPLATE(stateConfig.name);

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({ title: "Letter copied!", description: "Paste it into an email to your representative." });
    });
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyEmail) {
      onNotifyRequest?.(notifyEmail);
      setNotifySent(true);
      toast({ title: "You're on the list!", description: `We'll email you when ${stateConfig.name} data becomes available.` });
    }
  };

  const twitterText = encodeURIComponent(`I just asked ${stateConfig.name} to publish lottery scratch-off prize data like New York does. Players deserve transparency! #LotteryTransparency #OpenData @LotteryPro`);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=https://lotterypro.app/scratch-offs`;

  return (
    <div className="space-y-6">
      {/* State header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{stateConfig.flag}</span>
          <div>
            <h2 className="text-2xl font-bold">{stateConfig.name} Lottery Data</h2>
            <p className="text-indigo-200 text-sm">LotteryPro • Educational Platform</p>
          </div>
        </div>
        {stateConfig.prohibited ? (
          <div className="bg-red-500/30 border border-red-400 rounded-xl p-3 mt-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">Lottery ticket sales are not permitted in {stateConfig.name}. Our educational analysis tools are still available for informational purposes.</p>
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl p-3 mt-3">
            <p className="text-sm text-indigo-100">
              Powerball & Mega Millions analysis is available now. State-specific scratch-off prize tracking is coming once {stateConfig.name} publishes open data.
            </p>
          </div>
        )}
      </div>

      {/* What's available NOW */}
      {!stateConfig.prohibited && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-emerald-600" />
            Available for {stateConfig.name} Right Now
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {stateConfig.drawGames.map((game, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{game.name}</p>
                  {game.drawDays && <p className="text-xs text-gray-500">{game.drawDays}</p>}
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={() => setLocation('/home')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white w-full sm:w-auto"
          >
            <TrendingUp className="w-4 h-4 mr-2" /> Generate Numbers for These Games
          </Button>
        </div>
      )}

      {/* What's missing — the transparency gap */}
      {!stateConfig.prohibited && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            What {stateConfig.name} Isn't Telling You
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed mb-3">
            Every scratch-off game has a fixed number of prize tickets. Once the top prizes are claimed, every ticket sold after that is a guaranteed loser for those tiers.{' '}
            <strong>New York publishes exactly how many prizes remain for every game — in real time, as open public data.</strong> This lets players avoid games where all the big prizes are already gone.
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">
            {stateConfig.name} tracks this exact same data internally — every state lottery commission is required to. They just don't share it with the public. <strong>You have a right to know.</strong>
          </p>

          <div className="mt-4 bg-white border border-amber-200 rounded-xl p-3 flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <strong>New York's standard:</strong> data.ny.gov publishes remaining prize counts for 110+ scratch-off games, updated hourly, freely accessible to anyone.{' '}
              <a href="https://data.ny.gov/resource/nzqa-7unk.json" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                See the live data <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Civic action — the heart of this panel */}
      {!stateConfig.prohibited && (
        <div className="bg-purple-900 text-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-yellow-400" />
            <h3 className="font-bold text-xl">Demand Transparency from {stateConfig.name}</h3>
          </div>
          <p className="text-purple-200 text-sm leading-relaxed mb-5">
            Your state representative can pressure the {stateConfig.name} Lottery Commission to publish this data.
            It takes one email. We wrote it for you — just copy, fill in your name, and send.
          </p>

          {/* Letter preview */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4 font-mono text-xs text-purple-100 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {letter}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Button
              onClick={handleCopyLetter}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex-1"
            >
              {copied
                ? <><Check className="w-4 h-4 mr-2" /> Copied!</>
                : <><Copy className="w-4 h-4 mr-2" /> Copy Letter</>
              }
            </Button>
            <a
              href={stateConfig.representativeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full border-white/40 text-white hover:bg-white/10">
                <MapPin className="w-4 h-4 mr-2" /> Find My Representative
              </Button>
            </a>
          </div>

          {/* Social sharing */}
          <div className="border-t border-white/20 pt-4">
            <p className="text-xs text-purple-300 mb-3">Spread the word — the more people ask, the faster states act:</p>
            <div className="flex gap-3 flex-wrap">
              <a
                href={`https://twitter.com/intent/tweet?text=${twitterText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                Share on X/Twitter
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                Share on Facebook
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`I just asked ${stateConfig.name} to publish lottery scratch-off prize data like New York does. Check out LotteryPro: https://lotterypro.app`);
                  toast({ title: "Share text copied!" });
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Copy Share Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify me when state data arrives */}
      {!stateConfig.prohibited && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Notify Me When {stateConfig.name} Data Is Available
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We're actively working to add more states. Enter your email and we'll let you know the moment {stateConfig.name} scratch-off data goes live.
          </p>
          {notifySent ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">You're on the list! We'll email you when {stateConfig.name} data launches.</span>
            </div>
          ) : (
            <form onSubmit={handleNotifySubmit} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={notifyEmail}
                onChange={e => setNotifyEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Mail className="w-4 h-4 mr-1.5" /> Notify Me
              </Button>
            </form>
          )}
        </div>
      )}

      {/* State lottery website link */}
      {stateConfig.lotteryWebsite && (
        <div className="text-center">
          <a
            href={stateConfig.lotteryWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Official {stateConfig.name} Lottery Website
          </a>
        </div>
      )}
    </div>
  );
}
