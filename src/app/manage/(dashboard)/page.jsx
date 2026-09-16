import { getDashboardStats, getReservations } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatTimeRange } from "@/lib/utils";
import {
  CalendarCheck,
  DollarSign,
  CalendarClock,
  Landmark,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default async function AdminDashboardPage() {
  let stats;
  let todayReservations;

  try {
    stats = await getDashboardStats();
    const today = new Date().toISOString().split("T")[0];
    const result = await getReservations({ date: today, limit: 10 });
    todayReservations = result.data;
  } catch {
    stats = {
      todayReservations: 0,
      todayRevenue: 0,
      upcomingReservations: 0,
      availableCourts: 0,
      totalCourts: 0,
      pendingPayments: 0,
    };
    todayReservations = [];
  }

  const statCards = [
    {
      label: "Today's Reservations",
      value: stats.todayReservations,
      icon: CalendarCheck,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Upcoming Reservations",
      value: stats.upcomingReservations,
      icon: CalendarClock,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Available Courts",
      value: `${stats.availableCourts} / ${stats.totalCourts}`,
      icon: Landmark,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Pending Payments",
      value: stats.pendingPayments,
      icon: AlertCircle,
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back. Here;s what;s happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today;s Schedule</h2>
          {todayReservations.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">
              No reservations scheduled for today
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Court</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.map((res) => {
                    const court = res.court;
                    const customer = res.customer;
                    return (
                      <tr key={res.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-gray-900">
                          {formatTimeRange(res.start_time, res.end_time)}
                        </td>
                        <td className="py-3 text-gray-600">{court?.name || "N/A"}</td>
                        <td className="py-3 text-gray-600">{customer?.full_name || "N/A"}</td>
                        <td className="py-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                            {res.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {formatCurrency(Number(res.total_amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
