import { storage } from "./storage";

// PayPal subscription plan IDs (these need to be created in PayPal dashboard)
const PAYPAL_PLANS = {
  basic: process.env.NODE_ENV === 'production' ? 'P-BASIC-PROD-ID' : 'P-BASIC-TEST-ID',
  pro: process.env.NODE_ENV === 'production' ? 'P-PRO-PROD-ID' : 'P-PRO-TEST-ID', 
  premium: process.env.NODE_ENV === 'production' ? 'P-PREMIUM-PROD-ID' : 'P-PREMIUM-TEST-ID'
};

const PLAN_TIER_MAPPING = {
  'P-BASIC-TEST-ID': 'basic',
  'P-PRO-TEST-ID': 'pro',
  'P-PREMIUM-TEST-ID': 'premium',
  'P-BASIC-PROD-ID': 'basic',
  'P-PRO-PROD-ID': 'pro',
  'P-PREMIUM-PROD-ID': 'premium'
};

export async function createPayPalSubscription(planId: string, userId: string) {
  try {
    // For now, create a mock subscription to test the flow
    // In production, this would call PayPal API to create subscription
    
    const mockSubscriptionId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const approvalUrl = process.env.NODE_ENV === 'production' 
      ? `https://www.paypal.com/webapps/billing/subscriptions?subscription_id=${mockSubscriptionId}`
      : `https://www.sandbox.paypal.com/webapps/billing/subscriptions?subscription_id=${mockSubscriptionId}`;

    console.log('🎯 Educational PayPal subscription created for user:', userId, 'Plan:', planId);
    
    return {
      success: true,
      subscriptionId: mockSubscriptionId,
      approvalUrl
    };
  } catch (error) {
    console.error('PayPal subscription creation error:', error);
    return {
      success: false,
      error: 'Failed to create subscription'
    };
  }
}

export async function activatePayPalSubscription(subscriptionId: string, userId: string) {
  try {
    // For testing, we'll simulate activation
    // In production, this would verify the subscription with PayPal API
    
    // Determine tier from subscription (for now, default to 'pro')
    const tier = 'pro'; // In production, get this from PayPal API
    
    // Update user subscription status
    await storage.updateUserSubscriptionStatus(userId, 'active', subscriptionId);
    await storage.updateUserSubscriptionTier(userId, tier);
    
    console.log('✅ Educational subscription activated for user:', userId, 'Tier:', tier);
    
    return {
      success: true,
      tier
    };
  } catch (error) {
    console.error('PayPal subscription activation error:', error);
    return {
      success: false,
      error: 'Failed to activate subscription'
    };
  }
}

// PayPal webhook handlers
export async function handleSubscriptionActivated(resource: any) {
  try {
    const subscriptionId = resource.id;
    const planId = resource.plan_id;
    
    // Find user by PayPal subscription ID
    const users = await storage.getAllUsers();
    const user = users.find(u => u.paypalSubscriptionId === subscriptionId);
    
    if (user) {
      const tier = PLAN_TIER_MAPPING[planId as keyof typeof PLAN_TIER_MAPPING] || 'basic';
      
      await storage.updateUserSubscriptionStatus(user.id, 'active', subscriptionId);
      await storage.updateUserSubscriptionTier(user.id, tier);
      
      console.log('📧 Educational subscription activated via webhook:', user.email, 'Tier:', tier);
    } else {
      console.warn('User not found for subscription:', subscriptionId);
    }
  } catch (error) {
    console.error('Webhook subscription activation error:', error);
  }
}

export async function handleSubscriptionCancelled(resource: any) {
  try {
    const subscriptionId = resource.id;
    
    // Find user by PayPal subscription ID
    const users = await storage.getAllUsers();
    const user = users.find(u => u.paypalSubscriptionId === subscriptionId);
    
    if (user) {
      await storage.updateUserSubscriptionStatus(user.id, 'cancelled');
      await storage.updateUserSubscriptionTier(user.id, 'free');
      
      console.log('❌ Educational subscription cancelled via webhook:', user.email);
    } else {
      console.warn('User not found for cancelled subscription:', subscriptionId);
    }
  } catch (error) {
    console.error('Webhook subscription cancellation error:', error);
  }
}

export async function handleSubscriptionSuspended(resource: any) {
  try {
    const subscriptionId = resource.id;
    
    // Find user by PayPal subscription ID
    const users = await storage.getAllUsers();
    const user = users.find(u => u.paypalSubscriptionId === subscriptionId);
    
    if (user) {
      await storage.updateUserSubscriptionStatus(user.id, 'suspended');
      
      console.log('⏸️ Educational subscription suspended via webhook:', user.email);
    } else {
      console.warn('User not found for suspended subscription:', subscriptionId);
    }
  } catch (error) {
    console.error('Webhook subscription suspension error:', error);
  }
}

export async function handlePaymentCompleted(resource: any) {
  try {
    const subscriptionId = resource.billing_agreement_id;
    const amount = resource.amount?.total;
    
    // Find user by PayPal subscription ID
    const users = await storage.getAllUsers();
    const user = users.find(u => u.paypalSubscriptionId === subscriptionId);
    
    if (user) {
      // Reset daily usage for successful payment
      await storage.resetUserDailyUsage(user.id);
      
      console.log('💰 Educational payment completed via webhook:', user.email, 'Amount:', amount);
    } else {
      console.warn('User not found for payment:', subscriptionId);
    }
  } catch (error) {
    console.error('Webhook payment completion error:', error);
  }
}