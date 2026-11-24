<p align="center">
  <a href="https://shipmate.agency/articles/stripe-webhook-signature-error-fix">
    <img src="./assets/banner.png" alt="Verified Next.js App Router Stripe Webhook Handler by Shipmate" width="840" />
  </a>
</p>

# Verified Next.js App Router Stripe Webhook Handler

[![Fix Guide](https://img.shields.io/badge/Troubleshooting_Guide-shipmate.agency-1E57A8?style=flat-square)](https://shipmate.agency/articles/stripe-webhook-signature-error-fix)
[![Interactive Hack Demo](https://img.shields.io/badge/60s_Exploit_Demo-Try_In_Browser-11141C?style=flat-square)](https://shipmate.agency/tools/hack-demo)
[![License: MIT](https://img.shields.io/badge/License-MIT-11141C?style=flat-square)](./LICENSE)

Minimal, copy-paste Next.js App Router Stripe webhook handler ([`route.ts`](./route.ts)) that safely fixes:
- `No signatures found matching the expected signature for payload`
- `Webhook payload must be provided as a string or a Buffer`

Without disabling `stripe.webhooks.constructEvent` (skipping signature verification lets any attacker upgrade themselves to Pro for `$0` with a single `curl` request).

## Key Security Invariants in `route.ts`
1. **Raw body first:** Calls `await req.text()` before parsing JSON so the exact signed bytes reach `constructEvent`.
2. **Strict rejection:** Returns HTTP `400` immediately when `stripe-signature` or HMAC verification fails.
3. **Trimmed secret:** Guards against trailing newlines in `.env` (`process.env.STRIPE_WEBHOOK_SECRET?.trim()`).
4. **Idempotent fulfillment:** Reminds you to track `event.id` before mutating subscriptions/entitlements.

## Related Resources
- **Full App Router & Pages Router troubleshooting:** https://shipmate.agency/articles/stripe-webhook-signature-error-fix
- **Automated CI scanner for unsigned webhooks (`SR-PAY-001`):** [`Shipmate-agency/shipready`](https://github.com/Shipmate-agency/shipready)
- **Human security review + 1 fix PR ($950):** https://shipmate.agency · [Shipmate Open Source](https://github.com/Shipmate-agency)
