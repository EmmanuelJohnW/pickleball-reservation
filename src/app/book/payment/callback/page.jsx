"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBooking } from "@/hooks/use-booking";
import { getReservationById } from "@/actions/reservations";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 20; // ~50 seconds

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateBooking } = useBooking();

  const reservationId = searchParams.get("reservation_id");
  const redirectStatus = searchParams.get("status");

  const [state, setState] = useState("verifying"); // "verifying" | "paid" | "failed"
  const [message, setMessage] = useState("Verifying your payment...");
  const [trackInfo, setTrackInfo] = useState(null);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!reservationId) return;
    getReservationById(reservationId).then((reservation) => {
      if (reservation) {
        setTrackInfo({
          reservationNumber: reservation.reservation_number,
          email: reservation.customer?.email || "",
        });
      }
    });
  }, [reservationId]);

  useEffect(() => {
    if (!reservationId) {
      router.replace("/book");
      return;
    }

    if (redirectStatus === "failed") {
      setState("failed");
      setMessage("Payment was cancelled or failed. Please try again.");
      return;
    }

    let timeoutId;

    async function poll() {
      try {
        const res = await fetch(`/api/payment/verify?reservation_id=${reservationId}`);
        const data = await res.json();

        if (data.status === "paid") {
          // Restore booking context from DB before redirecting to confirmation
          const reservation = await getReservationById(reservationId);
          if (reservation) {
            const customer = reservation.customer;
            const court = reservation.court;
            updateBooking({
              reservationId: reservation.id,
              reservationNumber: reservation.reservation_number,
              fullName: customer?.full_name || "",
              email: customer?.email || "",
              phone: customer?.phone || "",
              courtName: court?.name || "",
              courtType: court?.type || "",
              courtPrice: Number(court?.price_per_hour || 0),
              date: reservation.reservation_date,
              startTime: reservation.start_time?.substring(0, 5),
              endTime: reservation.end_time?.substring(0, 5),
              duration: reservation.duration,
              paymentMethod: reservation.payment?.[0]?.payment_method || "",
            });
          }

          setState("paid");
          setMessage("Payment confirmed! Redirecting...");
          timeoutId = setTimeout(() => router.replace("/book/confirmation"), 1500);
          return;
        }

        if (data.status === "failed" || data.status === "cancelled") {
          setState("failed");
          setMessage("Payment failed. Please try again.");
          return;
        }

        // Still pending — keep polling
        pollCount.current += 1;
        if (pollCount.current >= MAX_POLLS) {
          setState("failed");
          setMessage(
            "We couldn't confirm your payment automatically. Please check your email or contact support with your reservation reference."
          );
          return;
        }

        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        pollCount.current += 1;
        if (pollCount.current >= MAX_POLLS) {
          setState("failed");
          setMessage("Network error while verifying payment. Please contact support.");
          return;
        }
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => clearTimeout(timeoutId);
  }, [reservationId, redirectStatus, router, updateBooking]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-sm mx-auto px-4">
        {state === "verifying" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <p className="text-gray-400 text-xs mt-3">Please don't close this page.</p>
          </>
        )}

        {state === "paid" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
            <p className="text-gray-500 text-sm">{message}</p>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Issue</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.back()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.replace("/")}>
                Go to Home
              </Button>
            </div>
            {trackInfo && (
              <p className="text-xs text-gray-400 mt-4">
                You can come back to this booking anytime:{" "}
                <Link
                  href={`/track/${encodeURIComponent(trackInfo.reservationNumber)}?email=${encodeURIComponent(trackInfo.email)}`}
                  className="text-green-600 hover:underline"
                >
                  Track Reservation
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
