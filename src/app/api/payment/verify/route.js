import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSource, createPayment } from "@/lib/paymongo";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get("reservation_id");

    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservation_id" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: payment, error } = await supabase
      .from("payments")
      .select("id, status, transaction_id, amount, reservation_id")
      .eq("reservation_id", reservationId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already confirmed
    if (payment.status === "paid") {
      return NextResponse.json({ status: "paid" });
    }

    if (payment.status === "failed" || payment.status === "cancelled") {
      return NextResponse.json({ status: payment.status });
    }

    // Still pending — check PayMongo source status if we have a source ID
    if (payment.transaction_id?.startsWith("src_")) {
      const source = await getSource(payment.transaction_id);
      const sourceStatus = source.attributes.status;

      if (sourceStatus === "chargeable") {
        // Source is ready — charge it
        const { data: reservation } = await supabase
          .from("reservations")
          .select("reservation_number")
          .eq("id", reservationId)
          .single();

        const pmPayment = await createPayment({
          sourceId: payment.transaction_id,
          amount: payment.amount,
          description: `Court booking ${reservation?.reservation_number || reservationId}`,
        });

        const pmStatus = pmPayment.attributes.status;

        if (pmStatus === "paid") {
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
            .eq("id", reservationId);

          return NextResponse.json({ status: "paid" });
        }
      }

      if (sourceStatus === "cancelled" || sourceStatus === "expired") {
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id);

        return NextResponse.json({ status: "failed" });
      }
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
