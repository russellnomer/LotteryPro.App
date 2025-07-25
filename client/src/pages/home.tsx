import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Chart } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { GAME_CONFIG, ANALYSIS_METHODS, WHEEL_SYSTEMS } from "@/lib/lottery-data";
import { formatChartData, generateWheelCombinations } from "@/lib/lottery-analysis";
import { apiRequest } from "@/lib/queryClient";
import { GameType, TicketGeneration } from "@shared/schema";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<GameType>('powerball');
  const [selectedMethod, setSelectedMethod] = useState<string>('hot');
  const [generatedNumbers, setGeneratedNumbers] = useState<TicketGeneration | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [wheelCombinations, setWheelCombinations] = useState<number[][]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch analysis data for selected game
  const { data: analysis, isLoading: analysisLoading } = useQuery<any>({
    queryKey: ['/api/analysis', selectedGame],
    enabled: !!selectedGame
  });

  // Generate numbers mutation
  const generateMutation = useMutation({
    mutationFn: async ({ game, method }: { game: GameType; method: string }) => {
      const response = await apiRequest('POST', `/api/generate/${game}`, { method });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedNumbers(data);
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
    generateMutation.mutate({ game: selectedGame, method: selectedMethod });
  };

  const handleGenerateWheel = () => {
    if (analysis?.hotNumbers) {
      const combinations = generateWheelCombinations(analysis.hotNumbers, selectedGame);
      setWheelCombinations(combinations);
      setShowWheel(true);
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">
                <i className="fas fa-chart-line mr-2"></i>LotteryPro
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Dashboard</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Analysis</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">History</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Help</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <div className="text-sm opacity-90">5 from 1-60 + 1 from 1-24</div>
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
                      disabled={isGenerating}
                      className="bg-primary hover:bg-blue-700"
                    >
                      <i className="fas fa-sync-alt mr-2"></i>
                      {selectedMethod === 'hot' ? 'Smart Pick' : 'Quick Pick'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Generated Numbers Display */}
                {generatedNumbers && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Numbers</h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {/* Main Numbers */}
                      <div className="flex gap-2">
                        {generatedNumbers.mainNumbers.map((num, index) => (
                          <div key={index} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-lg font-bold text-gray-800 shadow-md">
                            {num}
                          </div>
                        ))}
                      </div>
                      {/* Bonus Number */}
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-400 rounded-full mx-2"></div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${
                          selectedGame === 'powerball' ? 'bg-red-600' : 'bg-blue-600'
                        }`}>
                          {generatedNumbers.bonusNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Badge variant="secondary">
                        Method: {ANALYSIS_METHODS[generatedNumbers.method as keyof typeof ANALYSIS_METHODS]?.name || generatedNumbers.method}
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {Math.round(generatedNumbers.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Analysis Method Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Analysis Method</h3>
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

            {/* Frequency Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-chart-bar text-primary mr-2"></i>Frequency Analysis
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
                          <i className="fas fa-fire text-orange-500 mr-2"></i>Hot Numbers
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
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Number Frequency Distribution</h4>
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
                  <CardTitle className="flex items-center">
                    <i className="fas fa-cogs text-primary mr-2"></i>Wheel Combinations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wheelCombinations.map((combination, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Combination {index + 1}</div>
                        <div className="flex gap-2">
                          {combination.map((num, numIndex) => (
                            <div key={numIndex} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-800 shadow-sm">
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                  {Object.entries(WHEEL_SYSTEMS).map(([key, system]) => (
                    <div 
                      key={key} 
                      className={`p-3 rounded-lg ${key === 'abbreviated' ? 'bg-primary bg-opacity-10 border-2 border-primary' : 'bg-gray-50'}`}
                    >
                      <div className="font-medium text-gray-800">{system.name}</div>
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
                  Generate Wheel
                </Button>
              </CardContent>
            </Card>

            {/* Educational Info */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <i className="fas fa-lightbulb text-yellow-600 mr-2"></i>Analysis Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-700 space-y-2">
                <p><strong>Frequency Analysis:</strong> Identifies numbers drawn most/least often in recent history.</p>
                <p><strong>Wheel Systems:</strong> Mathematical approach to cover multiple number combinations efficiently.</p>
                <p><strong>Balance Strategy:</strong> Distributes numbers across low, mid, and high ranges.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="mt-12 bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-3 mt-1"></i>
              <div className="text-red-700">
                <h3 className="font-semibold mb-2">Important Disclaimer</h3>
                <p className="text-sm leading-relaxed mb-3">
                  Lottery games are games of chance. All numbers have equal probability of being drawn regardless of historical frequency. 
                  This analysis is for entertainment purposes only and does not guarantee winning outcomes. 
                  Please play responsibly and within your means. If you have a gambling problem, seek help at{' '}
                  <a href="#" className="underline font-medium">1-800-GAMBLER</a>.
                </p>
                <div className="text-xs">
                  <p>Powerball odds: 1 in 292,201,338 | MegaMillions odds: 1 in 302,575,350</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
