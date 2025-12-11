import { getStripeSync, getUncachableStripeClient, isStripeIntegrationAvailable } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

// Map Stripe Price IDs to subscription tiers
// These should match the prices configured in your Stripe dashboard
const PRICE_ID_TO_TIER: Record<string, 'basic' | 'pro' | 'premium'> = {
  // Add your actual Stripe Price IDs here once created
  // Example: 'price_1ABC123': 'basic',
  // For now, we'll also check product metadata and fallback to amount
};

// Fallback: Map amounts (in cents) to tiers
const AMOUNT_TO_TIER = (amountCents: number): 'basic' | 'pro' | 'premium' => {
  const amount = amountCents / 100;
  if (amount >= 35) return 'premium';  // $39.99
  if (amount >= 15) return 'pro';       // $19.99
  if (amount >= 5) return 'basic';      // $9.99
  return 'basic';
};

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!isStripeIntegrationAvailable()) {
      console.log('⚠️ Stripe not configured - webhook ignored');
      return;
    }

    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    
    // Process webhook through stripe-replit-sync (handles signature verification and DB storage)
    await sync.processWebhook(payload, signature, uuid);
    
    // Parse the event to trigger custom business logic
    const stripe = await getUncachableStripeClient();
    const webhookSecret = await sync.getWebhookSecret(uuid);
    
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    console.log(`📨 Stripe webhook event: ${event.type}`);
    
    // Handle specific events for our business logic
    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await WebhookHandlers.handleSubscriptionUpdated(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await WebhookHandlers.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await WebhookHandlers.handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
    
    console.log('✅ Stripe webhook processed successfully');
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const customerEmail = session.customer_email || session.customer_details?.email;
    const paymentStatus = session.payment_status;
    
    console.log(`💳 Checkout completed for: ${customerEmail}, status: ${paymentStatus}`);
    
    if (paymentStatus === 'paid' && customerEmail) {
      const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
      let tier: 'basic' | 'pro' | 'premium' = 'basic';
      
      if (amountTotal >= 39) {
        tier = 'premium';
      } else if (amountTotal >= 19) {
        tier = 'pro';
      } else if (amountTotal >= 9) {
        tier = 'basic';
      }
      
      const user = await storage.getUserByEmail(customerEmail);
      
      if (user) {
        await storage.updateUserSubscriptionTier(user.id, tier);
        await storage.updateUserSubscriptionStatus(user.id, 'active');
        console.log(`✅ Updated subscription for ${customerEmail} to ${tier} ($${amountTotal})`);
      } else {
        console.log(`ℹ️ User ${customerEmail} not found - they need to register first`);
      }
    }
  }

  static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const status = subscription.status;
    const customerId = subscription.customer;
    
    console.log(`📋 Subscription updated: customer=${customerId}, status=${status}`);
  }

  static async handlePaymentSucceeded(invoice: any): Promise<void> {
    const customerEmail = invoice.customer_email;
    const amountPaid = invoice.amount_paid / 100;
    
    console.log(`💵 Payment succeeded: ${customerEmail}, amount: $${amountPaid}`);
    
    if (customerEmail) {
      const user = await storage.getUserByEmail(customerEmail);
      if (user) {
        await storage.updateUserSubscriptionStatus(user.id, 'active');
      }
    }
  }

  static async handlePaymentFailed(invoice: any): Promise<void> {
    const customerEmail = invoice.customer_email;
    
    console.log(`⚠️ Payment failed: ${customerEmail}`);
    
    if (customerEmail) {
      const user = await storage.getUserByEmail(customerEmail);
      if (user) {
        await storage.updateUserSubscriptionStatus(user.id, 'suspended');
      }
    }
  }
}
