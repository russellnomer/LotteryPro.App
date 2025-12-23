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
  Monitor
} from "lucide-react";
import AdManagementDashboard from "./AdManagementDashboard";

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"generate" | "users" | "codes" | "ads" | "logs">("generate");
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
                { id: "ads", label: "Advertisement", icon: Monitor },
                { id: "logs", label: "Admin Logs", icon: Activity },
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

        {/* Advertisement Management Tab */}
        {activeTab === "ads" && (
          <div>
            <AdManagementDashboard />
          </div>
        )}
      </div>
    </div>
  );
}