import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Trophy, Star, TrendingUp, DollarSign, Ticket, Filter,
  ChevronDown, ChevronUp, RefreshCw, AlertCircle, Sparkles,
  Medal, Flame, Target, Info
} from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface PrizeTier {
  prizeAmount: string;
  prizeValue: number;
  unpaid: number;
  paid: number;
  total: number;
}

interface ScratchOffGame {
  gameNumber: string;
  gameName: string;
  price: number;
  totalRemainingWinners: number;
  totalRemainingValue: number;
  bigPrizesLeft: number;
  topPrizeRemaining: number;
  topPrizeAmount: string;
  topPrizeValue: number;
  prizeTiers: PrizeTier[];
  pctRemaining: number;
  valueScore: number;
  oddsOfWinning: string;
  rank: 'top' | 'good' | 'fair' | 'low';
}

interface ScratchOffResponse {
  games: ScratchOffGame[];
  fetchedAt: string;
  source: string;
}

const RANK_CONFIG = {
  top:  { label: 'Top Pick',   color: 'bg-emerald-500 text-white',      icon: Trophy,  border: 'border-emerald-400' },
  good: { label: 'Good Value', color: 'bg-blue-500 text-white',          icon: Star,    border: 'border-blue-400'    },
  fair: { label: 'Fair',       color: 'bg-yellow-500 text-white',        icon: Target,  border: 'border-yellow-400'  },
  low:  { label: 'Low Value',  color: 'bg-gray-500 text-white',          icon: Info,    border: 'border-gray-400'    },
};

function formatCurrency(n: number | null | undefined): string {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function ValueBar({ score }: { score: number }) {
  const s = Number(score) || 0;
  const pct = Math.min(s * 100, 100);
  const color = pct >= 50 ? 'bg-emerald-500' : pct >= 30 ? 'bg-blue-500' : pct >= 15 ? 'bg-yellow-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 w-10 text-right">{s.toFixed(2)}</span>
    </div>
  );
}

function GameCard({ game, rank }: { game: ScratchOffGame; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RANK_CONFIG[game.rank];
  const RankIcon = cfg.icon;

  return (
    <Card className={`border-2 ${cfg.border} hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
              #{rank}
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{game.gameName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Game #{game.gameNumber}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-sm font-bold text-green-700">${game.price}/ticket</span>
              </div>
            </div>
          </div>
          <Badge className={`${cfg.color} flex-shrink-0 flex items-center gap-1`}>
            <RankIcon className="w-3 h-3" />
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-emerald-700">{formatCurrency(game.totalRemainingValue)}</div>
            <div className="text-xs text-gray-500">Remaining Prize Pool</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-700">{(Number(game.bigPrizesLeft) || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Big Prizes Left ($10K+)</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-purple-700">{Number(game.pctRemaining) || 0}%</div>
            <div className="text-xs text-gray-500">Prizes Remaining</div>
          </div>
        </div>

        {/* Top prize */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Top Prize: {game.topPrizeAmount}</span>
          </div>
          <Badge variant="outline" className="text-amber-700 border-amber-400">
            {game.topPrizeRemaining} left
          </Badge>
        </div>

        {/* Value score bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Value Score</span>
            <span className="text-gray-400">remaining prize value per dollar</span>
          </div>
          <ValueBar score={game.valueScore} />
        </div>

        {/* Prize tiers toggle */}
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 h-7">
              {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {expanded ? 'Hide' : 'Show'} all {game.prizeTiers.length} prize tiers
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 font-medium text-gray-600">Prize</th>
                    <th className="text-right p-2 font-medium text-gray-600">Remaining</th>
                    <th className="text-right p-2 font-medium text-gray-600">Total</th>
                    <th className="text-right p-2 font-medium text-gray-600">% Left</th>
                  </tr>
                </thead>
                <tbody>
                  {game.prizeTiers.map((tier, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`p-2 font-medium ${tier.prizeValue >= 10000 ? 'text-emerald-700' : 'text-gray-800'}`}>
                        {tier.prizeAmount}
                      </td>
                      <td className="p-2 text-right text-gray-700">{(Number(tier.unpaid) || 0).toLocaleString()}</td>
                      <td className="p-2 text-right text-gray-500">{(Number(tier.total) || 0).toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className={tier.total > 0 && (tier.unpaid / tier.total) > 0.5 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                          {tier.total > 0 ? Math.round((tier.unpaid / tier.total) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default function ScratchOffs() {
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(30);
  const [minBigPrizes, setMinBigPrizes] = useState(0);
  const [sortBy, setSortBy] = useState<'valueScore' | 'bigPrizesLeft' | 'totalRemainingValue' | 'pctRemaining' | 'price'>('valueScore');
  const [rankFilter, setRankFilter] = useState<'all' | 'top' | 'good' | 'fair'>('all');

  const { data, isLoading, error, refetch, isFetching } = useQuery<ScratchOffResponse>({
    queryKey: ['/api/scratchoffs'],
    staleTime: 3600 * 1000,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    if (!data?.games) return [];
    return data.games
      .filter(g => {
        if (search && !g.gameName.toLowerCase().includes(search.toLowerCase()) && !g.gameNumber.includes(search)) return false;
        if (g.price > maxPrice) return false;
        if (g.bigPrizesLeft < minBigPrizes) return false;
        if (rankFilter !== 'all' && g.rank !== rankFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        return (b[sortBy] as number) - (a[sortBy] as number);
      });
  }, [data, search, maxPrice, minBigPrizes, sortBy, rankFilter]);

  const topPicks = useMemo(() => data?.games?.filter(g => g.rank === 'top').length ?? 0, [data]);
  const totalPool = useMemo(() => data?.games?.reduce((s, g) => s + g.totalRemainingValue, 0) ?? 0, [data]);
  const totalGames = data?.games?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <SEOHead
        title="NY Scratch-Off Helper - Best Games to Play Today | LotteryPro"
        description="Find the best NY scratch-off lottery games to play based on real-time remaining prize data from official NY State sources. See which games still have big prizes left."
        url="https://lotterypro.app/scratch-offs"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Ticket className="w-8 h-8" />
            <h1 className="text-3xl font-bold">NY Scratch-Off Helper</h1>
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="text-yellow-100 text-lg max-w-2xl mx-auto">
            Real-time remaining prize data from official NY State sources — find games that still have big prizes left
          </p>

          {/* Live summary stats */}
          {data && (
            <div className="grid grid-cols-3 gap-4 mt-6 max-w-xl mx-auto">
              <div className="bg-white/20 rounded-xl p-3">
                <div className="text-2xl font-bold">{totalGames}</div>
                <div className="text-xs text-yellow-100">Active Games</div>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <div className="text-2xl font-bold">{topPicks}</div>
                <div className="text-xs text-yellow-100">Top Picks Today</div>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <div className="text-2xl font-bold">{formatCurrency(totalPool)}</div>
                <div className="text-xs text-yellow-100">Total Prize Pool</div>
              </div>
            </div>
          )}

          {data?.fetchedAt && (
            <p className="text-yellow-200 text-xs mt-4">
              Data updated: {new Date(data.fetchedAt).toLocaleString()} • Source: {data.source}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Educational tool only.</strong> Prize data is from official NY State open data and refreshes hourly. 
            Value scores are analytical estimates — they do not predict or guarantee outcomes. Must be 18+ to purchase lottery tickets. 
            Please play responsibly.
          </span>
        </div>

        {/* How it works */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <strong>How value scores work:</strong> We pull official prize tables from NY State (updated daily), 
                calculate the total remaining prize pool for each game, and estimate the expected prize value per dollar spent. 
                "Big prizes" means any prize of $10,000 or more. Higher value scores = more prize money still available relative to the ticket price.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter & Sort
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Search Game</label>
                <Input
                  placeholder="Game name or number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Sort By</label>
                <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valueScore">Value Score (Best)</SelectItem>
                    <SelectItem value="bigPrizesLeft">Big Prizes Left</SelectItem>
                    <SelectItem value="totalRemainingValue">Total Prize Pool</SelectItem>
                    <SelectItem value="pctRemaining">% Prizes Remaining</SelectItem>
                    <SelectItem value="price">Ticket Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                <Select value={rankFilter} onValueChange={v => setRankFilter(v as typeof rankFilter)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="top">Top Picks Only</SelectItem>
                    <SelectItem value="good">Good Value+</SelectItem>
                    <SelectItem value="fair">Fair+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Max Ticket Price: ${maxPrice}
                </label>
                <Slider
                  value={[maxPrice]}
                  onValueChange={([v]) => setMaxPrice(v)}
                  min={1} max={30} step={1}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Min $10K+ Prizes Left: {minBigPrizes}
                  </label>
                  <Slider
                    value={[minBigPrizes]}
                    onValueChange={([v]) => setMinBigPrizes(v)}
                    min={0} max={20} step={1}
                    className="w-40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{filtered.length} games shown</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-lg">Loading live prize data from NY State...</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Fetching official remaining prize tables</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Could not load scratch-off data</p>
            <p className="text-sm text-gray-400 mb-4">The NY State data server may be temporarily unavailable</p>
            <Button onClick={() => refetch()} variant="outline">Try Again</Button>
          </div>
        )}

        {/* Top picks spotlight */}
        {!isLoading && filtered.length > 0 && filtered.filter(g => g.rank === 'top').length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              Top Picks Right Now
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.filter(g => g.rank === 'top').slice(0, 3).map((game, i) => (
                <GameCard key={game.gameNumber} game={game} rank={filtered.indexOf(game) + 1} />
              ))}
            </div>
          </div>
        )}

        {/* All results */}
        {!isLoading && filtered.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
              <Medal className="w-5 h-5 text-blue-500" />
              All Games Ranked
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((game, i) => (
                <GameCard key={game.gameNumber} game={game} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && data && (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No games match your filters</p>
            <p className="text-sm text-gray-400 mb-4">Try adjusting your price range or removing the big prize minimum</p>
            <Button onClick={() => { setSearch(''); setMaxPrice(30); setMinBigPrizes(0); setRankFilter('all'); }} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-10 text-center text-xs text-gray-400 border-t pt-6">
          Prize data sourced from the official NY State Open Data portal (data.ny.gov) • Refreshes hourly •
          For educational and entertainment purposes only • Gambling involves risk • Must be 18+
        </div>
      </div>
    </div>
  );
}
