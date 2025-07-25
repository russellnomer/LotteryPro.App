import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GameType, MarketingStats } from "@shared/schema";

export default function Performance() {
  const { data: marketingStats, isLoading } = useQuery<MarketingStats>({
    queryKey: ['/api/marketing-stats']
  });

  const { data: powerbballPerf } = useQuery({
    queryKey: ['/api/performance/powerball']
  });

  const { data: megaPerf } = useQuery({
    queryKey: ['/api/performance/megamillions']
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">
                <i className="fas fa-chart-line mr-2"></i>LotteryPro Performance
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-primary transition-colors">Dashboard</a>
              <a href="#" className="text-primary font-semibold">Performance</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Track Record</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistical Disclaimer Banner */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Statistical Analysis Status</h2>
              <p className="text-xl opacity-90">
                {marketingStats?.overallPerformance.totalEvaluated || 0} validated results - 
                {(marketingStats?.overallPerformance.sampleSizeNeeded || 384)} more needed for statistical significance
              </p>
              <p className="text-sm opacity-75 mt-2">
                ⚠️ No performance advantage claims can be validated with current data
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {marketingStats?.overallPerformance.totalPredictions || 0}
              </div>
              <div className="text-lg opacity-90">Total Generated</div>
              <div className="text-sm opacity-75">
                {marketingStats?.overallPerformance.totalEvaluated || 0} Evaluated
              </div>
            </div>
          </div>
        </div>

        {/* Critical Statistical Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">
                Important Statistical Disclaimer
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">
                  <strong>Current data is insufficient for statistical validation.</strong> Any performance claims require:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Minimum 384 validated predictions (95% confidence level)</li>
                  <li>Control group of random selections</li>
                  <li>6+ months of outcome tracking</li>
                  <li>Peer-reviewed statistical analysis</li>
                </ul>
                <p className="mt-3 font-semibold">
                  Mathematical fact: Each lottery draw is independent. Past results do not influence future outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Generated Predictions</CardTitle>
              <i className="fas fa-dice text-orange-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketingStats?.overallPerformance.averageAccuracy}%
              </div>
              <p className="text-xs text-muted-foreground">
                Better than random selection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Method</CardTitle>
              <i className="fas fa-trophy text-yellow-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {marketingStats?.overallPerformance.topPerformingMethod}
              </div>
              <p className="text-xs text-muted-foreground">
                Best performing strategy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Wins</CardTitle>
              <i className="fas fa-medal text-green-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketingStats?.recentWins.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                In the last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Edge Over Random</CardTitle>
              <i className="fas fa-chart-up text-blue-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{marketingStats?.overallPerformance.improvementOverRandom}%
              </div>
              <p className="text-xs text-muted-foreground">
                Improvement rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Method Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-bar text-primary mr-2"></i>Method Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {marketingStats?.methodComparison.map((method, index) => (
                <div key={method.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {method.method.toUpperCase()}
                      </Badge>
                      <span className="font-semibold capitalize">{method.method} Numbers</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="text-gray-600">Accuracy: </span>
                        <span className="font-bold">{method.accuracy}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Win Rate: </span>
                        <span className="font-bold">{method.winRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Best Match: </span>
                        <span className="font-bold">{method.bestMatch}/5</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={method.accuracy} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-trophy text-primary mr-2"></i>Recent Winning Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketingStats?.recentWins && marketingStats.recentWins.length > 0 ? (
              <div className="space-y-4">
                {marketingStats.recentWins.map((win, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {win.numbersMatched}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {win.game === 'powerball' ? 'Powerball' : 'MegaMillions'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {win.method.toUpperCase()} method • {win.prizeLevel}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {win.numbersMatched} matches
                      </div>
                      <div className="text-sm text-gray-600">{win.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-chart-line text-4xl mb-4 opacity-50"></i>
                <p>No recent wins to display. Start generating predictions to build your track record!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}