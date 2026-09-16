"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  minDate = startOfDay(new Date()),
  maxDate = new Date(2030, 11, 31),
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const monthStart = startOfMonth(new Date(currentYear, currentMonth.getMonth()));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const canGoPrev = !(
    currentMonth.getMonth() === minDate.getMonth() && currentMonth.getFullYear() === minDate.getFullYear()
  );

  const canGoNext = !(
    currentMonth.getMonth() === maxDate.getMonth() && currentMonth.getFullYear() === maxDate.getFullYear()
  );

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const years = [];
  for (let y = minDate.getFullYear(); y <= maxDate.getFullYear(); y++) {
    years.push(y);
  }

  const selectYear = (y) => {
    setCurrentYear(y);
    setCurrentMonth(new Date(y, currentMonth.getMonth()));
  };

  return (
    <div className="bg-white rounded-2xl border p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) =>
              setCurrentMonth(new Date(currentYear, parseInt(e.target.value)))
            }
            className="text-sm font-semibold text-gray-900 bg-transparent border-0 cursor-pointer focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {format(new Date(2026, i), "MMMM")}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => selectYear(parseInt(e.target.value))}
            className="text-sm font-semibold text-gray-900 bg-transparent border-0 cursor-pointer focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, monthStart);
          const isPast = isBefore(d, minDate) && !isSameDay(d, minDate);
          const isFuture = d > maxDate;
          const isDisabled = isPast || isFuture || !inMonth;
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const isToday = isSameDay(d, new Date());

          return (
            <button
              key={i}
              onClick={() => { if (!isDisabled) onDateSelect(d); }}
              disabled={isDisabled}
              className={cn(
                "h-9 sm:h-10 rounded-lg text-sm font-medium transition-all",
                isDisabled && "text-gray-300 cursor-not-allowed",
                !isDisabled && !isSelected && "hover:bg-green-50 text-gray-700 cursor-pointer",
                isSelected && "bg-green-600 text-white shadow-md",
                isToday && !isSelected && "ring-1 ring-green-400 font-bold"
              )}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
