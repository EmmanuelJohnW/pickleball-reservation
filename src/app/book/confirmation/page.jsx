"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/use-booking";
import { BookingSteps } from "@/components/booking/booking-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Printer, Home, CalendarDays, Search } from "lucide-react";
import { formatCurrency, formatDate, formatTimeRange } from "@/lib/utils";

export default function BookConfirmationPage() {
  const router = useRouter();
  const { data, resetBooking } = useBooking();

  useEffect(() => {
    if (!data.reservationNumber) {
      router.push("/book");
    }
  }, [data.reservationNumber, router]);

  const handlePrint = () => {
    window.print();
  };

  const handleNewBooking = () => {
    resetBooking();
    router.push("/book");
  };

  if (!data.reservationNumber) return null;

  const hours = (data.duration || 60) / 60;
  const total = (data.courtPrice || 0) * hours;

  return (
    <div className="print:py-0">
      <div className="print:hidden">
        <BookingSteps currentStep={7} />
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Reservation Confirmed
        </h1>
        <p className="text-gray-500">Your court has been successfully booked</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-6 space-y-4">
            <div className="text-center bg-green-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Reservation Number</p>
              <p className="text-2xl font-bold text-green-700 tracking-wider">
                {data.reservationNumber}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900">{data.fullName}</p>
              </div>
              <div>
                <p className="text-gray-500">Court</p>
                <p className="font-semibold text-gray-900">{data.courtName}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">
                  {data.date ? formatDate(data.date) : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-semibold text-gray-900">
                  {data.startTime && data.endTime
                    ? formatTimeRange(data.startTime, data.endTime)
                    : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{data.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{data.phone}</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Paid</span>
              <span className="text-xl font-bold text-green-700">{formatCurrency(total)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Payment Status</span>
              {data.paymentMethod === "cash" ? (
                <span className="text-sm font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  Pending — Pay at Front Desk
                </span>
              ) : (
                <span className="text-sm font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  Payment Confirmed
                </span>
              )}
            </div>

            {data.paymentMethod === "cash" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <p>
                  Please pay <strong>{formatCurrency(total)}</strong> at the front desk when you
                  arrive. Your reservation will be confirmed upon payment.
                </p>
              </div>
            )}

            {data.paymentMethod !== "cash" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                <p>
                  Your payment has been confirmed and your court is booked. See you on the court!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print Reservation
          </Button>
          <Button
            onClick={handleNewBooking}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Book Another Court
          </Button>
        </div>

        <div className="mt-4 text-center print:hidden">
          <Link href="/" className="text-sm text-gray-500 hover:text-green-600">
            <Home className="inline h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <span className="text-gray-300 mx-2">·</span>
          <span className="text-sm text-gray-500">
            Use the search bar in the header to track your reservation
          </span>
        </div>
      </div>
    </div>
  );
}
