import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PayPalButton from "@/components/PayPalButton";
import { useState } from "react";
import { CheckCircle, Star, Zap, Users, TrendingUp } from "lucide-react";

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "9.99",
      period: "monthly",
      description: "Perfect for casual players",
      features: [
        "5 number generations per day",
        "Basic frequency analysis",
        "Hot & cold number tracking",
        "Email support"
      ],
      badge: null
    },
    {
      id: "pro",
      name: "Pro",
      price: "19.99", 
      period: "monthly",
      description: "Best for serious lottery players",
      features: [
        "Unlimited number generations",
        "Advanced wheel systems",
        "Performance tracking & analytics",
        "Priority support",
        "Early access to new features"
      ],
      badge: "Most Popular"
    },
    {
      id: "premium",
      name: "Premium",
      price: "39.99",
      period: "monthly", 
      description: "For lottery enthusiasts and groups",
      features: [
        "Everything in Pro",
        "Community pool access",
        "Advanced prediction algorithms",
        "Jackpocket integration",
        "Personal lottery advisor",
        "Group management tools"
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
            Unlock the power of statistical analysis and increase your chances with our proven lottery strategies
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-lg ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
              } ${plan.badge === "Most Popular" ? 'border-blue-500 border-2' : ''}`}
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
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => setSelectedPlan(plan.id)}
                    className="w-full"
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                  </Button>
                  
                  {selectedPlan === plan.id && (
                    <div className="mt-4">
                      <PayPalButton 
                        amount={plan.price}
                        currency="USD"
                        intent="CAPTURE"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features highlight section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose LotteryPro?</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Statistical Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Advanced frequency analysis and pattern recognition
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Proven Methods</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hot numbers, wheel systems, and balanced selection
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Join pools and share strategies with other players
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-time</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Live tracking and instant number generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}