"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Date", step: 1 },
  { label: "Court", step: 2 },
  { label: "Time", step: 3 },
  { label: "Details", step: 4 },
  { label: "Review", step: 5 },
  { label: "Payment", step: 6 },
];

export function BookingSteps({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                currentStep > s.step
                  ? "bg-green-600 text-white"
                  : currentStep === s.step
                    ? "bg-green-600 text-white ring-2 ring-green-200"
                    : "bg-gray-200 text-gray-500"
              )}
            >
              {currentStep > s.step ? <Check className="h-4 w-4" /> : s.step}
            </div>
            <span
              className={cn(
                "text-[10px] sm:text-xs mt-1 font-medium",
                currentStep >= s.step ? "text-green-700" : "text-gray-400"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-6 sm:w-10 h-0.5 mx-1 mb-4",
                currentStep > s.step ? "bg-green-600" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
