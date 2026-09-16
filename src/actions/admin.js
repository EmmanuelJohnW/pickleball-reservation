"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendBookingConfirmedEmail, sendBookingCancelledEmail } from "@/lib/email";

export async function getDashboardStats() {
  const supabase = await createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const [reservationsRes, courtsRes, paymentsRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, reservation_date, total_amount, status")
      .gte("reservation_date", today),
    supabase.from("courts").select("id, status"),
    supabase.from("payments").select("id, status, amount").eq("status", "pending"),
  ]);

  const allReservations = reservationsRes.data || [];
  const todayReservations = allReservations.filter((r) => r.reservation_date === today);
  const todayRevenue = todayReservations
    .filter((r) => r.status === "confirmed" || r.status === "completed" || r.status === "checked_in")
    .reduce((sum, r) => sum + Number(r.total_amount), 0);
  const upcomingReservations = allReservations.filter(
    (r) => r.reservation_date > today && r.status !== "cancelled"
  );
  const courts = courtsRes.data || [];
  const activeCourts = courts.filter((c) => c.status === "active").length;

  return {
    todayReservations: todayReservations.length,
    todayRevenue,
    upcomingReservations: upcomingReservations.length,
    availableCourts: activeCourts,
    totalCourts: courts.length,
    pendingPayments: (paymentsRes.data || []).length,
  };
}

export async function getReservations(filters = {}) {
  const supabase = await createServiceClient();
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("reservations")
    .select("*, customer:customers(*), court:courts(*), payment:payments(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.date) query = query.eq("reservation_date", filters.date);
  if (filters?.court_id) query = query.eq("court_id", filters.court_id);
  if (filters?.status) query = query.eq("status", filters.status);

  if (filters?.search) {
    query = query.or(`reservation_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  let filtered = data || [];
  if (filters?.payment_status) {
    filtered = filtered.filter((r) => {
      const payments = Array.isArray(r.payment) ? r.payment : [];
      return payments?.some((p) => p.status === filters.payment_status);
    });
  }

  return { data: filtered, total: count || 0, page, limit };
}

export async function updateReservationStatus(
  reservationId,
  status
) {
  const supabase = await createServiceClient();

  // Fetch reservation details before updating
  const { data: reservation } = await supabase
    .from("reservations")
    .select("*, customer:customers(*), court:courts(*)")
    .eq("id", reservationId)
    .single();

  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId);
  if (error) throw new Error(error.message);

  // Sync payment status with reservation status
  if (status === "confirmed") {
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await supabase
      .from("payments")
      .update({
        status: "paid",
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
      })
      .eq("reservation_id", reservationId)
      .eq("status", "pending");
  } else if (status === "cancelled") {
    await supabase
      .from("payments")
      .update({ status: "cancelled" })
      .eq("reservation_id", reservationId)
      .in("status", ["pending", "paid"]);
  }

  // Send email on confirm or cancel
  if (reservation && (status === "confirmed" || status === "cancelled")) {
    const customer = reservation.customer || null;
    const court = reservation.court || null;

    if (customer?.email && court) {
      if (status === "confirmed") {
        await sendBookingConfirmedEmail(
          reservationId,
          customer.email,
          customer.full_name,
          reservation.reservation_number,
          court.name,
          reservation.reservation_date,
          reservation.start_time,
          reservation.end_time,
          Number(reservation.total_amount)
        );
      } else {
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
  }

  revalidatePath("/manage/reservations");
  revalidatePath("/manage/payments");
  revalidatePath("/manage/reports");
}

export async function getCourts() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCourt(court) {
  const supabase = await createServiceClient();
  const { data: existing } = await supabase.from("courts").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 1;

  const { data, error } = await supabase
    .from("courts")
    .insert({ ...court, sort_order: nextOrder })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/manage/courts");
  return data;
}

export async function updateCourt(id, court) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("courts").update(court).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/courts");
}

export async function deleteCourt(id) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("courts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/courts");
}

export async function blockCourt(data) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("court_blocks").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/calendar");
}

export async function getCourtBlocks(courtId, date) {
  const supabase = await createServiceClient();
  let query = supabase.from("court_blocks").select("*, court:courts(name)");
  if (courtId) query = query.eq("court_id", courtId);
  if (date) query = query.eq("date", date);
  const { data, error } = await query.order("date", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteCourtBlock(id) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("court_blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/calendar");
}

export async function getCustomers() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const customersWithStats = await Promise.all(
    (data || []).map(async (customer) => {
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, total_amount, status, reservation_date, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      const resList = reservations || [];
      const completedRes = resList.filter(
        (r) => r.status === "confirmed" || r.status === "completed" || r.status === "checked_in"
      );

      return {
        ...customer,
        total_reservations: resList.length,
        total_spending: completedRes.reduce((sum, r) => sum + Number(r.total_amount), 0),
        last_reservation: resList.length > 0 ? resList[0].reservation_date : null,
        reservations: resList,
      };
    })
  );

  return customersWithStats;
}

export async function getPayments(filters = {}) {
  const supabase = await createServiceClient();
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("payments")
    .select("*, reservation:reservations(reservation_number, customer:customers(full_name, email))", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { data: data || [], total: count || 0, page, limit };
}

export async function updatePaymentRefund(
  paymentId,
  refundAmount,
  reason
) {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("payments")
    .update({
      status: "refunded",
      refund_amount: refundAmount,
      refund_reason: reason,
    })
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/payments");
}

export async function getRevenueReport(startDate, endDate) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("amount, status, created_at, reservation:reservations(reservation_date, court:courts(name))")
    .gte("created_at", startDate)
    .lte("created_at", endDate + "T23:59:59")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getReservationReport(startDate, endDate) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, status, reservation_date, total_amount, court:courts(name)")
    .gte("reservation_date", startDate)
    .lte("reservation_date", endDate)
    .order("reservation_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getSettings() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("settings").select("*");
  if (error) return {};

  const settings = {};
  data?.forEach((s) => {
    settings[s.key] = s.value;
  });
  return settings;
}

export async function updateSettings(key, value) {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  revalidatePath("/manage/settings");
}
