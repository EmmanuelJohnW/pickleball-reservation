"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getSettings, updateSettings } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2, Upload, QrCode, Mail } from "lucide-react";
import { toast } from "sonner";
import { LoadingPage } from "@/components/shared/loading-spinner";
import { DAYS_OF_WEEK, DEFAULT_EMAIL_SETTINGS } from "@/lib/constants";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facility, setFacility] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gcash_qr: "",
    gotyme_qr: "",
  });
  const [operatingHours, setOperatingHours] = useState({});
  const [booking, setBooking] = useState({
    min_duration: 60,
    max_duration: 180,
    cancellation_hours: 24,
    advance_days: 1826,
    date_range_start: "2026-01-01",
    date_range_end: "2030-12-31",
  });
  const [emailConfig, setEmailConfig] = useState(DEFAULT_EMAIL_SETTINGS);
  const gcashInputRef = useRef(null);
  const gotymeInputRef = useRef(null);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        if (settings.facility) {
          setFacility(settings.facility);
        }
        if (settings.operating_hours) {
          setOperatingHours(settings.operating_hours);
        } else {
          const defaults = {};
          DAYS_OF_WEEK.forEach((day) => {
            defaults[day] = { open: "08:00", close: "22:00" };
          });
          setOperatingHours(defaults);
        }
        if (settings.booking) {
          setBooking(settings.booking);
        }
        if (settings.email_config) {
          setEmailConfig(settings.email_config);
        }
      })
      .catch(() => {
        toast.error("Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveFacility = async () => {
    setSaving(true);
    try {
      await updateSettings("facility", facility);
      toast.success("Facility settings saved");
    } catch {
      toast.error("Failed to save facility settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOperatingHours = async () => {
    setSaving(true);
    try {
      await updateSettings("operating_hours", operatingHours);
      toast.success("Operating hours saved");
    } catch {
      toast.error("Failed to save operating hours");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBooking = async () => {
    setSaving(true);
    try {
      await updateSettings("booking", booking);
      toast.success("Booking settings saved");
    } catch {
      toast.error("Failed to save booking settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      await updateSettings("email_config", emailConfig);
      toast.success("Email settings saved");
    } catch {
      toast.error("Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = (field, file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result;
      setFacility((prev) => ({ ...prev, [field]: base64 }));
      toast.success("QR code uploaded. Click Save to apply.");
    };
    reader.readAsDataURL(file);
  };

  const updateHour = (day, field, value) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day], [field]: value } : { open: "08:00", close: "22:00", [field]: value },
    }));
  };

  const toggleClosed = (day) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: prev[day] === null ? { open: "08:00", close: "22:00" } : null,
    }));
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your facility configuration</p>
        </div>
      </div>

      {/* Facility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facility-name">Facility Name</Label>
              <Input
                id="facility-name"
                value={facility.name}
                onChange={(e) => setFacility({ ...facility, name: e.target.value })}
                placeholder="e.g. Court ni Wardo Arena"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-phone">Phone</Label>
              <Input
                id="facility-phone"
                value={facility.phone}
                onChange={(e) => setFacility({ ...facility, phone: e.target.value })}
                placeholder="+63 912 345 6789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-email">Email</Label>
              <Input
                id="facility-email"
                type="email"
                value={facility.email}
                onChange={(e) => setFacility({ ...facility, email: e.target.value })}
                placeholder="info@picklezone.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-address">Address</Label>
              <Input
                id="facility-address"
                value={facility.address}
                onChange={(e) => setFacility({ ...facility, address: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveFacility} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Payment QR Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Upload QR codes for GCash and GoTyme. These will be shown to customers during payment.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GCash QR */}
            <div className="space-y-3">
              <Label>GCash QR Code</Label>
              <input
                ref={gcashInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleQrUpload("gcash_qr", file);
                  e.target.value = "";
                }}
              />
              {facility.gcash_qr ? (
                <div className="relative w-full aspect-square max-w-[200px] bg-white rounded-lg border p-2">
                  <Image src={facility.gcash_qr} alt="GCash QR" fill className="object-contain" />
                </div>
              ) : (
                <div className="w-full aspect-square max-w-[200px] bg-gray-50 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-400">
                  <QrCode className="h-8 w-8 mb-2" />
                  <p className="text-xs">No QR uploaded</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => gcashInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {facility.gcash_qr ? "Replace" : "Upload"} GCash QR
              </Button>
            </div>

            {/* GoTyme QR */}
            <div className="space-y-3">
              <Label>GoTyme QR Code</Label>
              <input
                ref={gotymeInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleQrUpload("gotyme_qr", file);
                  e.target.value = "";
                }}
              />
              {facility.gotyme_qr ? (
                <div className="relative w-full aspect-square max-w-[200px] bg-white rounded-lg border p-2">
                  <Image src={facility.gotyme_qr} alt="GoTyme QR" fill className="object-contain" />
                </div>
              ) : (
                <div className="w-full aspect-square max-w-[200px] bg-gray-50 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-400">
                  <QrCode className="h-8 w-8 mb-2" />
                  <p className="text-xs">No QR uploaded</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => gotymeInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {facility.gotyme_qr ? "Replace" : "Upload"} GoTyme QR
              </Button>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveFacility} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save QR Codes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Configure Gmail SMTP to send booking confirmation and cancellation emails.
            Use a <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-green-600 underline">Google App Password</a> (not your regular password).
          </p>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="email-enabled"
              checked={emailConfig.enabled}
              onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <Label htmlFor="email-enabled">Enable email notifications</Label>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!emailConfig.enabled ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="space-y-2">
              <Label>Gmail Address</Label>
              <Input
                type="email"
                value={emailConfig.smtp_user}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value, from_email: e.target.value })}
                placeholder="admin@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>App Password</Label>
              <Input
                type="password"
                value={emailConfig.smtp_pass}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtp_pass: e.target.value })}
                placeholder="xxxx xxxx xxxx xxxx"
              />
            </div>
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={emailConfig.from_name}
                onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                placeholder="Court ni Wardo"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={emailConfig.smtp_host}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveEmail} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Email Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const hours = operatingHours[day];
              const isClosed = hours === null;
              return (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-28 text-sm font-medium text-gray-700 capitalize">{day}</span>
                  {isClosed ? (
                    <span className="text-sm text-gray-400 italic">Closed</span>
                  ) : (
                    <>
                      <Input
                        type="time"
                        className="w-32"
                        value={hours?.open || "08:00"}
                        onChange={(e) => updateHour(day, "open", e.target.value)}
                      />
                      <span className="text-gray-400">to</span>
                      <Input
                        type="time"
                        className="w-32"
                        value={hours?.close || "22:00"}
                        onChange={(e) => updateHour(day, "close", e.target.value)}
                      />
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isClosed ? "text-green-600" : "text-gray-400"}
                    onClick={() => toggleClosed(day)}
                  >
                    {isClosed ? "Open" : "Close"}
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveOperatingHours} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-duration">Min Duration (minutes)</Label>
              <Input
                id="min-duration"
                type="number"
                min={15}
                step={15}
                value={booking.min_duration}
                onChange={(e) => setBooking({ ...booking, min_duration: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-duration">Max Duration (minutes)</Label>
              <Input
                id="max-duration"
                type="number"
                min={15}
                step={15}
                value={booking.max_duration}
                onChange={(e) => setBooking({ ...booking, max_duration: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellation-hours">Cancellation Policy (hours)</Label>
              <Input
                id="cancellation-hours"
                type="number"
                min={0}
                value={booking.cancellation_hours}
                onChange={(e) => setBooking({ ...booking, cancellation_hours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance-days">Advance Booking (days)</Label>
              <Input
                id="advance-days"
                type="number"
                min={1}
                value={booking.advance_days}
                onChange={(e) => setBooking({ ...booking, advance_days: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-range-start">Date Range Start</Label>
              <Input
                id="date-range-start"
                type="date"
                value={booking.date_range_start}
                onChange={(e) => setBooking({ ...booking, date_range_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-range-end">Date Range End</Label>
              <Input
                id="date-range-end"
                type="date"
                value={booking.date_range_end}
                onChange={(e) => setBooking({ ...booking, date_range_end: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveBooking} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
