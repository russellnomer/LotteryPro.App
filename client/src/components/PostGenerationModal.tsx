import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Sparkles, Music, Book, UserPlus, Mail, ArrowRight, X } from 'lucide-react';
import { Link } from 'wouter';

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
      const response = await apiRequest('POST', '/api/spin/register', {
        name: 'Guest',
        email: data.email,
        marketingConsent: data.marketingConsent
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thanks for signing up!',
        description: 'Check your email for lottery reminders and exclusive offers.',
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
                Never Miss a Draw!
              </DialogTitle>
            </DialogHeader>

            <p className="text-center text-gray-600 text-sm mb-6">
              Get reminders before each drawing so you never forget to play your numbers.
            </p>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
              />

              <div className="flex items-center gap-2">
                <Checkbox 
                  id="marketing"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                />
                <label htmlFor="marketing" className="text-sm text-gray-600">
                  Send me lottery tips and exclusive offers
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
              <DialogTitle className="text-xl font-bold text-center mb-4">
                Discover Russell Nomer
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Link href="/music" onClick={handleClose}>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 transition-colors cursor-pointer text-center">
                  <Music className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                  <span className="font-semibold text-purple-800">519 Songs</span>
                  <p className="text-xs text-gray-600 mt-1">Stream on Spotify & Apple Music</p>
                </div>
              </Link>

              <Link href="/books" onClick={handleClose}>
                <div className="p-4 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 transition-colors cursor-pointer text-center">
                  <Book className="w-10 h-10 text-orange-600 mx-auto mb-2" />
                  <span className="font-semibold text-orange-800">35 Books</span>
                  <p className="text-xs text-gray-600 mt-1">Available on Amazon</p>
                </div>
              </Link>
            </div>

            <Button 
              onClick={handleClose}
              variant="outline"
              className="w-full"
            >
              Start Playing
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
