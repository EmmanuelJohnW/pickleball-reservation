import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, addMinutes } from "date-fns";
import { CURRENCY } from "./constants";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return `${CURRENCY}${amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM d, yyyy");
}

export function formatDateShort(date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatTime(time) {
  if (!time || !time.includes(":")) return "";
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function generateTimeSlots(openTime, closeTime, durationMinutes = 60) {
  const slots = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);

  let currentMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  while (currentMinutes + durationMinutes <= closeMinutes) {
    const h = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
    const m = (currentMinutes % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    currentMinutes += durationMinutes;
  }

  return slots;
}

export function addTime(time, durationMinutes) {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const newH = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const newM = (totalMinutes % 60).toString().padStart(2, "0");
  return `${newH}:${newM}`;
}

export function generateReservationNumber(date, sequence) {
  const d = typeof date === "string" ? parseISO(date) : date;
  const dateStr = format(d, "yyyyMMdd");
  return `PB-${dateStr}-${sequence.toString().padStart(4, "0")}`;
}

export function getStatusColor(status) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    checked_in: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-purple-100 text-purple-800",
    active: "bg-green-100 text-green-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    disabled: "bg-gray-100 text-gray-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function generateCSV(headers, rows) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    ),
  ].join("\n");
  return csvContent;
}

export function downloadCSV(filename, headers, rows) {
  const csv = generateCSV(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
