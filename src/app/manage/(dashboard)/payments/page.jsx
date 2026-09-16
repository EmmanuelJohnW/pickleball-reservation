"use client";

import { useState, useEffect } from "react";
import { getPayments } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CreditCard, ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { LoadingPage } from "@/components/shared/loading-spinner";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const result = await getPayments({
        page,
        limit: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setPayments(result.data);
      setTotal(result.total);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">View all payment transactions</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{total} total payment{total !== 1 ? "s" : ""}</span>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingPage />
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No payments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="p-4 font-medium">Reservation #</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Method</th>
                    <th className="p-4 font-medium">Transaction ID</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const reservation = payment.reservation;
                    const customer = reservation?.customer;
                    return (
                      <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4 font-mono text-xs font-medium text-green-700">
                          {reservation?.reservation_number || "N/A"}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{customer?.full_name || "N/A"}</p>
                            <p className="text-xs text-gray-500">{customer?.email || ""}</p>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{formatCurrency(Number(payment.amount))}</td>
                        <td className="p-4 text-gray-600">
                          {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-500">
                          {payment.transaction_id || "—"}
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-600">{formatDate(payment.created_at)}</td>
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
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
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

      {/* No Refund Policy Notice */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <Ban className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">No Refund Policy</p>
              <p className="text-xs text-gray-500">All payments are final. No refunds will be processed for completed or cancelled reservations.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
