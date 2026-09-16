"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/use-booking";
import { BookingSteps } from "@/components/booking/booking-steps";
import { createReservation, getSettings } from "@/actions/reservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, CreditCard, Smartphone, Banknote } from "lucide-react";
import { formatCurrency, formatTimeRange } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const paymentMethods = [
  {
    id: "gcash",
    name: "GCash",
    icon: <Smartphone className="h-6 w-6" />,
    color: "text-blue-600",
    description: "Pay via GCash e-wallet",
  },
  {
    id: "gotyme",
    name: "GoTyme",
    icon: <CreditCard className="h-6 w-6" />,
    color: "text-purple-600",
    description: "Pay via GoTyme (Maya)",
  },
  {
    id: "cash",
    name: "Cash",
    icon: <Banknote className="h-6 w-6" />,
    color: "text-green-600",
    description: "Pay at the front desk",
  },
];

const PAYMONGO_METHODS = new Set(["gcash", "gotyme"]);

export default function BookPaymentPage() {
  const router = useRouter();
  const { data, updateBooking } = useBooking();
  const [selectedMethod, setSelectedMethod] = useState(data.paymentMethod || "");
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    if (!data.date || !data.courtId || !data.startTime || !data.fullName) {
      router.push("/book");
    }
  }, [data, router]);

  const hours = data.duration / 60;
  const total = (data.courtPrice || 0) * hours;

  const handlePayment = async () => {
    if (!selectedMethod || !data.courtId || !data.date || !data.startTime || !data.endTime) return;

    setProcessing(true);
    try {
      // Step 1: Create reservation + pending payment record
      const { reservation, payment } = await createReservation({
        court_id: data.courtId,
        reservation_date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        payment_method: selectedMethod,
      });

      updateBooking({
        reservationId: reservation.id,
        reservationNumber: reservation.reservation_number,
        paymentMethod: selectedMethod,
      });

      if (PAYMONGO_METHODS.has(selectedMethod)) {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservation_id: reservation.id,
            payment_method: selectedMethod,
            amount: total,
          }),
        });

        const result = await res.json();

        if (!res.ok || !result.checkout_url) {
          throw new Error(result.error || "Failed to initialize payment");
        }

        // Redirect to PayMongo checkout
        window.location.href = result.checkout_url;
      } else {
        // Cash: reservation is pending, admin confirms on arrival
        router.push("/book/confirmation");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
      setProcessing(false);
    }
  };

  return (
    <div>
      <BookingSteps currentStep={6} />
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Payment</h1>
        <p className="text-gray-500">Select your payment method</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-green-50 rounded-xl p-4 text-center mb-6">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatTimeRange(data.startTime || "", data.endTime || "")} · {data.duration} min
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedMethod === method.id
                  ? "border-2 border-green-600 shadow-md"
                  : "hover:shadow-md border-2 border-transparent"
              )}
              onClick={() => setSelectedMethod(method.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={method.color}>{method.icon}</div>
                <div>
                  <span className="font-semibold text-gray-900">{method.name}</span>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedMethod === "gcash" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
            <p className="font-medium">GCash via PayMongo</p>
            <p className="mt-1">
              You will be redirected to PayMongo's secure checkout to complete your GCash payment of{" "}
              <strong>{formatCurrency(total)}</strong>. Your reservation is confirmed automatically
              once payment is verified.
            </p>
          </div>
        )}

        {selectedMethod === "gotyme" && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 text-sm text-purple-800">
            <p className="font-medium">GoTyme (Maya) via PayMongo</p>
            <p className="mt-1">
              You will be redirected to PayMongo's secure checkout to pay{" "}
              <strong>{formatCurrency(total)}</strong> via GoTyme/Maya. Your reservation is confirmed
              automatically once payment is verified.
            </p>
          </div>
        )}

        {selectedMethod === "cash" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
            <p className="font-medium">Cash Payment</p>
            <p className="mt-1">
              Please pay <strong>{formatCurrency(total)}</strong> at the front desk when you arrive.
              Your reservation will be confirmed upon payment.
            </p>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              I agree that all payments are <strong>final and non-refundable</strong>. I understand
              that cash payments require admin confirmation upon arrival.
            </span>
          </label>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTermsOpen(true);
                }}
                className="font-medium text-green-600 underline underline-offset-2"
              >
                Terms &amp; Conditions
              </button>
              .
            </span>
          </label>
        </div>

        <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
          <DialogContent className="max-w-lg sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Terms &amp; Conditions</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-gray-600 text-left max-h-[55vh] overflow-y-auto">
              <p>
                1. GCash and GoTyme payments are processed securely via PayMongo. Your reservation
                is confirmed automatically once payment is verified.
              </p>
              <p>
                2. Cash payments are confirmed upon payment at the front desk. Your reservation
                will show as pending until then.
              </p>
              <p>
                3. All bookings are final and non-refundable. No cancellations or rescheduling are
                allowed, and no-shows are not refunded.
              </p>
              <p>
                4. Your name, contact details, and booking history are used solely to manage your
                reservations and send booking notifications.
              </p>
              <p>
                5. Requests to cancel or reschedule due to weather conditions, including rain on
                outdoor courts, are not accepted. If the facility itself suspends bookings due to
                maintenance, you may be offered a refund or rebooking at the facility's discretion.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/book/summary")} disabled={processing}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || processing || !agreed || !termsAccepted}
            className="bg-green-600 hover:bg-green-700 text-white px-8 font-bold"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {PAYMONGO_METHODS.has(selectedMethod) ? "Redirecting..." : "Processing..."}
              </>
            ) : (
              `Pay ${formatCurrency(total)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
