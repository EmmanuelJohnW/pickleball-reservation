"use client";

import { useState, useEffect } from "react";
import {
  getCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  blockCourt,
  getCourtBlocks,
} from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Landmark,
  Cloud,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Eye,
} from "lucide-react";
import {
  formatCurrency,
  getStatusColor,
} from "@/lib/utils";
import { courtSchema, blockCourtSchema } from "@/lib/validations";
import { LoadingPage } from "@/components/shared/loading-spinner";

export default function AdminCourtsPage() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [deletingCourt, setDeletingCourt] = useState(null);
  const [blocksCourt, setBlocksCourt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [blocks, setBlocks] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "indoor",
    price_per_hour: 0,
    image_url: "",
    status: "active",
  });

  const [blockForm, setBlockForm] = useState({
    court_id: "",
    date: "",
    start_time: "",
    end_time: "",
    reason: "",
  });

  const fetchCourts = async () => {
    setLoading(true);
    try {
      const data = await getCourts();
      setCourts(data);
    } catch {
      toast.error("Failed to load courts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const openAddDialog = () => {
    setEditingCourt(null);
    setForm({
      name: "",
      description: "",
      type: "indoor",
      price_per_hour: 0,
      image_url: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (court) => {
    setEditingCourt(court);
    setForm({
      name: court.name,
      description: court.description ?? "",
      type: court.type,
      price_per_hour: court.price_per_hour,
      image_url: court.image_url ?? "",
      status: court.status,
    });
    setDialogOpen(true);
  };

  const openBlockDialog = async (court) => {
    setBlocksCourt(court);
    setBlockForm({
      court_id: court.id,
      date: "",
      start_time: "",
      end_time: "",
      reason: "",
    });
    setBlockDialogOpen(true);
    try {
      const data = await getCourtBlocks(court.id);
      setBlocks(data);
    } catch {
      toast.error("Failed to load court blocks");
      setBlocks([]);
    }
  };

  const handleSubmit = async () => {
    const result = courtSchema.safeParse(form);
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    setSubmitting(true);
    try {
      if (editingCourt) {
        await updateCourt(editingCourt.id, result.data);
        toast.success("Court updated successfully");
      } else {
        await createCourt(result.data);
        toast.success("Court created successfully");
      }
      setDialogOpen(false);
      fetchCourts();
    } catch {
      toast.error(editingCourt ? "Failed to update court" : "Failed to create court");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCourt) return;
    setSubmitting(true);
    try {
      await deleteCourt(deletingCourt.id);
      toast.success("Court deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCourt(null);
      fetchCourts();
    } catch {
      toast.error("Failed to delete court");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (court) => {
    const newStatus = court.status === "maintenance" ? "active" : "maintenance";
    try {
      await updateCourt(court.id, {
        name: court.name,
        description: court.description ?? undefined,
        type: court.type,
        price_per_hour: court.price_per_hour,
        image_url: court.image_url ?? undefined,
        status: newStatus,
      });
      toast.success(`Court ${newStatus === "maintenance" ? "set to maintenance" : "reactivated"}`);
      fetchCourts();
    } catch {
      toast.error("Failed to update court status");
    }
  };

  const handleBlockCourt = async () => {
    const result = blockCourtSchema.safeParse(blockForm);
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    setSubmitting(true);
    try {
      await blockCourt(result.data);
      toast.success("Court time blocked successfully");
      setBlockDialogOpen(false);
      setBlocksCourt(null);
    } catch {
      toast.error("Failed to block court time");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your pickleball courts</p>
        </div>
        <Button onClick={openAddDialog} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Court
        </Button>
      </div>

      {loading ? (
        <LoadingPage />
      ) : courts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No courts found. Add your first court to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <Card key={court.id} className="relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                      {court.type === "indoor" ? (
                        <Landmark className="h-5 w-5" />
                      ) : (
                        <Cloud className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{court.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{court.type}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(court.status)}>
                    {court.status}
                  </Badge>
                </div>

                {court.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {court.description}
                  </p>
                )}

                <p className="text-lg font-bold text-green-700 mb-4">
                  {formatCurrency(court.price_per_hour)}<span className="text-xs font-normal text-gray-500">/hr</span>
                </p>

                <div className="flex items-center gap-1 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(court)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleMaintenance(court)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openBlockDialog(court)}
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setDeletingCourt(court);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCourt ? "Edit Court" : "Add Court"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Court Name</Label>
              <Input
                id="name"
                placeholder="e.g. Court 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per Hour</Label>
              <Input
                id="price"
                type="number"
                min={0}
                placeholder="0"
                value={form.price_per_hour || ""}
                onChange={(e) =>
                  setForm({ ...form, price_per_hour: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Saving..." : editingCourt ? "Update Court" : "Create Court"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Court Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Block Time — {blocksCourt?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="block-date">Date</Label>
              <Input
                id="block-date"
                type="date"
                value={blockForm.date}
                onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-start">Start Time</Label>
                <Input
                  id="block-start"
                  type="time"
                  value={blockForm.start_time}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-end">End Time</Label>
                <Input
                  id="block-end"
                  type="time"
                  value={blockForm.end_time}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, end_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason</Label>
              <Input
                id="block-reason"
                placeholder="e.g. Maintenance, event, etc."
                value={blockForm.reason}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, reason: e.target.value })
                }
              />
            </div>

            {blocks.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Existing Blocks</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="text-xs bg-gray-50 rounded px-3 py-2 flex justify-between"
                    >
                      <span className="text-gray-600">
                        {block.date} {block.start_time}–{block.end_time}
                      </span>
                      <span className="text-gray-500">{block.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setBlockDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBlockCourt}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Blocking..." : "Block Time"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Court</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <span className="font-medium text-gray-900">{deletingCourt?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete Court"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
