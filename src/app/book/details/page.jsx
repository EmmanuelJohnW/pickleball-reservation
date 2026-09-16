"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBooking } from "@/hooks/use-booking";
import { BookingSteps } from "@/components/booking/booking-steps";
import { customerInfoSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, User, Mail, Phone } from "lucide-react";

export default function BookDetailsPage() {
  const router = useRouter();
  const { data, updateBooking } = useBooking();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
    },
  });

  useEffect(() => {
    if (!data.date || !data.courtId || !data.startTime) {
      router.push("/book");
    }
  }, [data, router]);

  const onSubmit = (formData) => {
    updateBooking({
      fullName: formData.full_name,
      email: formData.email,
      phone: formData.phone,
    });
    router.push("/book/summary");
  };

  return (
    <div>
      <BookingSteps currentStep={4} />
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Your Information
        </h1>
        <p className="text-gray-500">Enter your details to complete the booking</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-5">
        <div>
          <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="full_name"
              placeholder="Juan Dela Cruz"
              className="pl-10"
              {...register("full_name")}
            />
          </div>
          {errors.full_name && (
            <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="juan@email.com"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              placeholder="09123456789"
              className="pl-10"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/book/time")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8">
            Review Booking
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
