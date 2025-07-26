import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Trophy, 
  Share2, 
  Heart, 
  Star, 
  Crown, 
  Gift, 
  Target,
  Music,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";

interface ContestEntry {
  id: string;
  userId: string;
  userName: string;
  entryType: 'music_share' | 'book_review' | 'fan_story' | 'social_media_post';
  content: string;
  proofUrl?: string;
  loyaltyScore: number;
  submittedAt: string;
  approved: boolean;
}

interface FanLoyaltyContestProps {
  compact?: boolean;
}

export default function FanLoyaltyContest({ compact = false }: FanLoyaltyContestProps) {
  const [activeTab, setActiveTab] = useState<'enter' | 'leaderboard'>('enter');
  const [entryForm, setEntryForm] = useState({
    entryType: 'music_share' as const,
    content: '',
    proofUrl: '',
  });

  const { toast } = useToast();

  // Get contest entries and leaderboard
  const { data: contestData, isLoading } = useQuery({
    queryKey: ['/api/fan-contest'],
    queryFn: async () => {
      const response = await fetch('/api/fan-contest');
      if (!response.ok) throw new Error('Failed to fetch contest data');
      return response.json() as Promise<{
        entries: ContestEntry[];
        leaderboard: { userName: string; totalScore: number; rank: number }[];
        prizePool: { vipCodes: number; bonusCredits: number };
      }>;
    }
  });

  // Submit contest entry
  const submitEntryMutation = useMutation({
    mutationFn: async (entry: typeof entryForm) => {
      const response = await apiRequest('POST', '/api/fan-contest/submit', entry);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry Submitted! 🎉",
        description: "Your fan loyalty entry is being reviewed. VIP codes awarded to top fans monthly!"
      });
      setEntryForm({ entryType: 'music_share', content: '', proofUrl: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please describe your fan loyalty action",
        variant: "destructive"
      });
      return;
    }
    submitEntryMutation.mutate(entryForm);
  };

  const entryTypes = [
    {
      type: 'music_share' as const,
      title: '🎵 Music Sharing',
      description: 'Share Russell\'s music on social media',
      points: '10-25 points',
      icon: Share2
    },
    {
      type: 'book_review' as const,
      title: '📚 Book Reviews',
      description: 'Review gambling strategy books on Amazon',
      points: '50-100 points',
      icon: BookOpen
    },
    {
      type: 'fan_story' as const,
      title: '❤️ Fan Stories',
      description: 'Share how Russell\'s work helped you win',
      points: '25-75 points',
      icon: Heart
    },
    {
      type: 'social_media_post' as const,
      title: '📱 Social Posts',
      description: 'Create content about lottery strategies',
      points: '15-40 points',
      icon: TrendingUp
    }
  ];

  if (isLoading) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-4xl"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Fan Loyalty Contest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? "w-full" : "w-full max-w-4xl"}>
      <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          🏆 Russell Nomer Fan Loyalty Contest
        </CardTitle>
        <p className="text-yellow-100">
          Share, like, and support Russell's work to earn VIP codes and exclusive rewards!
        </p>
        
        <Alert className="mt-3 bg-red-100 border-red-400">
          <Crown className="h-4 w-4" />
          <AlertDescription className="text-red-800 font-medium">
            <strong>🎁 Monthly Prizes:</strong> Top 10 fans win VIP subscription codes worth $47/month! 
            Random drawings for book purchases and exclusive lottery insights.
          </AlertDescription>
        </Alert>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'enter' ? 'default' : 'outline'}
            onClick={() => setActiveTab('enter')}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Enter Contest
          </Button>
          <Button
            variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Leaderboard
          </Button>
        </div>

        {activeTab === 'enter' && (
          <div className="space-y-6">
            {/* Entry Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entryTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.type}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      entryForm.entryType === type.type
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                    onClick={() => setEntryForm(prev => ({ ...prev, entryType: type.type }))}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-yellow-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm">{type.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{type.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {type.points}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Entry Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="content">Describe Your Fan Loyalty Action</Label>
                <Textarea
                  id="content"
                  placeholder="Tell us how you shared, reviewed, or supported Russell's work..."
                  value={entryForm.content}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="proofUrl">Proof URL (optional)</Label>
                <Input
                  id="proofUrl"
                  type="url"
                  placeholder="Link to your social media post, review, etc."
                  value={entryForm.proofUrl}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, proofUrl: e.target.value }))}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitEntryMutation.isPending}
              >
                {submitEntryMutation.isPending ? (
                  'Submitting...'
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Submit Entry & Earn Points
                  </>
                )}
              </Button>
            </form>

            {/* Contest Rules */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                How to Win VIP Codes
              </h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>🏆 <strong>Monthly Winners:</strong> Top 10 point earners get free VIP subscription codes</p>
                <p>🎲 <strong>Random Drawings:</strong> All participants eligible for bonus prizes</p>
                <p>🎵 <strong>Music Sharing:</strong> Share Russell's songs on social media with #RussellNomerMusic</p>
                <p>📚 <strong>Book Reviews:</strong> Leave honest reviews on Amazon for gambling strategy books</p>
                <p>❤️ <strong>Fan Stories:</strong> Share how Russell's strategies helped you win at lottery/gambling</p>
                <p>📱 <strong>Social Content:</strong> Create posts about lottery tips, casino strategies, or Russell's work</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Current Leaderboard</h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                Prize Pool: {contestData?.prizePool?.vipCodes || 10} VIP Codes
              </Badge>
            </div>

            {contestData?.leaderboard && contestData.leaderboard.length > 0 ? (
              <div className="space-y-2">
                {contestData.leaderboard.slice(0, compact ? 5 : 10).map((entry, index) => (
                  <div
                    key={entry.userName}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      index < 3 
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{entry.userName}</div>
                        <div className="text-xs text-gray-600">{entry.totalScore} points</div>
                      </div>
                    </div>
                    {index < 10 && (
                      <Badge variant={index < 3 ? 'default' : 'secondary'} className="text-xs">
                        {index < 3 ? '🏆 Winner' : '🎁 Prize Eligible'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No entries yet. Be the first to enter and win VIP codes!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}