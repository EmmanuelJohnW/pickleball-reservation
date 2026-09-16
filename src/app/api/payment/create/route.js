import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createSource } from "@/lib/paymongo";

const PAYMONGO_METHODS = { gcash: "gcash", gotyme: "paymaya" };

export async function POST(request) {
  try {
    const { reservation_id, payment_method, amount } = await request.json();

    if (!reservation_id || !payment_method || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paymongoType = PAYMONGO_METHODS[payment_method];
    if (!paymongoType) {
      return NextResponse.json({ error: "Payment method not supported via PayMongo" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Verify reservation exists and is still pending
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, status, amount")
      .eq("reservation_id", reservation_id)
      .eq("status", "pending")
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: "Reservation not found or already processed" }, { status: 404 });
    }

    // Create PayMongo source
    const source = await createSource({
      type: paymongoType,
      amount,
      reservationId: reservation_id,
    });

    // Store source ID in transaction_id for webhook lookup
    await supabase
      .from("payments")
      .update({ transaction_id: source.id })
      .eq("reservation_id", reservation_id)
      .eq("status", "pending");

    const checkoutUrl = source.attributes.redirect.checkout_url;

    return NextResponse.json({ checkout_url: checkoutUrl, source_id: source.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
