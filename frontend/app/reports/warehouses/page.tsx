"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { reportsService } from "@/services/reports";
import { warehousesService } from "@/services/warehouses";
import { exportToCSV } from "@/lib/csv-export";
import {
  Warehouse as WarehouseIcon,
  Filter,
  Download,
  Printer,
  ArrowLeft,
  Building,
} from "lucide-react";

export default function WarehouseReportPage() {
  const [warehouseId, setWarehouseId] = useState("");

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-report-select"],
    queryFn: () => warehousesService.getWarehouses({ page_size: 1000 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["warehouse-report-list", warehouseId],
    queryFn: () =>
      reportsService.getWarehouseReport({
        warehouse: warehouseId,
      }),
  });

  const warehouses = warehousesData?.results || [];
  const items = data?.results || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val || 0);
  };

  const handleExport = () => {
    const exportData = items.map((i) => ({
      "Warehouse Code": i.warehouse_code,
      Name: i.name,
      City: i.city,
      Status: i.status,
      "Total Items": i.total_items,
      "Total Units": i.total_units,
      "Asset Valuation ($)": i.total_value,
      "Transfers Sent": i.transfers_sent,
      "Transfers Received": i.transfers_received,
    }));
    exportToCSV(exportData, "Warehouse_Capacity_Report");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="print:hidden">
          <PageContainer
            title="Warehouse Capacity & Stock Transfer Analytics"
            subtitle="Operational breakdown of inventory allocation, storage capacity, and inter-branch transfer volume."
          >
            <Breadcrumb
              items={[
                { label: "Reports", href: "/reports" },
                { label: "Warehouse Report", active: true },
              ]}
            />

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
                className="gap-1.5 h-9 text-xs cursor-pointer border-border"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Reports
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="h-9 gap-1.5 cursor-pointer border-border font-semibold"
                >
                  <Download className="h-4 w-4" />
                  Export to CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-9 gap-1.5 cursor-pointer border-border font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full sm:w-72 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.warehouse_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Facility Name</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">SKU Items</th>
                      <th className="py-3.5 px-4 text-center">Total Units</th>
                      <th className="py-3.5 px-4 text-right">Asset Valuation</th>
                      <th className="py-3.5 px-4 text-center">Transfers (Sent / Rec)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded ml-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <WarehouseIcon className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <h3 className="font-extrabold text-foreground text-base">No warehouse metrics found</h3>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-primary">{item.warehouse_code}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {item.name}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{item.city}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-foreground">{item.total_items}</td>
                          <td className="py-3.5 px-4 text-center font-black text-foreground">{item.total_units}</td>
                          <td className="py-3.5 px-4 text-right font-black text-primary">{formatCurrency(item.total_value)}</td>
                          <td className="py-3.5 px-4 text-center text-xs font-bold text-muted-foreground">
                            <span className="text-primary">{item.transfers_sent}</span> / <span>{item.transfers_received}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </PageContainer>
        </div>

        {/* Printable View */}
        <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">WAREHOUSE CAPACITY & ALLOCATION REPORT</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS Enterprise Systems</div>
            </div>
            <div className="text-right">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div className="font-bold">Total Warehouses: {items.length}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">Code</th>
                <th className="p-2 border-r border-gray-300">Facility Name</th>
                <th className="p-2 border-r border-gray-300">City</th>
                <th className="p-2 border-r border-gray-300 text-center">Items Count</th>
                <th className="p-2 border-r border-gray-300 text-center">Total Units</th>
                <th className="p-2 text-right">Asset Valuation</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300 font-bold">{item.warehouse_code}</td>
                  <td className="p-2 border-r border-gray-300">{item.name}</td>
                  <td className="p-2 border-r border-gray-300">{item.city}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.total_items}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.total_units}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(item.total_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
