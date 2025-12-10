import { Request, Response } from 'express';
import { storage } from './storage';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

const productToPlanMapping: Record<string, 'basic' | 'pro' | 'premium'> = {
  'Lottery Pro Basic': 'basic',
  'Basic': 'basic',
  'basic': 'basic',
  'Lottery Pro Pro': 'pro', 
  'Pro': 'pro',
  'pro': 'pro',
  'Lottery Pro Premium': 'premium',
  'Premium': 'premium',
  'premium': 'premium',
};

export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const event = req.body as StripeEvent;
    
    console.log(`📧 Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const paymentStatus = session.payment_status;
        
        console.log(`💳 Checkout completed for: ${customerEmail}, status: ${paymentStatus}`);
        
        if (paymentStatus === 'paid' && customerEmail) {
          const productName = session.line_items?.data?.[0]?.description || 
                             session.metadata?.plan || 
                             'basic';
          
          const tier = productToPlanMapping[productName] || 'basic';
          
          let user = await storage.getUserByEmail(customerEmail);
          
          if (user) {
            await storage.updateUserSubscriptionTier(user.id, tier);
            await storage.updateUserSubscriptionStatus(user.id, 'active');
            console.log(`✅ Updated subscription for ${customerEmail} to ${tier}`);
          } else {
            console.log(`ℹ️ User ${customerEmail} not found - they need to register first`);
          }
          
          await logStripeEvent(event.id, event.type, customerEmail, tier, 'success');
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;
        const productName = subscription.items?.data?.[0]?.price?.product?.name || 
                          subscription.items?.data?.[0]?.plan?.nickname || 
                          'basic';
        
        console.log(`📋 Subscription ${event.type}: customer=${customerId}, status=${status}`);
        
        const tier = productToPlanMapping[productName] || 'basic';
        const subscriptionStatus = status === 'active' ? 'active' : 
                                   status === 'canceled' ? 'cancelled' : 
                                   status === 'past_due' ? 'suspended' : 'pending';
        
        await logStripeEvent(event.id, event.type, customerId, tier, subscriptionStatus);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        console.log(`❌ Subscription cancelled: customer=${customerId}`);
        
        await logStripeEvent(event.id, event.type, customerId, 'free', 'cancelled');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerEmail = invoice.customer_email;
        const amountPaid = invoice.amount_paid / 100;
        
        console.log(`💵 Payment succeeded: ${customerEmail}, amount: $${amountPaid}`);
        
        if (customerEmail) {
          const user = await storage.getUserByEmail(customerEmail);
          if (user) {
            await storage.updateUserSubscriptionStatus(user.id, 'active');
          }
        }
        
        await logStripeEvent(event.id, event.type, customerEmail || 'unknown', 'payment', 'success');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerEmail = invoice.customer_email;
        
        console.log(`⚠️ Payment failed: ${customerEmail}`);
        
        if (customerEmail) {
          const user = await storage.getUserByEmail(customerEmail);
          if (user) {
            await storage.updateUserSubscriptionStatus(user.id, 'suspended');
          }
        }
        
        await logStripeEvent(event.id, event.type, customerEmail || 'unknown', 'payment', 'failed');
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function logStripeEvent(
  eventId: string, 
  eventType: string, 
  identifier: string, 
  tier: string, 
  status: string
) {
  try {
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
    
    await db.execute(sql`
      INSERT INTO stripe_events (event_id, event_type, customer_identifier, tier, status, created_at)
      VALUES (${eventId}, ${eventType}, ${identifier}, ${tier}, ${status}, NOW())
      ON CONFLICT (event_id) DO NOTHING
    `);
  } catch (error) {
    console.error('Failed to log Stripe event:', error);
  }
}

export function isStripeConfigured(): boolean {
  return !!STRIPE_WEBHOOK_SECRET;
}
