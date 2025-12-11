import { getStripeSync } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);
    
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
