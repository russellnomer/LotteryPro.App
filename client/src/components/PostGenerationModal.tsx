import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Sparkles, Music, Book, Mail, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { SiApplemusic, SiSpotify, SiYoutube } from 'react-icons/si';

const APPLE_MUSIC_URL = 'https://music.apple.com/us/artist/russell-nomer/452485944';
const SPOTIFY_URL = 'https://open.spotify.com/artist/6sW3FG7MiVFoNMCRQ3cKmq';
const YOUTUBE_URL = 'https://youtube.com/@russellnomermusic';

interface PostGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedNumbers?: number[];
  bonusNumber?: number;
  gameName?: string;
}

export default function PostGenerationModal({ 
  open, 
  onOpenChange,
  generatedNumbers,
  bonusNumber,
  gameName
}: PostGenerationModalProps) {
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [step, setStep] = useState<'numbers' | 'signup' | 'discover'>('numbers');
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; marketingConsent: boolean }) => {
      const response = await apiRequest('POST', '/api/email/subscribe', {
        email: data.email,
        powerballReminders: data.marketingConsent,
        megamillionsReminders: data.marketingConsent,
        weeklyDigest: data.marketingConsent,
        promotionalEmails: data.marketingConsent,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thanks for signing up!',
        description: 'Check your email for your free weekly smart picks.',
      });
      setStep('discover');
    },
    onError: () => {
      setStep('discover');
    }
  });

  const handleSubmitEmail = () => {
    if (email && email.includes('@')) {
      registerMutation.mutate({ email, marketingConsent });
    } else {
      setStep('discover');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('numbers');
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === 'numbers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <div className="mb-4">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <DialogTitle className="text-2xl font-bold">Your Lucky Numbers!</DialogTitle>
              <p className="text-gray-600 text-sm mt-1">{gameName || 'Lottery'}</p>
            </div>
            
            {generatedNumbers && (
              <div className="flex justify-center gap-2 my-6">
                {generatedNumbers.map((num, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg"
                  >
                    {num}
                  </motion.div>
                ))}
                {bonusNumber && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: generatedNumbers.length * 0.1 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-lg"
                  >
                    {bonusNumber}
                  </motion.div>
                )}
              </div>
            )}

            <Button 
              onClick={() => setStep('signup')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Get Draw Day Reminders
            </Button>

            <button 
              onClick={() => setStep('discover')}
              className="text-sm text-gray-500 hover:text-gray-700 mt-4 block mx-auto"
            >
              Skip for now
            </button>
          </motion.div>
        )}

        {step === 'signup' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="py-4"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                <Mail className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                Free Weekly Smart Picks!
              </DialogTitle>
            </DialogHeader>

            <p className="text-center text-gray-600 text-sm mb-6">
              Get free weekly smart picks + an exclusive unreleased Russell Nomer track delivered to your inbox.
            </p>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
              />

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="marketing"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="marketing" className="text-xs text-gray-500 leading-relaxed">
                  Send me weekly picks and exclusive music. You can unsubscribe anytime. We retain your email for up to 30 days after unsubscribing per our privacy policy.
                </label>
              </div>

              <Button 
                onClick={handleSubmitEmail}
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {registerMutation.isPending ? 'Saving...' : 'Sign Me Up!'}
              </Button>

              <div className="text-center">
                <Link href="/auth" className="text-sm text-purple-600 hover:underline">
                  Already have an account? Login
                </Link>
              </div>

              <button 
                onClick={() => setStep('discover')}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2 block mx-auto"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {step === 'discover' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="py-4"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center mb-1">
                Support the Creator
              </DialogTitle>
            </DialogHeader>

            <p className="text-center text-gray-500 text-xs mb-5">
              These tools are built by independent musician Russell Nomer. Stream his music to help fund new releases.
            </p>

            {/* Direct streaming buttons */}
            <div className="space-y-2 mb-5">
              <a
                href={APPLE_MUSIC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold hover:from-pink-600 hover:to-rose-700 transition-colors"
              >
                <SiApplemusic className="w-5 h-5" />
                Stream on Apple Music
              </a>
              <a
                href={SPOTIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg bg-[#1DB954] text-white font-semibold hover:bg-[#1aa34a] transition-colors"
              >
                <SiSpotify className="w-5 h-5" />
                Stream on Spotify
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg bg-[#FF0000] text-white font-semibold hover:bg-[#cc0000] transition-colors"
              >
                <SiYoutube className="w-5 h-5" />
                Watch on YouTube
              </a>
            </div>

            {/* Secondary links */}
            <div className="flex gap-2 mb-4">
              <Link href="/music" onClick={handleClose} className="flex-1">
                <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium transition-colors cursor-pointer">
                  <Music className="w-3.5 h-3.5" />
                  Full Catalog (532 songs)
                </div>
              </Link>
              <Link href="/books" onClick={handleClose} className="flex-1">
                <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-medium transition-colors cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  35 Books on Amazon
                </div>
              </Link>
            </div>

            <Button 
              onClick={handleClose}
              variant="outline"
              className="w-full"
            >
              Back to Smart Picks
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
