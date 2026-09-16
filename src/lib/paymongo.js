import crypto from "crypto";

const PAYMONGO_BASE = "https://api.paymongo.com/v1";

/** @returns {string} */
function authHeader() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

/**
 * Creates a GCash or Maya payment source and returns the checkout URL.
 * @param {{ type: "gcash"|"paymaya", amount: number, reservationId: string }} opts
 */
export async function createSource({ type, amount, reservationId }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured");

  const callbackBase = `${appUrl}/book/payment/callback?reservation_id=${reservationId}`;

  const res = await fetch(`${PAYMONGO_BASE}/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // PHP to centavos
          redirect: {
            success: `${callbackBase}&status=success`,
            failed: `${callbackBase}&status=failed`,
          },
          type,
          currency: "PHP",
        },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const detail = json.errors?.[0]?.detail || "Failed to create payment source";
    throw new Error(detail);
  }

  return json.data;
}

/**
 * Retrieves a source by ID from PayMongo.
 * @param {string} sourceId
 */
export async function getSource(sourceId) {
  const res = await fetch(`${PAYMONGO_BASE}/sources/${sourceId}`, {
    headers: { Authorization: authHeader() },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.detail || "Failed to get source");
  }

  return json.data;
}

/**
 * Charges a chargeable source by creating a PayMongo payment.
 * @param {{ sourceId: string, amount: number, description: string }} opts
 */
export async function createPayment({ sourceId, amount, description }) {
  const res = await fetch(`${PAYMONGO_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          source: { id: sourceId, type: "source" },
          currency: "PHP",
          description,
        },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.detail || "Failed to create payment");
  }

  return json.data;
}

/**
 * Verifies a PayMongo webhook signature.
 * Header format: "t=<timestamp>,te=<signature>"
 * @param {string} rawBody
 * @param {string} signatureHeader
 * @param {string} webhookSecret
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signature = parts.find((p) => p.startsWith("te="))?.slice(3);

  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
