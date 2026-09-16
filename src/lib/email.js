import nodemailer from "nodemailer";
import { createServiceClient } from "@/lib/supabase/server";

async function getEmailConfig() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "email_config")
    .single();

  if (!data?.value) return null;
  const config = data.value;
  if (!config.enabled || !config.smtp_user || !config.smtp_pass) return null;
  return config;
}

async function getFacilityName() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "facility")
    .single();
  const facility = data?.value;
  return facility?.name || "Court ni Wardo";
}

function buildConfirmedEmail(
  facilityName,
  customerName,
  reservationNumber,
  courtName,
  date,
  startTime,
  endTime,
  totalAmount
) {
  const subject = `Booking Confirmed - ${courtName} on ${date}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">✅ Booking Confirmed!</h1>
      </div>
      <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Your booking has been confirmed. Here are your details:</p>
        <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Reservation #:</strong> ${reservationNumber}</p>
          <p style="margin: 5px 0;"><strong>Court:</strong> ${courtName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} – ${endTime}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₱${totalAmount.toFixed(2)}</p>
        </div>
        <p>We look forward to seeing you!</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">— ${facilityName} Team</p>
      </div>
    </div>
  `;
  return { subject, body };
}

function buildCancelledEmail(
  facilityName,
  customerName,
  reservationNumber,
  courtName,
  date,
  startTime,
  endTime
) {
  const subject = `Booking Cancelled - ${courtName} on ${date}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">❌ Booking Cancelled</h1>
      </div>
      <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Your booking has been cancelled. Here are the details:</p>
        <div style="background-color: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Reservation #:</strong> ${reservationNumber}</p>
          <p style="margin: 5px 0;"><strong>Court:</strong> ${courtName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} – ${endTime}</p>
        </div>
        <p>If this was a mistake, please make a new reservation.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">— ${facilityName} Team</p>
      </div>
    </div>
  `;
  return { subject, body };
}

async function sendEmail(to, subject, html) {
  const config = await getEmailConfig();
  if (!config) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_port === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });

    await transporter.sendMail({
      from: `"${config.from_name}" <${config.from_email}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

async function logNotification(
  reservationId,
  type,
  recipient,
  subject,
  status
) {
  const supabase = await createServiceClient();
  await supabase.from("notifications").insert({
    reservation_id: reservationId,
    type,
    recipient,
    subject,
    status,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
}

export async function sendBookingConfirmedEmail(
  reservationId,
  customerEmail,
  customerName,
  reservationNumber,
  courtName,
  date,
  startTime,
  endTime,
  totalAmount
) {
  const facilityName = await getFacilityName();
  const { subject, body } = buildConfirmedEmail(
    facilityName, customerName, reservationNumber, courtName, date, startTime, endTime, totalAmount
  );
  const sent = await sendEmail(customerEmail, subject, body);
  await logNotification(reservationId, "booking_confirmed", customerEmail, subject, sent ? "sent" : "failed");
}

export async function sendBookingCancelledEmail(
  reservationId,
  customerEmail,
  customerName,
  reservationNumber,
  courtName,
  date,
  startTime,
  endTime
) {
  const facilityName = await getFacilityName();
  const { subject, body } = buildCancelledEmail(
    facilityName, customerName, reservationNumber, courtName, date, startTime, endTime
  );
  const sent = await sendEmail(customerEmail, subject, body);
  await logNotification(reservationId, "booking_cancelled", customerEmail, subject, sent ? "sent" : "failed");
}
