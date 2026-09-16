"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
import { getReservations, getCourts } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Landmark,
} from "lucide-react";
import {
  formatTimeRange,
  formatDate,
  getStatusColor,
  formatCurrency,
  cn,
} from "@/lib/utils";
import { LoadingPage } from "@/components/shared/loading-spinner";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

const STATUS_BG = {
  available: "bg-green-100 border-green-300 hover:bg-green-200",
  pending: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200",
  confirmed: "bg-blue-100 border-blue-300 hover:bg-blue-200",
  maintenance: "bg-red-100 border-red-300 hover:bg-red-200",
  checked_in: "bg-blue-100 border-blue-300 hover:bg-blue-200",
  completed: "bg-gray-100 border-gray-300 hover:bg-gray-200",
  cancelled: "bg-gray-50 border-gray-200 opacity-50",
  no_show: "bg-orange-100 border-orange-300 hover:bg-orange-200",
};

function shortDay(d) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function getSlotStatus(
  courtId,
  date,
  startHour,
  reservations,
  courtStatus
) {
  if (courtStatus !== "active") {
    return { status: "maintenance", reservation: null };
  }

  const reservation = reservations.find((r) => {
    if (r.court_id !== courtId || r.reservation_date !== date) return false;
    const rStart = parseInt(r.start_time.split(":")[0], 10);
    const rEnd = parseInt(r.end_time.split(":")[0], 10);
    return startHour >= rStart && startHour < rEnd;
  });

  if (reservation) {
    return { status: reservation.status, reservation };
  }

  return { status: "available", reservation: null };
}

function getWeekDates(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export default function AdminCalendarPage() {
  const [view, setView] = useState("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [courts, setCourts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const fetchData = async (date) => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const [courtsData, resData] = await Promise.all([
        getCourts(),
        getReservations({ date: dateStr }),
      ]);
      setCourts(courtsData);
      setReservations(resData.data);
    } catch {
      setCourts([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentDate);
  }, [currentDate]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

  const toISO = (d) => d.toISOString().split("T")[0];

  const navigatePrev = () => {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (view === "day")
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    if (view === "week") {
      const first = weekDates[0];
      const last = weekDates[6];
      if (first.getMonth() === last.getMonth()) {
        return `${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
      }
      return `${first.toLocaleDateString("en-US", { month: "short" })} ${first.getDate()} – ${last.toLocaleDateString("en-US", { month: "short" })} ${last.getDate()}, ${last.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate, view, weekDates]);

  if (loading && courts.length === 0) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage court reservations
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={navigatePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={navigateNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToday}
                className="ml-2"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Today
              </Button>
              <span className="text-sm font-semibold text-gray-900 ml-2 hidden sm:inline">
                {headerLabel}
              </span>
            </div>
            <Tabs
              value={view}
              onValueChange={(v) => setView(v)}
            >
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <span className="text-sm font-semibold text-gray-900 sm:hidden block mb-4">
        {headerLabel}
      </span>

      <div className="flex flex-wrap gap-3 mb-4">
        {[
          {
            label: "Available",
            cls: "bg-green-100 text-green-800 border border-green-300",
          },
          {
            label: "Pending",
            cls: "bg-yellow-100 text-yellow-800 border border-yellow-300",
          },
          {
            label: "Confirmed",
            cls: "bg-blue-100 text-blue-800 border border-blue-300",
          },
          {
            label: "Maintenance",
            cls: "bg-red-100 text-red-800 border border-red-300",
          },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn("w-3 h-3 rounded-sm", l.cls)} />
            <span className="text-xs text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>

      {view === "day" && (
        <DayView
          courts={courts}
          date={toISO(currentDate)}
          reservations={reservations}
          onSelectReservation={setSelectedReservation}
        />
      )}

      {view === "week" && (
        <WeekView
          courts={courts}
          weekDates={weekDates}
          reservations={reservations}
          onSelectReservation={setSelectedReservation}
        />
      )}

      {view === "month" && (
        <MonthView
          monthDays={monthDays}
          reservations={reservations}
          onSelectDate={(d) => {
            setCurrentDate(d);
            setView("day");
          }}
        />
      )}

      <Dialog
        open={!!selectedReservation}
        onOpenChange={() => setSelectedReservation(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-green-700">
              {selectedReservation?.reservation_number}
            </DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Customer
                  </p>
                  <p className="font-medium">
                    {(selectedReservation.customer)?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedReservation.customer)?.email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5" /> Court
                  </p>
                  <p className="font-medium">
                    {(selectedReservation.court)?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {(selectedReservation.court)?.type}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Date 
                  </p>
                  <p className="font-medium">
                    {formatDate(selectedReservation.reservation_date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimeRange(
                      selectedReservation.start_time,
                      selectedReservation.end_time
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Amount
                  </p>
                  <p className="font-bold text-green-700 text-lg">
                    {formatCurrency(Number(selectedReservation.total_amount))}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-2">Status</p>
                <Badge className={getStatusColor(selectedReservation.status)}>
                  {selectedReservation.status.replace("_", " ")}
                </Badge>
              </div>
              {selectedReservation.notes && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Notes</p>
                  <p className="text-sm text-gray-700">
                    {selectedReservation.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayView({ courts,
  date,
  reservations,
  onSelectReservation,
 }) {
  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          No courts configured
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `80px repeat(${courts.length}, 1fr)`,
          }}
        >
          <div />
          {courts.map((court) => (
            <div
              key={court.id}
              className="text-center p-2 font-semibold text-sm text-gray-700 bg-gray-50 rounded-t-lg"
            >
              <Landmark className="h-4 w-4 mx-auto mb-1 text-gray-400" />
              {court.name}
              <p className="text-xs text-gray-400 font-normal capitalize">
                {court.type}
              </p>
            </div>
          ))}

          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div className="flex items-center justify-end pr-2 text-xs text-gray-500 h-14">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {courts.map((court) => {
                const { status, reservation } = getSlotStatus(
                  court.id,
                  date,
                  hour,
                  reservations,
                  court.status
                );
                return (
                  <div
                    key={`${court.id}-${hour}`}
onClick={() =>
  reservation && setSelectedReservation(reservation)
}
                    className={cn(
                      "border rounded-md h-14 flex items-center justify-center text-xs font-medium transition-colors cursor-pointer",
                      STATUS_BG[status] || "bg-gray-50 border-gray-200"
                    )}
                  >
                    {reservation ? (
                      <span className="truncate px-1 text-center leading-tight">
                        {formatTimeRange(
                          reservation.start_time,
                          reservation.end_time
                        )
                          .split("–")[0]
                          .trim()}
                        <br />
                        <span className="text-[10px] font-normal opacity-75">
                          {(reservation.customer)?.full_name?.split(
                            " "
                          )[0] || ""}
                        </span>
                      </span>
                    ) : status === "maintenance" ? (
                      <span className="text-red-500 text-[10px]">
                        Maintenance
                      </span>
                    ) : (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekView({ courts,
  weekDates,
  reservations,
  onSelectReservation,
 }) {
  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          No courts configured
        </CardContent>
      </Card>
    );
  }

  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `80px repeat(${weekDates.length}, 1fr)`,
          }}
        >
          <div />
          {weekDates.map((d, i) => {
            const isToday = d.toISOString().split("T")[0] === todayISO;
            return (
              <div
                key={i}
                className={cn(
                  "text-center p-2 rounded-t-lg text-sm",
                  isToday
                    ? "bg-green-100 font-bold text-green-800"
                    : "bg-gray-50 text-gray-700"
                )}
              >
                <p className="font-semibold">{shortDay(d)}</p>
                <p className="text-xs">{d.getDate()}</p>
              </div>
            );
          })}

          {courts.map((court) => (
            <Fragment key={court.id}>
              <div className="flex items-center justify-end pr-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-l-lg">
                <div className="text-right">
                  <Landmark className="h-4 w-4 inline mr-1 text-gray-400" />
                  <span className="font-medium">{court.name}</span>
                  <p className="text-[10px] capitalize text-gray-400">
                    {court.type}
                  </p>
                </div>
              </div>
              {weekDates.map((d, di) => {
                const dateStr = d.toISOString().split("T")[0];
                const dayRes = reservations.filter(
                  (r) =>
                    r.court_id === court.id &&
                    r.reservation_date === dateStr &&
                    r.status !== "cancelled"
                );
                return (
                  <div
                    key={`${court.id}-${di}`}
                    className={cn(
                      "border rounded-md min-h-[60px] p-1 flex flex-col gap-0.5",
                      dayRes.length === 0
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-gray-200"
                    )}
                  >
                    {dayRes.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-green-400 text-xs">
                        ✓
                      </div>
                    ) : (
                      dayRes.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => onSelectReservation(r)}
                          className={cn(
                            "text-[10px] px-1 py-0.5 rounded cursor-pointer font-medium truncate transition-colors",
                            r.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : r.status === "confirmed"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : r.status === "checked_in"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                          title={`${formatTimeRange(r.start_time, r.end_time)} — ${(r.customer)?.full_name}`}
                        >
                          {formatTimeRange(r.start_time, r.end_time)
                            .split("–")[0]
                            .trim()}
                          <span className="hidden lg:inline">
                            {" "}
                            —{" "}
                            {(r.customer)?.full_name?.split(" ")[0]}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({ monthDays,
  reservations,
  onSelectDate,
 }) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="bg-gray-50 text-center p-2 text-xs font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}

          {monthDays.map((d, i) => {
            if (!d)
              return (
                <div
                  key={`empty-${i}`}
                  className="bg-white p-2 min-h-[80px]"
                />
              );

            const dateStr = d.toISOString().split("T")[0];
            const isToday = dateStr === today;
            const dayRes = reservations.filter(
              (r) => r.reservation_date === dateStr
            );
            const count = dayRes.length;
            const confirmedCount = dayRes.filter(
              (r) => r.status === "confirmed" || r.status === "checked_in"
            ).length;
            const pendingCount = dayRes.filter(
              (r) => r.status === "pending"
            ).length;

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(d)}
                className={cn(
                  "bg-white p-2 min-h-[80px] cursor-pointer hover:bg-gray-50 transition-colors",
                  isToday && "ring-2 ring-green-500 ring-inset"
                )}
              >
                <p
                  className={cn(
                    "text-sm font-medium mb-1",
                    isToday ? "text-green-600" : "text-gray-900"
                  )}
                >
                  {d.getDate()}
                </p>
                {count > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-gray-700">
                      {count} booking{count !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-1">
                      {confirmedCount > 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">
                          {confirmedCount} confirmed
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
