import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Snowflake, BarChart2, RefreshCw, ArrowRight } from "lucide-react";

interface AnalysisData {
  hotNumbers: number[];
  coldNumbers: number[];
  frequencyData: Array<{ number: number; frequency: number; isHot: boolean; isCold: boolean }>;
  bonusFrequency: Array<[number, number]>;
  stats: {
    totalDraws: number;
    dateRange: string;
    mostFrequent: number[];
    leastFrequent: number[];
    dataFreshness: string;
  };
}

function getHeatColor(isHot: boolean, isCold: boolean): string {
  if (isHot) return "bg-red-500 text-white border-red-600";
  if (isCold) return "bg-blue-400 text-white border-blue-500";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getHeatLabel(isHot: boolean, isCold: boolean): string {
  if (isHot) return "Hot";
  if (isCold) return "Cold";
  return "Warm";
}

interface HotNumbersPageProps {
  game: "powerball" | "megamillions";
}

function HotNumbersPage({ game }: HotNumbersPageProps) {
  const isPowerball = game === "powerball";

  const pageTitle = isPowerball
    ? "Powerball Hot Numbers — Live Frequency Analysis"
    : "Mega Millions Hot Numbers — Live Frequency Analysis";
  const pageDesc = isPowerball
    ? "See which Powerball numbers have been drawn most often across 2,000+ official draws. Updated after every drawing with live frequency data and hot/cold rankings."
    : "See which Mega Millions numbers have been drawn most often across 1,500+ official draws. Updated after every drawing with live frequency data and hot/cold rankings.";
  const h1 = isPowerball
    ? "Powerball Hot Numbers"
    : "Mega Millions Hot Numbers";
  const bonusLabel = isPowerball ? "Powerball" : "Mega Ball";
  const ballCount = isPowerball ? 69 : 70;
  const bonusMax = isPowerball ? 26 : 25;

  const { data, isLoading, refetch, isFetching } = useQuery<AnalysisData>({
    queryKey: ["/api/analysis", game],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/${game}`);
      if (!res.ok) throw new Error("Failed to load frequency data");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": pageTitle,
    "description": pageDesc,
    "url": `https://lotterypro.app/${game}/hot-numbers`,
    "creator": {
      "@type": "Organization",
      "name": "LotteryPro",
      "url": "https://lotterypro.app",
    },
    "keywords": isPowerball
      ? "Powerball hot numbers, Powerball frequency analysis, most common Powerball numbers"
      : "Mega Millions hot numbers, Mega Millions frequency analysis, most common Mega Millions numbers",
    "temporalCoverage": data?.stats?.dateRange,
    "variableMeasured": "Lottery number draw frequency",
  };

  const path = `/${game}/hot-numbers`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        path={path}
        type="website"
        jsonLd={jsonLd}
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="text-red-500" size={28} />
            <h1 className="text-4xl font-bold text-gray-900">{h1}</h1>
            <Flame className="text-red-500" size={28} />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {pageDesc}
          </p>
          {data && (
            <p className="text-sm text-gray-400 mt-2">
              Based on <strong className="text-gray-700">{data.stats.totalDraws.toLocaleString()}</strong> official draws · {data.stats.dataFreshness}
            </p>
          )}
        </div>

        {/* Stats bar */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-red-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="text-red-500" size={18} />
                  <span className="text-sm font-semibold text-gray-700">Top 5 Hottest</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.hotNumbers.map(n => (
                    <span key={n} className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white font-bold text-sm">
                      {n}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-100">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Snowflake className="text-blue-500" size={18} />
                  <span className="text-sm font-semibold text-gray-700">Top 5 Coldest</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.coldNumbers.map(n => (
                    <span key={n} className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-400 text-white font-bold text-sm">
                      {n}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="text-gray-500" size={18} />
                  <span className="text-sm font-semibold text-gray-700">Dataset</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalDraws.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{data.stats.dateRange}</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Frequency grid — white balls */}
        <Card className="mb-8">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">White Ball Frequency (1–{ballCount})</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-gray-500"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              <span className="ml-1 text-xs">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: ballCount }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : data ? (
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: ballCount }, (_, i) => i + 1).map(num => {
                  const entry = data.frequencyData.find(f => f.number === num);
                  const freq = entry?.frequency ?? 0;
                  const isHot = entry?.isHot ?? false;
                  const isCold = entry?.isCold ?? false;
                  return (
                    <div
                      key={num}
                      title={`Number ${num}: drawn ${freq} times`}
                      className={`flex flex-col items-center justify-center rounded-lg border p-1 text-center cursor-default transition-transform hover:scale-105 ${getHeatColor(isHot, isCold)}`}
                    >
                      <span className="font-bold text-sm">{num}</span>
                      <span className="text-xs opacity-80">{freq}×</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">Failed to load frequency data.</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Hot (top 5)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> Warm (average)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Cold (bottom 5)</span>
            </div>
          </CardContent>
        </Card>

        {/* Bonus ball frequency */}
        {data && data.bonusFrequency.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{bonusLabel} Frequency (1–{bonusMax})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-13 gap-2">
                {Array.from({ length: bonusMax }, (_, i) => i + 1).map(num => {
                  const entry = data.bonusFrequency.find(([n]) => n === num);
                  const freq = entry ? entry[1] : 0;
                  const topBonus = data.bonusFrequency.slice(0, 3).map(([n]) => n);
                  const isTop = topBonus.includes(num);
                  return (
                    <div
                      key={num}
                      title={`${bonusLabel} ${num}: drawn ${freq} times`}
                      className={`flex flex-col items-center justify-center rounded-lg border p-1 text-center cursor-default transition-transform hover:scale-105 ${
                        isTop ? "bg-yellow-400 text-yellow-900 border-yellow-500" : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      <span className="font-bold text-sm">{num}</span>
                      <span className="text-xs opacity-80">{freq}×</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Yellow = top 3 most frequent {bonusLabel} numbers
              </p>
            </CardContent>
          </Card>
        )}

        {/* Educational disclaimer */}
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg mb-8">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Educational Note:</strong> This frequency analysis is based on historical draw data and is provided for educational and entertainment purposes only. Each lottery drawing is an independent random event — past frequency does not predict future results. The odds of winning any single lottery prize remain fixed regardless of which numbers you choose. Always play responsibly.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-2xl p-8 text-center text-white mb-8">
          <h2 className="text-2xl font-bold mb-3">
            Generate Numbers Using This Data
          </h2>
          <p className="text-blue-200 mb-6 max-w-lg mx-auto">
            LotteryPro's number generator uses this live frequency data to produce hot, balanced, or random picks — all free.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8">
              Generate Numbers Free <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>

        {/* Related blog articles — rich cards for SEO internal linking depth */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-600" />
            Learn More: Related Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href={isPowerball ? "/blog/powerball-number-frequency-analysis" : "/blog/mega-millions-frequency-analysis"}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 h-full">
                <CardHeader className="pb-2">
                  <Badge className="bg-blue-100 text-blue-800 w-fit" variant="secondary">Analysis</Badge>
                  <CardTitle className="text-sm font-semibold text-gray-900 mt-2 leading-snug">
                    {isPowerball ? "Powerball Number Frequency Analysis" : "Mega Millions Frequency Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-2">
                    {isPowerball
                      ? "A deep dive into historical Powerball draw patterns and what frequency data actually tells us."
                      : "Explore historical draw patterns for Mega Millions and what the data can and cannot reveal."}
                  </p>
                  <span className="text-blue-600 text-xs flex items-center gap-1 font-medium">
                    Read article <ArrowRight size={12} />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/blog/smart-number-generation-methods">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 h-full">
                <CardHeader className="pb-2">
                  <Badge className="bg-orange-100 text-orange-800 w-fit" variant="secondary">Methods</Badge>
                  <CardTitle className="text-sm font-semibold text-gray-900 mt-2 leading-snug">
                    Smart Number Generation Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-2">
                    How different pick strategies — hot, cold, balanced, and random — compare when applied to real draw data.
                  </p>
                  <span className="text-blue-600 text-xs flex items-center gap-1 font-medium">
                    Read article <ArrowRight size={12} />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/blog">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 h-full">
                <CardHeader className="pb-2">
                  <Badge className="bg-gray-100 text-gray-700 w-fit" variant="secondary">Blog</Badge>
                  <CardTitle className="text-sm font-semibold text-gray-900 mt-2 leading-snug">
                    All LotteryPro Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-2">
                    Browse all educational articles on lottery statistics, pool strategies, and analysis methods.
                  </p>
                  <span className="text-blue-600 text-xs flex items-center gap-1 font-medium">
                    View all <ArrowRight size={12} />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PowerballHotNumbers() {
  return <HotNumbersPage game="powerball" />;
}

export function MegaMillionsHotNumbers() {
  return <HotNumbersPage game="megamillions" />;
}
