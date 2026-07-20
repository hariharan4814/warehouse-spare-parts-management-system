"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { reportsService } from "@/services/reports";
import { warehousesService } from "@/services/warehouses";
import { exportToCSV } from "@/lib/csv-export";
import {
  Package,
  Search,
  Filter,
  Download,
  Printer,
  ArrowLeft,
} from "lucide-react";

export default function InventoryReportPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-filter-select"],
    queryFn: () => warehousesService.getWarehouses({ page_size: 1000 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-report-list", search, statusFilter, warehouseId],
    queryFn: () =>
      reportsService.getInventoryReport({
        search,
        status: statusFilter,
        warehouse: warehouseId,
      }),
  });

  const warehouses = warehousesData?.results || [];
  const items = data?.results || [];

  const totalValuation = items.reduce((sum, item) => sum + item.valuation, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0).replace("INR", "₹").trim();
  };

  const handleExport = () => {
    const exportData = items.map((i) => ({
      "Part Number": i.part_number,
      "Part Name": i.part_name,
      Category: i.category,
      "Current Stock": i.current_stock,
      "Min Stock": i.minimum_stock,
      "Max Stock": i.maximum_stock,
      "Unit Cost (₹)": i.cost_price,
      "Total Valuation (₹)": i.valuation,
      Status: i.status,
    }));
    exportToCSV(exportData, "Inventory_Valuation_Report");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Main View (Hidden on print) */}
        <div className="print:hidden">
          <PageContainer
            title="Inventory Valuation & Stock Status Report"
            subtitle="Comprehensive breakdown of stock levels, safety margins, and financial valuation."
          >
            <Breadcrumb
              items={[
                { label: "Reports", href: "/reports" },
                { label: "Inventory Report", active: true },
              ]}
            />

            {/* Top Bar */}
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

            {/* Filter Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search part number, part name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 border-border bg-background"
                  />
                </div>

                <div className="flex items-center gap-1.5 min-w-[160px]">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Stock Levels</option>
                    <option value="LOW_STOCK">Low Stock Watchlist</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 min-w-[180px]">
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Warehouses</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.warehouse_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-muted-foreground block">Total Valuation:</span>
                <span className="text-lg font-black text-primary">{formatCurrency(totalValuation)}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Part Number</th>
                      <th className="py-3.5 px-4">Part Name</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4 text-center">Stock</th>
                      <th className="py-3.5 px-4 text-center">Min / Max</th>
                      <th className="py-3.5 px-4 text-right">Unit Cost</th>
                      <th className="py-3.5 px-4 text-right">Total Valuation</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-6 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-36 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded ml-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded ml-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <h3 className="font-extrabold text-foreground text-base">No inventory records found</h3>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-muted-foreground">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-extrabold text-primary">{item.part_number}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground">{item.part_name}</td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{item.category}</td>
                          <td className="py-3.5 px-4 text-center font-black text-foreground">{item.current_stock}</td>
                          <td className="py-3.5 px-4 text-center text-xs font-semibold text-muted-foreground">
                            {item.minimum_stock} / {item.maximum_stock}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-muted-foreground">{formatCurrency(item.cost_price)}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-foreground">{formatCurrency(item.valuation)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                                item.status === "Out of Stock"
                                  ? "bg-rose-500/10 text-rose-600"
                                  : item.status === "Low Stock"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                              }`}
                            >
                              {item.status}
                            </span>
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
              <h1 className="text-2xl font-black tracking-tight text-black">INVENTORY VALUATION REPORT</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS Enterprise Systems</div>
            </div>
            <div className="text-right">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div className="font-bold">Total Items: {items.length}</div>
              <div className="font-bold">Total Valuation: {formatCurrency(totalValuation)}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">#</th>
                <th className="p-2 border-r border-gray-300">Part Number</th>
                <th className="p-2 border-r border-gray-300">Part Description</th>
                <th className="p-2 border-r border-gray-300 text-center">Stock</th>
                <th className="p-2 border-r border-gray-300 text-right">Unit Cost</th>
                <th className="p-2 text-right">Valuation</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300">{idx + 1}</td>
                  <td className="p-2 border-r border-gray-300 font-bold">{item.part_number}</td>
                  <td className="p-2 border-r border-gray-300">{item.part_name}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.current_stock}</td>
                  <td className="p-2 border-r border-gray-300 text-right">{formatCurrency(item.cost_price)}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(item.valuation)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-black bg-gray-50">
                <td colSpan={5} className="p-2 text-right border-r border-gray-300">TOTAL VALUATION:</td>
                <td className="p-2 text-right">{formatCurrency(totalValuation)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
