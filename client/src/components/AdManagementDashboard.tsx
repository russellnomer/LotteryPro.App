import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  DollarSign,
  Calendar,
  Target,
  Settings,
  BarChart3,
  Copy
} from "lucide-react";

interface AdCampaign {
  id: string;
  name: string;
  type: 'adsense' | 'custom' | 'affiliate';
  adCode: string;
  placement: string;
  priority: number;
  isActive: boolean;
  maxViews?: number;
  maxClicks?: number;
  ratePerView?: string;
  ratePerClick?: string;
  startDate?: string;
  endDate?: string;
  rotationWeight: number;
  clientName?: string;
  clientEmail?: string;
  createdAt: string;
}

interface AdAnalytics {
  campaignId: string;
  campaignName: string;
  revenue: number;
  views: number;
  clicks: number;
}

interface RevenueReport {
  totalRevenue: number;
  viewRevenue: number;
  clickRevenue: number;
  totalViews: number;
  totalClicks: number;
  campaignBreakdown: AdAnalytics[];
}

export default function AdManagementDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "custom" as 'adsense' | 'custom' | 'affiliate',
    adCode: "",
    placement: "sidebar",
    priority: 1,
    maxViews: "",
    maxClicks: "",
    ratePerView: "",
    ratePerClick: "",
    startDate: "",
    endDate: "",
    rotationWeight: 1,
    clientName: "",
    clientEmail: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<AdCampaign[]>({
    queryKey: ['/api/admin/campaigns'],
    retry: false,
  });

  // Fetch revenue report
  const { data: revenueReport, isLoading: revenueLoading } = useQuery<RevenueReport>({
    queryKey: ['/api/admin/ad-revenue'],
    retry: false,
  });

  // Create/Update campaign mutation
  const campaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = selectedCampaign 
        ? `/api/admin/campaigns/${selectedCampaign.id}`
        : '/api/admin/campaigns';
      
      const method = selectedCampaign ? 'PATCH' : 'POST';
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: selectedCampaign ? "Campaign Updated" : "Campaign Created",
        description: "Advertisement campaign saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign",
        variant: "destructive",
      });
    },
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/campaigns/${campaignId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: "Advertisement campaign removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setSelectedCampaign(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "custom" as 'adsense' | 'custom' | 'affiliate',
      adCode: "",
      placement: "sidebar",
      priority: 1,
      maxViews: "",
      maxClicks: "",
      ratePerView: "",
      ratePerClick: "",
      startDate: "",
      endDate: "",
      rotationWeight: 1,
      clientName: "",
      clientEmail: "",
    });
    setSelectedCampaign(null);
    setIsCreateMode(false);
  };

  const handleEdit = (campaign: AdCampaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      type: campaign.type,
      adCode: campaign.adCode,
      placement: campaign.placement,
      priority: campaign.priority,
      maxViews: campaign.maxViews?.toString() || "",
      maxClicks: campaign.maxClicks?.toString() || "",
      ratePerView: campaign.ratePerView || "",
      ratePerClick: campaign.ratePerClick || "",
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : "",
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : "",
      rotationWeight: campaign.rotationWeight,
      clientName: campaign.clientName || "",
      clientEmail: campaign.clientEmail || "",
    });
    setIsCreateMode(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.adCode) {
      toast({
        title: "Missing Information",
        description: "Campaign name and ad code are required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      maxViews: formData.maxViews ? parseInt(formData.maxViews) : null,
      maxClicks: formData.maxClicks ? parseInt(formData.maxClicks) : null,
      ratePerView: formData.ratePerView || null,
      ratePerClick: formData.ratePerClick || null,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    };

    campaignMutation.mutate(submitData);
  };

  const copyAdCode = (adCode: string) => {
    navigator.clipboard.writeText(adCode).then(() => {
      toast({
        title: "Copied",
        description: "Ad code copied to clipboard",
      });
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'adsense': return 'bg-blue-100 text-blue-800';
      case 'affiliate': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Advertisement Management</h2>
          <p className="text-gray-600">Control Google AdSense, custom ads, and affiliate content</p>
        </div>
        <Button 
          onClick={() => setIsCreateMode(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {isCreateMode && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name</label>
                    <Input
                      placeholder="Summer Sale Banner"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adsense">Google AdSense</SelectItem>
                        <SelectItem value="custom">Custom Ad</SelectItem>
                        <SelectItem value="affiliate">Affiliate Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Placement</label>
                    <Select 
                      value={formData.placement} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, placement: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                        <SelectItem value="content">Content Area</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority (1-10)</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ad Code (HTML/JavaScript)</label>
                  <Textarea
                    placeholder={formData.type === 'adsense' 
                      ? '<script>...</script> or <ins class="adsbygoogle">...'
                      : formData.type === 'affiliate'
                      ? '<a href="https://affiliate-link">Affiliate content...</a>'
                      : '<div>Custom HTML content...</div>'
                    }
                    className="h-32 font-mono text-sm"
                    value={formData.adCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, adCode: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Views</label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={formData.maxViews}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxViews: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Clicks</label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={formData.maxClicks}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxClicks: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rate per View ($)</label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={formData.ratePerView}
                      onChange={(e) => setFormData(prev => ({ ...prev, ratePerView: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rate per Click ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.ratePerClick}
                      onChange={(e) => setFormData(prev => ({ ...prev, ratePerClick: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rotation Weight (1-100)</label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.rotationWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, rotationWeight: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Name (Optional)</label>
                    <Input
                      placeholder="Client or Company Name"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Email (Optional)</label>
                    <Input
                      type="email"
                      placeholder="client@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={handleSubmit}
                    disabled={campaignMutation.isPending}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {campaignMutation.isPending ? 'Saving...' : 'Save Campaign'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {campaignsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">Loading campaigns...</div>
                </CardContent>
              </Card>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    No advertisement campaigns yet. Create your first campaign to get started.
                  </div>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign: AdCampaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          <Badge className={getTypeColor(campaign.type)}>
                            {campaign.type.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(campaign.isActive)}>
                            {campaign.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Placement:</strong> {campaign.placement}
                          </div>
                          <div>
                            <strong>Priority:</strong> {campaign.priority}
                          </div>
                          <div>
                            <strong>Weight:</strong> {campaign.rotationWeight}
                          </div>
                          <div>
                            <strong>Client:</strong> {campaign.clientName || 'N/A'}
                          </div>
                        </div>

                        {(campaign.maxViews || campaign.maxClicks) && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Limits:</strong>
                            {campaign.maxViews && ` ${campaign.maxViews} views`}
                            {campaign.maxViews && campaign.maxClicks && ' • '}
                            {campaign.maxClicks && ` ${campaign.maxClicks} clicks`}
                          </div>
                        )}

                        {(campaign.ratePerView || campaign.ratePerClick) && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Rates:</strong>
                            {campaign.ratePerView && ` $${campaign.ratePerView}/view`}
                            {campaign.ratePerView && campaign.ratePerClick && ' • '}
                            {campaign.ratePerClick && ` $${campaign.ratePerClick}/click`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAdCode(campaign.adCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate(campaign.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold">{revenueReport?.totalViews ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MousePointer className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                    <p className="text-2xl font-bold">{revenueReport?.totalClicks ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">CTR</p>
                    <p className="text-2xl font-bold">
                      {revenueReport?.totalViews 
                        ? ((revenueReport.totalClicks / revenueReport.totalViews) * 100).toFixed(2)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold">
                      {campaigns.filter((c: AdCampaign) => c.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      ${revenueReport?.totalRevenue?.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">View Revenue</p>
                    <p className="text-2xl font-bold">
                      ${revenueReport?.viewRevenue?.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MousePointer className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Click Revenue</p>
                    <p className="text-2xl font-bold">
                      ${revenueReport?.clickRevenue?.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {revenueReport?.campaignBreakdown && revenueReport.campaignBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueReport.campaignBreakdown?.map((campaign: AdAnalytics) => (
                    <div key={campaign.campaignId} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{campaign.campaignName}</h4>
                        <p className="text-sm text-gray-600">
                          {campaign.views} views • {campaign.clicks} clicks
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ${campaign.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}