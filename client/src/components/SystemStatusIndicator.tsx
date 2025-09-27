import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Database, 
  Zap, 
  CheckCircle, 
  Activity, 
  BarChart3,
  Cpu,
  Timer,
  Target,
  Crown
} from "lucide-react";

interface LoadingProgress {
  game: 'powerball' | 'megamillions';
  stage: 'essential' | 'progressive' | 'complete';
  progress: number;
  drawsLoaded: number;
  totalDraws: number;
  estimatedTimeRemaining?: number;
  statisticalPower?: number;
}

interface LoadingStatus {
  loadingState: Record<string, LoadingProgress>;
  isComplete: boolean;
  timestamp: string;
}

interface SystemStatusProps {
  compact?: boolean;
  showDetails?: boolean;
}

export default function SystemStatusIndicator({ compact = false, showDetails = true }: SystemStatusProps) {
  const [milestones, setMilestones] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Reduce polling frequency during initial load to improve performance
  const { data: status, isLoading } = useQuery<LoadingStatus>({
    queryKey: ['/api/loading/status'],
    refetchInterval: isInitialLoad ? 5000 : 2000, // 5s initially, then 2s after load
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const response = await fetch('/api/loading/status');
      if (!response.ok) throw new Error('Failed to fetch loading status');
      return response.json();
    }
  });

  // Switch to faster polling after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 8000); // Wait 8 seconds before switching to faster polling

    return () => clearTimeout(timer);
  }, []);

  const powerbellState = status?.loadingState?.powerball;
  const megaMillionsState = status?.loadingState?.megamillions;
  const isSystemComplete = status?.isComplete || false;

  // Handle milestone notifications
  useEffect(() => {
    if (!powerbellState && !megaMillionsState) return;

    const newMilestones: string[] = [];
    
    [powerbellState, megaMillionsState].forEach(state => {
      if (!state) return;
      
      if (state.drawsLoaded >= 100 && state.drawsLoaded < 150) {
        newMilestones.push(`${state.game.toUpperCase()}: Basic Analysis Ready (3x minimum confidence)`);
      } else if (state.drawsLoaded >= 200 && state.drawsLoaded < 250) {
        newMilestones.push(`${state.game.toUpperCase()}: Advanced Analysis Ready (6x minimum confidence)`);
      } else if (state.drawsLoaded >= 300 && state.drawsLoaded < 350) {
        newMilestones.push(`${state.game.toUpperCase()}: Expert Analysis Ready (10x minimum confidence)`);
      } else if (state.stage === 'complete') {
        newMilestones.push(`${state.game.toUpperCase()}: MAXIMUM STATISTICAL POWER achieved!`);
      }
    });

    if (newMilestones.length > 0) {
      setMilestones(prev => [...prev, ...newMilestones.filter(m => !prev.includes(m))]);
    }
  }, [powerbellState?.drawsLoaded, megaMillionsState?.drawsLoaded, powerbellState?.stage, megaMillionsState?.stage]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Checking system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
        <div className="flex items-center gap-2">
          {isSystemComplete ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
          )}
          <span className="text-sm font-medium">
            {isSystemComplete ? 'Analysis Ready' : 'Loading Analysis Tools'}
          </span>
        </div>
        {showDetails && (
          <div className="flex gap-2">
            {powerbellState && (
              <Badge variant={powerbellState.stage === 'complete' ? 'default' : 'secondary'}>
                PB: {powerbellState.progress}%
              </Badge>
            )}
            {megaMillionsState && (
              <Badge variant={megaMillionsState.stage === 'complete' ? 'default' : 'secondary'}>
                MM: {megaMillionsState.progress}%
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cpu className="h-5 w-5" />
          🚀 Russell Nomer Hybrid Powerhouse System
        </CardTitle>
        <div className="text-blue-100 text-sm">
          {isSystemComplete ? 
            '✅ Educational analysis tools ready for lottery study' :
            '📊 Progressive enhancement building statistical power in real-time'
          }
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {/* Overall System Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="font-medium">System Status:</span>
          </div>
          <Badge variant={isSystemComplete ? 'default' : 'secondary'} className="flex items-center gap-1">
            {isSystemComplete ? (
              <><CheckCircle className="h-3 w-3" /> READY</>
            ) : (
              <><Activity className="h-3 w-3 animate-pulse" /> LOADING</>
            )}
          </Badge>
        </div>

        {/* Game Loading Progress */}
        {showDetails && (
          <div className="space-y-3">
            {powerbellState && (
              <GameLoadingCard 
                game="Powerball"
                state={powerbellState}
                color="red"
              />
            )}
            
            {megaMillionsState && (
              <GameLoadingCard 
                game="MegaMillions" 
                state={megaMillionsState}
                color="blue"
              />
            )}
          </div>
        )}

        {/* Statistical Power Summary */}
        {(powerbellState || megaMillionsState) && (
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">Statistical Power Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {powerbellState && (
                <div>
                  <div className="text-gray-600">Powerball Confidence:</div>
                  <div className="font-bold text-red-600">
                    {powerbellState.statisticalPower || 0}% ({Math.round((powerbellState.statisticalPower || 0) / 100 * 30)}x minimum)
                  </div>
                </div>
              )}
              {megaMillionsState && (
                <div>
                  <div className="text-gray-600">MegaMillions Confidence:</div>
                  <div className="font-bold text-blue-600">
                    {megaMillionsState.statisticalPower || 0}% ({Math.round((megaMillionsState.statisticalPower || 0) / 100 * 30)}x minimum)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Milestones */}
        {milestones.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Recent Milestones</span>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {milestones.slice(-3).map((milestone, index) => (
                <Alert key={index} className="py-2 bg-green-50 border-green-200">
                  <AlertDescription className="text-xs text-green-800">
                    ✅ {milestone}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Russell's God Mode Status */}
        {isSystemComplete && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="font-bold text-yellow-800 text-sm">
                Russell's Platform: ANALYSIS READY
              </span>
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              Unprecedented statistical analysis ready with {powerbellState?.drawsLoaded || 0}+ Powerball and {megaMillionsState?.drawsLoaded || 0}+ MegaMillions draws
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GameLoadingCard({ 
  game, 
  state, 
  color 
}: { 
  game: string; 
  state: LoadingProgress; 
  color: 'red' | 'blue';
}) {
  const colorClasses = {
    red: 'text-red-600 bg-red-50 border-red-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const progressColor = color === 'red' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium text-sm">{game}</span>
        </div>
        <Badge variant={state.stage === 'complete' ? 'default' : 'secondary'}>
          {state.stage === 'complete' ? 'Complete' : `${state.progress}%`}
        </Badge>
      </div>
      
      <Progress value={state.progress} className="mb-2" />
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-600">Draws: </span>
          <span className="font-medium">{state.drawsLoaded.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-600">Stage: </span>
          <span className="font-medium capitalize">{state.stage}</span>
        </div>
      </div>
      
      {state.estimatedTimeRemaining && state.estimatedTimeRemaining > 0 && (
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
          <Timer className="h-3 w-3" />
          <span>~{Math.round(state.estimatedTimeRemaining / 1000)}s remaining</span>
        </div>
      )}
    </div>
  );
}