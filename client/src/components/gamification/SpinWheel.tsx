import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Gift, Crown, Ticket, X, UserPlus } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import SessionTimeReminder from '@/components/SessionTimeReminder';
import SpinRegistrationModal from './SpinRegistrationModal';

interface Prize {
  type: 'free_generation' | 'discount_code' | 'premium_trial' | 'no_prize';
  value: string;
  displayName: string;
  color: string;
  icon: any;
}

const PRIZES: Prize[] = [
  { type: 'free_generation', value: '3', displayName: '3 Free Picks!', color: '#10b981', icon: Ticket },
  { type: 'no_prize', value: 'better_luck', displayName: 'Try Again Tomorrow', color: '#6b7280', icon: X },
  { type: 'free_generation', value: '1', displayName: '1 Free Pick', color: '#3b82f6', icon: Gift },
  { type: 'discount_code', value: 'LUCKY10', displayName: '10% Off Premium', color: '#f59e0b', icon: Sparkles },
  { type: 'free_generation', value: '2', displayName: '2 Free Picks', color: '#8b5cf6', icon: Ticket },
  { type: 'premium_trial', value: '7', displayName: '7-Day Premium Trial', color: '#ec4899', icon: Crown },
  { type: 'free_generation', value: '1', displayName: '1 Free Pick', color: '#3b82f6', icon: Gift },
  { type: 'no_prize', value: 'better_luck', displayName: 'Try Again Tomorrow', color: '#6b7280', icon: X },
];

interface SpinStatus {
  canSpin: boolean;
  hoursUntilNextSpin: number;
  spinStreak: number;
  lastSpin: any;
  requiresRegistration?: boolean;
  message?: string;
}

export default function SpinWheel() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [currentSpinId, setCurrentSpinId] = useState<number | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [spinAnnouncement, setSpinAnnouncement] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const { data: spinStatus } = useQuery<SpinStatus>({
    queryKey: ['/api/spin/status'],
  });

  const requiresRegistration = spinStatus?.requiresRegistration && !isAuthenticated && !registeredEmail;

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/spin/daily', {
        email: registeredEmail
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      const prizeIndex = PRIZES.findIndex(p => p.type === data.prizeType && p.value === data.prizeValue);
      const targetRotation = 360 * 5 + (prizeIndex * (360 / PRIZES.length));
      
      setSpinning(true);
      setRotation(targetRotation);
      setCurrentSpinId(data.spinId);
      
      setTimeout(() => {
        setSpinning(false);
        setWonPrize(PRIZES[prizeIndex]);
        setSpinCount(prev => prev + 1);
        setSpinAnnouncement(`Spin complete! You won: ${PRIZES[prizeIndex].displayName}`);
        queryClient.invalidateQueries({ queryKey: ['/api/spin/status'] });
        
        toast({
          title: '🎉 Spin Complete!',
          description: `You won: ${PRIZES[prizeIndex].displayName}`,
          duration: 5000,
        });
      }, 4000);
    },
    onError: (error: any) => {
      toast({
        title: '❌ Spin Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });

  const claimMutation = useMutation({
    mutationFn: async (spinId: number) => {
      const response = await apiRequest('POST', `/api/spin/claim/${spinId}`, {
        email: registeredEmail
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      setWonPrize(null);
      setCurrentSpinId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/spin/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spin/prizes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      
      toast({
        title: '🎁 Prize Claimed!',
        description: data.message || 'Your prize has been added to your account!',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Claim Failed',
        description: error.message || 'Could not claim prize',
        variant: 'destructive',
      });
    }
  });

  const handleClaimPrize = () => {
    if (wonPrize?.type === 'no_prize') {
      setWonPrize(null);
      setCurrentSpinId(null);
      return;
    }
    
    if (currentSpinId) {
      setClaiming(true);
      claimMutation.mutate(currentSpinId, {
        onSettled: () => setClaiming(false)
      });
    } else {
      setWonPrize(null);
    }
  };

  const handleSpin = () => {
    if (requiresRegistration) {
      setRegistrationModalOpen(true);
      return;
    }
    
    if (!spinning && spinStatus?.canSpin) {
      spinMutation.mutate();
    }
  };

  const handleRegistrationComplete = (email: string) => {
    setRegisteredEmail(email);
    queryClient.invalidateQueries({ queryKey: ['/api/spin/status'] });
  };

  const segmentAngle = 360 / PRIZES.length;

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-2 border-purple-200 dark:border-purple-800">
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {spinAnnouncement}
        </div>
        
        <SessionTimeReminder spinCount={spinCount} threshold={5} />
        
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
            <Sparkles className="inline mr-2 mb-1" aria-hidden="true" />
            Daily Lucky Spin
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {requiresRegistration 
              ? 'Register to unlock your daily spin and win prizes!' 
              : 'Spin once per day to win prizes!'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Spin Wheel */}
          <div className="relative w-80 h-80">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <motion.div
              className="relative w-full h-full rounded-full shadow-2xl"
              style={{ 
                background: 'conic-gradient(from 0deg, #10b981 0deg 45deg, #6b7280 45deg 90deg, #3b82f6 90deg 135deg, #f59e0b 135deg 180deg, #8b5cf6 180deg 225deg, #ec4899 225deg 270deg, #3b82f6 270deg 315deg, #6b7280 315deg 360deg)',
              }}
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Prize Segments */}
              {PRIZES.map((prize, index) => {
                const angle = index * segmentAngle;
                const Icon = prize.icon;
                
                return (
                  <div
                    key={index}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transform: `rotate(${angle + segmentAngle / 2}deg) translateX(-50%) translateY(-130px)`,
                      transformOrigin: 'left center',
                    }}
                  >
                    <div className="flex flex-col items-center text-white text-xs font-bold text-center">
                      <Icon className="w-6 h-6 mb-1" />
                      <span className="text-shadow max-w-16 leading-tight">
                        {prize.displayName.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Center Circle */}
              <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-xl border-4 border-yellow-400">
                <Sparkles className="w-10 h-10 text-yellow-500" />
              </div>
            </motion.div>
          </div>

          {/* Action Button */}
          {requiresRegistration ? (
            <Button
              size="lg"
              onClick={() => setRegistrationModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-xl px-12 py-6 shadow-lg hover:shadow-xl transition-all"
              data-testid="button-register-to-spin"
              aria-label="Register to unlock the spin wheel"
            >
              <UserPlus className="mr-2 w-6 h-6" />
              Register to Spin!
            </Button>
          ) : spinStatus?.canSpin ? (
            <Button
              size="lg"
              onClick={handleSpin}
              disabled={spinning}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl px-12 py-6 shadow-lg hover:shadow-xl transition-all"
              data-testid="button-spin-wheel"
              aria-label={spinning ? "Wheel is spinning, please wait" : "Spin to generate numbers"}
            >
              {spinning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Sparkles />
                  </motion.div>
                  Spinning...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" />
                  SPIN NOW!
                </>
              )}
            </Button>
          ) : (
            <div className="text-center">
              <Badge variant="outline" className="px-6 py-3 text-lg">
                Next spin available in {spinStatus?.hoursUntilNextSpin || 24} hours
              </Badge>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Come back tomorrow for another chance!
              </p>
            </div>
          )}

          {/* Current Streak */}
          {spinStatus?.spinStreak && spinStatus.spinStreak > 0 && (
            <div className="text-center">
              <Badge variant="secondary" className="px-4 py-2">
                🔥 {spinStatus.spinStreak} Day Streak!
              </Badge>
            </div>
          )}

          {/* Registered Email Display */}
          {registeredEmail && !isAuthenticated && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registered as: {registeredEmail}
            </p>
          )}
        </div>

        {/* Prize Won Modal */}
        <AnimatePresence>
          {wonPrize && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <Card className="p-8 max-w-md text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  {wonPrize.icon && <wonPrize.icon className="w-24 h-24 mx-auto mb-4" style={{ color: wonPrize.color }} />}
                </motion.div>
                
                <h3 className="text-3xl font-bold mb-4">
                  {wonPrize.type === 'no_prize' ? '😔 Almost!' : '🎉 You Won!'}
                </h3>
                
                <p className="text-xl mb-6" style={{ color: wonPrize.color }}>
                  {wonPrize.displayName}
                </p>
                
                {wonPrize.type !== 'no_prize' && !claimMutation.isError && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Click below to claim your prize!
                  </p>
                )}
                
                {claimMutation.isError && (
                  <p className="text-sm text-red-500 mb-4">
                    Failed to claim prize. Please try again.
                  </p>
                )}
                
                <Button 
                  onClick={handleClaimPrize} 
                  disabled={claiming}
                  data-testid="button-close-prize"
                >
                  {claiming ? 'Claiming...' : (wonPrize.type === 'no_prize' ? 'Try Again Tomorrow' : (claimMutation.isError ? 'Retry Claim' : 'Claim Prize'))}
                </Button>
                
                {/* Upsell to Premium Subscription */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {wonPrize.type === 'no_prize' 
                      ? "Want more chances? Premium members get 5 daily spins!" 
                      : "Love winning? Premium members get unlimited picks!"}
                  </p>
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                    data-testid="link-upsell-premium"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </a>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Registration Modal */}
      <SpinRegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        onRegistrationComplete={handleRegistrationComplete}
      />
    </>
  );
}
