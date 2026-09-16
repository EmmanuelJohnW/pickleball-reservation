"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { addTime } from "@/lib/utils";
import { sendBookingCancelledEmail } from "@/lib/email";

export async function getActiveCourts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCourt(id) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courts").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function getAvailableTimeSlots(
  courtId,
  date,
  operatingHours
) {
  const supabase = await createClient();

  // Get day of week
  const d = new Date(date + "T00:00:00");
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayOfWeek = dayNames[d.getDay()];

  const hours = operatingHours[dayOfWeek];
  if (!hours) return [];

  const court = await getCourt(courtId);
  if (!court || court.status !== "active") return [];

  // Get existing reservations
  const { data: reservations } = await supabase
    .from("reservations")
    .select("start_time, end_time, status")
    .eq("court_id", courtId)
    .eq("reservation_date", date)
    .not("status", "eq", "cancelled");

  // Get court blocks
  const { data: blocks } = await supabase
    .from("court_blocks")
    .select("start_time, end_time")
    .eq("court_id", courtId)
    .eq("date", date);

  // Generate 1-hour slots
  const slots = [];
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  let currentMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  while (currentMin + 60 <= closeMin) {
    const startH = Math.floor(currentMin / 60).toString().padStart(2, "0");
    const startM = (currentMin % 60).toString().padStart(2, "0");
    const startTime = `${startH}:${startM}`;
    const endTime = addTime(startTime, 60);

    let available = true;
    let reason;

    // Check reservations
    const conflictingReservation = reservations?.find(
      (r) => r.start_time.substring(0, 5) < endTime && r.end_time.substring(0, 5) > startTime
    );
    if (conflictingReservation) {
      available = false;
      reason = "Reserved";
    }

    // Check blocks
    const conflictingBlock = blocks?.find(
      (b) => b.start_time.substring(0, 5) < endTime && b.end_time.substring(0, 5) > startTime
    );
    if (conflictingBlock) {
      available = false;
      reason = "Blocked";
    }

    // Check if date is in the past
    const now = new Date();
    const slotDate = new Date(`${date}T${startTime}:00`);
    if (slotDate <= now) {
      available = false;
      reason = "Past";
    }

    slots.push({ time: startTime, available, reason });
    currentMin += 60;
  }

  return slots;
}

export async function getSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*");
  if (error) return {};

  const settings = {};
  data?.forEach((s) => {
    settings[s.key] = s.value;
  });
  return settings;
}

export async function lookupCustomer(email, phone) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .ilike("email", email)
    .eq("phone", phone)
    .single();
  return data || null;
}

export async function createCustomer(fullName, email, phone) {
  const supabase = await createServiceClient();

  // Check if exists
  const existing = await lookupCustomer(email, phone);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("customers")
    .insert({ full_name: fullName, email, phone })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createReservation(data) {
  const supabase = await createServiceClient();

  // 1. Get court price
  const court = await getCourt(data.court_id);
  if (!court) throw new Error("Court not found");

  // 2. Calculate duration
  const [startH, startM] = data.start_time.split(":").map(Number);
  const [endH, endM] = data.end_time.split(":").map(Number);
  const duration = (endH * 60 + endM) - (startH * 60 + startM);
  const totalAmount = (duration / 60) * Number(court.price_per_hour);

  // 3. Create or find customer
  const customer = await createCustomer(data.full_name, data.email, data.phone);

  // 4. Create reservation (trigger will generate reservation_number)
  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .insert({
      customer_id: customer.id,
      court_id: data.court_id,
      reservation_date: data.reservation_date,
      start_time: data.start_time,
      end_time: data.end_time,
      duration,
      total_amount: totalAmount,
      status: "pending",
      notes: data.notes || null,
    })
    .select()
    .single();

  if (resError) {
    if (resError.message.includes("overlap") || resError.message.includes("blocked")) {
      throw new Error("This time slot is no longer available. Please select a different time.");
    }
    throw new Error(resError.message);
  }

  // 5. Create payment record
  const { data: payment, error: payError } = await supabase
    .from("payments")
    .insert({
      reservation_id: reservation.id,
      amount: totalAmount,
      payment_method: data.payment_method,
      status: "pending",
    })
    .select()
    .single();

  if (payError) throw new Error(payError.message);

  return { reservation, payment };
}

export async function processPayment(
  reservationId,
  paymentMethod
) {
  const supabase = await createServiceClient();

  // Mock payment processing - in production, this would call the real payment provider
  // Simulate success for all methods
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Update payment status
  const { data: payment, error: payError } = await supabase
    .from("payments")
    .update({
      status: "paid",
      transaction_id: transactionId,
      paid_at: new Date().toISOString(),
    })
    .eq("reservation_id", reservationId)
    .eq("status", "pending")
    .select()
    .single();

  if (payError) return { success: false, error: "Payment processing failed" };

  // Update reservation status
  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .update({ status: "confirmed" })
    .eq("id", reservationId)
    .eq("status", "pending")
    .select()
    .single();

  if (resError) return { success: false, error: "Failed to confirm reservation" };

  return { success: true, reservation, payment };
}

export async function getReservationByNumber(
  reservationNumber,
  email
) {
  const supabase = await createClient();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("*, customer:customers(*), court:courts(*), payment:payments(*)")
    .eq("reservation_number", reservationNumber)
    .single();

  if (error || !reservation) return null;

  // Verify email matches customer
  if (
    reservation.customer &&
    (reservation.customer).email.toLowerCase() !== email.toLowerCase()
  ) {
    return null;
  }

  return reservation;
}

export async function cancelReservation(reservationId) {
  const supabase = await createServiceClient();

  // Fetch reservation details before cancelling
  const { data: reservation } = await supabase
    .from("reservations")
    .select("*, customer:customers(*), court:courts(*)")
    .eq("id", reservationId)
    .single();

  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId)
    .in("status", ["pending", "confirmed"]);

  if (error) return false;

  // Send cancellation email
  if (reservation) {
    const customer = reservation.customer || null;
    const court = reservation.court || null;

    if (customer?.email && court) {
      await sendBookingCancelledEmail(
        reservationId,
        customer.email,
        customer.full_name,
        reservation.reservation_number,
        court.name,
        reservation.reservation_date,
        reservation.start_time,
        reservation.end_time
      );
    }
  }

  return true;
}

export async function getReservationById(id) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("*, customer:customers(*), court:courts(*), payment:payments(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function trackReservation(
  reservationNumber
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("reservation_number, status, reservation_date, start_time, end_time, total_amount, court:courts(name, type)")
    .eq("reservation_number", reservationNumber)
    .single();

  if (error || !data) return null;

  const courtRaw = data.court;
  const court = Array.isArray(courtRaw) ? (courtRaw[0] ?? undefined) : (courtRaw ?? null);

  return {
    reservation_number: data.reservation_number,
    status: data.status,
    court_name: court?.name || "N/A",
    court_type: court?.type || "N/A",
    reservation_date: data.reservation_date,
    start_time: data.start_time,
    end_time: data.end_time,
    total_amount: Number(data.total_amount),
  };
}
