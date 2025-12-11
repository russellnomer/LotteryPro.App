import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Chart } from "@/components/ui/chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { GAME_CONFIG, ANALYSIS_METHODS, WHEEL_SYSTEMS } from "@/lib/lottery-data";
import { formatChartData, generateWheelCombinations } from "@/lib/lottery-analysis";
import { apiRequest } from "@/lib/queryClient";
import { GameType, TicketGeneration } from "@shared/schema";
import AdSpace from "@/components/AdSpace";
import JackpocketBanner from "@/components/JackpocketBanner";
// import EnhancedMusicPlayer from "@/components/EnhancedMusicPlayer"; // Replaced with RussellMusicPlayer
// Lazy load non-critical components for better initial performance
const BookRecommendations = lazy(() => import("@/components/BookRecommendations"));
const VipCodeManager = lazy(() => import("@/components/VipCodeManager"));
const FanLoyaltyContest = lazy(() => import("@/components/FanLoyaltyContest"));
const AstrologicalFeatures = lazy(() => import("@/components/AstrologicalFeatures"));
const RussellBiography = lazy(() => import("@/components/RussellBiography"));
const RussellMusicPlayer = lazy(() => import("@/components/RussellMusicPlayer"));
const ProfileSetup = lazy(() => import("@/components/ProfileSetup"));
const SpinWheel = lazy(() => import("@/components/gamification/SpinWheel"));
import SystemStatusIndicator from "@/components/SystemStatusIndicator";
import { Crown, Lock, UserPlus, Music, Star, Target, TrendingUp, Calendar, DollarSign } from "lucide-react";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<GameType>('powerball');
  const [selectedMethod, setSelectedMethod] = useState<string>('hot');
  const [generatedNumbers, setGeneratedNumbers] = useState<TicketGeneration | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [wheelCombinations, setWheelCombinations] = useState<number[][]>([]);
  const [selectedWheelType, setSelectedWheelType] = useState<string>('single');
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro' | 'premium' | 'unlimited'>('free'); // Default to free tier for all users
  const [dailyGenerationsUsed, setDailyGenerationsUsed] = useState<number>(0);
  const [maxDailyGenerations, setMaxDailyGenerations] = useState<number>(1); // Free tier limit
  const [userEmail, setUserEmail] = useState<string>(""); // Empty by default - user must authenticate
  const [showFloatingJackpocket, setShowFloatingJackpocket] = useState(false);

  // Show floating Jackpocket banner after 10 seconds
  useEffect(() => {
    const hasSeenBanner = sessionStorage.getItem('jackpocket_banner_seen');
    if (!hasSeenBanner) {
      const timer = setTimeout(() => {
        setShowFloatingJackpocket(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissFloatingBanner = () => {
    setShowFloatingJackpocket(false);
    sessionStorage.setItem('jackpocket_banner_seen', 'true');
  };
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check daily usage limits for free users
  useEffect(() => {
    const today = new Date().toDateString();
    const storedUsage = localStorage.getItem(`dailyUsage_${today}`);
    if (storedUsage) {
      setDailyGenerationsUsed(parseInt(storedUsage));
    }
  }, []);

  const updateDailyUsage = () => {
    // Don't track usage for unlimited users or Russell
    if (userTier === 'unlimited' || userEmail === 'russell@russellnomer.com') {
      return;
    }
    
    const today = new Date().toDateString();
    const newUsage = dailyGenerationsUsed + 1;
    setDailyGenerationsUsed(newUsage);
    localStorage.setItem(`dailyUsage_${today}`, newUsage.toString());
  };

  // Fetch analysis data for selected game (only when needed)
  const { data: analysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery<any>({
    queryKey: ['/api/analysis', selectedGame],
    enabled: false // Don't auto-fetch, only load when user generates numbers
  });

  // Generate numbers mutation
  const generateMutation = useMutation({
    mutationFn: async ({ game, method }: { game: GameType; method: string }) => {
      const response = await apiRequest('POST', `/api/generate/${game}`, { method });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedNumbers(data);
      updateDailyUsage();
      toast({
        title: "Numbers Generated!",
        description: `Generated ${GAME_CONFIG[selectedGame].name} numbers using ${ANALYSIS_METHODS[selectedMethod as keyof typeof ANALYSIS_METHODS].name} method.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate numbers",
        variant: "destructive"
      });
    }
  });

  const handleGenerateNumbers = () => {
    // Unlimited users and Russell bypass all limits
    if (userTier === 'unlimited' || userEmail === 'russell@russellnomer.com') {
      generateMutation.mutate({ game: selectedGame, method: selectedMethod });
      return;
    }
    
    // Check daily limits for other users
    if (userTier === 'free' && dailyGenerationsUsed >= maxDailyGenerations) {
      toast({
        title: "Daily Limit Reached",
        description: "Free users can generate 1 set of numbers per day. Upgrade to remove limits!",
        variant: "destructive"
      });
      return;
    }
    
    generateMutation.mutate({ game: selectedGame, method: selectedMethod });
  };

  const handleGenerateWheel = () => {
    if (analysis?.hotNumbers) {
      const combinations = generateWheelCombinations(analysis.hotNumbers, selectedGame, selectedWheelType);
      setWheelCombinations(combinations);
      setShowWheel(true);
      
      toast({
        title: "Wheel Generated!",
        description: `Generated ${WHEEL_SYSTEMS[selectedWheelType as keyof typeof WHEEL_SYSTEMS].name} with ${combinations.length} ${combinations.length === 1 ? 'ticket' : 'tickets'}.`
      });
    }
  };

  const gameConfig = GAME_CONFIG[selectedGame];
  const isGenerating = generateMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">
                <i className="fas fa-robot mr-2"></i>AI LotteryPro
              </h1>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                By Russell Nomer
              </Badge>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-primary font-semibold transition-colors">AI Lottery Pro</a>
              <a href="/music" className="text-gray-600 hover:text-primary transition-colors">Russell's Music</a>
              <a href="/performance" className="text-gray-600 hover:text-primary transition-colors">Performance</a>
              <a href="/subscription" className="text-gray-600 hover:text-primary transition-colors">Subscribe</a>
              <a href="/social-marketing" className="text-gray-600 hover:text-primary transition-colors">Social Marketing</a>
              <a href="/admin" className="text-red-600 hover:text-red-700 transition-colors font-semibold">🔑 Admin</a>
              
              {/* Demo User Tier Switcher (for testing) */}
              <select 
                value={userTier} 
                onChange={(e) => setUserTier(e.target.value as any)}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
                <option value="unlimited">Unlimited (Russell)</option>
              </select>
            </nav>
          </div>
        </div>
      </header>

      {/* Russell Nomer Branding Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">✨ Russell Nomer's Numerology & Runes Randomizer</h2>
            <p className="text-purple-100 text-lg">
              Sprinkle some mathematical fairy dust on your lottery dreams (just for fun!)
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                Number Magic
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                Crystal Ball Data
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                Fortune Cookie Stats
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Quick Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-white text-purple-600 hover:bg-gray-100"
                    onClick={() => window.location.href = '/music'}
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Russell's Music
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>}>
                <BookRecommendations compact={true} />
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>}>
                <VipCodeManager userEmail={userEmail} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Free Tier Banner Advertisement */}
        {userTier === 'free' && (
          <div className="mb-6 flex justify-center">
            <AdSpace size="leaderboard" position="Header" className="max-w-full" />
          </div>
        )}

        {/* Usage Limit Alert for Free Users */}
        {userTier === 'free' && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              <div className="flex justify-between items-center">
                <span>
                  Free Plan: {dailyGenerationsUsed}/{maxDailyGenerations} daily generations used
                  {dailyGenerationsUsed >= maxDailyGenerations && (
                    <span className="text-orange-600 ml-2">• Daily limit reached</span>
                  )}
                </span>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/subscription'}>
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time System Status and Statistical Power Indicator */}
        <div className="mb-6">
          <SystemStatusIndicator showDetails={true} />
        </div>

        {/* Daily Spin-to-Win Gamification - Revenue Driver! */}
        <div className="mb-8">
          <Suspense fallback={
            <div className="animate-pulse bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 h-96 rounded-lg"></div>
          }>
            <SpinWheel />
          </Suspense>
        </div>

        {/* Game Selector */}
        <div className="mb-8">
          <Tabs value={selectedGame} onValueChange={(value) => setSelectedGame(value as GameType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="powerball" className="bg-red-600 text-white hover:bg-red-700 data-[state=active]:bg-red-600">
                <div className="text-center">
                  <i className="fas fa-bolt text-2xl mb-2 block"></i>
                  <div className="text-lg font-semibold">Powerball</div>
                  <div className="text-sm opacity-90">5 from 1-69 + 1 from 1-26</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="megamillions" className="bg-blue-600 text-white hover:bg-blue-700 data-[state=active]:bg-blue-600">
                <div className="text-center">
                  <i className="fas fa-gem text-2xl mb-2 block"></i>
                  <div className="text-lg font-semibold">MegaMillions</div>
                  <div className="text-sm opacity-90">5 from 1-70 + 1 from 1-24</div>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Number Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-dice text-primary mr-2"></i>Generate Numbers
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleGenerateNumbers}
                      disabled={isGenerating || (userTier === 'free' && dailyGenerationsUsed >= maxDailyGenerations)}
                      className="bg-primary hover:bg-blue-700"
                    >
                      <i className="fas fa-sync-alt mr-2"></i>
                      {isGenerating ? 'Generating...' : 
                       userTier === 'free' && dailyGenerationsUsed >= maxDailyGenerations ? 
                       'Daily Limit Reached' : 'Generate 6 Numbers'}
                    </Button>
                    {userTier === 'free' && dailyGenerationsUsed >= maxDailyGenerations && (
                      <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
                        <Lock className="h-4 w-4 mr-2" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Generated Numbers Display */}
                {generatedNumbers && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Your 6 Lucky Numbers</h3>
                      <div className="text-sm text-gray-600">
                        {selectedGame === 'powerball' ? 'Powerball' : 'MegaMillions'} • 5 Main + 1 {selectedGame === 'powerball' ? 'Powerball' : 'Mega Ball'}
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center gap-3 mb-6">
                      {/* Main 5 Numbers */}
                      {generatedNumbers.mainNumbers.map((num, index) => (
                        <div key={index} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-xl font-bold text-gray-800 shadow-lg border-2 border-gray-200">
                          {num}
                        </div>
                      ))}
                      
                      {/* Visual Separator */}
                      <div className="flex flex-col items-center mx-3">
                        <div className="text-gray-400 font-bold text-lg">+</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedGame === 'powerball' ? 'PB' : 'MB'}
                        </div>
                      </div>
                      
                      {/* Bonus Number */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-white ${
                        selectedGame === 'powerball' ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
                        {generatedNumbers.bonusNumber}
                      </div>
                    </div>
                    
                    {/* Number Summary */}
                    <div className="text-center bg-white rounded-lg p-4 mb-4">
                      <div className="text-lg font-mono font-bold text-gray-800">
                        {generatedNumbers.mainNumbers.join(' - ')} + {generatedNumbers.bonusNumber}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Complete 6-Number Selection
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-3 text-sm">
                      <Badge variant="secondary">
                        Method: {ANALYSIS_METHODS[generatedNumbers.method as keyof typeof ANALYSIS_METHODS]?.name || generatedNumbers.method}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Just for Giggles
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        6 Total Numbers
                      </Badge>
                    </div>
                    
                    {/* Jackpocket Affiliate CTA - Revenue Generator */}
                    <div className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold mb-2">🎫 Ready to Play?</div>
                        <p className="text-sm opacity-90">
                          Buy your ticket instantly through Jackpocket - America's #1 lottery app!
                        </p>
                      </div>
                      <Button
                        className="w-full bg-white text-green-600 hover:bg-gray-100 font-bold text-lg py-6"
                        onClick={async () => {
                          // Track affiliate click
                          try {
                            await fetch('/api/affiliate/track', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                partner: 'jackpocket',
                                game: selectedGame,
                                ticketId: generatedNumbers.ticketId
                              })
                            });
                          } catch (e) {
                            console.error('Tracking error:', e);
                          }
                          // Open Jackpocket affiliate link
                          window.open('https://lottery.jackpocket.com/r/lotto/russellnomer/LOTTERY/US-NY', '_blank');
                        }}
                        data-testid="button-play-jackpocket"
                      >
                        <i className="fas fa-ticket-alt mr-2"></i>
                        Play These Numbers on Jackpocket
                      </Button>
                      <div className="mt-3 text-center text-xs opacity-75">
                        Available in 17+ states • Secure & Regulated • Instant Play
                      </div>
                      <div className="mt-2 text-center text-xs opacity-60 italic">
                        Affiliate Link - We may earn a commission at no extra cost to you
                      </div>
                    </div>
                  </div>
                )}

                {/* Number Recipe Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Pick Your Number Recipe</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(ANALYSIS_METHODS).map(([key, method]) => (
                      <div 
                        key={key}
                        className={`bg-gray-50 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedMethod === key ? 'border-primary' : 'border-gray-200 hover:border-primary'
                        }`}
                        onClick={() => setSelectedMethod(key)}
                      >
                        <div className="text-center">
                          <i className={`${method.icon} text-${method.color}-500 text-2xl mb-2`}></i>
                          <div className="font-semibold text-gray-800">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mid-content Advertisement for Free Users */}
            {userTier === 'free' && (
              <div className="flex justify-center mb-6">
                <AdSpace size="rectangle" position="Mid-content" />
              </div>
            )}

            {/* Number Popularity Contest */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-chart-bar text-primary mr-2"></i>Number Popularity Contest
                  {userTier === 'free' && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Limited Features
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading analysis...</div>
                  </div>
                ) : analysis ? (
                  <>
                    {/* Hot and Cold Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <i className="fas fa-fire text-orange-500 mr-2"></i>Currently Trendy Numbers
                        </h3>
                        <div className="space-y-2">
                          {analysis.hotNumbers.slice(0, 3).map((num: number, index: number) => {
                            const freq = analysis.frequencyData.find((f: any) => f.number === num)?.frequency || 0;
                            return (
                              <div key={num} className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {num}
                                  </div>
                                  <span className="ml-3 font-medium">Number {num}</span>
                                </div>
                                <span className="text-orange-600 font-semibold">{freq} times</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <i className="fas fa-snowflake text-blue-500 mr-2"></i>Cold Numbers
                        </h3>
                        <div className="space-y-2">
                          {analysis.coldNumbers.slice(0, 3).map((num: number) => {
                            const freq = analysis.frequencyData.find((f: any) => f.number === num)?.frequency || 0;
                            return (
                              <div key={num} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {num}
                                  </div>
                                  <span className="ml-3 font-medium">Number {num}</span>
                                </div>
                                <span className="text-blue-600 font-semibold">{freq} times</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Frequency Chart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Which Numbers Show Up Most Often? (Spoiler: It Doesn't Matter!)</h4>
                      <div className="h-64">
                        <Chart data={formatChartData(analysis.frequencyData)} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No analysis data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wheel Combinations */}
            {showWheel && wheelCombinations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <i className="fas fa-cogs text-primary mr-2"></i>
                      {WHEEL_SYSTEMS[selectedWheelType as keyof typeof WHEEL_SYSTEMS]?.name || 'Wheel Combinations'}
                    </span>
                    <Badge variant="secondary">
                      {wheelCombinations.length} {wheelCombinations.length === 1 ? 'Ticket' : 'Tickets'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {wheelCombinations.map((combination, index) => {
                      // Generate consistent bonus number for each combination
                      const bonusNumber = Math.floor(Math.random() * (selectedGame === 'powerball' ? 26 : 24)) + 1;
                      
                      return (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                          <div className="text-sm text-gray-600 mb-3 flex items-center justify-between">
                            <span>
                              {selectedWheelType === 'single' ? 'Optimized Single Ticket' : `Ticket ${index + 1}`} • 6 Numbers Total
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {selectedGame === 'powerball' ? 'Powerball' : 'MegaMillions'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 justify-center mb-3">
                            {/* Main 5 numbers */}
                            {combination.map((num, numIndex) => (
                              <div key={numIndex} className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-800 shadow-md border-2 border-gray-300">
                                {num}
                              </div>
                            ))}
                            
                            {/* Separator */}
                            <div className="text-gray-400 font-bold mx-2 text-lg">+</div>
                            
                            {/* Bonus number */}
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md border-2 border-white ${
                              selectedGame === 'powerball' ? 'bg-red-600' : 'bg-blue-600'
                            }`}>
                              {bonusNumber}
                            </div>
                          </div>
                          
                          <div className="text-center bg-white rounded-md p-2">
                            <div className="text-sm font-mono font-bold text-gray-800">
                              {combination.join(' - ')} + {bonusNumber}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Complete 6-Number Selection
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {selectedWheelType === 'single' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center text-green-800">
                        <i className="fas fa-star mr-2"></i>
                        <span className="text-sm font-medium">Single Ticket Optimization</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        This ticket combines hot numbers with balanced selection for optimal single-play strategy.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleGenerateWheel}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>Generate New Wheel
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Fun Dataset Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-magic text-primary mr-2"></i>The Number Cauldron
                  </span>
                  <a href="/performance" className="text-sm text-primary hover:underline">
                    View Magic Stats →
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">112K+</div>
                    <div className="text-sm text-gray-600">Lucky Numbers Brewed</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">5+ Years</div>
                    <div className="text-sm text-gray-600">of Number Wizardry</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">✨</div>
                    <div className="text-sm text-gray-600">Pure Entertainment</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white text-center">
                  <p className="font-semibold">🎭 Just for Fun & Giggles!</p>
                  <p className="text-sm opacity-90">This magical number generator is pure entertainment - no crystal ball actually predicts lottery draws! 🔮</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sidebar Advertisement for Free Users */}
            {userTier === 'free' && (
              <div className="flex justify-center">
                <AdSpace size="square" position="Sidebar Top" />
              </div>
            )}

            {/* Statistics Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-calculator text-primary mr-2"></i>Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Draws Analyzed</span>
                      <span className="font-semibold text-gray-800">{analysis.stats.totalDraws}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Date Range</span>
                      <span className="font-semibold text-gray-800 text-sm">{analysis.stats.dateRange}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Most Frequent</span>
                      <span className="font-semibold text-orange-600">{analysis.stats.mostFrequent.join(', ')}</span>
                    </div>
                    <Separator />
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Jackpot Odds</div>
                      <div className="text-lg font-bold text-red-600">{gameConfig.odds}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">Loading statistics...</div>
                )}
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-history text-primary mr-2"></i>Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis?.recentDraws ? (
                  <div className="space-y-3">
                    {analysis.recentDraws.slice(0, 3).map((draw: any, index: number) => (
                      <div key={draw.id} className={`border-l-4 pl-3 ${index === 0 ? 'border-primary' : 'border-gray-300'}`}>
                        <div className="text-sm text-gray-600">{new Date(draw.drawDate).toLocaleDateString()}</div>
                        <div className="flex gap-1 mt-1">
                          {(draw.mainNumbers as number[]).map((num: number, numIndex: number) => (
                            <div key={numIndex} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">
                              {num}
                            </div>
                          ))}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                            selectedGame === 'powerball' ? 'bg-red-500' : 'bg-blue-500'
                          }`}>
                            {draw.bonusNumber}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">Loading recent results...</div>
                )}
              </CardContent>
            </Card>

            {/* Wheeling System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-cogs text-primary mr-2"></i>Wheel System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Select Wheel Type:</h4>
                  {Object.entries(WHEEL_SYSTEMS).map(([key, system]) => (
                    <div 
                      key={key} 
                      className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                        selectedWheelType === key 
                          ? 'bg-primary bg-opacity-10 border-primary' 
                          : 'bg-gray-50 border-gray-200 hover:border-primary'
                      }`}
                      onClick={() => setSelectedWheelType(key)}
                    >
                      <div className="font-medium text-gray-800 flex items-center justify-between">
                        {system.name}
                        {selectedWheelType === key && <i className="fas fa-check text-primary"></i>}
                      </div>
                      <div className="text-sm text-gray-600">{system.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{system.ticketsRequired}</div>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={handleGenerateWheel}
                  className="w-full mt-4 bg-primary hover:bg-blue-700"
                  disabled={!analysis?.hotNumbers}
                >
                  <i className="fas fa-cogs mr-2"></i>
                  Generate {WHEEL_SYSTEMS[selectedWheelType as keyof typeof WHEEL_SYSTEMS]?.name || 'Wheel'}
                </Button>
              </CardContent>
            </Card>

            {/* Mid-sidebar Advertisement for Free Users */}
            {userTier === 'free' && (
              <div className="flex justify-center">
                <AdSpace size="square" position="Sidebar Mid" />
              </div>
            )}

            {/* Educational Info */}
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-800">
                  <i className="fas fa-heart text-pink-600 mr-2"></i>💝 Support Russell's Dream
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-purple-700 space-y-3">
                <p className="font-semibold">😂 If This Somehow Works:</p>
                <p>• Consider naming Russell Nomer as co-heir to your jackpot winnings</p>
                <p>• Become his Sugar Mamma and fund his music career</p>
                <p>• At minimum, buy his entire 35-book Amazon collection!</p>
                <p className="text-xs text-purple-600 mt-2 italic">
                  (Obviously joking - but seriously, check out his books and music! Support independent artists! 🎵📚)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Advertisement for Free Users */}
        {userTier === 'free' && (
          <div className="mt-8 mb-6 flex justify-center">
            <AdSpace size="banner" position="Footer" className="max-w-full" />
          </div>
        )}

        {/* Customer Data Collection for Marketing Leads */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <UserPlus className="h-5 w-5 mr-2" />
              Get Personalized Casino & Gambling Offers
            </CardTitle>
            <p className="text-sm text-blue-700">
              Complete your profile to receive exclusive casino deals, cruise offers, and gambling education opportunities tailored for lottery players.
            </p>
          </CardHeader>
          <CardContent>
            <ProfileSetup 
              compact={true}
              onComplete={(customerId) => {
                toast({
                  title: "Profile Complete",
                  description: "Your account is now verified! You have full access to all system features and personalized offers."
                });
              }}
            />
          </CardContent>
        </Card>

        {/* Fun Reality Check */}
        <Card className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start">
              <i className="fas fa-hat-wizard text-purple-500 text-2xl mr-3 mt-1"></i>
              <div className="text-purple-700">
                <h3 className="font-semibold mb-2">🎪 Reality Check: No Magic Wands Here!</h3>
                <p className="text-sm leading-relaxed mb-3">
                  <strong>🎲 THE TRUTH:</strong> This is a fancy random number picker with sparkles and statistics - NOT a lottery oracle! 
                  Every number from 1-69 has exactly the same chance of popping up, whether we "analyze" it or flip a coin. 
                  Our "cosmic algorithms" are just fun math tricks - pure entertainment, zero fortune-telling powers!
                  <br/><br/>
                  <strong>✨ NO MAGIC GUARANTEES:</strong> Our fairy dust, crystal ball data, and lucky number cauldron are 100% for giggles. 
                  They won't make you rich (sorry!). Play lottery for fun, not profit - and only with money you'd happily spend on pizza!
                  <br/><br/>
                  <strong>🎯 PLAY SMART:</strong> Keep it fun, keep it light! 
                  If gambling becomes a problem, reach out for real help at{' '}
                  <a href="https://www.1800gambler.net" className="underline font-medium text-purple-800" target="_blank" rel="noopener noreferrer">1-800-GAMBLER</a> or{' '}
                  <a href="https://www.ncpgambling.org" className="underline font-medium text-purple-800" target="_blank" rel="noopener noreferrer">ncpgambling.org</a>.
                  <br/><br/>
                  <strong>😂 IF YOU WIN:</strong> Please remember Russell Nomer in your will as co-heir, become his Sugar Mamma, 
                  or at least buy him a coffee. (Just kidding... but his books and music are fire! 🔥)
                </p>
                <div className="text-xs bg-red-100 p-2 rounded border border-red-300">
                  <p className="font-semibold">Mathematical Reality:</p>
                  <p>Powerball odds: 1 in 292,201,338 | MegaMillions odds: 1 in 302,575,350</p>
                  <p>These odds remain constant regardless of any analytical method used.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Russell Biography Section - Personal story and mission */}
      <div className="mb-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>}>
          <RussellBiography />
        </Suspense>
      </div>

      {/* Russell's Authentic Music Player Section - Replaces old music player */}
      <div className="mb-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>}>
          <RussellMusicPlayer />
        </Suspense>
      </div>
      
      {/* Remove old Enhanced Music Player to prevent confusion */}

      {/* Book Recommendations Section */}
      <div className="mb-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>}>
          <BookRecommendations />
        </Suspense>
      </div>

      {/* Astrological Features Section */}
      <div className="mb-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>}>
          <AstrologicalFeatures compact={false} />
        </Suspense>
      </div>

      {/* Fan Loyalty Contest Section */}
      <div className="mb-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>}>
          <FanLoyaltyContest compact={false} />
        </Suspense>
      </div>

      {/* Floating Jackpocket Banner - Appears after 10 seconds */}
      {showFloatingJackpocket && (
        <JackpocketBanner variant="floating" onDismiss={dismissFloatingBanner} />
      )}
    </div>
  );
}
