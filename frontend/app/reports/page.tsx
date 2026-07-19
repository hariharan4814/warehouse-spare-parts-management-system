"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { reportsService } from "@/services/reports";
import { BarChartCard, TrendBarChart } from "@/components/reports/reports-charts";
import {
  BarChart3,
  Package,
  Warehouse,
  Truck,
  FileSpreadsheet,
  Wrench,
  ArrowLeftRight,
  PackageCheck,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function ReportsDashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["reports-dashboard-main"],
    queryFn: () => reportsService.getDashboard(),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Reports & Business Intelligence" subtitle="Loading analytics...">
            <div className="h-96 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const warehouseChartItems = (dashboard?.inventory_by_warehouse || []).map((w) => ({
    label: w.name,
    value: w.total_value,
  }));

  const topPartsItems = (dashboard?.top_consumed_parts || []).map((p) => ({
    label: `${p.part_name} (${p.part_number})`,
    value: p.total_issued,
  }));

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Reports & Business Intelligence"
          subtitle="Real-time operational metrics, financial inventory valuation, and procurement analytics."
        >
          <Breadcrumb items={[{ label: "Reports", active: true }]} />

          {/* Quick Sub-Reports Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <Link
              href="/reports/inventory"
              className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary">Inventory</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/reports/purchases"
              className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary">Purchases</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/reports/warehouses"
              className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary">Warehouses</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/reports/work-orders"
              className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary">Work Orders</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/reports/stock-movements"
              className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground group-hover:text-primary">Movements</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* High-Level Overview Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold text-muted-foreground uppercase tracking-wider">
                  Total Inventory Value
                </span>
                <h3 className="text-2xl font-black text-primary mt-1">
                  {formatCurrency(dashboard?.total_inventory_value || 0)}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>

            <DashboardCard
              title="Total Spare Parts"
              value={dashboard?.total_spare_parts || 0}
              iconName="Package"
              type="info"
            />

            <DashboardCard
              title="Active Warehouses"
              value={dashboard?.total_warehouses || 0}
              iconName="Warehouse"
              type="info"
            />

            <DashboardCard
              title="Active Suppliers"
              value={dashboard?.total_suppliers || 0}
              iconName="Truck"
              type="info"
            />
          </div>

          {/* Operational Month Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <div className="text-2xs font-bold text-muted-foreground uppercase">PO Orders (This Month)</div>
              <div className="text-xl font-black text-foreground mt-1">{dashboard?.pos_this_month || 0}</div>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <div className="text-2xs font-bold text-muted-foreground uppercase">Work Orders (This Month)</div>
              <div className="text-xl font-black text-foreground mt-1">{dashboard?.wos_this_month || 0}</div>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <div className="text-2xs font-bold text-muted-foreground uppercase">Low Stock Items</div>
              <div className="text-xl font-black text-amber-600 mt-1">{dashboard?.low_stock_items || 0}</div>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl shadow-xs">
              <div className="text-2xs font-bold text-muted-foreground uppercase">Out of Stock Items</div>
              <div className="text-xl font-black text-rose-600 mt-1">{dashboard?.out_of_stock_items || 0}</div>
            </div>
          </div>

          {/* Interactive Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <BarChartCard
              title="Inventory Valuation by Warehouse"
              subtitle="Total asset value ($) stored across regional distribution centers"
              items={warehouseChartItems}
              formatValue={formatCurrency}
              barColor="bg-primary"
            />

            <BarChartCard
              title="Top 10 Most Consumed Spare Parts"
              subtitle="Parts with highest cumulative quantities issued for work order maintenance"
              items={topPartsItems}
              barColor="bg-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TrendBarChart
              title="Monthly Purchase Orders Trend"
              subtitle="Procurement volume over recent billing months"
              data={dashboard?.monthly_pos || []}
            />

            <TrendBarChart
              title="Monthly Maintenance Work Orders Trend"
              subtitle="Work order volume over recent maintenance months"
              data={dashboard?.monthly_wos || []}
            />
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
