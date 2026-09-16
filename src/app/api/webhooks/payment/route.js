import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookSignature, createPayment } from "@/lib/paymongo";

export async function POST(request) {
  const rawBody = await request.text();

  // Verify PayMongo webhook signature
  const signature = request.headers.get("paymongo-signature");
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (webhookSecret && signature) {
    const valid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = body?.data?.attributes?.type;
  const eventData = body?.data?.attributes?.data;

  const supabase = await createServiceClient();

  try {
    if (eventType === "source.chargeable") {
      // Source is ready to charge — create a payment
      const sourceId = eventData?.id;
      const amount = eventData?.attributes?.amount; // in centavos

      if (!sourceId || !amount) {
        return NextResponse.json({ error: "Missing source data" }, { status: 400 });
      }

      // Find the payment record by source ID
      const { data: payment } = await supabase
        .from("payments")
        .select("id, reservation_id, amount")
        .eq("transaction_id", sourceId)
        .eq("status", "pending")
        .single();

      if (!payment) {
        // Already processed or not found — return 200 to prevent PayMongo retries
        return NextResponse.json({ received: true });
      }

      const { data: reservation } = await supabase
        .from("reservations")
        .select("reservation_number")
        .eq("id", payment.reservation_id)
        .single();

      const pmPayment = await createPayment({
        sourceId,
        amount: amount / 100, // centavos back to PHP
        description: `Court booking ${reservation?.reservation_number || payment.reservation_id}`,
      });

      if (pmPayment.attributes.status === "paid") {
        await supabase
          .from("payments")
          .update({
            status: "paid",
            transaction_id: pmPayment.id,
            paid_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await supabase
          .from("reservations")
          .update({ status: "confirmed" })
          .eq("id", payment.reservation_id);
      }
    } else if (eventType === "payment.paid") {
      // Payment confirmed — ensure reservation is marked confirmed
      const pmPaymentId = eventData?.id;
      const sourceId = eventData?.attributes?.source?.id;

      if (sourceId) {
        const { data: payment } = await supabase
          .from("payments")
          .select("id, reservation_id")
          .or(`transaction_id.eq.${sourceId},transaction_id.eq.${pmPaymentId}`)
          .single();

        if (payment) {
          await supabase
            .from("payments")
            .update({
              status: "paid",
              transaction_id: pmPaymentId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          await supabase
            .from("reservations")
            .update({ status: "confirmed" })
            .eq("id", payment.reservation_id);
        }
      }
    } else if (eventType === "payment.failed") {
      const sourceId = eventData?.attributes?.source?.id;

      if (sourceId) {
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("transaction_id", sourceId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
