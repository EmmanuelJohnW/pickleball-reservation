"use client";

import { useState, useEffect } from "react";
import { getCustomers } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, Eye, Calendar } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import { LoadingPage } from "@/components/shared/loading-spinner";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  const totalSpending = customers.reduce((sum, c) => sum + c.total_spending, 0);
  const totalReservations = customers.reduce((sum, c) => sum + c.total_reservations, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all customers</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Customers</p>
                <p className="text-lg font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Reservations</p>
                <p className="text-lg font-bold text-gray-900">{totalReservations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <span className="text-lg font-bold">₱</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingPage />
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No customers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Phone</th>
                    <th className="p-4 font-medium text-center">Reservations</th>
                    <th className="p-4 font-medium text-right">Total Spending</th>
                    <th className="p-4 font-medium">Last Reservation</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">{customer.full_name}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{customer.phone || "N/A"}</td>
                      <td className="p-4 text-center font-medium text-gray-900">
                        {customer.total_reservations}
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        {formatCurrency(customer.total_spending)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {customer.last_reservation ? formatDate(customer.last_reservation) : "Never"}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog
        open={!!selectedCustomer}
        onOpenChange={() => setSelectedCustomer(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Reservations</p>
                  <p className="font-medium">{selectedCustomer.total_reservations}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Spending</p>
                  <p className="font-bold text-green-700 text-lg">
                    {formatCurrency(selectedCustomer.total_spending)}
                  </p>
                </div>
              </div>

              {/* Reservation History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Reservation History</h3>
                {selectedCustomer.reservations.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No reservations yet</p>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-left text-gray-500">
                          <th className="p-3 font-medium">Date</th>
                          <th className="p-3 font-medium">Amount</th>
                          <th className="p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.reservations.map((res) => (
                          <tr key={res.id} className="border-b last:border-0">
                            <td className="p-3 text-gray-900">
                              {formatDate(res.reservation_date)}
                            </td>
                            <td className="p-3 font-medium">
                              {formatCurrency(Number(res.total_amount))}
                            </td>
                            <td className="p-3">
                              <Badge className={getStatusColor(res.status)}>
                                {res.status.replace("_", " ")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
