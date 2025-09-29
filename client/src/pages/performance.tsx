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
                <i className="fas fa-chart-line mr-2"></i>Educational Analysis History
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-primary transition-colors">Dashboard</a>
              <a href="#" className="text-primary font-semibold">Analysis History</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Study Results</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistical Disclaimer Banner */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Educational Analysis Summary</h2>
              <p className="text-xl opacity-90">
                {marketingStats?.overallPerformance.totalPredictions || 0} historical pattern studies completed
              </p>
              <p className="text-sm opacity-75 mt-2">
                📚 For educational and entertainment purposes only
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {marketingStats?.overallPerformance.totalPredictions || 0}
              </div>
              <div className="text-lg opacity-90">Total Generated</div>
              <div className="text-sm opacity-75">
                Educational analysis only
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
                Educational Use Disclaimer
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">
                  <strong>This platform is for educational and entertainment purposes only.</strong> Important reminders:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All analysis is historical pattern study - not predictive</li>
                  <li>No system can predict random lottery outcomes</li>
                  <li>Each lottery draw is mathematically independent</li>
                  <li>Past results do not influence future outcomes</li>
                </ul>
                <p className="mt-3 font-semibold">
                  Use this tool for cultural learning and entertainment only - never for financial decisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pattern Studies</CardTitle>
              <i className="fas fa-dice text-orange-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketingStats?.overallPerformance.totalPredictions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total historical studies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Studied Method</CardTitle>
              <i className="fas fa-trophy text-yellow-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {marketingStats?.overallPerformance.topPerformingMethod || 'Various'}
              </div>
              <p className="text-xs text-muted-foreground">
                Study methodology
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pattern Matches</CardTitle>
              <i className="fas fa-medal text-green-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketingStats?.recentWins.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Recent analysis sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analysis Sessions</CardTitle>
              <i className="fas fa-chart-up text-blue-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {marketingStats?.overallPerformance.totalPredictions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Educational studies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Method Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-bar text-primary mr-2"></i>Analysis Method Comparison
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
                        <span className="text-gray-600">Sample Size: </span>
                        <span className="font-bold">{method.accuracy} studies</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Method: </span>
                        <span className="font-bold capitalize">{method.method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 italic">Historical frequency analysis - not predictive</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-book text-primary mr-2"></i>Recent Pattern Studies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketingStats?.recentWins && marketingStats.recentWins.length > 0 ? (
              <div className="space-y-4">
                {marketingStats.recentWins.map((win, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {win.numbersMatched}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {win.game === 'powerball' ? 'Powerball' : 'MegaMillions'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {win.method.toUpperCase()} analysis method
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">
                        {win.numbersMatched} pattern correlations
                      </div>
                      <div className="text-sm text-gray-600">{win.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-chart-line text-4xl mb-4 opacity-50"></i>
                <p>No recent pattern studies to display. Start analyzing numbers to build your educational history!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}