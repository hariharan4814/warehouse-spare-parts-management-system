"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { settingsService } from "@/services/settings";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Settings as SettingsIcon,
  Building,
  Upload,
  Globe,
  BellRing,
  AlertOctagon,
  ShieldAlert,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === "ADMIN";

  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings-data"],
    queryFn: () => settingsService.getSettings(),
    enabled: !!isAdmin,
  });

  const [companyName, setCompanyName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [systemTimeZone, setSystemTimeZone] = useState("UTC");
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);

  const [notif, setNotif] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || "");
      setWarehouseAddress(settings.warehouse_address || "");
      setDefaultCurrency(settings.default_currency || "INR");
      setLowStockThreshold(settings.low_stock_threshold || 10);
      setSystemTimeZone(settings.system_time_zone || "UTC");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (formData: FormData) => settingsService.updateSettings(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings-data"] });
      setNotif({ type: "success", msg: "System settings updated successfully!" });
    },
    onError: (err: any) => {
      setNotif({ type: "error", msg: err.response?.data?.detail || "Failed to update settings." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("company_name", companyName);
    fd.append("warehouse_address", warehouseAddress);
    fd.append("default_currency", defaultCurrency);
    fd.append("low_stock_threshold", String(lowStockThreshold));
    fd.append("system_time_zone", systemTimeZone);
    if (companyLogoFile) {
      fd.append("company_logo", companyLogoFile);
    }
    updateSettingsMutation.mutate(fd);
  };

  if (!isAdmin) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <PageContainer title="System Settings" subtitle="Access restriction.">
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl shadow-xs">
              <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
              <h3 className="font-extrabold text-foreground text-lg">403 - Forbidden Access</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                System configuration control is restricted exclusively to Admin roles. Please contact system manager for updates.
              </p>
            </div>
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <PageContainer title="System Settings" subtitle="Loading settings data...">
            <div className="h-96 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <PageContainer
          title="Global System Configuration"
          subtitle="Branding customization, warehouse details, inventory defaults, and operational metadata."
        >
          <Breadcrumb items={[{ label: "System Settings", active: true }]} />

          {notif && (
            <div
              className={`p-4 rounded-xl text-xs font-bold mb-6 border ${
                notif.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              }`}
            >
              {notif.msg}
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-6 shadow-xs max-w-3xl">
            <h3 className="font-extrabold text-foreground text-base border-b border-border pb-3 mb-5 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Branding & Regional Settings
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    Company Name
                  </label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" />
                    Company Logo
                  </label>
                  <Input
                    type="file"
                    onChange={(e) => setCompanyLogoFile(e.target.files?.[0] || null)}
                    accept="image/*"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Default Warehouse Address</label>
                <textarea
                  value={warehouseAddress}
                  onChange={(e) => setWarehouseAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Default Currency</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <BellRing className="h-3.5 w-3.5" />
                    Low Stock Threshold
                  </label>
                  <Input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    System Time Zone
                  </label>
                  <select
                    value={systemTimeZone}
                    onChange={(e) => setSystemTimeZone(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">EST (America/New_York)</option>
                    <option value="Europe/London">GMT (Europe/London)</option>
                    <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <Button type="submit" disabled={updateSettingsMutation.isPending} className="w-full sm:w-auto">
                  Save Settings Configuration
                </Button>
              </div>
            </form>
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
