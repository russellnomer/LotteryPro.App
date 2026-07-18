import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Users, 
  Key, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  UserCheck,
  TrendingUp,
  Activity,
  Lock,
  Calendar,
  Settings,
  Download,
  Monitor,
  FileText,
  Plus,
  Trash2,
  Edit,
  Globe,
  EyeOff as UnpublishIcon,
  Mail,
  XCircle,
  ArrowRight
} from "lucide-react";
import AdManagementDashboard from "./AdManagementDashboard";
import BlogMarkdownContent from "./BlogMarkdownContent";

interface VipCodeGeneration {
  targetEmail: string;
  currentTier: string;
  targetTier: string;
  adminNotes?: string;
}

interface UserAccount {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  mfaEnabled: number;
  lastLogin: string | null;
  createdAt: string;
}

interface VipCode {
  id: string;
  targetEmail: string;
  currentTier: string;
  targetTier: string;
  isUsed: number;
  createdAt: string;
  usedAt: string | null;
  expiresAt: string;
  adminNotes: string | null;
}

interface AdminLog {
  id: string;
  adminEmail: string;
  action: string;
  targetEmail: string | null;
  details: any;
  ipAddress: string | null;
  timestamp: string;
}

interface CreateUserForm {
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
  sendVipCode: boolean;
  adminNotes: string;
}

interface DripStatus {
  userId: string;
  email: string;
  sequenceName: string;
  currentStep: number;
  isActive: boolean;
  haltReason: string | null;
  enrolledAt: string | null;
  nextSendAt: string | null;
  haltedAt: string | null;
}

const DRIP_STEP_LABELS: Record<number, string> = {
  0: 'Enrolled',
  1: 'Day 0 Sent',
  2: 'Day 2 Sent',
  3: 'Day 5 Sent',
  4: 'Day 10 Sent',
};

interface ScratchOffGap {
  gameNumber: string;
  gameName: string;
  detectedAt: string;
}

interface ScratchOffGapsData {
  gaps: ScratchOffGap[];
  lastCheckedAt: string | null;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"generate" | "users" | "codes" | "ads" | "logs" | "blog" | "drip" | "scratchGaps">("generate");
  const [vipForm, setVipForm] = useState<VipCodeGeneration>({
    targetEmail: "",
    currentTier: "free",
    targetTier: "basic",
    adminNotes: "",
  });
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: "",
    firstName: "",
    lastName: "",
    subscriptionTier: "basic",
    sendVipCode: true,
    adminNotes: "",
  });
  const [autoUpgradeEmail, setAutoUpgradeEmail] = useState("");
  const [autoUpgradeTier, setAutoUpgradeTier] = useState("premium");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user accounts
  const { data: users, isLoading: usersLoading } = useQuery<UserAccount[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch VIP codes
  const { data: vipCodes, isLoading: codesLoading } = useQuery<VipCode[]>({
    queryKey: ['/api/admin/vip-codes'],
  });

  // Fetch admin logs
  const { data: adminLogs, isLoading: logsLoading } = useQuery<AdminLog[]>({
    queryKey: ['/api/admin/logs'],
  });

  // Fetch drip sequence status
  const { data: dripStatus, isLoading: dripLoading } = useQuery<DripStatus[]>({
    queryKey: ['/api/admin/drip-status'],
  });

  // Automated VIP allocation mutation
  const autoUpgradeMutation = useMutation({
    mutationFn: async ({ email, tier }: { email: string; tier: string }) => {
      // First generate VIP code
      const vipResponse = await apiRequest('POST', '/api/admin/generate-vip', {
        targetEmail: email,
        currentTier: "free",
        targetTier: tier,
        adminNotes: `Automated upgrade to ${tier} tier`
      });
      const vipData = await vipResponse.json();
      
      // Then auto-redeem the code
      const redeemResponse = await apiRequest('POST', '/api/vip/redeem', {
        code: vipData.vipCode,
        userEmail: email
      });
      return redeemResponse.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Upgraded Successfully!",
        description: `User has been automatically upgraded to ${autoUpgradeTier} tier`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
      setAutoUpgradeEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Auto Upgrade Failed",
        description: error.message || "Failed to automatically upgrade user",
        variant: "destructive",
      });
    },
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserForm) => {
      const response = await apiRequest('POST', '/api/admin/create-user', userData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Created Successfully!",
        description: `User account created${data.vipCode ? ' and VIP code sent' : ''}${data.emailSent ? ' via email' : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
      setCreateUserForm({
        email: "",
        firstName: "",
        lastName: "",
        subscriptionTier: "basic",
        sendVipCode: true,
        adminNotes: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "User Creation Failed",
        description: error.message || "Failed to create user account",
        variant: "destructive",
      });
    },
  });

  // Generate VIP code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (data: VipCodeGeneration) => {
      const response = await apiRequest('POST', '/api/admin/generate-vip', data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.vipCode);
      setShowCode(true);
      toast({
        title: "VIP Code Generated!",
        description: `Secure VIP code created for ${vipForm.targetEmail}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vip-codes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate VIP code",
        variant: "destructive",
      });
    },
  });

  // Update user tier mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ email, tier }: { email: string; tier: string }) => {
      const response = await apiRequest('POST', '/api/admin/update-user-tier', { email, tier });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User tier updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Scratch-off gaps query
  const scratchGapsQuery = useQuery<ScratchOffGapsData>({
    queryKey: ['/api/admin/scratch-off-gaps'],
    refetchOnWindowFocus: false,
  });

  // Trigger manual gap re-check
  const refreshGapsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/scratch-off-gaps/refresh', {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Gap check complete", description: "NY scratch-off gap list refreshed." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scratch-off-gaps'] });
    },
    onError: (error: any) => {
      toast({ title: "Refresh failed", description: error.message || "Could not refresh gaps", variant: "destructive" });
    },
  });

  // Update lottery data mutation
  const updateLotteryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/update-lottery-data', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lottery Data Updated!",
        description: data.message || `Fetched live results. ${data.added} new draws added.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to fetch lottery data from external APIs",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "VIP code copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleGenerateCode = () => {
    if (!vipForm.targetEmail) {
      toast({
        title: "Error",
        description: "Please enter a target email address",
        variant: "destructive",
      });
      return;
    }
    generateCodeMutation.mutate(vipForm);
  };

  const handleCreateUser = () => {
    if (!createUserForm.email) {
      toast({
        title: "Error",
        description: "Please enter a user email address",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(createUserForm);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'unlimited': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-900 border-orange-300';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create_vip_code': return 'bg-green-100 text-green-800';
      case 'vip_code_redeemed': return 'bg-blue-100 text-blue-800';
      case 'vip_code_failed_redemption': return 'bg-red-100 text-red-800';
      case 'update_user_tier': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <Shield className="h-8 w-8 mr-3 inline text-red-600" />
                Russell's Admin Dashboard
              </h1>
              <p className="text-gray-600">VIP code management and user administration</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                <Activity className="h-4 w-4 mr-2" />
                System Active
              </Badge>
              <p className="text-sm text-gray-500">Logged in as admin</p>
            </div>
          </div>
        </div>


        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "generate", label: "Generate VIP Code", icon: Key },
                { id: "users", label: "Manage Users", icon: Users },
                { id: "codes", label: "VIP Codes", icon: Shield },
                { id: "blog", label: "Blog Editor", icon: FileText },
                { id: "drip", label: "Drip Sequences", icon: Mail },
                { id: "ads", label: "Advertisement", icon: Monitor },
                { id: "logs", label: "Admin Logs", icon: Activity },
                { id: "scratchGaps", label: "Scratch-Off Gaps", icon: AlertTriangle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automated User Upgrade */}
            <Card className="border-2 border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Automated User Upgrade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="text"
                    placeholder="user@example.com"
                    value={autoUpgradeEmail}
                    onChange={(e) => setAutoUpgradeEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Target Tier</Label>
                  <Select value={autoUpgradeTier} onValueChange={setAutoUpgradeTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => autoUpgradeMutation.mutate({ email: autoUpgradeEmail, tier: autoUpgradeTier })}
                  disabled={!autoUpgradeEmail || autoUpgradeMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  data-testid="button-auto-upgrade"
                >
                  {autoUpgradeMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  Auto-Upgrade User
                </Button>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Instantly generates VIP code and redeems it for the user
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Create New User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Create New User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="createEmail">Email Address</Label>
                      <Input
                        id="createEmail"
                        type="text"
                        value={createUserForm.email}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                        placeholder="user@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="createTier">Subscription Tier</Label>
                      <Select
                        value={createUserForm.subscriptionTier}
                        onValueChange={(value) => setCreateUserForm({ ...createUserForm, subscriptionTier: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="createFirstName">First Name (Optional)</Label>
                      <Input
                        id="createFirstName"
                        value={createUserForm.firstName}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, firstName: e.target.value })}
                        placeholder="John"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="createLastName">Last Name (Optional)</Label>
                      <Input
                        id="createLastName"
                        value={createUserForm.lastName}
                        onChange={(e) => setCreateUserForm({ ...createUserForm, lastName: e.target.value })}
                        placeholder="Doe"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="createNotes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="createNotes"
                      value={createUserForm.adminNotes}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, adminNotes: e.target.value })}
                      placeholder="Notes about this user creation..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sendVipCode"
                      checked={createUserForm.sendVipCode}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, sendVipCode: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="sendVipCode" className="text-sm">
                      Send VIP code and welcome email
                    </Label>
                  </div>

                  <Button
                    onClick={handleCreateUser}
                    disabled={createUserMutation.isPending}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Create User Account
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Existing Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {users?.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getTierColor(user.subscriptionTier)}>
                                {user.subscriptionTier.toUpperCase()}
                              </Badge>
                              {user.mfaEnabled ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <Shield className="h-3 w-3 mr-1" />
                                  MFA
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  No MFA
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{formatDate(user.createdAt)}</p>
                            {user.lastLogin && (
                              <p className="text-xs">Last: {formatDate(user.lastLogin)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "generate" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2 text-green-600" />
                Generate Secure VIP Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetEmail">Target User Email</Label>
                    <Input
                      id="targetEmail"
                      type="text"
                      value={vipForm.targetEmail}
                      onChange={(e) => setVipForm({ ...vipForm, targetEmail: e.target.value })}
                      placeholder="user@example.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentTier">Current Tier</Label>
                      <Select value={vipForm.currentTier} onValueChange={(value) => setVipForm({ ...vipForm, currentTier: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="targetTier">Target Tier</Label>
                      <Select value={vipForm.targetTier} onValueChange={(value) => setVipForm({ ...vipForm, targetTier: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      value={vipForm.adminNotes}
                      onChange={(e) => setVipForm({ ...vipForm, adminNotes: e.target.value })}
                      placeholder="Reason for upgrade, special instructions, etc."
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleGenerateCode}
                    disabled={generateCodeMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {generateCodeMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Generate Secure VIP Code
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>How it works:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Code format: VIP-XXXX-XXXX</li>
                        <li>• Valid for 30 minutes</li>
                        <li>• Single use per user</li>
                        <li>• Sent via email automatically</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  
                  {generatedCode && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-800">VIP Code Generated!</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowCode(!showCode)}
                          >
                            {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {showCode && (
                          <div className="mt-3">
                            <div className="bg-white p-3 rounded border border-green-200 mb-2">
                              <code className="text-lg font-mono break-all">{generatedCode}</code>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => copyToClipboard(generatedCode)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Code
                            </Button>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "generate" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2 text-teal-600" />
                Update Lottery Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Fetch the latest draw results from the NY State Open Data API and PA Lottery scraper for all supported games (Powerball, Mega Millions, NY Lotto, Take 5, Pick 10, Numbers, Win 4, Millionaire for Life). Falls back to realistic generated data if the external API is unavailable.
              </p>
              <Button
                onClick={() => updateLotteryMutation.mutate()}
                disabled={updateLotteryMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                data-testid="button-update-lottery"
              >
                {updateLotteryMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {updateLotteryMutation.isPending ? "Fetching Live Data..." : "Update All Game Results"}
              </Button>
              {updateLotteryMutation.isSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {updateLotteryMutation.data?.message}
                  </AlertDescription>
                </Alert>
              )}
              {updateLotteryMutation.isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {(updateLotteryMutation.error as any)?.message || "Failed to update lottery data"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getTierColor(user.subscriptionTier)}>
                              {user.subscriptionTier}
                            </Badge>
                            <Badge variant="outline">
                              {user.mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Joined: {formatDate(user.createdAt)}
                            {user.lastLogin && ` • Last login: ${formatDate(user.lastLogin)}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Select 
                            value={user.subscriptionTier} 
                            onValueChange={(tier) => updateUserMutation.mutate({ email: user.email, tier })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "codes" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                VIP Code History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading VIP codes...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vipCodes?.map((code) => (
                    <div key={code.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{code.targetEmail}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getTierColor(code.currentTier)}>
                              {code.currentTier} → {code.targetTier}
                            </Badge>
                            <Badge variant={code.isUsed ? "default" : "outline"}>
                              {code.isUsed ? "Used" : "Unused"}
                            </Badge>
                          </div>
                          {code.adminNotes && (
                            <p className="text-sm text-gray-600 mt-1">
                              Note: {code.adminNotes}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Created: {formatDate(code.createdAt)}</p>
                          <p>Expires: {formatDate(code.expiresAt)}</p>
                          {code.usedAt && (
                            <p className="text-green-600">Used: {formatDate(code.usedAt)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "logs" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-orange-600" />
                Admin Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading logs...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminLogs?.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={getActionColor(log.action)}>
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                            <span className="font-medium">{log.adminEmail}</span>
                          </div>
                          {log.targetEmail && (
                            <p className="text-sm text-gray-600 mt-1">
                              Target: {log.targetEmail}
                            </p>
                          )}
                          {log.details && (
                            <div className="text-sm text-gray-500 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </code>
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{formatDate(log.timestamp)}</p>
                          {log.ipAddress && (
                            <p className="text-xs">IP: {log.ipAddress}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Blog Editor Tab */}
        {activeTab === "blog" && <BlogEditorTab />}

        {/* Drip Sequence Status Tab */}
        {activeTab === "drip" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-indigo-600" />
                Free-to-Paid Drip Sequences
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Automated 4-email nurture sequence for free users (Day 0, 2, 5, 10). Halts automatically on upgrade.
              </p>
            </CardHeader>
            <CardContent>
              {dripLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading drip status...</p>
                </div>
              ) : !dripStatus || dripStatus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No drip sequences yet. New sign-ups will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Enrolled', value: dripStatus.length, color: 'blue' },
                      { label: 'Active', value: dripStatus.filter(d => d.isActive).length, color: 'green' },
                      { label: 'Converted', value: dripStatus.filter(d => d.haltReason === 'upgraded').length, color: 'purple' },
                      { label: 'Unsubscribed', value: dripStatus.filter(d => d.haltReason === 'unsubscribed').length, color: 'gray' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-lg p-4 text-center`}>
                        <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
                        <p className={`text-sm text-${color}-600`}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Per-user rows */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {dripStatus.map((row) => {
                      const stepLabel = DRIP_STEP_LABELS[row.currentStep] ?? `Step ${row.currentStep}`;
                      const isConverted = row.haltReason === 'upgraded';
                      const isUnsub = row.haltReason === 'unsubscribed';
                      const isComplete = row.haltReason === 'completed';
                      return (
                        <div key={row.userId} className="border border-gray-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{row.email}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Enrolled: {row.enrolledAt ? new Date(row.enrolledAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Step progress */}
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              <ArrowRight className="h-3 w-3 mr-1" />
                              {stepLabel}
                            </Badge>

                            {/* Status badge */}
                            {isConverted && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Converted
                              </Badge>
                            )}
                            {isUnsub && (
                              <Badge className="bg-gray-100 text-gray-600">
                                <XCircle className="h-3 w-3 mr-1" />
                                Unsubscribed
                              </Badge>
                            )}
                            {isComplete && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {row.isActive && (
                              <Badge className="bg-blue-100 text-blue-700">
                                <Mail className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {/* Next send */}
                            {row.nextSendAt && row.isActive && (
                              <span className="text-xs text-gray-400">
                                Next: {new Date(row.nextSendAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Advertisement Management Tab */}
        {activeTab === "ads" && (
          <div>
            <AdManagementDashboard />
          </div>
        )}

        {/* Scratch-Off Gaps Tab */}
        {activeTab === "scratchGaps" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                    NY Scratch-Off Price Gaps
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Games found in the live NY API ({" "}
                    <a
                      href="https://data.ny.gov/resource/nzqa-7unk.json"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      data.ny.gov
                    </a>
                    ) that are missing from the PRICE_LOOKUP in{" "}
                    <code className="bg-gray-100 px-1 rounded text-xs">server/scratchOffService.ts</code>.
                    These games show &ldquo;Unknown&rdquo; price and score 0 in rankings. Look up each ticket price at{" "}
                    <a
                      href="https://nylottery.ny.gov/scratch-off-games"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      nylottery.ny.gov
                    </a>{" "}
                    and add the entry to the lookup. Checked automatically once per week.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshGapsMutation.mutate()}
                  disabled={refreshGapsMutation.isPending}
                  className="shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshGapsMutation.isPending ? "animate-spin" : ""}`} />
                  Refresh Now
                </Button>
              </div>
              {scratchGapsQuery.data?.lastCheckedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Last checked: {formatDate(scratchGapsQuery.data.lastCheckedAt)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {scratchGapsQuery.isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading gap report…</p>
                </div>
              ) : !scratchGapsQuery.data?.lastCheckedAt ? (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">First scan pending</p>
                    <p className="text-sm text-blue-600">The gap detector runs 10 seconds after server boot. Click &ldquo;Refresh Now&rdquo; to trigger an immediate check.</p>
                  </div>
                </div>
              ) : scratchGapsQuery.data?.gaps.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">All clear — no price gaps detected</p>
                    <p className="text-sm text-green-600">Every game in the live NY API has a price entry. Rankings are complete.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert className="border-amber-300 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>{scratchGapsQuery.data?.gaps.length} game(s)</strong> in the live NY API have no price entry.
                      They are showing &ldquo;Unknown&rdquo; price and rank 0 in the scratch-off helper.
                      Look up each price at nylottery.ny.gov and add them to <code className="bg-amber-100 px-1 rounded text-xs">PRICE_LOOKUP</code> in <code className="bg-amber-100 px-1 rounded text-xs">server/scratchOffService.ts</code>.
                    </AlertDescription>
                  </Alert>
                  <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {scratchGapsQuery.data?.gaps.map((gap) => (
                      <div key={gap.gameNumber} className="flex items-center justify-between p-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            #{gap.gameNumber}
                          </Badge>
                          <span className="font-medium text-gray-900">{gap.gameName}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-gray-400">
                            Detected {new Date(gap.detectedAt).toLocaleDateString()}
                          </span>
                          <a
                            href={`https://nylottery.ny.gov/scratch-off-games`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Globe className="h-3 w-3" />
                            Look up price
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    After adding prices to PRICE_LOOKUP, redeploy the server and click &ldquo;Refresh Now&rdquo; to confirm gaps are resolved.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ==================== BLOG EDITOR TAB ====================

interface BlogPostAdmin {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  content: string;
  published: boolean;
  publishedAt: string | null;
  author: string;
  category: string;
  readTimeMinutes: number;
  ogImageUrl: string | null;
}

const CATEGORY_OG_IMAGES: Record<string, string> = {
  Analysis: "/og-blog-analysis.svg",
  Education: "/og-blog-education.svg",
  Strategy: "/og-blog-strategy.svg",
  Methods: "/og-blog-methods.svg",
};

const EMPTY_FORM = {
  slug: "",
  title: "",
  metaDescription: "",
  content: "",
  published: false,
  author: "LotteryPro Team",
  category: "Analysis",
  readTimeMinutes: 7,
  ogImageUrl: CATEGORY_OG_IMAGES["Analysis"],
};


function BlogEditorTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BlogPostAdmin | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [contentTab, setContentTab] = useState<"edit" | "preview">("edit");

  const { data, isLoading, refetch } = useQuery<{ success: boolean; posts: BlogPostAdmin[] }>({
    queryKey: ["/api/blog/all"],
  });

  const { data: sitemapStats } = useQuery<{ totalUrls: number; publishedBlogPosts: number; staticUrls: number; error?: string }>({
    queryKey: ["/api/admin/sitemap-stats"],
    refetchInterval: 30000,
  });

  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; message: string; checked: number; missing: string[] } | null>(null);
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/admin/sitemap-verify");
      return res.json() as Promise<{ ok: boolean; message: string; checked: number; missing: string[] }>;
    },
    onSuccess: (data) => { setVerifyResult(data); },
    onError: (err: any) => { setVerifyResult({ ok: false, message: err.message, checked: 0, missing: [] }); },
  });

  const posts = data?.posts ?? [];

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY_FORM & { id?: string }) => {
      if (payload.id) {
        const res = await apiRequest("PATCH", `/api/blog/${payload.id}`, payload);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/blog", payload);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Blog post saved!", description: `"${form.title}" has been saved.` });
        setEditing(null);
        setCreating(false);
        setForm({ ...EMPTY_FORM });
        queryClient.invalidateQueries({ queryKey: ["/api/blog/all"] });
        queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sitemap-stats"] });
      } else {
        toast({ title: "Save failed", description: data.message, variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const res = await apiRequest("PATCH", `/api/blog/${id}`, { published });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: data.post.published ? "Published!" : "Unpublished", description: data.post.title });
        queryClient.invalidateQueries({ queryKey: ["/api/blog/all"] });
        queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sitemap-stats"] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/blog/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Post deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sitemap-stats"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function startEdit(post: BlogPostAdmin) {
    setEditing(post);
    setCreating(false);
    setContentTab("edit");
    setForm({
      slug: post.slug,
      title: post.title,
      metaDescription: post.metaDescription,
      content: post.content,
      published: post.published,
      author: post.author,
      category: post.category,
      readTimeMinutes: post.readTimeMinutes,
      ogImageUrl: post.ogImageUrl ?? CATEGORY_OG_IMAGES[post.category] ?? CATEGORY_OG_IMAGES["Analysis"],
    });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setContentTab("edit");
    setForm({ ...EMPTY_FORM });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setContentTab("edit");
    setForm({ ...EMPTY_FORM });
  }

  function handleSave() {
    if (!form.title || !form.slug || !form.content) {
      toast({ title: "Missing fields", description: "Title, slug, and content are required.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  }

  const showForm = creating || !!editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blog Editor</h2>
          <p className="text-sm text-gray-500">Publish and manage SEO articles. Changes appear in the sitemap within minutes.</p>
        </div>
        {!showForm && (
          <Button onClick={startCreate} className="flex items-center gap-2">
            <Plus size={16} /> New Article
          </Button>
        )}
      </div>

      {/* Sitemap URL count + verification */}
      <Card className="border border-blue-100 bg-blue-50">
        <CardContent className="py-3 px-4 space-y-3">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Sitemap URLs</span>
            </div>
            {sitemapStats ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-blue-700">{sitemapStats.totalUrls}</span>
                  <span className="text-xs text-blue-500">total</span>
                </div>
                <div className="text-xs text-blue-600 flex gap-4">
                  <span>{sitemapStats.staticUrls} static pages</span>
                  <span>+</span>
                  <span className="font-semibold">{sitemapStats.publishedBlogPosts} published posts</span>
                </div>
                {sitemapStats.error && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={12} /> DB unavailable — count may be incomplete
                  </span>
                )}
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 underline ml-auto"
                >
                  View sitemap.xml ↗
                </a>
              </>
            ) : (
              <span className="text-xs text-blue-400 animate-pulse">Loading...</span>
            )}
          </div>

          {/* Sitemap verification check */}
          <div className="flex items-center gap-3 pt-1 border-t border-blue-100 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => { setVerifyResult(null); verifyMutation.mutate(); }}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <><RefreshCw size={12} className="mr-1 animate-spin" /> Checking...</>
              ) : (
                <><CheckCircle size={12} className="mr-1" /> Verify Sitemap</>
              )}
            </Button>
            {verifyResult && (
              <div className={`flex-1 flex items-start gap-2 text-xs rounded px-2 py-1 ${verifyResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {verifyResult.ok
                  ? <CheckCircle size={12} className="mt-0.5 shrink-0 text-green-600" />
                  : <AlertTriangle size={12} className="mt-0.5 shrink-0 text-red-600" />}
                <span>
                  {verifyResult.message}
                  {verifyResult.missing.length > 0 && (
                    <span className="block font-mono mt-0.5">{verifyResult.missing.map(s => `/blog/${s}`).join(', ')}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={18} />
              {editing ? `Editing: ${editing.title}` : "New Blog Post"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Title *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Powerball Number Frequency Analysis..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">URL Slug * (no spaces)</Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                  placeholder="powerball-number-frequency-analysis"
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Meta Description * (150–160 chars)</Label>
              <Input
                value={form.metaDescription}
                onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                placeholder="Brief SEO description shown in Google results..."
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">{form.metaDescription.length}/160 characters</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={v => setForm(f => ({
                    ...f,
                    category: v,
                    ogImageUrl: f.ogImageUrl === CATEGORY_OG_IMAGES[f.category] ? CATEGORY_OG_IMAGES[v] : f.ogImageUrl,
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Analysis">Analysis</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Strategy">Strategy</SelectItem>
                    <SelectItem value="Methods">Methods</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Author</Label>
                <Input
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Read Time (minutes)</Label>
                <Input
                  type="number"
                  value={form.readTimeMinutes}
                  onChange={e => setForm(f => ({ ...f, readTimeMinutes: parseInt(e.target.value) || 5 }))}
                  className="mt-1"
                  min={1}
                  max={30}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">Content * (Markdown supported)</Label>
                <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setContentTab("edit")}
                    className={`px-3 py-1 flex items-center gap-1 transition-colors ${contentTab === "edit" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Edit size={12} /> Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentTab("preview")}
                    className={`px-3 py-1 flex items-center gap-1 transition-colors border-l border-gray-200 ${contentTab === "preview" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Eye size={12} /> Preview
                  </button>
                </div>
              </div>
              {contentTab === "edit" ? (
                <>
                  <Textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="## Introduction&#10;&#10;Write your article content here in Markdown format...&#10;&#10;## Section Heading&#10;&#10;Paragraph text..."
                    className="font-mono text-sm min-h-[400px]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Use ## for headings, **bold**, and &gt; for blockquotes</p>
                </>
              ) : (
                <div className="min-h-[400px] border border-gray-200 rounded-md bg-white p-5 overflow-auto">
                  {form.content.trim() ? (
                    <div>
                      {form.title && (
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title}</h1>
                      )}
                      <BlogMarkdownContent content={form.content} />
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Nothing to preview yet — start writing in the Write tab.</p>
                  )}
                </div>
              )}
            </div>
            {/* OG Image URL field with live preview */}
            <div>
              <Label className="text-sm font-medium">Social Share Image (OG Image URL)</Label>
              <div className="mt-1 flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    value={form.ogImageUrl ?? ""}
                    onChange={e => setForm(f => ({ ...f, ogImageUrl: e.target.value || null }))}
                    placeholder="/og-blog-analysis.svg or https://..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Used as the preview image when this post is shared on X/Twitter, Facebook, or LinkedIn.
                    Category default auto-fills when you pick a category above.
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Object.entries(CATEGORY_OG_IMAGES).map(([cat, url]) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, ogImageUrl: url }))}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          form.ogImageUrl === url
                            ? "bg-blue-100 border-blue-400 text-blue-700 font-medium"
                            : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {form.ogImageUrl && (
                  <div className="shrink-0">
                    <img
                      src={form.ogImageUrl}
                      alt="OG image preview"
                      className="w-40 h-[84px] object-cover rounded border border-gray-200 bg-gray-50"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">1200×630 preview</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published-toggle"
                checked={form.published}
                onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="published-toggle" className="text-sm font-medium">
                Publish immediately (visible on blog + sitemap)
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t">
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Post"}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No blog posts yet. Click "New Article" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} className={`border ${post.published ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        post.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {post.published ? <><Globe size={10} /> Published</> : "Draft"}
                      </span>
                      <span className="text-xs text-gray-400">{post.category}</span>
                      <span className="text-xs text-gray-400">{post.readTimeMinutes} min</span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm mt-0.5 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400 font-mono">/blog/{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePublishMutation.mutate({ id: post.id, published: !post.published })}
                      disabled={togglePublishMutation.isPending}
                      className="text-xs"
                    >
                      {post.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(post)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => {
                        if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}