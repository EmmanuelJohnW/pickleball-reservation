"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function TrackPage() {
  const router = useRouter();
  const [reservationNumber, setReservationNumber] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const number = reservationNumber.trim();
    if (!number || !email.trim()) return;
    router.push(`/track/${encodeURIComponent(number)}?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Track Your Reservation
        </h1>
        <p className="text-gray-500">
          Enter your reservation number and email to check its status
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reservationNumber" className="mb-1.5 block">
                Reservation Number
              </Label>
              <Input
                id="reservationNumber"
                placeholder="PB-20260917-0001"
                value={reservationNumber}
                onChange={(e) => setReservationNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!reservationNumber.trim() || !email.trim()}
            >
              <Search className="mr-2 h-4 w-4" />
              Track Reservation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
