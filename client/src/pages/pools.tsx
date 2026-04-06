import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, DollarSign, Calendar, Trophy, Plus, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";

const DISCLAIMER = "LotteryPro does not process or hold funds. All payments are made directly between participants off-platform. This tool is for entertainment coordination only.";

interface Pool {
  id: string;
  name: string;
  description: string;
  game: string;
  targetDrawDate: string;
  contributionPerMember: string;
  maxMembers: number;
  currentMembers: number;
  totalContributions: string;
  netPoolAmount: string;
  status: string;
  totalTicketsPurchased: number;
  createdBy: string;
  createdAt: string;
}

interface PoolMember {
  id: string;
  poolId: string;
  userId: string | null;
  displayName: string;
  email: string;
  contributionAmount: string;
  paymentStatus: string;
  paymentMethod: string | null;
  sharePercentage: string;
  status: string;
  joinedAt: string;
}

interface PoolDetail {
  pool: Pool;
  members: PoolMember[];
  tickets: any[];
}

export default function PoolsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [detailPoolId, setDetailPoolId] = useState<string | null>(null);
  const [logContribDialogOpen, setLogContribDialogOpen] = useState(false);
  const [selectedMemberUserId, setSelectedMemberUserId] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const { data: poolsData, isLoading } = useQuery<{ pools: Pool[] }>({
    queryKey: ['/api/pools'],
  });

  const { data: poolDetail } = useQuery<PoolDetail>({
    queryKey: ['/api/pools', detailPoolId],
    enabled: !!detailPoolId,
  });

  const pools = poolsData?.pools || [];

  const createPoolMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/pools/create', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      setCreateDialogOpen(false);
      toast({ title: "Syndicate Created!", description: "Your lottery syndicate is now open for members to join." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create syndicate", variant: "destructive" });
    },
  });

  const joinPoolMutation = useMutation({
    mutationFn: async (data: any) => {
      const { poolId, ...rest } = data;
      const res = await apiRequest('POST', `/api/pools/${poolId}/join`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      if (detailPoolId) queryClient.invalidateQueries({ queryKey: ['/api/pools', detailPoolId] });
      setJoinDialogOpen(false);
      toast({
        title: "Joined Syndicate!",
        description: `Contact the organizer to arrange your $${selectedPool?.contributionPerMember} contribution off-platform (Venmo, Zelle, Cash, etc.).`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to join syndicate", variant: "destructive" });
    },
  });

  const logContribMutation = useMutation({
    mutationFn: async (data: any) => {
      const { poolId, ...rest } = data;
      const res = await apiRequest('POST', `/api/pools/${poolId}/log-contribution`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools', detailPoolId] });
      setLogContribDialogOpen(false);
      setSelectedMemberUserId(null);
      toast({ title: "Contribution Logged!", description: "Member's contribution has been marked as received." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to log contribution", variant: "destructive" });
    },
  });

  const handleCreatePool = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPoolMutation.mutate({
      name: formData.get('name'),
      description: formData.get('description'),
      game: formData.get('game'),
      targetDrawDate: formData.get('targetDrawDate'),
      contributionPerMember: parseFloat(formData.get('contributionPerMember') as string),
      maxMembers: parseInt(formData.get('maxMembers') as string),
      isPublic: true,
      requiresApproval: false,
    });
  };

  const handleJoinPool = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!selectedPool) return;
    joinPoolMutation.mutate({
      poolId: selectedPool.id,
      displayName: formData.get('displayName'),
      email: formData.get('email'),
    });
  };

  const handleLogContrib = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!detailPoolId || !selectedMemberUserId) return;
    logContribMutation.mutate({
      poolId: detailPoolId,
      userId: selectedMemberUserId,
      amount: formData.get('amount'),
      method: formData.get('method'),
      note: formData.get('note'),
    });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-green-500', full: 'bg-yellow-500', active: 'bg-blue-500',
      completed: 'bg-purple-500', cancelled: 'bg-red-500',
    };
    return <Badge className={map[status] || 'bg-gray-500'}>{status.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading syndicates...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <SEOHead
        title="Lottery Syndicate Tracker"
        description="Coordinate your lottery syndicate group. Track members, generate shared tickets, and manage contributions off-platform."
        path="/pools"
      />

      {/* Page header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Lottery Syndicate Tracker</h1>
          <p className="text-muted-foreground">
            Coordinate groups to generate shared tickets. Contributions happen off-platform.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="button-create-pool">
              <Plus className="mr-2 h-4 w-4" />
              Create Syndicate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Lottery Syndicate</DialogTitle>
              <DialogDescription>Set up a coordination group for the upcoming draw</DialogDescription>
            </DialogHeader>
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                {DISCLAIMER}
              </AlertDescription>
            </Alert>
            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Syndicate Name</label>
                <Input name="name" placeholder="e.g., Friday MegaMillions Group" required data-testid="input-pool-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea name="description" placeholder="Share what makes your syndicate special..." data-testid="input-pool-description" />
              </div>
              <div>
                <label className="text-sm font-medium">Game</label>
                <Select name="game" required>
                  <SelectTrigger data-testid="select-game">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="powerball">Powerball</SelectItem>
                    <SelectItem value="megamillions">MegaMillions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Draw Date</label>
                <Input type="datetime-local" name="targetDrawDate" required data-testid="input-draw-date" />
              </div>
              <div>
                <label className="text-sm font-medium">Suggested Contribution Per Member ($)</label>
                <Input type="number" inputMode="decimal" name="contributionPerMember" placeholder="20.00" step="0.01" min="5" required data-testid="input-contribution" />
              </div>
              <div>
                <label className="text-sm font-medium">Max Members</label>
                <Input type="number" inputMode="numeric" name="maxMembers" placeholder="10" min="2" max="100" required data-testid="input-max-members" />
              </div>
              <Button type="submit" className="w-full" disabled={createPoolMutation.isPending} data-testid="button-submit-pool">
                {createPoolMutation.isPending ? 'Creating...' : 'Create Syndicate'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Global disclaimer */}
      <Alert className="mb-6 border-blue-400 bg-blue-50 dark:bg-blue-950">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
          {DISCLAIMER}
        </AlertDescription>
      </Alert>

      {/* Pool cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool: Pool) => {
          const fillPercent = (pool.currentMembers / pool.maxMembers) * 100;
          return (
            <Card key={pool.id} className="hover:shadow-lg transition-shadow" data-testid={`card-pool-${pool.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{pool.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {pool.game === 'powerball' ? 'Powerball' : 'MegaMillions'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(pool.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pool.description && (
                  <p className="text-sm text-muted-foreground">{pool.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Members</span>
                    <span className="font-medium">{pool.currentMembers} / {pool.maxMembers}</span>
                  </div>
                  <Progress value={fillPercent} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-muted-foreground">Per Member</p>
                      <p className="font-semibold">${pool.contributionPerMember}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-muted-foreground">Logged Total</p>
                      <p className="font-semibold">${parseFloat(pool.totalContributions || '0').toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-muted-foreground">Draw Date</p>
                      <p className="font-semibold">{format(new Date(pool.targetDrawDate), 'MMM dd')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-muted-foreground">Tickets</p>
                      <p className="font-semibold">{pool.totalTicketsPurchased || 0}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setDetailPoolId(pool.id);
                      setSelectedPool(pool);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={pool.status !== 'open'}
                    onClick={() => {
                      setSelectedPool(pool);
                      setJoinDialogOpen(true);
                    }}
                    data-testid={`button-join-${pool.id}`}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Syndicates</h3>
          <p className="text-muted-foreground mb-4">Be the first to create a lottery syndicate group!</p>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-pool">
            <Plus className="mr-2 h-4 w-4" />
            Create Syndicate
          </Button>
        </div>
      )}

      {/* Pool detail panel */}
      {detailPoolId && poolDetail && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{poolDetail.pool.name} — Contribution Ledger</CardTitle>
                <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={() => { setDetailPoolId(null); setSelectedPool(null); }}>
                  Close
                </Button>
              </div>
              <CardDescription>
                Members who have joined. The organizer logs confirmed off-platform payments below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                  {DISCLAIMER}
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                {poolDetail.members.length === 0 && (
                  <p className="text-muted-foreground text-sm">No members yet.</p>
                )}
                {poolDetail.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{member.displayName || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                      {member.paymentMethod && (
                        <p className="text-xs text-muted-foreground capitalize">via {member.paymentMethod}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">${parseFloat(member.contributionAmount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{member.sharePercentage}% share</p>
                      </div>
                      {member.paymentStatus === 'logged' ? (
                        <Badge className="bg-green-500 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Received
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      {/* Only the pool creator can log contributions — server enforces this with 403 too */}
                      {member.paymentStatus !== 'logged' && poolDetail && user?.id === poolDetail.pool.createdBy && member.userId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[44px]"
                          onClick={() => {
                            setSelectedMemberUserId(member.userId!);
                            setLogContribDialogOpen(true);
                          }}
                        >
                          Log Payment
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {selectedPool?.name}</DialogTitle>
            <DialogDescription>
              Register your spot in this syndicate
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
              {DISCLAIMER}
            </AlertDescription>
          </Alert>
          <form onSubmit={handleJoinPool} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Name</label>
              <Input name="displayName" placeholder="Your name" required data-testid="input-join-name" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" name="email" placeholder="your@email.com" required data-testid="input-join-email" />
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <div className="flex justify-between mb-2">
                <span>Suggested contribution:</span>
                <span className="font-semibold">${selectedPool?.contributionPerMember}</span>
              </div>
              <p className="text-muted-foreground text-xs">
                After joining, contact the organizer to arrange payment via Venmo, Zelle, CashApp, or cash.
                The organizer will mark your contribution as received once payment is confirmed.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={joinPoolMutation.isPending} data-testid="button-submit-join">
              {joinPoolMutation.isPending ? 'Joining...' : 'Join Syndicate'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log contribution dialog */}
      <Dialog open={logContribDialogOpen} onOpenChange={setLogContribDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Contribution Received</DialogTitle>
            <DialogDescription>
              Mark that you have received this member's payment off-platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogContrib} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount Received ($)</label>
              <Input
                type="number"
                inputMode="decimal"
                name="amount"
                step="0.01"
                min="0.01"
                defaultValue={
                  poolDetail?.members.find(m => m.userId === selectedMemberUserId)?.contributionAmount || ''
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select name="method" required>
                <SelectTrigger>
                  <SelectValue placeholder="How was it paid?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="cashapp">CashApp</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Note (optional)</label>
              <Input name="note" placeholder="e.g., Venmo reference #1234" />
            </div>
            <Button type="submit" className="w-full" disabled={logContribMutation.isPending}>
              {logContribMutation.isPending ? 'Logging...' : 'Mark as Received'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
