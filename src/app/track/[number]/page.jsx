"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getReservationByNumber } from "@/actions/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search } from "lucide-react";
import { formatCurrency, formatDate, formatTimeRange, getStatusColor } from "@/lib/utils";
import { LoadingPage } from "@/components/shared/loading-spinner";
import { toast } from "sonner";

const PAYMONGO_METHODS = new Set(["gcash", "gotyme"]);

export default function TrackByNumberPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <TrackByNumberContent />
    </Suspense>
  );
}

function toSingle(value) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function TrackByNumberContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationNumber = decodeURIComponent(params.number);
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(!!emailFromUrl);
  const [notFound, setNotFound] = useState(false);
  const [resuming, setResuming] = useState(false);

  const lookup = async (emailToUse) => {
    setLoading(true);
    setNotFound(false);
    const result = await getReservationByNumber(reservationNumber, emailToUse);
    if (result) {
      setReservation(result);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (emailFromUrl) {
      lookup(emailFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationNumber, emailFromUrl]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    router.replace(`/track/${encodeURIComponent(reservationNumber)}?email=${encodeURIComponent(email.trim())}`);
    lookup(email.trim());
  };

  const handleResumePayment = async () => {
    const payment = toSingle(reservation?.payment);
    if (!payment) return;

    setResuming(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservation.id,
          payment_method: payment.payment_method,
          amount: Number(payment.amount),
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.checkout_url) {
        throw new Error(result.error || "Failed to resume payment");
      }

      window.location.href = result.checkout_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resume payment");
      setResuming(false);
    }
  };

  if (!emailFromUrl && !reservation) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Confirm Your Email
          </h1>
          <p className="text-gray-500">
            Enter the email used for reservation{" "}
            <span className="font-mono font-semibold text-green-700">{reservationNumber}</span>
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-1.5 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Search className="mr-2 h-4 w-4" />
                View Reservation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) return <LoadingPage />;

  if (notFound || !reservation) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">
          No reservation found for <span className="font-mono font-semibold">{reservationNumber}</span>{" "}
          with that email.
        </p>
        <Link href="/track" className="text-green-600 hover:underline text-sm">
          Try another reservation
        </Link>
      </div>
    );
  }

  const court = toSingle(reservation.court);
  const customer = toSingle(reservation.customer);
  const payment = toSingle(reservation.payment);
  const canResumePayment =
    reservation.status === "pending" &&
    payment &&
    payment.status === "pending" &&
    PAYMONGO_METHODS.has(payment.payment_method);

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Reservation Status</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Reservation Number</p>
            <p className="text-2xl font-bold text-green-700 tracking-wider">
              {reservation.reservation_number}
            </p>
          </div>

          <div className="flex justify-center">
            <Badge className={getStatusColor(reservation.status)}>
              {reservation.status.replace("_", " ")}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-semibold text-gray-900">{customer?.full_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Court</p>
              <p className="font-semibold text-gray-900">{court?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">{formatDate(reservation.reservation_date)}</p>
            </div>
            <div>
              <p className="text-gray-500">Time</p>
              <p className="font-semibold text-gray-900">
                {formatTimeRange(reservation.start_time, reservation.end_time)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Total Amount</span>
            <span className="text-xl font-bold text-green-700">
              {formatCurrency(Number(reservation.total_amount))}
            </span>
          </div>

          {canResumePayment && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-3">
              <p>Your payment wasn&apos;t completed. You can resume it below.</p>
              <Button
                onClick={handleResumePayment}
                disabled={resuming}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {resuming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Link href="/track" className="text-sm text-gray-500 hover:text-green-600">
          Track a different reservation
        </Link>
      </div>
    </div>
  );
}
