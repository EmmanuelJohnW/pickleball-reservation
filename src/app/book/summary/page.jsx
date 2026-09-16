"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/use-booking";
import { BookingSteps } from "@/components/booking/booking-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, Calendar, Clock, Landmark, User, Mail, Phone } from "lucide-react";
import { formatCurrency, formatTime, formatTimeRange, formatDate } from "@/lib/utils";

export default function BookSummaryPage() {
  const router = useRouter();
  const { data } = useBooking();

  useEffect(() => {
    if (!data.date || !data.courtId || !data.startTime || !data.fullName) {
      router.push("/book");
    }
  }, [data, router]);

  const slotCount = data.selectedSlots.length;
  const hours = data.duration / 60;
  const courtFee = (data.courtPrice || 0) * hours;
  const additionalFees = 0;
  const total = courtFee + additionalFees;

  return (
    <div>
      <BookingSteps currentStep={5} />
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Reservation Summary
        </h1>
        <p className="text-gray-500">Review your booking details before payment</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Court</p>
                <p className="font-semibold text-gray-900">{data.courtName}</p>
                <p className="text-xs text-gray-400 capitalize">{data.courtType}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">
                  {data.date ? formatDate(data.date) : ""}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-semibold text-gray-900">
                  {data.startTime && data.endTime
                    ? formatTimeRange(data.startTime, data.endTime)
                    : ""}
                </p>
                <p className="text-xs text-gray-400">
                  {slotCount} slot{slotCount !== 1 ? "s" : ""} · {hours} hour{hours !== 1 ? "s" : ""}
                </p>
                {data.selectedSlots.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.selectedSlots.sort().map((slot) => {
                      const [h, m] = slot.split(":").map(Number);
                      const endH = h + 1;
                      const endStr = `${endH.toString().padStart(2, "0")}:${(m || 0).toString().padStart(2, "0")}`;
                      return (
                        <span key={slot} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {formatTimeRange(slot, endStr)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Court Fee ({formatCurrency(data.courtPrice || 0)} × {hours}h)</span>
                <span className="text-gray-900">{formatCurrency(courtFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Additional Fees</span>
                <span className="text-gray-900">{formatCurrency(additionalFees)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-700">{formatCurrency(total)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-gray-900">{data.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-gray-900">{data.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium text-gray-900">{data.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => router.push("/book/details")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={() => router.push("/book/payment")}
            className="bg-green-600 hover:bg-green-700 text-white px-8 font-bold"
          >
            Proceed to Payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
