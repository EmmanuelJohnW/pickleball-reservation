"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/use-booking";
import { BookingSteps } from "@/components/booking/booking-steps";
import { getActiveCourts } from "@/actions/reservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Landmark, Cloud } from "lucide-react";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { LoadingPage } from "@/components/shared/loading-spinner";

export default function BookCourtPage() {
  const router = useRouter();
  const { data, updateBooking } = useBooking();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(data.courtId);

  useEffect(() => {
    if (!data.date) {
      router.push("/book");
      return;
    }
    getActiveCourts()
      .then(setCourts)
      .finally(() => setLoading(false));
  }, [data.date, router]);

  const handleContinue = () => {
    const court = courts.find((c) => c.id === selectedId);
    if (!court) return;
    updateBooking({
      courtId: court.id,
      courtName: court.name,
      courtType: court.type,
      courtPrice: Number(court.price_per_hour),
    });
    router.push("/book/time");
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <BookingSteps currentStep={2} />
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Choose a Court
        </h1>
        <p className="text-gray-500">
          Available courts for{" "}
          <span className="font-semibold text-green-700">{data.date}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courts.map((court) => {
          const isActive = court.status === "active";
          const isSelected = selectedId === court.id;

          return (
            <Card
              key={court.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-2 border-green-600 shadow-md"
                  : isActive
                    ? "hover:shadow-md border-2 border-transparent"
                    : "opacity-60 border-2 border-transparent"
              }`}
              onClick={() => isActive && setSelectedId(court.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      {court.type === "indoor" ? (
                        <Landmark className="h-5 w-5 text-green-700" />
                      ) : (
                        <Cloud className="h-5 w-5 text-green-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{court.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{court.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(Number(court.price_per_hour))}
                    </span>
                    <span className="text-xs text-gray-500 block">/hour</span>
                  </div>
                </div>
                {court.description && (
                  <p className="text-sm text-gray-500 mt-2">{court.description}</p>
                )}
                <div className="mt-3">
                  <Badge className={getStatusColor(court.status)}>
                    {court.status === "active" ? "Available" : court.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/book")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedId}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
