import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target, Trophy, BarChart3, AlertTriangle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface WinLossStatement {
  spendingLevel: number;
  totalSpent: number;
  totalWon: number;
  netProfit: number;
  winningTickets: number;
  totalTickets: number;
  roi: number;
  biggestWin: number;
  byMethod: {
    [method: string]: {
      spent: number;
      won: number;
      net: number;
      tickets: number;
      wins: number;
    };
  };
}

interface MethodSummary {
  method: string;
  totalTickets: number;
  wins: number;
  totalWon: number;
  avgWin: number;
  biggestWin: number;
  matches: {
    '0': number;
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

interface DailyPick {
  id: string;
  game: string;
  method: string;
  mainNumbers: number[];
  bonusNumber: number;
  createdAt: string;
}

export default function Performance() {
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const { data: winLossData, isLoading: loadingWinLoss } = useQuery<{ success: boolean; statements: WinLossStatement[] }>({
    queryKey: ['/api/performance/win-loss-statements']
  });

  const { data: methodSummaryData, isLoading: loadingMethodSummary } = useQuery<{ success: boolean; summary: Record<string, MethodSummary> }>({
    queryKey: ['/api/performance/method-summary']
  });

  const { data: dailyPicksData, isLoading: loadingDailyPicks } = useQuery<{ success: boolean; tickets: DailyPick[]; total: number }>({
    queryKey: ['/api/performance/daily-picks', { game: gameFilter, method: methodFilter }]
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalPicks = () => {
    if (!methodSummaryData?.summary) return 0;
    return Object.values(methodSummaryData.summary).reduce((sum, method) => sum + method.totalTickets, 0);
  };

  const getTotalWins = () => {
    if (!methodSummaryData?.summary) return 0;
    return Object.values(methodSummaryData.summary).reduce((sum, method) => sum + method.wins, 0);
  };

  if (loadingWinLoss && loadingMethodSummary && loadingDailyPicks) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" data-testid="loading-performance">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead title="Performance Analytics & Historical Tracking" description="Track lottery number generation performance with real draw results. Comprehensive win/loss analysis across multiple spending levels." path="/performance" />
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
                Analysis History (Performance)
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Educational Disclaimer Banner */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 mb-8 text-white" data-testid="disclaimer-banner">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2">Educational Analysis Summary</h2>
              <p className="text-sm opacity-90 mb-2">
                <strong>This platform is for educational and entertainment purposes only.</strong> Important reminders:
              </p>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• All analysis is historical pattern study - not predictive</li>
                <li>• No system can predict random lottery outcomes</li>
                <li>• Each lottery draw is mathematically independent</li>
                <li>• Past results do not influence future outcomes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-list">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="daily-picks" data-testid="tab-daily-picks">Daily Picks</TabsTrigger>
            <TabsTrigger value="win-loss" data-testid="tab-win-loss">Win/Loss Analysis</TabsTrigger>
            <TabsTrigger value="method-comparison" data-testid="tab-method-comparison">Method Comparison</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6" data-testid="dashboard-content">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-total-picks">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Generated Picks</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-picks">{getTotalPicks()}</div>
                  <p className="text-xs text-muted-foreground">Educational analysis picks</p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-wins">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Wins</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-wins">{getTotalWins()}</div>
                  <p className="text-xs text-muted-foreground">Pattern matches found</p>
                </CardContent>
              </Card>

              <Card data-testid="card-success-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-success-rate">
                    {getTotalPicks() > 0 ? ((getTotalWins() / getTotalPicks()) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Match rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Win/Loss Summary Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Win/Loss Summary by Spending Level</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {winLossData?.statements?.map((statement) => (
                  <Card key={statement.spendingLevel} data-testid={`card-spending-${statement.spendingLevel}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        ${statement.spendingLevel} Per Pick
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Spent:</span>
                        <span className="font-semibold" data-testid={`text-spent-${statement.spendingLevel}`}>
                          {formatCurrency(statement.totalSpent)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Won:</span>
                        <span className="font-semibold" data-testid={`text-won-${statement.spendingLevel}`}>
                          {formatCurrency(statement.totalWon)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net:</span>
                        <span className={`font-semibold ${statement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-net-${statement.spendingLevel}`}>
                          {formatCurrency(statement.netProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ROI:</span>
                        <span className={`font-semibold ${statement.roi >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-roi-${statement.spendingLevel}`}>
                          {statement.roi.toFixed(1)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Daily Picks Tab */}
          <TabsContent value="daily-picks" className="space-y-6" data-testid="daily-picks-content">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Game:</label>
                <Select value={gameFilter} onValueChange={setGameFilter}>
                  <SelectTrigger className="w-40" data-testid="select-game-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="powerball">Powerball</SelectItem>
                    <SelectItem value="megamillions">MegaMillions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Method:</label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-40" data-testid="select-method-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="hot">Hot Numbers</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="wheel">Wheel</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Picks Table */}
            <Card data-testid="daily-picks-table">
              <CardHeader>
                <CardTitle>Generated Picks ({dailyPicksData?.total || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDailyPicks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead data-testid="header-date">Date</TableHead>
                          <TableHead data-testid="header-game">Game</TableHead>
                          <TableHead data-testid="header-method">Method</TableHead>
                          <TableHead data-testid="header-numbers">Numbers</TableHead>
                          <TableHead data-testid="header-bonus">Bonus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyPicksData?.tickets?.slice(0, 50).map((pick) => (
                          <TableRow key={pick.id} data-testid={`row-pick-${pick.id}`}>
                            <TableCell data-testid={`cell-date-${pick.id}`}>{formatDate(pick.createdAt)}</TableCell>
                            <TableCell data-testid={`cell-game-${pick.id}`}>
                              <Badge variant="outline" className="capitalize">
                                {pick.game}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`cell-method-${pick.id}`}>
                              <Badge variant="secondary" className="capitalize">
                                {pick.method}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`cell-numbers-${pick.id}`}>
                              <div className="flex gap-1">
                                {pick.mainNumbers.map((num, idx) => (
                                  <span key={idx} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm font-semibold">
                                    {num}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell data-testid={`cell-bonus-${pick.id}`}>
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-sm font-semibold">
                                {pick.bonusNumber}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Win/Loss Analysis Tab */}
          <TabsContent value="win-loss" className="space-y-6" data-testid="win-loss-content">
            {loadingWinLoss ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              winLossData?.statements?.map((statement) => (
                <Card key={statement.spendingLevel} data-testid={`card-statement-${statement.spendingLevel}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Spending Level: ${statement.spendingLevel} Per Pick</span>
                      <Badge variant={statement.netProfit >= 0 ? "default" : "destructive"} data-testid={`badge-profit-${statement.spendingLevel}`}>
                        {statement.netProfit >= 0 ? 'Profit' : 'Loss'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-bold" data-testid={`text-statement-spent-${statement.spendingLevel}`}>
                          {formatCurrency(statement.totalSpent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Won</p>
                        <p className="text-lg font-bold" data-testid={`text-statement-won-${statement.spendingLevel}`}>
                          {formatCurrency(statement.totalWon)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
                        <p className={`text-lg font-bold ${statement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-statement-net-${statement.spendingLevel}`}>
                          {formatCurrency(statement.netProfit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ROI</p>
                        <p className={`text-lg font-bold ${statement.roi >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-statement-roi-${statement.spendingLevel}`}>
                          {statement.roi.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Method Breakdown */}
                    <div>
                      <h4 className="font-semibold mb-3">Breakdown by Method</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Method</TableHead>
                              <TableHead>Tickets</TableHead>
                              <TableHead>Wins</TableHead>
                              <TableHead>Spent</TableHead>
                              <TableHead>Won</TableHead>
                              <TableHead>Net</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(statement.byMethod).map(([method, data]) => (
                              <TableRow key={method} data-testid={`row-method-${statement.spendingLevel}-${method}`}>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {method}
                                  </Badge>
                                </TableCell>
                                <TableCell data-testid={`cell-tickets-${statement.spendingLevel}-${method}`}>{data.tickets}</TableCell>
                                <TableCell data-testid={`cell-wins-${statement.spendingLevel}-${method}`}>{data.wins}</TableCell>
                                <TableCell data-testid={`cell-spent-${statement.spendingLevel}-${method}`}>{formatCurrency(data.spent)}</TableCell>
                                <TableCell data-testid={`cell-won-${statement.spendingLevel}-${method}`}>{formatCurrency(data.won)}</TableCell>
                                <TableCell className={data.net >= 0 ? 'text-green-600' : 'text-red-600'} data-testid={`cell-net-${statement.spendingLevel}-${method}`}>
                                  {formatCurrency(data.net)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Method Comparison Tab */}
          <TabsContent value="method-comparison" className="space-y-6" data-testid="method-comparison-content">
            {loadingMethodSummary ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {methodSummaryData?.summary && Object.entries(methodSummaryData.summary).map(([methodName, method]) => (
                  <Card key={methodName} data-testid={`card-method-${methodName}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{methodName} Method</span>
                        <Badge variant="outline" data-testid={`badge-method-${methodName}`}>
                          {method.totalTickets} picks
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Wins</p>
                          <p className="text-lg font-bold" data-testid={`text-method-wins-${methodName}`}>{method.wins}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Won</p>
                          <p className="text-lg font-bold" data-testid={`text-method-total-won-${methodName}`}>
                            {formatCurrency(method.totalWon)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average Win</p>
                          <p className="text-lg font-bold" data-testid={`text-method-avg-win-${methodName}`}>
                            {formatCurrency(method.avgWin)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Biggest Win</p>
                          <p className="text-lg font-bold" data-testid={`text-method-biggest-win-${methodName}`}>
                            {formatCurrency(method.biggestWin)}
                          </p>
                        </div>
                      </div>

                      {/* Match Distribution */}
                      <div>
                        <h4 className="font-semibold mb-3">Match Distribution</h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {Object.entries(method.matches).reverse().map(([matches, count]) => (
                            <div key={matches} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid={`div-match-${methodName}-${matches}`}>
                              <p className="text-2xl font-bold" data-testid={`text-match-count-${methodName}-${matches}`}>{count}</p>
                              <p className="text-xs text-muted-foreground">{matches} matches</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Disclaimer */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded" data-testid="footer-disclaimer">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Educational Disclaimer:</strong> This analysis is purely educational. All data represents historical pattern studies and does not predict future lottery outcomes. Lottery draws are random and independent events.
          </p>
        </div>
      </div>
    </div>
  );
}
