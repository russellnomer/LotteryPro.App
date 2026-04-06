import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Smartphone, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Fingerprint, Clock, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

import { ELIGIBLE_STATES, PROHIBITED_STATE_CODES } from "@shared/stateConfig";

const PROHIBITED_STATES = PROHIBITED_STATE_CODES;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'mfa-setup' | 'mfa-verify' | 'forgot-password' | 'reset-password' | 'email-verify'>('login');
  const [resetToken, setResetToken] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [stateConfirmed, setStateConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    subscriptionTier: 'basic',
    mfaCode: '',
    otpCode: '',
    userId: '',
    homeState: ''
  });
  const [mfaData, setMfaData] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  // Handle URL query parameters for auth flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true') {
      setAuthStep('register');
    } else if (params.get('forgot') === 'true') {
      setAuthStep('forgot-password');
    } else if (params.get('reset')) {
      setResetToken(params.get('reset')!);
      setAuthStep('reset-password');
    }
  }, []);

  // Detect if biometric authentication is available on this device
  useEffect(() => {
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setBiometricSupported(available))
        .catch(() => setBiometricSupported(false));
    }
  }, []);

  const handleBiometricLogin = useCallback(async () => {
    setIsBiometricLoading(true);
    setErrors([]);
    try {
      const optionsRes = await fetch('/api/auth/webauthn/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email || undefined }),
      });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || 'Could not start biometric login.');

      const { challengeKey, ...authOptions } = options;
      const authResponse = await startAuthentication({ optionsJSON: authOptions });

      const verifyRes = await fetch('/api/auth/webauthn/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResponse, challengeKey }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error || 'Biometric verification failed.');

      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({ title: 'Welcome back!', description: 'Signed in with biometrics.' });
      window.location.href = '/';
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setErrors(['Biometric prompt was cancelled. Please try again or sign in with your password.']);
      } else {
        setErrors([err.message || 'Biometric sign-in failed. Please use your password.']);
      }
    } finally {
      setIsBiometricLoading(false);
    }
  }, [formData.email, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      if (authStep === 'register') {
        await handleRegister();
      } else if (authStep === 'email-verify') {
        await handleVerifyEmail();
      } else if (authStep === 'login') {
        await handleLogin();
      } else if (authStep === 'mfa-setup') {
        await handleMfaSetup();
      } else if (authStep === 'mfa-verify') {
        await handleMfaVerify();
      } else if (authStep === 'forgot-password') {
        await handleForgotPassword();
      } else if (authStep === 'reset-password') {
        await handleResetPassword();
      }
    } catch (error: any) {
      const msg: string = error.message || '';
      if (msg === 'TOO_MANY_ATTEMPTS' || msg.toLowerCase().includes('too many')) {
        setLockoutMinutes(15);
        setErrors(['too_many_attempts']);
      } else {
        setErrors([msg || 'Something went wrong. Please try again.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (PROHIBITED_STATES.includes(formData.homeState)) {
      throw new Error(`Lottery services are not available in your state. Please select a different state or contact support.`);
    }
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        subscriptionTier: formData.subscriptionTier,
        homeState: formData.homeState || undefined,
        marketingConsent
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    if (data.requiresEmailVerification) {
      setFormData(prev => ({ ...prev, userId: data.userId }));
      setAuthStep('email-verify');
      startResendCooldown(60);
    } else if (data.requiresMFA) {
      setFormData(prev => ({ ...prev, userId: data.userId }));
      setAuthStep('mfa-setup');
    }
  };

  const startResendCooldown = (seconds: number) => {
    setResendCooldown(seconds);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyEmail = async () => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email, code: formData.otpCode })
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.code === 'invalid_code') throw new Error('That code is incorrect or has expired. Check your inbox or request a new one.');
      throw new Error(data.error || 'Verification failed');
    }
    toast({ title: 'Email verified!', description: 'Your email has been confirmed.' });
    setAuthStep('mfa-setup');
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (response.status === 429) {
        startResendCooldown(data.waitSeconds || 60);
        return;
      }
      if (!response.ok) throw new Error(data.error);
      toast({ title: 'Code sent!', description: 'Check your inbox for a new 6-digit code.' });
      startResendCooldown(60);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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

  const handleForgotPassword = async () => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    toast({
      title: "Check Your Email",
      description: "If an account exists with this email, you'll receive password reset instructions."
    });
    
    // For development: if token is returned, show reset form immediately
    if (data.resetToken) {
      setResetToken(data.resetToken);
      setAuthStep('reset-password');
    } else {
      setAuthStep('login');
    }
  };

  const handleResetPassword = async () => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: resetToken,
        newPassword: formData.password 
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    toast({
      title: "Password Reset Successful",
      description: "You can now sign in with your new password."
    });
    setAuthStep('login');
    setFormData(prev => ({ ...prev, password: '' }));
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
        <CardDescription>Sign in to your LotteryPro account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Biometric sign-in — shown when device supports it */}
        {biometricSupported && authStep !== 'mfa-verify' && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 flex items-center justify-center gap-3"
              onClick={handleBiometricLogin}
              disabled={isBiometricLoading}
              data-testid="button-biometric-login"
            >
              <Fingerprint className={`h-5 w-5 text-indigo-600 ${isBiometricLoading ? 'animate-pulse' : ''}`} />
              {isBiometricLoading ? 'Verifying…' : 'Sign in with Face ID / Fingerprint'}
            </Button>
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">or use password</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
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
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {authStep === 'mfa-verify' && (
            <div className="space-y-2">
              <Label htmlFor="mfaCodeLogin">6-Digit Authentication Code</Label>
              <Input
                id="mfaCodeLogin"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={formData.mfaCode}
                onChange={(e) => setFormData(prev => ({ ...prev, mfaCode: e.target.value.replace(/\D/g, '') }))}
                className="text-center text-xl tracking-widest"
                autoFocus
              />
              <p className="text-sm text-gray-500">Open Google Authenticator on your phone and enter the code shown.</p>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full h-11 text-base">
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthStep('forgot-password')}
              className="text-sm text-blue-600 hover:underline"
              data-testid="link-forgot-password"
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderForgotPasswordForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resetEmail">Email</Label>
            <Input
              id="resetEmail"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              data-testid="input-reset-email"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full" data-testid="button-send-reset">
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setAuthStep('login')}
              className="text-sm text-gray-600 hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderResetPasswordForm = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                data-testid="input-new-password"
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
            <p className="text-xs text-gray-500">Password must be at least 8 characters</p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full" data-testid="button-reset-password">
            {isLoading ? 'Resetting...' : 'Reset Password'}
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

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="homeState">Your State <span className="text-gray-400 font-normal">(optional — sets your local lottery data)</span></Label>
              <Select
                value={formData.homeState}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, homeState: value }));
                  setStateConfirmed(!PROHIBITED_STATES.includes(value));
                }}
              >
                <SelectTrigger id="homeState" data-testid="select-home-state">
                  <SelectValue placeholder="Select your state..." />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {ELIGIBLE_STATES.map(s => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.flag} {s.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="OTHER">🌍 Outside USA / Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              {formData.homeState && PROHIBITED_STATES.includes(formData.homeState) && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Lottery services are not permitted in this state.
                </p>
              )}
              {formData.homeState === 'NY' && (
                <p className="text-xs text-emerald-600">New York users get full scratch-off prize tracking!</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="ageVerify" 
                checked={ageVerified}
                onCheckedChange={(checked) => setAgeVerified(checked === true)}
                data-testid="checkbox-age-verify"
              />
              <label htmlFor="ageVerify" className="text-sm text-gray-700 dark:text-gray-300 leading-tight cursor-pointer">
                I confirm I am 18 years of age or older
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="termsAccept" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                data-testid="checkbox-terms-accept"
              />
              <label htmlFor="termsAccept" className="text-sm text-gray-700 dark:text-gray-300 leading-tight cursor-pointer">
                I agree to the <Link href="/terms"><span className="text-primary hover:underline">Terms of Service</span></Link> and <Link href="/privacy"><span className="text-primary hover:underline">Privacy Policy</span></Link>
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="marketingConsent"
                checked={marketingConsent}
                onCheckedChange={(checked) => setMarketingConsent(checked === true)}
              />
              <label htmlFor="marketingConsent" className="text-sm text-gray-600 dark:text-gray-400 leading-tight cursor-pointer">
                <span className="font-medium">Optional:</span> Send me draw day reminders and occasional updates about new features. You can unsubscribe at any time.
              </label>
            </div>
          </div>

          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
              <strong>Educational Entertainment Only:</strong> LotteryPro is for educational and entertainment purposes only. We make no claims about improving your odds of winning. Past number patterns do not predict future results.
            </AlertDescription>
          </Alert>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              All subscribers must set up Multi-Factor Authentication for account security.
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            disabled={isLoading || !ageVerified || !termsAccepted || PROHIBITED_STATES.includes(formData.homeState)} 
            className="w-full"
            data-testid="button-create-account"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderEmailVerifyStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-2">
          <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <CardTitle>Check your inbox</CardTitle>
        <CardDescription>
          We sent a 6-digit code to <strong>{formData.email}</strong>. Enter it below to confirm your address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otpCode">Verification code</Label>
            <Input
              id="otpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              required
              autoFocus
              value={formData.otpCode}
              onChange={(e) => setFormData(prev => ({ ...prev, otpCode: e.target.value.replace(/\D/g, '') }))}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <p className="text-xs text-gray-500">Code expires in 15 minutes. Check your spam folder if you don't see it.</p>
          </div>

          <Button type="submit" disabled={isLoading || formData.otpCode.length !== 6} className="w-full">
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendCode}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <SEOHead title="Login or Register" description="Create your free LotteryPro account to access lottery analysis tools, save picks, and join community pools." path="/auth" />
      <div className="max-w-4xl mx-auto">
        {errors.includes('too_many_attempts') ? (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <AlertDescription className="text-orange-900 dark:text-orange-100">
              <p className="font-semibold text-base mb-1">Too many sign-in attempts</p>
              <p className="text-sm mb-3">For your security, sign-in has been paused for a few minutes. You haven't been locked out — just take a short break and try again.</p>
              <div className="flex flex-col gap-2 text-sm">
                <p>In the meantime, you can:</p>
                <button
                  type="button"
                  onClick={() => { setErrors([]); setAuthStep('forgot-password'); }}
                  className="text-left text-orange-700 dark:text-orange-300 underline hover:no-underline"
                >
                  → Reset your password via email
                </button>
                {biometricSupported && (
                  <button
                    type="button"
                    onClick={() => { setErrors([]); handleBiometricLogin(); }}
                    className="text-left text-orange-700 dark:text-orange-300 underline hover:no-underline"
                  >
                    → Sign in with Face ID / fingerprint (no password needed)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrors([])}
                  className="text-left text-orange-500 hover:underline mt-1"
                >
                  → Try again now
                </button>
              </div>
            </AlertDescription>
          </Alert>
        ) : errors.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {authStep === 'email-verify' ? (
          renderEmailVerifyStep()
        ) : authStep === 'mfa-setup' ? (
          renderMFASetup()
        ) : authStep === 'forgot-password' ? (
          renderForgotPasswordForm()
        ) : authStep === 'reset-password' ? (
          renderResetPasswordForm()
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