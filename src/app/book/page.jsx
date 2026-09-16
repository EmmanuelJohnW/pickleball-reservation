"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarPicker } from "@/components/booking/calendar-picker";
import { BookingSteps } from "@/components/booking/booking-steps";
import { useBooking } from "@/hooks/use-booking";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function BookDatePage() {
  const router = useRouter();
  const { data, updateBooking } = useBooking();
  const [selectedDate, setSelectedDate] = useState(
    data.date ? new Date(data.date + "T00:00:00") : null
  );

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (!selectedDate) return;
    updateBooking({ date: format(selectedDate, "yyyy-MM-dd") });
    router.push("/book/court");
  };

  return (
    <div>
      <BookingSteps currentStep={1} />
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Select a Date
        </h1>
        <p className="text-gray-500">Choose your preferred date for the reservation</p>
      </div>

      <div className="max-w-md mx-auto">
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {selectedDate && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Selected: <span className="font-semibold text-green-700">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={!selectedDate}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
