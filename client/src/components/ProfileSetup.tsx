import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { UserPlus, Mail, Phone, MapPin, Shield, CheckCircle, AlertTriangle, Send } from 'lucide-react';

interface ProfileSetupProps {
  onComplete?: (customerId: string) => void;
  compact?: boolean;
}

export default function ProfileSetup({ onComplete, compact = false }: ProfileSetupProps) {
  const [step, setStep] = useState<'profile' | 'verification'>('profile');
  const [profileData, setProfileData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    mobileNumber: '',
    marketingOptIn: true,
    preferredVerification: 'email' as 'email' | 'mobile'
  });
  
  const [verificationData, setVerificationData] = useState({
    code: '',
    attempts: 0,
    codeSent: false,
    isVerifying: false
  });

  const [customerId, setCustomerId] = useState<string>('');
  const { toast } = useToast();

  // US States for dropdown
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest('POST', '/api/customer/profile', data);
      return response.json();
    },
    onSuccess: (data) => {
      setCustomerId(data.customerId);
      setStep('verification');
      toast({
        title: "Profile Created",
        description: `Verification code sent via ${profileData.preferredVerification}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive"
      });
    }
  });

  // Send verification code mutation
  const sendVerificationMutation = useMutation({
    mutationFn: async (method: 'email' | 'mobile') => {
      const response = await apiRequest('POST', '/api/customer/send-verification', {
        customerId,
        method
      });
      return response.json();
    },
    onSuccess: () => {
      setVerificationData(prev => ({ ...prev, codeSent: true }));
      toast({
        title: "Code Sent",
        description: `Verification code sent via ${profileData.preferredVerification}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive"
      });
    }
  });

  // Verify code mutation
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/customer/verify', {
        customerId,
        code,
        method: profileData.preferredVerification
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Complete",
        description: "Your account has been approved! You now have full access to the system."
      });
      onComplete?.(customerId);
    },
    onError: (error: any) => {
      setVerificationData(prev => ({ 
        ...prev, 
        attempts: prev.attempts + 1,
        isVerifying: false 
      }));
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const required = ['email', 'firstName', 'lastName', 'streetAddress', 'city', 'state', 'zipCode', 'mobileNumber'];
    const missing = required.filter(field => !profileData[field as keyof typeof profileData]);
    
    if (missing.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missing.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Validate mobile number format (US format)
    const mobileRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!mobileRegex.test(profileData.mobileNumber)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid US mobile number (e.g., 555-123-4567)",
        variant: "destructive"
      });
      return;
    }

    createProfileMutation.mutate(profileData);
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationData.code.length === 6) {
      setVerificationData(prev => ({ ...prev, isVerifying: true }));
      verifyCodeMutation.mutate(verificationData.code);
    }
  };

  const handleResendCode = () => {
    sendVerificationMutation.mutate(profileData.preferredVerification);
  };

  if (step === 'verification') {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-2xl mx-auto"}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Verify Your Account
          </CardTitle>
          <p className="text-sm text-gray-600">
            We've sent a 6-digit verification code to your {profileData.preferredVerification === 'email' ? 'email' : 'mobile number'}.
            Enter it below to complete your profile and gain full access.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationData.code}
                onChange={(e) => setVerificationData(prev => ({ 
                  ...prev, 
                  code: e.target.value.replace(/\D/g, '').slice(0, 6) 
                }))}
                className="text-center text-lg font-mono"
                maxLength={6}
              />
            </div>

            {verificationData.attempts > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Verification failed. {3 - verificationData.attempts} attempts remaining.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Button 
                type="submit" 
                disabled={verificationData.code.length !== 6 || verifyCodeMutation.isPending}
                className="w-full"
              >
                {verifyCodeMutation.isPending ? 'Verifying...' : 'Verify & Complete Setup'}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={sendVerificationMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendVerificationMutation.isPending ? 'Sending...' : 'Resend Code'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? "w-full" : "w-full max-w-2xl mx-auto"}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Complete Your Profile
        </CardTitle>
        <p className="text-sm text-gray-600">
          Fill out all required information to unlock personalized casino deals, cruise offers, 
          and gambling education opportunities. Verification required for account approval.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              <h3 className="text-lg font-medium">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="555-123-4567"
                  value={profileData.mobileNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Smith"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Mailing Address */}
          <div className="space-y-4">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <h3 className="text-lg font-medium">Mailing Address</h3>
            </div>
            
            <div>
              <Label htmlFor="streetAddress">Street Address *</Label>
              <Input
                id="streetAddress"
                type="text"
                placeholder="123 Main Street"
                value={profileData.streetAddress}
                onChange={(e) => setProfileData(prev => ({ ...prev, streetAddress: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Las Vegas"
                  value={profileData.city}
                  onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="state">State *</Label>
                <Select 
                  value={profileData.state} 
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, state: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {usStates.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="89101"
                  value={profileData.zipCode}
                  onChange={(e) => setProfileData(prev => ({ ...prev, zipCode: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Verification Method & Preferences */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <h3 className="text-lg font-medium">Verification & Preferences</h3>
            </div>
            
            <div>
              <Label>Preferred Verification Method</Label>
              <Select 
                value={profileData.preferredVerification} 
                onValueChange={(value: 'email' | 'mobile') => 
                  setProfileData(prev => ({ ...prev, preferredVerification: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Verification</SelectItem>
                  <SelectItem value="mobile">SMS Verification</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                You must verify via email or mobile to access the system
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing"
                checked={profileData.marketingOptIn}
                onCheckedChange={(checked) => 
                  setProfileData(prev => ({ ...prev, marketingOptIn: checked as boolean }))
                }
              />
              <Label htmlFor="marketing" className="text-sm">
                Send me casino deals, cruise offers, and gambling education opportunities
              </Label>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              After submitting, you'll receive a verification code to complete your profile. 
              Once verified, you'll have full access to personalized offers and system features.
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createProfileMutation.isPending}
          >
            {createProfileMutation.isPending ? 'Creating Profile...' : 'Create Profile & Send Verification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}