import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getPool } from './db';
import { getAuthUser } from './auth';

const router = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

// GET /api/stripe/status — current user's subscription status
router.get('/status', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.json({ isPremium: false, status: null });
    return;
  }
  try {
    const db = getPool();
    const { rows } = await db.query<{ status: string; plan: string | null; current_period_end: Date | null }>(
      'SELECT status, plan, current_period_end FROM subscriptions WHERE user_id = $1',
      [user.id]
    );
    const sub = rows[0];
    res.json({
      isPremium: sub?.status === 'active',
      status: sub?.status ?? null,
      plan: sub?.plan ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
    });
  } catch (err) {
    console.error('[stripe] status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stripe/checkout — create Stripe Checkout session
router.post('/checkout', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in to subscribe' });
    return;
  }

  const { plan } = req.body as { plan: string };
  if (plan !== 'monthly' && plan !== 'yearly') {
    res.status(400).json({ error: 'plan must be monthly or yearly' });
    return;
  }

  const priceId = plan === 'monthly'
    ? process.env.STRIPE_PRICE_MONTHLY
    : process.env.STRIPE_PRICE_YEARLY;

  if (!priceId) {
    res.status(503).json({ error: 'Stripe payment not configured yet. Check back soon!' });
    return;
  }

  try {
    const stripe = getStripe();
    const db = getPool();

    // Look up existing customer ID if any
    const { rows } = await db.query<{ stripe_customer_id: string | null }>(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
      [user.id]
    );
    let customerId = rows[0]?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/upgrade`,
      subscription_data: {
        metadata: { userId: String(user.id), plan },
      },
      metadata: { userId: String(user.id), plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/stripe/portal — create billing portal session
router.post('/portal', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const stripe = getStripe();
    const db = getPool();
    const { rows } = await db.query<{ stripe_customer_id: string | null }>(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
      [user.id]
    );
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) {
      res.status(400).json({ error: 'No subscription found' });
      return;
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/upgrade`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] portal error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// POST /api/stripe/webhook — handle Stripe webhook events
// Mounted with express.raw() in app.ts BEFORE express.json()
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET not configured');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      req.headers['stripe-signature'] as string,
      webhookSecret
    );
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  const db = getPool();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        if (userId && subscriptionId) {
          await db.query(
            `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan)
             VALUES ($1, $2, $3, 'active', $4)
             ON CONFLICT (user_id) DO UPDATE SET
               stripe_customer_id = EXCLUDED.stripe_customer_id,
               stripe_subscription_id = EXCLUDED.stripe_subscription_id,
               status = 'active',
               plan = EXCLUDED.plan`,
            [userId, customerId, subscriptionId, plan]
          );
          console.log(`[stripe] Subscription activated for user ${userId} (${plan})`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await db.query(
          `UPDATE subscriptions SET
             status = $1,
             stripe_subscription_id = $2,
             current_period_end = to_timestamp($3)
           WHERE stripe_customer_id = $4`,
          [sub.status, sub.id, sub.current_period_end, customerId]
        );
        console.log(`[stripe] Subscription updated for customer ${customerId}: ${sub.status}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await db.query(
          `UPDATE subscriptions SET status = 'canceled' WHERE stripe_customer_id = $1`,
          [customerId]
        );
        console.log(`[stripe] Subscription canceled for customer ${customerId}`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await db.query(
          `UPDATE subscriptions SET status = 'past_due' WHERE stripe_customer_id = $1`,
          [customerId]
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[stripe] webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

export default router;
