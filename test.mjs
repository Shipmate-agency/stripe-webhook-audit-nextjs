// Runs route.ts POST against signed, forged, stale and replayed requests.
// npm install && npm test   (Node 22.18+ runs route.ts directly by stripping types)
import assert from "node:assert/strict";
import Stripe from "stripe";

const secret = "whsec_test_secret";
process.env.STRIPE_WEBHOOK_SECRET = `${secret}\n`; // trailing newline, as pasted into .env
delete process.env.STRIPE_SECRET_KEY; // verification must not need an API key

const { POST } = await import("./route.ts");

// Pretty-printed with non-ASCII, so any re-serialization of the body would break the HMAC.
const payload = JSON.stringify(
  { id: "evt_1", object: "event", type: "checkout.session.completed",
    data: { object: { id: "cs_1", object: "checkout.session", payment_status: "paid", metadata: { note: "café ✓" } } } },
  null, 2,
);
const sign = (o = {}) => Stripe.webhooks.generateTestHeaderString({ payload, secret, ...o });
const call = async (headers, body = payload) =>
  (await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers, body }))).status;

assert.equal(await call({ "stripe-signature": sign() }), 200, "valid signature");
assert.equal(await call({ "stripe-signature": sign({ secret: "whsec_wrong" }) }), 400, "wrong secret");
assert.equal(await call({}), 400, "missing header");
assert.equal(await call({ "stripe-signature": sign({ timestamp: Math.floor(Date.now() / 1000) - 600 }) }), 400, "stale timestamp");
assert.equal(await call({ "stripe-signature": sign() }, JSON.stringify(JSON.parse(payload))), 400, "re-serialized body");
// A replay inside the 5-minute window passes the signature check by design; dedupe is your fulfillment code's job.
const replay = sign();
assert.equal(await call({ "stripe-signature": replay }), 200, "replay #1");
assert.equal(await call({ "stripe-signature": replay }), 200, "replay #2");

delete process.env.STRIPE_WEBHOOK_SECRET;
assert.equal(await call({ "stripe-signature": sign() }), 500, "secret not configured");

console.log("ok");
