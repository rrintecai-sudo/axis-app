import type { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';
import { prisma } from '@axis/db';
import { env } from '../../env.js';
import { NOT_FOUND, VALIDATION_ERROR, INTERNAL_ERROR } from '../../errors.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Price ID for the STARTER plan ($15/month) — set in your Stripe dashboard
const STARTER_PRICE_ID = process.env['STRIPE_STARTER_PRICE_ID'] ?? 'price_starter_monthly';

interface CheckoutBody {
  userId: string;
}

interface PortalBody {
  userId: string;
}

const stripeRoutes: FastifyPluginAsync = async (fastify) => {
  // ------------------------------------------------------------------
  // POST /stripe/webhook — Stripe webhook handler
  // Reads raw body to validate signature
  // ------------------------------------------------------------------
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      done(null, body);
    },
  );

  fastify.post('/stripe/webhook', async (request, reply) => {
    const sig = request.headers['stripe-signature'];

    if (typeof sig !== 'string') {
      return reply.code(400).send({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;
    try {
      const rawBody = request.body as Buffer;
      event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      request.log.warn(`[stripe] Webhook signature verification failed: ${message}`);
      return reply.code(400).send({ error: 'Webhook signature verification failed' });
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: 'ACTIVE' },
          });

          await prisma.subscription.updateMany({
            where: {
              user: { stripeCustomerId: customerId },
            },
            data: {
              stripeSubscriptionId: subscription.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;

          const newStatus =
            subscription.status === 'active' ? 'ACTIVE' :
            subscription.status === 'past_due' ? 'PAST_DUE' :
            subscription.status === 'canceled' ? 'CANCELED' :
            'TRIAL';

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: newStatus },
          });

          await prisma.subscription.updateMany({
            where: {
              user: { stripeCustomerId: customerId },
            },
            data: {
              status: newStatus,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id;

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: 'CANCELED' },
          });

          await prisma.subscription.updateMany({
            where: {
              user: { stripeCustomerId: customerId },
            },
            data: { status: 'CANCELED' },
          });
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId =
            typeof invoice.customer === 'string'
              ? invoice.customer
              : invoice.customer?.id;

          if (customerId) {
            await prisma.user.updateMany({
              where: { stripeCustomerId: customerId },
              data: { subscriptionStatus: 'PAST_DUE' },
            });

            await prisma.subscription.updateMany({
              where: {
                user: { stripeCustomerId: customerId },
              },
              data: { status: 'PAST_DUE' },
            });
          }
          break;
        }

        default:
          request.log.info(`[stripe] Unhandled event type: ${event.type}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      request.log.error(`[stripe] Error processing event ${event.type}: ${message}`);
      return reply.code(500).send({ error: 'Internal error processing webhook' });
    }

    return reply.code(200).send({ received: true });
  });

  // ------------------------------------------------------------------
  // POST /stripe/checkout — Create Stripe Checkout session
  // ------------------------------------------------------------------
  fastify.post<{ Body: CheckoutBody }>('/stripe/checkout', async (request, reply) => {
    const { userId } = request.body;

    if (!userId) {
      throw VALIDATION_ERROR('userId is required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw NOT_FOUND('User');
    }

    // Ensure stripe customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customerParams: Stripe.CustomerCreateParams = {
        email: user.email,
        metadata: { axisUserId: user.id },
      };
      if (user.name) {
        customerParams.name = user.name;
      }
      const customer = await stripe.customers.create(customerParams);
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: STARTER_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${process.env['APP_URL'] ?? 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env['APP_URL'] ?? 'http://localhost:3000'}/cancel`,
        metadata: { axisUserId: user.id },
      });

      return reply.code(200).send({ url: session.url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      request.log.error(`[stripe] Checkout session creation failed: ${message}`);
      throw INTERNAL_ERROR('Failed to create checkout session');
    }
  });

  // ------------------------------------------------------------------
  // POST /stripe/portal — Create Stripe Customer Portal session
  // ------------------------------------------------------------------
  fastify.post<{ Body: PortalBody }>('/stripe/portal', async (request, reply) => {
    const { userId } = request.body;

    if (!userId) {
      throw VALIDATION_ERROR('userId is required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw NOT_FOUND('User');
    }

    if (!user.stripeCustomerId) {
      throw VALIDATION_ERROR('User does not have a Stripe customer account yet');
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env['APP_URL'] ?? 'http://localhost:3000'}/settings`,
      });

      return reply.code(200).send({ url: session.url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      request.log.error(`[stripe] Portal session creation failed: ${message}`);
      throw INTERNAL_ERROR('Failed to create portal session');
    }
  });
};

export default stripeRoutes;
