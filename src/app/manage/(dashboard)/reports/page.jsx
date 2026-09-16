"use client";

import { useState, useEffect } from "react";
import { getRevenueReport, getReservationReport } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Download, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { formatCurrency, downloadCSV } from "@/lib/utils";
import { toast } from "sonner";


const STATUS_COLORS = {
  confirmed: "#22c55e",
  completed: "#6b7280",
  cancelled: "#ef4444",
  no_show: "#f97316",
  checked_in: "#3b82f6",
  pending: "#eab308",
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444", "#f97316", "#eab308", "#6b7280"];

function getDateRange(preset, customStart, customEnd) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { start: today, end: today };
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { start: start.toISOString().split("T")[0], end: today };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString().split("T")[0], end: today };
    }
    case "custom":
      return { start: customStart || today, end: customEnd || today };
    default:
      return { start: today, end: today };
  }
}

export default function AdminReportsPage() {
  const [revenueData, setRevenueData] = useState([]);
  const [reservationData, setReservationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenuePreset, setRevenuePreset] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(revenuePreset, customStart, customEnd);
      const [revRes, resRes] = await Promise.all([
        getRevenueReport(start, end),
        getReservationReport(start, end),
      ]);
      setRevenueData(revRes || []);
      setReservationData(resRes || []);
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [revenuePreset]);

  useEffect(() => {
    if (revenuePreset === "custom" && customStart && customEnd) {
      fetchData();
    }
  }, [customStart, customEnd]);

  const paidRevenue = revenueData
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const pendingRevenue = revenueData
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const refundedRevenue = revenueData
    .filter((r) => r.status === "refunded")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const statusCounts = reservationData.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const reservationStatusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    status: name,
  }));

  const courtUsage = reservationData.reduce(
    (acc, r) => {
      const name = r.court?.name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    },
    {}
  );

  const courtUsageData = Object.entries(courtUsage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const hourlySlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 6;
    return { hour: `${hour.toString().padStart(2, "0")}:00`, count: 0 };
  });

  reservationData.forEach((r) => {
    const h = new Date(r.reservation_date).getHours();
    const slot = hourlySlots.find((s) => s.hour === `${h.toString().padStart(2, "0")}:00`);
    if (slot) slot.count++;
  });

  const revenueChartByDay = revenueData.reduce(
    (acc, r) => {
      const date = r.created_at.split("T")[0];
      if (!acc[date]) acc[date] = { date, paid: 0, pending: 0, refunded: 0 };
      if (r.status === "paid") acc[date].paid += Number(r.amount);
      else if (r.status === "pending") acc[date].pending += Number(r.amount);
      else if (r.status === "refunded") acc[date].refunded += Number(r.amount);
      return acc;
    },
    {}
  );

  const revenueChart = Object.values(revenueChartByDay).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const handleExportRevenue = () => {
    if (revenueData.length === 0) {
      toast.error("No revenue data to export");
      return;
    }
    const headers = ["Date", "Amount", "Status", "Court"];
    const rows = revenueData.map((r) => [
      r.created_at.split("T")[0],
      Number(r.amount),
      r.status,
      r.reservation?.court?.name || "N/A",
    ]);
    downloadCSV("revenue-report.csv", headers, rows);
    toast.success("Revenue report exported");
  };

  const handleExportReservations = () => {
    if (reservationData.length === 0) {
      toast.error("No reservation data to export");
      return;
    }
    const headers = ["Date", "Status", "Court", "Amount"];
    const rows = reservationData.map((r) => [
      r.reservation_date,
      r.status,
      r.court?.name || "N/A",
      Number(r.total_amount),
    ]);
    downloadCSV("reservation-report.csv", headers, rows);
    toast.success("Reservation report exported");
  };

  const handleExportCourtUsage = () => {
    if (courtUsageData.length === 0) {
      toast.error("No court usage data to export");
      return;
    }
    const headers = ["Court", "Bookings"];
    const rows = courtUsageData.map((c) => [c.name, c.count]);
    downloadCSV("court-usage-report.csv", headers, rows);
    toast.success("Court usage report exported");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports </h1>
          <p className="text-sm text-gray-500 mt-1">
            Revenue insights, reservation summaries, and usage analytics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Revenue Section */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue
            </h2>
            <Button variant="outline" size="sm" onClick={handleExportRevenue}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Tabs value={revenuePreset} onValueChange={setRevenuePreset}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
            <TabsContent value="custom">
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full sm:w-auto"
                />
                <span className="text-sm text-gray-500 flex items-center">to</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Collected</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(paidRevenue)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{formatCurrency(pendingRevenue)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Refunded</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(refundedRevenue)}</p>
            </div>
          </div>

          {revenueChart.length > 0 && (
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const d = new Date(v + "T00:00:00");
                      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) =>
                      new Date(String(label) + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                  <Bar dataKey="paid" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#eab308" name="Pending" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refunded" fill="#ef4444" name="Refunded" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {revenueChart.length === 0 && !loading && (
            <p className="text-center text-gray-400 text-sm py-8">No revenue data for this period</p>
          )}
        </CardContent>
      </Card>

      {/* Reservations Summary */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Reservations Summary
            </h2>
            <Button variant="outline" size="sm" onClick={handleExportReservations}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{reservationData.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">
                {(statusCounts["confirmed"] || 0) + (statusCounts["completed"] || 0)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-700">{statusCounts["cancelled"] || 0}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-orange-600">No-show</p>
              <p className="text-2xl font-bold text-orange-700">{statusCounts["no_show"] || 0}</p>
            </div>
          </div>

          {reservationStatusData.length > 0 && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reservationStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {reservationStatusData.map((entry, i) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {reservationStatusData.length === 0 && !loading && (
            <p className="text-center text-gray-400 text-sm py-8">
              No reservation data for this period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Court Usage  Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Usage */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Court Usage
              </h2>
              <Button variant="outline" size="sm" onClick={handleExportCourtUsage}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>

            {courtUsageData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courtUsageData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Bookings" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">No court data available</p>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-amber-600" />
              Peak Hours
            </h2>

            {hourlySlots.some((s) => s.count > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlySlots}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={1} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#f59e0b" }}
                      name="Bookings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">
                No booking data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
