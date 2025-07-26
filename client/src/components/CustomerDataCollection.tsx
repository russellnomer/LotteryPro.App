import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserIcon, PhoneIcon, MapPinIcon, DollarSignIcon } from "lucide-react";

interface CustomerDataCollectionProps {
  trigger?: "registration" | "subscription" | "profile_update";
  onComplete?: (customerId: string) => void;
  compact?: boolean;
}

export default function CustomerDataCollection({ 
  trigger = "registration", 
  onComplete,
  compact = false 
}: CustomerDataCollectionProps) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    zipCode: "",
    state: "",
    dateOfBirth: "",
    interests: {
      lotteryGames: [] as string[],
      gamblingInterest: "moderate",
      casinoInterest: false,
      cruiseInterest: false,
      educationInterest: false
    },
    demographics: {
      ageGroup: "",
      incomeRange: "",
      education: "",
      householdSize: ""
    },
    marketingOptIn: true,
    smsOptIn: false,
    referralCode: ""
  });

  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          registrationSource: 'web',
          trigger
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save customer data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your information has been saved securely for personalized experiences."
      });
      onComplete?.(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const updateInterest = (interest: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        [interest]: value
      }
    }));
  };

  const updateDemographic = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        [field]: value
      }
    }));
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <UserIcon className="h-4 w-4 mr-2" />
            Quick Profile Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <Input
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="casino-interest"
                checked={formData.interests.casinoInterest}
                onCheckedChange={(checked) => updateInterest('casinoInterest', !!checked)}
              />
              <label htmlFor="casino-interest" className="text-xs text-gray-600">
                Interested in casino offers
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing-opt"
                checked={formData.marketingOptIn}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingOptIn: !!checked }))}
              />
              <label htmlFor="marketing-opt" className="text-xs text-gray-600">
                Receive marketing emails
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="sm"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Complete Your Profile
        </CardTitle>
        <p className="text-sm text-gray-600">
          Help us personalize your experience and discover relevant gambling opportunities
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    {/* Add more states as needed */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Gambling Interests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <DollarSignIcon className="h-4 w-4 mr-2" />
              Gambling Interests
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="casino-interest"
                  checked={formData.interests.casinoInterest}
                  onCheckedChange={(checked) => updateInterest('casinoInterest', !!checked)}
                />
                <label htmlFor="casino-interest" className="text-sm">
                  Interested in casino promotions and offers
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cruise-interest"
                  checked={formData.interests.cruiseInterest}
                  onCheckedChange={(checked) => updateInterest('cruiseInterest', !!checked)}
                />
                <label htmlFor="cruise-interest" className="text-sm">
                  Interested in casino cruise deals
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="education-interest"
                  checked={formData.interests.educationInterest}
                  onCheckedChange={(checked) => updateInterest('educationInterest', !!checked)}
                />
                <label htmlFor="education-interest" className="text-sm">
                  Interested in gambling strategy courses
                </label>
              </div>

              <div>
                <Label htmlFor="gambling-experience">Gambling Experience Level</Label>
                <Select 
                  value={formData.interests.gamblingInterest} 
                  onValueChange={(value) => updateInterest('gamblingInterest', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Demographics (Optional) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Demographics (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age-group">Age Group</Label>
                <Select value={formData.demographics.ageGroup} onValueChange={(value) => updateDemographic('ageGroup', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="26-35">26-35</SelectItem>
                    <SelectItem value="36-45">36-45</SelectItem>
                    <SelectItem value="46-55">46-55</SelectItem>
                    <SelectItem value="56-65">56-65</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="income-range">Income Range</Label>
                <Select value={formData.demographics.incomeRange} onValueChange={(value) => updateDemographic('incomeRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-25k">Under $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                    <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                    <SelectItem value="100k-150k">$100,000 - $150,000</SelectItem>
                    <SelectItem value="150k+">$150,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Marketing Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Communication Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing-opt-in"
                  checked={formData.marketingOptIn}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingOptIn: !!checked }))}
                />
                <label htmlFor="marketing-opt-in" className="text-sm">
                  Send me email updates about lottery strategies, casino offers, and gambling opportunities
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms-opt-in"
                  checked={formData.smsOptIn}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smsOptIn: !!checked }))}
                />
                <label htmlFor="sms-opt-in" className="text-sm">
                  Send me SMS notifications for time-sensitive offers
                </label>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <Label htmlFor="referral-code">Referral Code (Optional)</Label>
            <Input
              id="referral-code"
              value={formData.referralCode}
              onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
              placeholder="Enter referral code if you have one"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Saving Profile...' : 'Complete Profile Setup'}
          </Button>

          <p className="text-xs text-gray-600 text-center">
            Your data is encrypted and stored securely. We use this information to provide personalized 
            gambling opportunities and comply with regulatory requirements.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}