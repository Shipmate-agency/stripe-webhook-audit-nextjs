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
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Delayed methods (ACH, bank transfer) complete as "unpaid" and succeed later via
      // checkout.session.async_payment_succeeded. Only fulfill once paid.
      if (session.payment_status !== "unpaid") {
        // Stripe can deliver the same event more than once, even concurrently. Make fulfillment
        // idempotent: e.g. INSERT session.id into a table with a UNIQUE constraint in the same DB
        // transaction that grants access, and skip if it already exists. Fetch amounts and line
        // items from Stripe by session.id, never from client-supplied data.
      }
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
