import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Gift, Mail, User, Shield, Trophy } from 'lucide-react';
import { Link } from 'wouter';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  marketingConsent: z.boolean(),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the privacy policy to continue'
  })
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface SpinRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistrationComplete: (email: string) => void;
}

export default function SpinRegistrationModal({ 
  open, 
  onOpenChange, 
  onRegistrationComplete 
}: SpinRegistrationModalProps) {
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      marketingConsent: true,
      privacyAccepted: false
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await apiRequest('POST', '/api/spin/register', {
        name: data.name,
        email: data.email,
        marketingConsent: data.marketingConsent
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: '🎉 Registration Complete!',
        description: 'You can now spin the wheel for prizes!',
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/spin/status'] });
      onRegistrationComplete(data.email);
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: '❌ Registration Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (data: RegistrationFormData) => {
    registerMutation.mutate(data);
  };

  const prizes = [
    { icon: Gift, text: 'Free Lottery Picks', color: 'text-green-500' },
    { icon: Trophy, text: '7-Day Premium Trial', color: 'text-purple-500' },
    { icon: Sparkles, text: 'Exclusive Discounts', color: 'text-yellow-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Spin to Win Prizes!
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-center">
            Register to unlock your daily spin and win amazing prizes!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 my-4">
          {prizes.map((prize, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg"
            >
              <prize.icon className={`w-6 h-6 ${prize.color} mb-1`} />
              <span className="text-xs text-center font-medium">{prize.text}</span>
            </motion.div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your name" 
                      {...field} 
                      data-testid="input-spin-registration-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="you@example.com" 
                      {...field}
                      data-testid="input-spin-registration-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketingConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-marketing-consent"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Send me lottery reminders & exclusive offers
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacyAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-privacy-policy"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I accept the{' '}
                      <Link href="/privacy" className="text-purple-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-sm">
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-300">
                Your information is secure and will never be sold.
              </span>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
              disabled={registerMutation.isPending}
              data-testid="button-spin-register-submit"
            >
              {registerMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Registering...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Unlock My Spin!
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <Link href="/auth" className="text-sm text-purple-600 hover:underline font-medium">
                Login here
              </Link>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
