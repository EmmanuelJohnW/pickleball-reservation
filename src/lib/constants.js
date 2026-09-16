export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "cancelled"];

export const PAYMENT_METHODS = ["gcash", "gotyme", "cash", "card"];

export const COURT_STATUSES = ["active", "maintenance", "disabled"];

export const COURT_TYPES = ["indoor", "outdoor"];

export const RESERVATION_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABELS = {
  gcash: "GCash",
  gotyme: "GoTyme",
  cash: "Cash",
  card: "Card",
};

export const COURT_STATUS_LABELS = {
  active: "Active",
  maintenance: "Maintenance",
  disabled: "Disabled",
};

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DEFAULT_OPERATING_HOURS = {
  monday: { open: "08:00", close: "22:00" },
  tuesday: { open: "08:00", close: "22:00" },
  wednesday: { open: "08:00", close: "22:00" },
  thursday: { open: "08:00", close: "22:00" },
  friday: { open: "08:00", close: "22:00" },
  saturday: { open: "08:00", close: "22:00" },
  sunday: { open: "08:00", close: "22:00" },
};

export const DEFAULT_BOOKING_SETTINGS = {
  min_duration: 60,
  max_duration: 180,
  cancellation_hours: 24,
  advance_days: 1826,
  date_range_start: "2026-01-01",
  date_range_end: "2030-12-31",
};

export const DEFAULT_EMAIL_SETTINGS = {
  smtp_host: "smtp.gmail.com",
  smtp_port: 465,
  smtp_user: "",
  smtp_pass: "",
  from_name: "Court ni Wardo",
  from_email: "",
  enabled: false,
};

export const CURRENCY = "₱";

export const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  active: "bg-green-100 text-green-800 border-green-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  disabled: "bg-gray-100 text-gray-800 border-gray-200",
};
