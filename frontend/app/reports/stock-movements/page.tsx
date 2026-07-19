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
import { exportToCSV } from "@/lib/csv-export";
import {
  TrendingUp,
  Search,
  Filter,
  Download,
  Printer,
  ArrowLeft,
  User,
} from "lucide-react";

export default function StockMovementReportPage() {
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("");
  const [referenceType, setReferenceType] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["stock-movement-report-list", search, movementType, referenceType],
    queryFn: () =>
      reportsService.getStockMovementReport({
        search,
        movement_type: movementType,
        reference_type: referenceType,
      }),
  });

  const items = data?.results || [];

  const handleExport = () => {
    const exportData = items.map((i) => ({
      Timestamp: i.timestamp,
      "Part Number": i.part_number,
      "Part Name": i.part_name,
      "Movement Type": i.movement_type,
      "Reference Type": i.reference_type,
      "Reference Number": i.reference_number,
      Quantity: i.quantity,
      "Previous Stock": i.previous_stock,
      "New Stock": i.new_stock,
      Reason: i.reason,
      "Performed By": i.performed_by,
    }));
    exportToCSV(exportData, "Stock_Movements_Ledger_Report");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="print:hidden">
          <PageContainer
            title="Stock Movement Audit Ledger Report"
            subtitle="Complete chronological audit trail of all inventory receipts, issues, transfers, and adjustments."
          >
            <Breadcrumb
              items={[
                { label: "Reports", href: "/reports" },
                { label: "Stock Movement Report", active: true },
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

            {/* Filter Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search part, ref number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 border-border bg-background"
                  />
                </div>

                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Movement Types</option>
                    <option value="STOCK_IN">Stock In (+)</option>
                    <option value="STOCK_OUT">Stock Out (-)</option>
                    <option value="STOCK_TRANSFER">Stock Transfer</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <select
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Ref Types</option>
                    <option value="PURCHASE">Purchase Order</option>
                    <option value="ISSUE">Parts Issue</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
              </div>

              <div className="text-right text-xs font-bold text-muted-foreground">
                Total Log Entries: <span className="text-foreground text-sm font-black">{items.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4">Part Number</th>
                      <th className="py-3.5 px-4">Part Name</th>
                      <th className="py-3.5 px-4 text-center">Movement Type</th>
                      <th className="py-3.5 px-4 text-center">Qty</th>
                      <th className="py-3.5 px-4 text-center">Prev / New Stock</th>
                      <th className="py-3.5 px-4">Ref Type / Number</th>
                      <th className="py-3.5 px-4">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-28 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <h3 className="font-extrabold text-foreground text-base">No movement ledger entries found</h3>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{item.timestamp}</td>
                          <td className="py-3.5 px-4 font-extrabold text-primary">{item.part_number}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground">{item.part_name}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                                item.movement_type === "STOCK_IN"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : item.movement_type === "STOCK_OUT"
                                  ? "bg-rose-500/10 text-rose-600"
                                  : "bg-blue-500/10 text-blue-600"
                              }`}
                            >
                              {item.movement_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-foreground">{item.quantity}</td>
                          <td className="py-3.5 px-4 text-center text-xs font-semibold text-muted-foreground">
                            {item.previous_stock} → {item.new_stock}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-bold text-foreground">
                            <div>{item.reference_number}</div>
                            <div className="text-2xs font-normal text-muted-foreground">{item.reference_type}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.performed_by}
                            </div>
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
              <h1 className="text-2xl font-black tracking-tight text-black">STOCK MOVEMENT AUDIT LEDGER REPORT</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS Enterprise Systems</div>
            </div>
            <div className="text-right">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div className="font-bold">Total Ledger Entries: {items.length}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">Timestamp</th>
                <th className="p-2 border-r border-gray-300">Part Number</th>
                <th className="p-2 border-r border-gray-300">Part Name</th>
                <th className="p-2 border-r border-gray-300 text-center">Type</th>
                <th className="p-2 border-r border-gray-300 text-center">Qty</th>
                <th className="p-2 border-r border-gray-300">Ref #</th>
                <th className="p-2">User</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300">{item.timestamp}</td>
                  <td className="p-2 border-r border-gray-300 font-bold">{item.part_number}</td>
                  <td className="p-2 border-r border-gray-300">{item.part_name}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.movement_type}</td>
                  <td className="p-2 border-r border-gray-300 text-center font-bold">{item.quantity}</td>
                  <td className="p-2 border-r border-gray-300">{item.reference_number}</td>
                  <td className="p-2">{item.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
