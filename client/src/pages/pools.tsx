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
import { Users, DollarSign, Calendar, Trophy, Plus, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  adminFeePercent: string;
  netPoolAmount: string;
  status: string;
  totalTicketsPurchased: number;
  createdAt: string;
}

export default function PoolsPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);

  const { data: poolsData, isLoading } = useQuery<{ pools: Pool[] }>({
    queryKey: ['/api/pools'],
  });

  const pools = poolsData?.pools || [];

  const createPoolMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/pools/create', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      setCreateDialogOpen(false);
      toast({
        title: "Pool Created!",
        description: "Your lottery pool is now open for members to join.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pool",
        variant: "destructive",
      });
    },
  });

  const joinPoolMutation = useMutation({
    mutationFn: async (data: any) => {
      const { poolId, ...rest } = data;
      return await apiRequest(`/api/pools/${poolId}/join`, 'POST', rest);
    },
    onSuccess: (data: any) => {
      setJoinDialogOpen(false);
      setPendingMemberId(data.member.id);
      setPaymentDialogOpen(true);
      toast({
        title: "Almost There!",
        description: "Complete your payment to secure your spot in the pool.",
      });
    },
    onError: (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join pool",
        variant: "destructive",
      });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (data: { poolId: string; memberId: string }) => {
      // Create PayPal order
      const createResponse: any = await apiRequest(
        `/api/pools/${data.poolId}/create-payment`,
        'POST',
        { memberId: data.memberId }
      );
      
      // Simulate PayPal payment (in production, this would open PayPal dialog)
      // For now, we'll auto-capture for testing
      const captureResponse: any = await apiRequest(
        `/api/pools/${data.poolId}/capture-payment`,
        'POST',
        { memberId: data.memberId, orderId: createResponse.orderId }
      );
      
      return captureResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      setPaymentDialogOpen(false);
      setPendingMemberId(null);
      toast({
        title: "Payment Successful!",
        description: "You're now an active member of the pool. Good luck!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
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
      adminFeePercent: 7.5,
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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      open: 'bg-green-500',
      full: 'bg-yellow-500',
      active: 'bg-blue-500',
      completed: 'bg-purple-500',
      cancelled: 'bg-red-500',
    };
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-500'}`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading pools...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Community Lottery Pools</h1>
          <p className="text-muted-foreground">
            Join forces with other players to buy more tickets and increase your winning chances!
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="button-create-pool">
              <Plus className="mr-2 h-4 w-4" />
              Create Pool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Lottery Pool</DialogTitle>
              <DialogDescription>
                Set up a new community pool for the upcoming draw
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Pool Name</label>
                <Input
                  name="name"
                  placeholder="e.g., Friday MegaMillions Group"
                  required
                  data-testid="input-pool-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  name="description"
                  placeholder="Share what makes your pool special..."
                  data-testid="input-pool-description"
                />
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
                <Input
                  type="datetime-local"
                  name="targetDrawDate"
                  required
                  data-testid="input-draw-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contribution Per Member ($)</label>
                <Input
                  type="number"
                  name="contributionPerMember"
                  placeholder="20.00"
                  step="0.01"
                  min="5"
                  required
                  data-testid="input-contribution"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Members</label>
                <Input
                  type="number"
                  name="maxMembers"
                  placeholder="10"
                  min="2"
                  max="100"
                  required
                  data-testid="input-max-members"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Note: 7.5% admin fee will be deducted from total pool amount
              </p>
              <Button type="submit" className="w-full" data-testid="button-submit-pool">
                Create Pool
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool: Pool) => {
          const fillPercent = (pool.currentMembers / pool.maxMembers) * 100;
          const potentialTickets = Math.floor(parseFloat(pool.netPoolAmount) / 2);
          
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
                      <p className="text-muted-foreground">Pool Total</p>
                      <p className="font-semibold">${parseFloat(pool.totalContributions).toFixed(2)}</p>
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
                      <p className="font-semibold">{potentialTickets}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button 
                  className="w-full" 
                  disabled={pool.status !== 'open'}
                  onClick={() => {
                    setSelectedPool(pool);
                    setJoinDialogOpen(true);
                  }}
                  data-testid={`button-join-${pool.id}`}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join Pool
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Pools</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to create a community lottery pool!
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-pool">
            <Plus className="mr-2 h-4 w-4" />
            Create Pool
          </Button>
        </div>
      )}

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {selectedPool?.name}</DialogTitle>
            <DialogDescription>
              Contribute ${selectedPool?.contributionPerMember} to join this pool
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinPool} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                name="displayName"
                placeholder="Your name"
                required
                data-testid="input-join-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="your@email.com"
                required
                data-testid="input-join-email"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Contribution:</span>
                <span className="font-semibold">${selectedPool?.contributionPerMember}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Admin Fee ({selectedPool?.adminFeePercent}%):</span>
                <span>
                  ${(parseFloat(selectedPool?.contributionPerMember || '0') * 
                     parseFloat(selectedPool?.adminFeePercent || '0') / 100).toFixed(2)}
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" data-testid="button-submit-join">
              Join & Proceed to Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Secure your spot in {selectedPool?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pool Contribution:</span>
                <span className="text-2xl font-bold">${selectedPool?.contributionPerMember}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Admin Fee ({selectedPool?.adminFeePercent}%):</span>
                <span className="font-medium text-yellow-600">
                  -${(parseFloat(selectedPool?.contributionPerMember || '0') * 
                      parseFloat(selectedPool?.adminFeePercent || '0') / 100).toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Pool Contribution:</span>
                <span className="font-semibold text-green-600">
                  ${(parseFloat(selectedPool?.contributionPerMember || '0') * 
                      (1 - parseFloat(selectedPool?.adminFeePercent || '0') / 100)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                By completing payment, you agree to pool your contribution with other members. 
                Winnings will be split proportionally among all paid members.
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (selectedPool && pendingMemberId) {
                  processPaymentMutation.mutate({
                    poolId: selectedPool.id,
                    memberId: pendingMemberId
                  });
                }
              }}
              disabled={processPaymentMutation.isPending}
              data-testid="button-complete-payment"
            >
              {processPaymentMutation.isPending ? 'Processing...' : 'Complete Payment with PayPal'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Production mode will use PayPal's secure checkout
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
