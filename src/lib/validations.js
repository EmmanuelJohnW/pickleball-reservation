import { z } from "zod";

export const customerInfoSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^[\d\s\-+()]+$/, "Please enter a valid phone number"),
});

export const reservationLookupSchema = z.object({
  reservation_number: z.string().min(1, "Reservation number is required"),
  email: z.string().email("Please enter a valid email address"),
});

export const courtSchema = z.object({
  name: z.string().min(1, "Court name is required"),
  description: z.string().optional(),
  type: z.enum(["indoor", "outdoor"]),
  price_per_hour: z.number().min(1, "Price must be greater than 0"),
  image_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "maintenance", "disabled"]),
});

export const blockCourtSchema = z.object({
  court_id: z.string().min(1, "Court is required"),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  reason: z.string().min(1, "Reason is required"),
});

export const facilitySettingsSchema = z.object({
  name: z.string().min(1, "Facility name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const bookingSettingsSchema = z.object({
  min_duration: z.number().min(30, "Minimum duration is 30 minutes"),
  max_duration: z.number().max(480, "Maximum duration is 8 hours"),
  cancellation_hours: z.number().min(0),
  advance_days: z.number().min(1),
  date_range_start: z.string().min(1),
  date_range_end: z.string().min(1),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const manualReservationSchema = z.object({
  court_id: z.string().min(1, "Court is required"),
  reservation_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone is required"),
  payment_method: z.enum(["gcash", "gotyme", "cash", "card"]),
  notes: z.string().optional(),
});

export const emailSettingsSchema = z.object({
  smtp_host: z.string().min(1, "SMTP host is required"),
  smtp_port: z.number().min(1).max(65535),
  smtp_user: z.string().min(1, "Gmail address is required"),
  smtp_pass: z.string().min(1, "App password is required"),
  from_name: z.string().min(1, "Sender name is required"),
  from_email: z.string().email("Valid email is required"),
  enabled: z.boolean(),
});

export const trackReservationSchema = z.object({
  reservation_number: z.string().min(1, "Reservation number is required"),
});

