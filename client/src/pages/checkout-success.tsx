import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Music, Star, Zap } from "lucide-react";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Invalidate subscription status so navbar/features update immediately
    import("@/lib/queryClient").then(({ queryClient }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-emerald-500/20 border border-emerald-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-3">You're Premium!</h1>
        <p className="text-lg text-gray-300 mb-8">
          Your subscription is active. All premium features are unlocked.
        </p>

        <div className="bg-purple-900/40 border border-purple-700 rounded-2xl p-6 mb-8 text-left">
          <div className="flex items-start gap-4">
            <Music className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-bold text-white text-lg mb-1">
                Thank you — this funds new music
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Your subscription directly supports <strong className="text-white">Russell Nomer</strong>,
                an independent NYC musician and ASCAP member. Every dollar goes toward
                recording and releasing original songs. Explore the full 535-song catalog — it's all here for free.
              </p>
              <div className="flex gap-3 mt-4 flex-wrap">
                <a href="https://music.apple.com/search#q=Russell%20Nomer" target="_blank" rel="noopener noreferrer"
                   className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-gray-300 transition-colors">
                  Apple Music
                </a>
                <a href="https://open.spotify.com/search/Russell%20Nomer" target="_blank" rel="noopener noreferrer"
                   className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-gray-300 transition-colors">
                  Spotify
                </a>
                <a href="https://www.youtube.com/@RussellNomer" target="_blank" rel="noopener noreferrer"
                   className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-gray-300 transition-colors">
                  YouTube
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8 text-left">
          {[
            { icon: Star, text: "Email alerts when big prizes drop or Value Score hits 50+" },
            { icon: Zap, text: "Ad-free, unlimited daily number generations" },
            { icon: CheckCircle, text: "Personal watchlist + CSV export of rankings" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
              <Icon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-sm text-gray-200">{text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setLocation('/scratch-offs')}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-6"
            size="lg"
          >
            View Scratch-Off Rankings
          </Button>
          <Button
            onClick={() => setLocation('/music')}
            variant="outline"
            className="flex-1 border-purple-600 text-purple-300 hover:bg-purple-900/30 py-6"
            size="lg"
          >
            Explore the Music
          </Button>
        </div>
      </div>
    </div>
  );
}
