// Verified Next.js App Router Stripe webhook handler
// Guide: https://shipmate.agency/articles/stripe-webhook-signature-error-fix
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return new Response("Missing Stripe signature or webhook secret", { status: 400 });
  }

  // Raw unparsed body is mandatory for HMAC verification.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
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
