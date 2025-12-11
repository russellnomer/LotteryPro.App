import { Request, Response } from 'express';
import { storage } from './storage';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
}) : null;

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

const priceToPlanMapping: Record<string, 'basic' | 'pro' | 'premium'> = {
  'price_basic': 'basic',
  'price_pro': 'pro', 
  'price_premium': 'premium',
};

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
    let event: StripeWebhookEvent;
    
    if (STRIPE_WEBHOOK_SECRET && stripe) {
      const sig = req.headers['stripe-signature'] as string;
      
      if (!sig) {
        console.error('❌ Missing Stripe signature header');
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }
      
      try {
        const rawBody = (req as any).rawBody || req.body;
        const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
        
        event = stripe.webhooks.constructEvent(
          bodyString,
          sig,
          STRIPE_WEBHOOK_SECRET
        ) as StripeWebhookEvent;
        
        console.log(`✅ Stripe signature verified for event: ${event.id}`);
      } catch (err: any) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }
    } else {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - skipping signature verification (INSECURE)');
      event = req.body as StripeWebhookEvent;
    }
    
    console.log(`📧 Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const paymentStatus = session.payment_status;
        
        console.log(`💳 Checkout completed for: ${customerEmail}, status: ${paymentStatus}`);
        
        if (paymentStatus === 'paid' && customerEmail) {
          let tier: 'basic' | 'pro' | 'premium' = 'basic';
          
          const priceId = session.line_items?.data?.[0]?.price?.id;
          if (priceId && priceToPlanMapping[priceId]) {
            tier = priceToPlanMapping[priceId];
          } else {
            const productName = session.line_items?.data?.[0]?.description || 
                               session.metadata?.plan || 
                               'basic';
            tier = productToPlanMapping[productName] || 'basic';
          }
          
          const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
          if (amountTotal >= 39) {
            tier = 'premium';
          } else if (amountTotal >= 19) {
            tier = 'pro';
          } else if (amountTotal >= 9) {
            tier = 'basic';
          }
          
          let user = await storage.getUserByEmail(customerEmail);
          
          if (user) {
            await storage.updateUserSubscriptionTier(user.id, tier);
            await storage.updateUserSubscriptionStatus(user.id, 'active');
            console.log(`✅ Updated subscription for ${customerEmail} to ${tier} ($${amountTotal})`);
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
        
        let tier: 'basic' | 'pro' | 'premium' = 'basic';
        
        const priceId = subscription.items?.data?.[0]?.price?.id;
        if (priceId && priceToPlanMapping[priceId]) {
          tier = priceToPlanMapping[priceId];
        } else {
          const productName = subscription.items?.data?.[0]?.price?.product?.name || 
                            subscription.items?.data?.[0]?.plan?.nickname || 
                            'basic';
          tier = productToPlanMapping[productName] || 'basic';
        }
        
        console.log(`📋 Subscription ${event.type}: customer=${customerId}, status=${status}, tier=${tier}`);
        
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
  return !!STRIPE_SECRET_KEY && !!STRIPE_WEBHOOK_SECRET;
}

export function getStripeStatus() {
  return {
    secretKeyConfigured: !!STRIPE_SECRET_KEY,
    webhookSecretConfigured: !!STRIPE_WEBHOOK_SECRET,
    fullyConfigured: !!STRIPE_SECRET_KEY && !!STRIPE_WEBHOOK_SECRET,
  };
}
