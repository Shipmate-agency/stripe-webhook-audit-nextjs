// Verified Next.js App Router Stripe webhook handler
// Guide: https://shipmate.agency/articles/stripe-webhook-signature-error-fix
import Stripe from "stripe";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    // Server misconfiguration, not a bad request: return 5xx so it shows up and Stripe retries.
    return new Response("STRIPE_WEBHOOK_SECRET is not set", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  // Raw unparsed body is mandatory for HMAC verification.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    // Static helper: verifying a signature needs only the webhook secret, not an API key,
    // so `next build` works without STRIPE_SECRET_KEY. Also rejects timestamps older than 5 minutes.
    event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Record event.id in a processed_events table for idempotency before granting access.
      void session;
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
