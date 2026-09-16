"use client";

import { useState, useEffect } from "react";
import { getReservations, updateReservationStatus, getCourts } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatTimeRange,
  getStatusColor,
} from "@/lib/utils";
import { toast } from "sonner";
import { LoadingPage } from "@/components/shared/loading-spinner";

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [courts, setCourts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [courtFilter, setCourtFilter] = useState("all");
  const [selectedRes, setSelectedRes] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getReservations({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        date: dateFilter || undefined,
        court_id: courtFilter !== "all" ? courtFilter : undefined,
      });
      setReservations(result.data);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter, dateFilter, courtFilter]);

  useEffect(() => {
    getCourts().then(setCourts).catch(() => {});
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await updateReservationStatus(reservationId, newStatus);
      toast.success(`Reservation ${newStatus}`);
      fetchData();
      setSelectedRes(null);
    } catch {
      toast.error("Failed to update reservation");
    }
  };

  const totalPages = Math.ceil(total / 15);

  const statusActions = {
    pending: [
      { label: "Confirm", action: "confirmed", icon: CheckCircle },
      { label: "Cancel", action: "cancelled", icon: XCircle },
    ],
    confirmed: [
      { label: "Check In", action: "checked_in", icon: UserCheck },
      { label: "Cancel", action: "cancelled", icon: XCircle },
    ],
    checked_in: [
      { label: "Complete", action: "completed", icon: CheckCircle },
    ],
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all court reservations</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reservation #, name, email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="w-full md:w-44"
            />
            <Select value={courtFilter} onValueChange={(v) => { setCourtFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Courts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSearch}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingPage />
          ) : reservations.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No reservations found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="p-4 font-medium">Reservation #</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Court</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Time</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => {
                    const court = res.court;
                    const customer = res.customer;
                    return (
                      <tr key={res.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4 font-mono text-xs font-medium text-green-700">
                          {res.reservation_number}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{customer?.full_name || "N/A"}</p>
                            <p className="text-xs text-gray-500">{customer?.email || ""}</p>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{court?.name || "N/A"}</td>
                        <td className="p-4 text-gray-600">{formatDate(res.reservation_date)}</td>
                        <td className="p-4 text-gray-600 text-xs">
                          {formatTimeRange(res.start_time, res.end_time)}
                        </td>
                        <td className="p-4 font-medium">{formatCurrency(Number(res.total_amount))}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(res.status)}>
                            {res.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedRes(res)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRes} onOpenChange={() => setSelectedRes(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-green-700">
              {selectedRes?.reservation_number}
            </DialogTitle>
          </DialogHeader>
          {selectedRes && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{(selectedRes.customer)?.full_name}</p>
                  <p className="text-xs text-gray-500">{(selectedRes.customer)?.email}</p>
                  <p className="text-xs text-gray-500">{(selectedRes.customer)?.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Court</p>
                  <p className="font-medium">{(selectedRes.court)?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{(selectedRes.court)?.type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date </p>
                  <p className="font-medium">{formatDate(selectedRes.reservation_date)}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeRange(selectedRes.start_time, selectedRes.end_time)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-bold text-green-700 text-lg">
                    {formatCurrency(Number(selectedRes.total_amount))}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2">Status</p>
                <Badge className={getStatusColor(selectedRes.status)}>
                  {selectedRes.status.replace("_", " ")}
                </Badge>
              </div>

              {statusActions[selectedRes.status] && (
                <div className="flex gap-2 pt-2">
                  {statusActions[selectedRes.status].map((act) => (
                    <Button
                      key={act.action}
                      variant={act.action === "cancelled" ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleStatusChange(selectedRes.id, act.action)}
                      className={act.action !== "cancelled" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <act.icon className="h-4 w-4 mr-1" />
                      {act.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
