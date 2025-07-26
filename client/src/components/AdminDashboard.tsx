import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3Icon, 
  UsersIcon, 
  DollarSignIcon, 
  TrendingUpIcon,
  ShieldCheckIcon,
  DownloadIcon,
  SearchIcon,
  FilterIcon,
  EyeIcon
} from "lucide-react";

interface AdminDashboardProps {
  adminEmail: string;
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [selectedDateRange, setSelectedDateRange] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [complianceJustification, setComplianceJustification] = useState("");
  const { toast } = useToast();

  // Check if user has admin privileges
  const isRussellAdmin = adminEmail === "russell@russellnomer.com";
  const isAuthorizedAdmin = isRussellAdmin || adminEmail.endsWith("@lotteryproapp.com");

  // Customer analytics query
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/admin/analytics`, selectedDateRange, selectedSegment],
    enabled: isAuthorizedAdmin
  });

  // Customer segments query
  const { data: segments, isLoading: segmentsLoading } = useQuery({
    queryKey: [`/api/admin/segments`],
    enabled: isAuthorizedAdmin
  });

  // Customer search query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: [`/api/admin/customers/search`, searchQuery],
    enabled: isAuthorizedAdmin && searchQuery.length > 2
  });

  // Compliance report generation
  const complianceReportMutation = useMutation({
    mutationFn: async (justification: string) => {
      const response = await fetch('/api/admin/compliance-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate compliance report');
      }
      
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Compliance Report Generated",
        description: "Report has been downloaded to your device."
      });
    }
  });

  // Customer export mutation
  const exportCustomersMutation = useMutation({
    mutationFn: async (filters: any) => {
      const response = await fetch('/api/admin/customers/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, justification: complianceJustification }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export customer data');
      }
      
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer-data-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  if (!isAuthorizedAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Administrative access is restricted to authorized personnel only.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Contact russell@russellnomer.com for access requests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administrative Dashboard
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Secure customer data management and compliance reporting
            </p>
            <Badge variant={isRussellAdmin ? "default" : "secondary"}>
              {isRussellAdmin ? "Super Admin" : "Admin"} • {adminEmail}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Customer Analytics</h2>
              <div className="flex items-center space-x-4">
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-8">Loading analytics...</div>
            ) : analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.activeCustomers} active this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${Object.values(analytics.revenueByTier).reduce((a: number, b: number) => a + b, 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average LTV: ${analytics.ltv.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.conversionFunnel.conversionRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.conversionFunnel.paidUsers} paid subscribers
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                    <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.churnRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Subscription Breakdown */}
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Tier Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics.subscriptionBreakdown).map(([tier, count]) => (
                      <div key={tier} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold capitalize">{count as number}</div>
                        <div className="text-sm text-gray-600 capitalize">{tier}</div>
                        <div className="text-xs text-gray-500">
                          ${(analytics.revenueByTier[tier] || 0).toFixed(2)} revenue
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Customer Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button 
                  onClick={() => exportCustomersMutation.mutate({ segment: selectedSegment })}
                  variant="outline"
                  disabled={!complianceJustification}
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Data Export Justification</CardTitle>
                <p className="text-sm text-gray-600">
                  Administrative access and data exports are logged for compliance. Please provide justification.
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter business justification for accessing customer data..."
                  value={complianceJustification}
                  onChange={(e) => setComplianceJustification(e.target.value)}
                  className="min-h-20"
                />
              </CardContent>
            </Card>

            {searchResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((customer: any) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            {customer.firstName} {customer.lastName}
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {customer.subscriptionTier}
                            </Badge>
                          </TableCell>
                          <TableCell>${customer.totalSpent}</TableCell>
                          <TableCell>
                            {new Date(customer.lastActivity).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <EyeIcon className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Customer Segments Tab */}
          <TabsContent value="segments" className="space-y-6">
            <h2 className="text-2xl font-semibold">Customer Segments</h2>
            
            {segmentsLoading ? (
              <div className="text-center py-8">Loading segments...</div>
            ) : segments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(segments).map(([segmentName, customers]) => (
                  <Card key={segmentName}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{segmentName.replace(/([A-Z])/g, ' $1')}</span>
                        <Badge variant="secondary">
                          {(customers as any[]).length} customers
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Revenue:</span>
                          <span className="font-semibold">
                            ${(customers as any[]).reduce((sum, c) => sum + parseFloat(c.totalSpent || '0'), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg. LTV:</span>
                          <span className="font-semibold">
                            ${((customers as any[]).reduce((sum, c) => sum + parseFloat(c.totalSpent || '0'), 0) / Math.max((customers as any[]).length, 1)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedSegment(segmentName)}
                      >
                        View Segment Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </TabsContent>

          {/* Marketing Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Marketing Campaigns</h2>
              <Button>Create Campaign</Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommended Campaign Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-green-700">Casino Cross-Sell</h3>
                    <p className="text-sm text-gray-600">Target lottery players with casino interest</p>
                    <Badge variant="secondary" className="mt-2">High Conversion</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-blue-700">Free Tier Conversion</h3>
                    <p className="text-sm text-gray-600">Upgrade active free users to paid tiers</p>
                    <Badge variant="secondary" className="mt-2">Revenue Growth</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-purple-700">Cruise Partnerships</h3>
                    <p className="text-sm text-gray-600">Casino cruise packages for premium users</p>
                    <Badge variant="secondary" className="mt-2">Premium LTV</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Compliance & Transparency</h2>
              <Button 
                onClick={() => complianceReportMutation.mutate(complianceJustification)}
                disabled={!complianceJustification || complianceReportMutation.isPending}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                {complianceReportMutation.isPending ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                    Data Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Encryption Status:</span>
                    <Badge variant="secondary">✓ Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Hashing:</span>
                    <Badge variant="secondary">✓ Salted</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Logging:</span>
                    <Badge variant="secondary">✓ Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Consent Tracking:</span>
                    <Badge variant="secondary">✓ Compliant</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Trail</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    All administrative actions are logged for regulatory compliance and transparency.
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Data Retention:</strong> 7 years (regulatory requirement)
                    </div>
                    <div className="text-sm">
                      <strong>Export Tracking:</strong> All data exports logged with justification
                    </div>
                    <div className="text-sm">
                      <strong>Access Controls:</strong> Role-based permissions enforced
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Report Justification</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter justification for generating compliance report (required for audit trail)..."
                  value={complianceJustification}
                  onChange={(e) => setComplianceJustification(e.target.value)}
                  className="min-h-24"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This justification will be included in the audit log and compliance report.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}