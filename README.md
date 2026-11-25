<p align="center">
  <a href="https://shipmate.agency/articles/stripe-webhook-signature-error-fix">
    <img src="./assets/banner.png" alt="Next.js App Router Stripe Webhook Handler by Shipmate" width="840" />
  </a>
</p>

# Next.js App Router Stripe Webhook Handler (Signature-Verified, Tested)

[![Fix Guide](https://img.shields.io/badge/Troubleshooting_Guide-shipmate.agency-1E57A8?style=flat-square)](https://shipmate.agency/articles/stripe-webhook-signature-error-fix)
[![Interactive Hack Demo](https://img.shields.io/badge/60s_Exploit_Demo-Try_In_Browser-11141C?style=flat-square)](https://shipmate.agency/tools/hack-demo)
[![License: MIT](https://img.shields.io/badge/License-MIT-11141C?style=flat-square)](./LICENSE)

Minimal, copy-paste Next.js App Router Stripe webhook handler ([`route.ts`](./route.ts)) that safely fixes:
- `No signatures found matching the expected signature for payload`
- `Webhook payload must be provided as a string or a Buffer`

Without disabling `stripe.webhooks.constructEvent` (skipping signature verification lets any attacker upgrade themselves to Pro for `$0` with a single `curl` request).

## Usage
1. `npm install stripe` (tested with `stripe@23` on Next.js 16; signature check needs no API key).
2. Copy [`route.ts`](./route.ts) to `app/api/webhooks/stripe/route.ts` (or `src/app/...`). No `bodyParser` config is needed in the App Router; the default Node.js runtime is fine.
3. Set `STRIPE_WEBHOOK_SECRET` to the `whsec_...` signing secret of **this** endpoint:
   - Local: run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and use the secret it prints (it differs from the Dashboard one).
   - Deployed: the endpoint's secret from Dashboard → Webhooks. Test mode and live mode endpoints have different secrets; using the wrong one is the most common cause of `No signatures found`.
4. Make sure middleware/proxy, auth redirects or a `www` redirect don't intercept this path: Stripe treats `3xx` as a failed delivery.

## Key Security Invariants in `route.ts`
1. **Raw body first:** Calls `await req.text()` before parsing JSON so the exact signed bytes reach `constructEvent`.
2. **Strict rejection:** Returns HTTP `400` when the `stripe-signature` header is missing, the HMAC doesn't match, or the timestamp is older than 5 minutes (Stripe's default tolerance). Returns `500` if `STRIPE_WEBHOOK_SECRET` is unset.
3. **Trimmed secret:** Guards against trailing newlines in `.env` (`process.env.STRIPE_WEBHOOK_SECRET?.trim()`).
4. **Paid sessions only:** Fulfills `checkout.session.completed` / `checkout.session.async_payment_succeeded` only when `payment_status !== "unpaid"` (delayed methods like ACH succeed later).
5. **Idempotency is yours to add:** A valid event can be delivered more than once, and a replay inside the 5-minute window passes the signature check. The comment in `route.ts` marks where to dedupe on `session.id` in the same transaction that grants access.

Also from [Stripe's webhook best practices](https://docs.stripe.com/webhooks#best-practices): return `2xx` quickly and move slow work to a queue, take amounts and line items from Stripe rather than the client, and never log the secret or full event payloads.

## Tests
`npm install && npm test` runs `route.ts` against a valid signature, wrong secret, missing header, stale timestamp, re-serialized body, a replay, and an unset secret. `npm run typecheck` checks it against the current `stripe` types.

## Related Resources
- **Full App Router & Pages Router troubleshooting:** https://shipmate.agency/articles/stripe-webhook-signature-error-fix
- **Automated CI scanner for unsigned webhooks (`SR-PAY-001`):** [`Shipmate-agency/shipready`](https://github.com/Shipmate-agency/shipready)
- **Human security review + 1 fix PR ($950):** https://shipmate.agency · [Shipmate Open Source](https://github.com/Shipmate-agency)
