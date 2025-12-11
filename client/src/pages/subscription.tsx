import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Star, Zap, Users, TrendingUp, CreditCard, AlertTriangle, Info, ExternalLink, Gift } from "lucide-react";
import { Link } from "wouter";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/8x28wO2Xq5gbgGX6Se9IQ00";
const JACKPOCKET_REFERRAL_LINK = "https://lottery.jackpocket.com/r/lotto/russellnomer/LOTTERY/US-NY";

export default function SubscriptionPage() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [stateConfirmed, setStateConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const canPurchase = ageVerified && stateConfirmed && termsAccepted;

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "0.00",
      period: "forever",
      description: "Dip your toe in the number cauldron",
      features: [
        "1 number generation per day",
        "Basic lucky number mixing",
        "Hot & cold number watching",
        "Community support"
      ],
      badge: null,
      limitations: [
        "Includes advertising",
        "Daily generation limit",
        "Basic features only"
      ]
    },
    {
      id: "basic",
      name: "Basic",
      price: "9.99",
      period: "monthly",
      description: "Perfect for casual dreamers",
      features: [
        "5 number conjurings per day",
        "Fancy number shuffling",
        "Hot & cold number gazing",
        "No advertisements",
        "Email support"
      ],
      badge: null
    },
    {
      id: "pro",
      name: "Pro",
      price: "19.99", 
      period: "monthly",
      description: "For dedicated number enthusiasts",
      features: [
        "Unlimited number wizardry",
        "Fancy wheel spinning systems",
        "Fun number history tracking",
        "No advertisements",
        "Priority support",
        "Early access to new toys"
      ],
      badge: "Most Popular"
    },
    {
      id: "premium",
      name: "Premium",
      price: "39.99",
      period: "monthly", 
      description: "For number nerds and dream teams",
      features: [
        "Everything in Pro",
        "Community pool access",
        "Extra sprinkles of fairy dust",
        "Jackpocket integration",
        "Personal number concierge",
        "Group dream management",
        "100% ad-free experience"
      ],
      badge: "Best Value"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your LotteryPro Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
Upgrade your lucky number game with more cosmic conjuring power! ✨ (Pure entertainment - no actual magic!)
          </p>
          
          <Alert className="max-w-2xl mx-auto mt-6 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>Educational Entertainment Only:</strong> LotteryPro is for educational and entertainment purposes only. We make no claims about improving your odds of winning. Past number patterns do not predict future results. Play responsibly.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="max-w-3xl mx-auto mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Before purchasing, please confirm:</p>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="subAgeVerify" 
                checked={ageVerified}
                onCheckedChange={(checked) => setAgeVerified(checked === true)}
                data-testid="checkbox-sub-age-verify"
              />
              <label htmlFor="subAgeVerify" className="text-sm text-gray-700 dark:text-gray-300 leading-tight cursor-pointer">
                I confirm I am 18 years of age or older
              </label>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="subStateConfirm" 
                checked={stateConfirmed}
                onCheckedChange={(checked) => setStateConfirmed(checked === true)}
                data-testid="checkbox-sub-state-confirm"
              />
              <label htmlFor="subStateConfirm" className="text-sm text-gray-700 dark:text-gray-300 leading-tight cursor-pointer">
                I confirm I do not reside in AL, AK, HI, MS, NV, or UT (where lottery services are prohibited)
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="subTermsAccept" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                data-testid="checkbox-sub-terms-accept"
              />
              <label htmlFor="subTermsAccept" className="text-sm text-gray-700 dark:text-gray-300 leading-tight cursor-pointer">
                I agree to the <Link href="/terms"><span className="text-primary hover:underline">Terms of Service</span></Link> and <Link href="/privacy"><span className="text-primary hover:underline">Privacy Policy</span></Link>
              </label>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-lg ${
                plan.badge === "Most Popular" ? 'border-blue-500 border-2' : ''
              } ${plan.badge === "Best Value" ? 'border-purple-500 border-2' : ''}`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  {plan.badge}
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">${plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {(plan as any).limitations && (
                  <ul className="space-y-2 mb-6 border-t pt-4">
                    {(plan as any).limitations.map((limitation: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-orange-400 rounded-full flex-shrink-0" />
                        <span className="text-sm text-orange-600 dark:text-orange-400">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="space-y-3">
                  {plan.id === "free" ? (
                    <Button 
                      className="w-full" 
                      onClick={() => window.location.href = "/"}
                      data-testid="button-start-free"
                    >
                      Start Free
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => window.open(STRIPE_PAYMENT_LINK, '_blank')}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      disabled={!canPurchase}
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {canPurchase ? 'Subscribe Now' : 'Confirm Above to Subscribe'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Jackpocket Referral - Premium Partner CTA */}
        <div className="mb-12 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Gift className="h-6 w-6" />
                <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300">NEW USER BONUS</Badge>
              </div>
              <h2 className="text-3xl font-bold mb-3">Ready to Play Your Numbers?</h2>
              <p className="text-lg opacity-90 mb-4">
                Use Jackpocket - America's #1 lottery app! New users get bonus lottery credits when you sign up through our link.
              </p>
              <ul className="text-sm opacity-80 space-y-1 mb-4">
                <li>✓ Play official state lottery games from your phone</li>
                <li>✓ Available in 17+ states</li>
                <li>✓ Secure, regulated, and legal</li>
                <li>✓ Get $20 in lottery credits for new accounts</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-6 shadow-lg"
                onClick={() => window.open(JACKPOCKET_REFERRAL_LINK, '_blank')}
                data-testid="button-jackpocket-subscription"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Get Jackpocket Now
              </Button>
              <p className="text-xs text-center opacity-60 italic">
                Affiliate Link - We may earn a commission
              </p>
            </div>
          </div>
        </div>

        {/* Features highlight section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Why Our Number Cauldron is Fun!</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Fancy Math Sprinkles</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                We count stuff and make it look pretty with charts
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Fun Number Tricks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hot numbers, spinning wheels, and other entertaining gimmicks
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Dream Together</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Join pools and share hopes with fellow dreamers
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant Fun</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Quick number mixing and sparkly animations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}