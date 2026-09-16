"use client";

import { createContext, useContext, useState, useCallback } from "react";

const defaultData = {
  date: null,
  courtId: null,
  courtName: null,
  courtType: null,
  courtPrice: null,
  selectedSlots: [],
  startTime: null,
  endTime: null,
  duration: 0,
  fullName: "",
  email: "",
  phone: "",
  paymentMethod: "",
  reservationId: null,
  reservationNumber: null,
};

const BookingContext = createContext({
  data: defaultData,
  updateBooking: () => {},
  toggleSlot: () => {},
  resetBooking: () => {},
});

function computeStartEnd(slots) {
  if (slots.length === 0) return { start: "", end: "", duration: 0 };
  const sorted = [...slots].sort();
  const start = sorted[0];
  const lastSlot = sorted[sorted.length - 1];
  const [h, m] = lastSlot.split(":").map(Number);
  const endMinutes = h * 60 + m + 60;
  const endH = Math.floor(endMinutes / 60).toString().padStart(2, "0");
  const endM = (endMinutes % 60).toString().padStart(2, "0");
  const end = `${endH}:${endM}`;
  const duration = sorted.length * 60;
  return { start, end, duration };
}

export function BookingProvider({ children }) {
  const [data, setData] = useState(defaultData);

  const updateBooking = useCallback((partial) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleSlot = useCallback((time) => {
    setData((prev) => {
      const exists = prev.selectedSlots.includes(time);
      const newSlots = exists
        ? prev.selectedSlots.filter((s) => s !== time)
        : [...prev.selectedSlots, time].sort();
      const { start, end, duration } = computeStartEnd(newSlots);
      return {
        ...prev,
        selectedSlots: newSlots,
        startTime: start,
        endTime: end,
        duration,
      };
    });
  }, []);

  const resetBooking = useCallback(() => {
    setData(defaultData);
  }, []);

  return (
    <BookingContext.Provider value={{ data, updateBooking, toggleSlot, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
