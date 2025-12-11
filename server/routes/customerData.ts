import express, { Router } from 'express';
import { customerDataService } from '../customerDataService';
import type { Request, Response } from 'express';

const router = Router();

// Track customer activity
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const activity = await customerDataService.trackActivity({
      ...req.body,
      req
    });

    res.json(activity);
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({ message: 'Failed to track activity' });
  }
});

// Administrative routes (restricted access)
router.get('/admin/analytics', async (req: Request, res: Response) => {
  try {
    const adminEmail = req.user?.claims?.email;
    
    if (!adminEmail || (!adminEmail.includes('russell@russellnomer.com') && !adminEmail.endsWith('@lotteryproapp.com'))) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const filters = {
      dateRange: req.query.dateRange || '30',
      segment: req.query.segment || 'all'
    };

    await customerDataService.logAdminAccess({
      adminEmail,
      action: 'view_analytics',
      queryParameters: filters,
      justification: 'Regular business analytics review',
      req
    });

    const analytics = await customerDataService.getCustomerAnalytics(filters);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

router.get('/admin/segments', async (req: Request, res: Response) => {
  try {
    const adminEmail = req.user?.claims?.email;
    
    if (!adminEmail || (!adminEmail.includes('russell@russellnomer.com') && !adminEmail.endsWith('@lotteryproapp.com'))) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await customerDataService.logAdminAccess({
      adminEmail,
      action: 'view_segments',
      justification: 'Customer segmentation analysis',
      req
    });

    const segments = await customerDataService.getCustomerSegments();
    res.json(segments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ message: 'Failed to fetch segments' });
  }
});

router.get('/admin/customers/search', async (req: Request, res: Response) => {
  try {
    const adminEmail = req.user?.claims?.email;
    const searchQuery = req.query.q as string;
    
    if (!adminEmail || (!adminEmail.includes('russell@russellnomer.com') && !adminEmail.endsWith('@lotteryproapp.com'))) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (!searchQuery || searchQuery.length < 3) {
      return res.json([]);
    }

    await customerDataService.logAdminAccess({
      adminEmail,
      action: 'search_customers',
      queryParameters: { searchQuery },
      justification: req.body.justification || 'Customer lookup for support',
      req
    });

    // Simple search implementation - would be more sophisticated in production
    const customers = await customerDataService.getCustomerAnalytics();
    const searchResults = []; // Implement actual search logic here

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ message: 'Failed to search customers' });
  }
});

router.post('/admin/customers/export', async (req: Request, res: Response) => {
  try {
    const adminEmail = req.user?.claims?.email;
    
    if (!adminEmail || (!adminEmail.includes('russell@russellnomer.com') && !adminEmail.endsWith('@lotteryproapp.com'))) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { filters, justification } = req.body;

    if (!justification) {
      return res.status(400).json({ message: 'Justification required for data export' });
    }

    await customerDataService.logAdminAccess({
      adminEmail,
      action: 'export_customer_data',
      queryParameters: filters,
      justification,
      req
    });

    const customers = await customerDataService.getCustomerAnalytics(filters);
    
    // Create CSV export
    const csvData = createCustomerCSV(customers);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer-export.csv"');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting customers:', error);
    res.status(500).json({ message: 'Failed to export customer data' });
  }
});

router.post('/admin/compliance-report', async (req: Request, res: Response) => {
  try {
    const adminEmail = req.user?.claims?.email;
    
    if (!adminEmail || (!adminEmail.includes('russell@russellnomer.com') && !adminEmail.endsWith('@lotteryproapp.com'))) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { justification } = req.body;

    if (!justification) {
      return res.status(400).json({ message: 'Justification required for compliance report' });
    }

    const report = await customerDataService.generateComplianceReport(adminEmail, req);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.json"');
    res.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ message: 'Failed to generate compliance report' });
  }
});

// Helper function to create CSV from customer data
function createCustomerCSV(data: any): string {
  const headers = [
    'Email Hash',
    'First Name',
    'Last Name', 
    'State',
    'Subscription Tier',
    'Total Spent',
    'Last Activity',
    'Marketing Opt-In',
    'Casino Interest',
    'Cruise Interest'
  ];

  const rows = data.customers?.map((customer: any) => [
    customer.emailHash,
    customer.firstName || '',
    customer.lastName || '',
    customer.state || '',
    customer.subscriptionTier,
    customer.totalSpent,
    customer.lastActivity,
    customer.marketingOptIn,
    customer.interests?.casinoInterest || false,
    customer.interests?.cruiseInterest || false
  ]) || [];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export default router;