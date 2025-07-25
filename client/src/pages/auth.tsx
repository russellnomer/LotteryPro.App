import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Smartphone, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'mfa-setup' | 'mfa-verify'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    subscriptionTier: 'basic',
    mfaCode: '',
    userId: ''
  });
  const [mfaData, setMfaData] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      if (authStep === 'register') {
        await handleRegister();
      } else if (authStep === 'login') {
        await handleLogin();
      } else if (authStep === 'mfa-setup') {
        await handleMfaSetup();
      } else if (authStep === 'mfa-verify') {
        await handleMfaVerify();
      }
    } catch (error: any) {
      setErrors([error.message || 'An error occurred']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        subscriptionTier: formData.subscriptionTier
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    if (data.requiresMFA) {
      setFormData(prev => ({ ...prev, userId: data.userId }));
      setAuthStep('mfa-setup');
    }
  };

  const handleLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        mfaCode: formData.mfaCode
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    if (data.requiresMFA) {
      setAuthStep('mfa-verify');
    } else if (data.requiresMFASetup) {
      setFormData(prev => ({ ...prev, userId: data.userId }));
      setAuthStep('mfa-setup');
    } else if (data.success) {
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: "Login successful",
        description: "Welcome back to LotteryPro!"
      });
      window.location.href = '/';
    }
  };

  const handleMfaSetup = async () => {
    const response = await fetch('/api/auth/mfa/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: formData.userId })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    setMfaData(data);
  };

  const handleMfaVerify = async () => {
    const endpoint = mfaData ? '/api/auth/mfa/verify' : '/api/auth/login';
    const payload = mfaData 
      ? { userId: formData.userId, token: formData.mfaCode }
      : { email: formData.email, password: formData.password, mfaCode: formData.mfaCode };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    if (data.success) {
      if (data.backupCodes) {
        // Show backup codes for MFA setup completion
        toast({
          title: "MFA Setup Complete!",
          description: "Save your backup codes in a safe place."
        });
      }
      if (data.sessionToken) {
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      window.location.href = '/';
    }
  };

  const renderMFAEducation = () => (
    <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        <div className="font-semibold mb-2">Why Multi-Factor Authentication (MFA) is Required</div>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Account Protection:</strong> MFA prevents unauthorized access even if your password is compromised</li>
          <li><strong>Secure Subscriptions:</strong> Protects your payment information and subscription benefits</li>
          <li><strong>Data Safety:</strong> Keeps your lottery strategies and personal preferences secure</li>
          <li><strong>Industry Standard:</strong> Financial and gaming platforms require MFA for user protection</li>
        </ul>
        <div className="mt-3 text-sm">
          <strong>Google Authenticator</strong> generates time-based codes that change every 30 seconds, providing strong security without push notifications that can be intercepted.
        </div>
      </AlertDescription>
    </Alert>
  );

  const renderMFASetup = () => (
    <div className="space-y-6">
      {renderMFAEducation()}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Set Up Google Authenticator
          </CardTitle>
          <CardDescription>
            Follow these steps to secure your account with MFA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!mfaData ? (
            <Button onClick={handleMfaSetup} disabled={isLoading} className="w-full">
              {isLoading ? 'Setting up...' : 'Start MFA Setup'}
            </Button>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Step 1: Download Google Authenticator</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download from your device's app store: "Google Authenticator"
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Step 2: Scan QR Code or Enter Key</h4>
                  <div className="text-center mb-4">
                    <img 
                      src={mfaData.qrCode} 
                      alt="QR Code for MFA Setup" 
                      className="mx-auto border rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Or manually enter this key:
                    </p>
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                      {mfaData.manualEntryKey}
                    </code>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Step 3: Enter Verification Code</h4>
                  <div className="space-y-3">
                    <Label htmlFor="mfaCode">6-digit code from Google Authenticator</Label>
                    <Input
                      id="mfaCode"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={formData.mfaCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, mfaCode: e.target.value.replace(/\D/g, '') }))}
                      className="text-center text-lg tracking-widest"
                    />
                    <Button 
                      onClick={handleMfaVerify} 
                      disabled={isLoading || formData.mfaCode.length !== 6}
                      className="w-full"
                    >
                      {isLoading ? 'Verifying...' : 'Complete MFA Setup'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderLoginForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your LotteryPro account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {authStep === 'mfa-verify' && (
            <div className="space-y-2">
              <Label htmlFor="mfaCodeLogin">Authentication Code</Label>
              <Input
                id="mfaCodeLogin"
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={formData.mfaCode}
                onChange={(e) => setFormData(prev => ({ ...prev, mfaCode: e.target.value.replace(/\D/g, '') }))}
                className="text-center tracking-widest"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the code from your Google Authenticator app
              </p>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderRegisterForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Start your lottery analysis journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="regEmail">Email</Label>
            <Input
              id="regEmail"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="regPassword">Password</Label>
            <div className="relative">
              <Input
                id="regPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription">Subscription Plan</Label>
            <Select value={formData.subscriptionTier} onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionTier: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - $9.99/month</SelectItem>
                <SelectItem value="pro">Pro - $19.99/month</SelectItem>
                <SelectItem value="premium">Premium - $29.99/month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              All subscribers must set up Multi-Factor Authentication for account security.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {errors.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {authStep === 'mfa-setup' ? (
          renderMFASetup()
        ) : (
          <Tabs value={authStep === 'mfa-verify' ? 'login' : authStep} onValueChange={(value) => {
            if (value !== 'mfa-verify') {
              setAuthStep(value as any);
              setFormData(prev => ({ ...prev, mfaCode: '' }));
            }
          }}>
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {renderLoginForm()}
            </TabsContent>
            
            <TabsContent value="register">
              {renderRegisterForm()}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}