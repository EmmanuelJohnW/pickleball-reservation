"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/use-booking";
import { BookingSteps } from "@/components/booking/booking-steps";
import { getAvailableTimeSlots, getSettings } from "@/actions/reservations";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CircleX } from "lucide-react";
import { formatTime, addTime, cn } from "@/lib/utils";
import { LoadingPage } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";

export default function BookTimePage() {
  const router = useRouter();
  const { data, updateBooking, toggleSlot } = useBooking();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data.date || !data.courtId) {
      router.push("/book");
      return;
    }

    getSettings()
      .then((settings) => {
        const hours = settings.operating_hours;
        return getAvailableTimeSlots(data.courtId, data.date, hours || {});
      })
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [data.date, data.courtId, router]);

  const handleContinue = () => {
    if (data.selectedSlots.length === 0) return;
    router.push("/book/details");
  };

  const selectedCount = data.selectedSlots.length;
  const totalAmount = selectedCount * (data.courtPrice || 0);

  if (loading) return <LoadingPage />;

  return (
    <div>
      <BookingSteps currentStep={3} />
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Select Time Slots
        </h1>
        <p className="text-gray-500">
          <span className="font-semibold text-green-700">{data.courtName}</span>
          {" · "}
          <span className="font-semibold">{data.date}</span>
        </p>
        <p className="text-sm text-gray-400 mt-1">Select one or more consecutive time slots</p>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-12">
          <CircleX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No time slots available for this date</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {slots.map((slot) => {
            const isSelected = data.selectedSlots.includes(slot.time);
            const endTime = addTime(slot.time, 60);

            return (
              <button
                key={slot.time}
                onClick={() => slot.available && toggleSlot(slot.time)}
                disabled={!slot.available}
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all",
                  !slot.available && "bg-gray-50 border-gray-100 cursor-not-allowed opacity-50",
                  slot.available && isSelected
                    ? "border-green-600 bg-green-50 shadow-md"
                    : slot.available
                      ? "border-gray-200 hover:border-green-300 cursor-pointer"
                      : ""
                )}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {formatTime(slot.time)} – {formatTime(endTime)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {slot.available
                    ? isSelected
                      ? "Selected"
                      : "Available"
                    : slot.reason || "Reserved"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {selectedCount} slot{selectedCount !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatTime(data.startTime || "")} – {formatTime(data.endTime || "")} · {data.duration} min
              </p>
            </div>
            <p className="text-lg font-bold text-green-700">
              ₱{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/book/court")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedCount === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          Continue ({selectedCount} slot{selectedCount !== 1 ? "s" : ""})
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
