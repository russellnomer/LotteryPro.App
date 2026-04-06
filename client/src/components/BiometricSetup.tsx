import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, CheckCircle, Trash2, Smartphone, Monitor, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const PAID_TIERS = ['basic', 'pro', 'premium', 'founder', 'lifetime', 'unlimited'];

interface BiometricCredential {
  id: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function BiometricSetup({ userTier }: { userTier?: string }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('biometric_prompt_dismissed') === 'true'
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isPaidUser = PAID_TIERS.includes(userTier || '');

  useEffect(() => {
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setPlatformAvailable(available))
        .catch(() => setPlatformAvailable(false));
    }
  }, []);

  const { data: credsData, isLoading: credsLoading } = useQuery<{ credentials: BiometricCredential[] }>({
    queryKey: ['/api/auth/webauthn/credentials'],
    enabled: isPaidUser,
  });

  const credentials = credsData?.credentials || [];
  const hasCredentials = credentials.length > 0;

  const deleteMutation = useMutation({
    mutationFn: (credId: string) =>
      apiRequest('DELETE', `/api/auth/webauthn/credentials/${credId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/webauthn/credentials'] });
      toast({ title: 'Device removed', description: 'Biometric login removed for this device.' });
    },
  });

  const handleSetup = async () => {
    setIsRegistering(true);
    try {
      const optRes = await fetch('/api/auth/webauthn/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || 'Could not start setup.');

      const regResponse = await startRegistration({ optionsJSON: options });

      const deviceName = getDeviceName();
      const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: regResponse, deviceName }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error || 'Setup failed.');

      queryClient.invalidateQueries({ queryKey: ['/api/auth/webauthn/credentials'] });
      toast({
        title: 'Biometric login enabled!',
        description: `${deviceName} is now registered. Next time, just use Face ID or your fingerprint.`,
      });
      localStorage.setItem('biometric_prompt_dismissed', 'true');
      setDismissed(true);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        toast({ title: 'Cancelled', description: 'Biometric setup was cancelled.', variant: 'destructive' });
      } else {
        toast({ title: 'Setup failed', description: err.message || 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('biometric_prompt_dismissed', 'true');
    setDismissed(true);
  };

  if (!isPaidUser || !platformAvailable) return null;

  // If user already has credentials set up, show management view
  if (hasCredentials) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200 text-base">
            <CheckCircle className="h-5 w-5" />
            Biometric Login Active
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            You can sign in with Face ID or fingerprint on registered devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {credentials.map(cred => (
            <div key={cred.id} className="flex items-center justify-between bg-white dark:bg-green-900 rounded-lg p-3 border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">{cred.deviceName}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {cred.lastUsedAt
                      ? `Last used ${new Date(cred.lastUsedAt).toLocaleDateString()}`
                      : `Added ${new Date(cred.createdAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(cred.id)}
                disabled={deleteMutation.isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetup}
            disabled={isRegistering}
            className="w-full mt-2 min-h-[44px] border-green-300 text-green-700 hover:bg-green-100"
          >
            <Fingerprint className="h-4 w-4 mr-2" />
            {isRegistering ? 'Registering…' : 'Add Another Device'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // First-time prompt — shown if not dismissed and no credentials yet
  if (dismissed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSetup}
        disabled={isRegistering}
        className="flex items-center gap-2 min-h-[44px] border-indigo-200 text-indigo-700 hover:bg-indigo-50"
      >
        <Fingerprint className="h-4 w-4" />
        {isRegistering ? 'Setting up…' : 'Enable Face ID / Fingerprint Login'}
      </Button>
    );
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-800 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <CardHeader className="pb-3 pr-8">
        <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 text-base">
          <Fingerprint className="h-5 w-5" />
          Skip the password next time
        </CardTitle>
        <CardDescription className="text-indigo-700 dark:text-indigo-300">
          Set up Face ID or fingerprint login — one tap to get in, no password needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleSetup}
          disabled={isRegistering}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Fingerprint className="h-4 w-4 mr-2" />
          {isRegistering ? 'Setting up — approve the prompt on your device…' : 'Set Up Biometric Login'}
        </Button>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 text-center">
          Your face or fingerprint never leaves your device. We only store a secure key.
        </p>
      </CardContent>
    </Card>
  );
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Windows/.test(ua)) return 'Windows PC';
  return 'This Device';
}
