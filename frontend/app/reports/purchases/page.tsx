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
import { suppliersService } from "@/services/suppliers";
import { exportToCSV } from "@/lib/csv-export";
import {
  FileSpreadsheet,
  Filter,
  Download,
  Printer,
  ArrowLeft,
} from "lucide-react";

export default function PurchaseReportPage() {
  const [supplierId, setSupplierId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-report-select"],
    queryFn: () => suppliersService.getSuppliers({ page_size: 1000 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-report-list", supplierId, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      reportsService.getPurchaseReport({
        supplier: supplierId,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
      }),
  });

  const suppliers = suppliersData?.results || [];
  const items = data?.results || [];
  const totalSpend = data?.total_spend || 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val || 0);
  };

  const handleExport = () => {
    const exportData = items.map((i) => ({
      "PO Number": i.po_number,
      Supplier: i.supplier_name,
      "Supplier Code": i.supplier_code,
      "Order Date": i.order_date,
      "Expected Delivery": i.expected_delivery_date,
      Status: i.status,
      "Total Amount ($)": i.total_amount,
      "Created By": i.created_by,
    }));
    exportToCSV(exportData, "Purchase_Orders_Report");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="print:hidden">
          <PageContainer
            title="Procurement & Purchase Orders Report"
            subtitle="Analyze vendor purchasing history, order statuses, and supplier spend distribution."
          >
            <Breadcrumb
              items={[
                { label: "Reports", href: "/reports" },
                { label: "Purchase Report", active: true },
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
                <div className="flex items-center gap-1.5 min-w-[180px]">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name} ({s.supplier_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PARTIALLY_RECEIVED">Partially Received</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 text-xs w-36"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 text-xs w-36"
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-muted-foreground block">Total Procurement Spend:</span>
                <span className="text-lg font-black text-primary">{formatCurrency(totalSpend)}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4">PO Number</th>
                      <th className="py-3.5 px-4">Supplier / Vendor</th>
                      <th className="py-3.5 px-4">Order Date</th>
                      <th className="py-3.5 px-4">Expected Delivery</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Total Amount</th>
                      <th className="py-3.5 px-4">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-36 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded ml-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <h3 className="font-extrabold text-foreground text-base">No purchase orders found</h3>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-primary">{item.po_number}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {item.supplier_name}
                            <span className="text-2xs text-muted-foreground font-normal block">({item.supplier_code})</span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{item.order_date}</td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{item.expected_delivery_date}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-accent text-foreground">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-foreground">{formatCurrency(item.total_amount)}</td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{item.created_by}</td>
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
              <h1 className="text-2xl font-black tracking-tight text-black">PROCUREMENT & PURCHASE ORDERS REPORT</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS Enterprise Systems</div>
            </div>
            <div className="text-right">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div className="font-bold">Total Orders: {items.length}</div>
              <div className="font-bold">Total Spend: {formatCurrency(totalSpend)}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">PO Number</th>
                <th className="p-2 border-r border-gray-300">Supplier Vendor</th>
                <th className="p-2 border-r border-gray-300">Order Date</th>
                <th className="p-2 border-r border-gray-300 text-center">Status</th>
                <th className="p-2 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300 font-bold">{item.po_number}</td>
                  <td className="p-2 border-r border-gray-300">{item.supplier_name}</td>
                  <td className="p-2 border-r border-gray-300">{item.order_date}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.status}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-black bg-gray-50">
                <td colSpan={4} className="p-2 text-right border-r border-gray-300">TOTAL PROCUREMENT SPEND:</td>
                <td className="p-2 text-right">{formatCurrency(totalSpend)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
