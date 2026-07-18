"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { inventoryService } from "@/services/inventory";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  AlertTriangle,
  History,
  TrendingUp,
  PackageCheck,
  Eye,
  Settings2,
} from "lucide-react";

export default function InventoryDashboard() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: () => inventoryService.getDashboard(),
  });

  const isTechnician = user?.role === "TECHNICIAN";
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const canAdjust = isAdmin || isManager;

  // Format currency
  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num || 0);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format movement type label
  const formatType = (type: string) => {
    return type.replace("STOCK_", "").replace("_", " ");
  };

  // Chart data format
  const getChartData = () => {
    if (!data?.movement_summary) return [];
    return Object.entries(data.movement_summary).map(([key, val]) => ({
      name: formatType(key),
      value: val,
    }));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Inventory Management"
          subtitle="Monitor stock levels, log movements, and manage corrections."
        >
          <Breadcrumb items={[{ label: "Inventory", href: "/inventory", active: true }]} />

          {/* Top Quick Navigation Actions */}
          <div className="flex flex-wrap gap-3 items-center justify-between pb-2">
            <div className="flex gap-2">
              <Link href="/inventory/movements">
                <Button variant="outline" size="sm" className="h-9 gap-1.5 cursor-pointer border-border">
                  <History className="h-4 w-4 text-muted-foreground" />
                  View Stock Movements
                </Button>
              </Link>
              <Link href="/inventory/adjustments">
                <Button variant="outline" size="sm" className="h-9 gap-1.5 cursor-pointer border-border">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  View Adjustments
                </Button>
              </Link>
            </div>

            {!isTechnician && (
              <div className="flex gap-2">
                <Link href="/inventory/movements?action=stock_in">
                  <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white">
                    <ArrowDownLeft className="h-4 w-4" />
                    Stock In
                  </Button>
                </Link>
                <Link href="/inventory/movements?action=stock_out">
                  <Button size="sm" className="h-9 gap-1.5 bg-rose-600 hover:bg-rose-700 cursor-pointer text-white">
                    <ArrowUpRight className="h-4 w-4" />
                    Stock Out
                  </Button>
                </Link>
                {canAdjust && (
                  <Link href="/inventory/adjustments?action=adjust">
                    <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 cursor-pointer text-white">
                      <TrendingUp className="h-4 w-4" />
                      New Adjustment
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            /* Skeleton Loading State */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-80 lg:col-span-1 bg-card border border-border rounded-xl animate-pulse" />
                <div className="h-80 lg:col-span-2 bg-card border border-border rounded-xl animate-pulse" />
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
              Error loading inventory metrics. Please verify that the backend is running.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dashboard metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <DashboardCard
                  title="On-Hand Items"
                  value={data?.summary?.total_items || 0}
                  iconName="Package"
                  type="info"
                />
                <DashboardCard
                  title="Total Stock Units"
                  value={data?.summary?.total_stock || 0}
                  iconName="CheckCircle"
                  type="success"
                />
                <DashboardCard
                  title="Total Value (Cost)"
                  value={formatCurrency(data?.summary?.total_value || 0)}
                  iconName="Package"
                  type="success"
                />
                <DashboardCard
                  title="Low Stock Items"
                  value={data?.summary?.low_stock_count || 0}
                  iconName="AlertTriangle"
                  type="warning"
                />
                <DashboardCard
                  title="Out Of Stock"
                  value={data?.summary?.out_of_stock_count || 0}
                  iconName="XOctagon"
                  type="danger"
                />
              </div>

              {/* Charts & Graphs Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard
                  title="Stock Movements Breakdown"
                  description="Split by transactions logged in database"
                  type="inventory-overview"
                  data={getChartData()}
                  className="lg:col-span-1"
                />

                {/* Low Stock Watchlist */}
                <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden lg:col-span-2 flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-extrabold text-foreground flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Low Stock Watchlist
                    </h3>
                    <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                      Critical Thresholds
                    </span>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    {data?.low_stock_items && data.low_stock_items.length > 0 ? (
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-accent/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="py-2.5 px-4">Part Details</th>
                            <th className="py-2.5 px-4 text-center">Safety Stock</th>
                            <th className="py-2.5 px-4 text-center">Current Qty</th>
                            <th className="py-2.5 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {data.low_stock_items.map((part) => (
                            <tr key={part.id} className="hover:bg-accent/10">
                              <td className="py-3 px-4 font-semibold text-primary">
                                {part.part_name}
                                <span className="block text-xs font-bold text-muted-foreground mt-0.5">
                                  {part.part_number} | {part.manufacturer}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-muted-foreground">
                                {part.minimum_stock}
                              </td>
                              <td className="py-3 px-4 text-center font-extrabold text-destructive">
                                {part.current_stock}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                                    part.current_stock === 0
                                      ? "bg-rose-500/10 text-rose-600"
                                      : "bg-amber-500/10 text-amber-600"
                                  }`}
                                >
                                  {part.current_stock === 0 ? "Out of Stock" : "Low Stock"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <PackageCheck className="h-10 w-10 text-emerald-500 mb-2" />
                        <h4 className="font-extrabold text-sm text-foreground">All stock levels healthy</h4>
                        <p className="text-xs text-muted-foreground">No parts are currently below thresholds.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Stock Movements Timeline */}
              <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-extrabold text-foreground flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-500" />
                    Recent Stock Movements
                  </h3>
                  <Link href="/inventory/movements">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                      <Eye className="h-3 w-3" />
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  {data?.recent_transactions && data.recent_transactions.length > 0 ? (
                    <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border bg-accent/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Part Number</th>
                          <th className="py-2.5 px-4">Part Name</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4 text-center">Quantity</th>
                          <th className="py-2.5 px-4 text-center">Prev Stock</th>
                          <th className="py-2.5 px-4 text-center">New Stock</th>
                          <th className="py-2.5 px-4">User</th>
                          <th className="py-2.5 px-4">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data.recent_transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-accent/10 transition-colors">
                            <td className="py-2.5 px-4 text-xs font-bold text-muted-foreground">
                              {formatDate(tx.created_at)}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-primary">{tx.spare_part?.part_number}</td>
                            <td className="py-2.5 px-4 truncate max-w-[150px]">{tx.spare_part?.part_name}</td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                                  tx.movement_type === "STOCK_IN"
                                    ? "bg-blue-500/10 text-blue-600"
                                    : tx.movement_type === "STOCK_OUT"
                                    ? "bg-rose-500/10 text-rose-600"
                                    : tx.movement_type === "STOCK_TRANSFER"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-amber-500/10 text-amber-600"
                                }`}
                              >
                                {formatType(tx.movement_type)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-extrabold text-foreground">
                              {tx.quantity}
                            </td>
                            <td className="py-2.5 px-4 text-center font-medium text-muted-foreground">
                              {tx.previous_stock}
                            </td>
                            <td className="py-2.5 px-4 text-center font-extrabold text-foreground">
                              {tx.new_stock}
                            </td>
                            <td className="py-2.5 px-4 text-xs font-semibold text-muted-foreground">
                              {tx.performed_by_username}
                            </td>
                            <td className="py-2.5 px-4 text-xs font-semibold text-muted-foreground truncate max-w-[120px]">
                              {tx.reference_number || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <h4 className="font-extrabold text-sm text-foreground">No recent movements</h4>
                      <p className="text-xs text-muted-foreground">No inventory transactions have been logged yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
