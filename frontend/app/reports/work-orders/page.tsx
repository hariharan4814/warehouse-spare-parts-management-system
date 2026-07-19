"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { reportsService } from "@/services/reports";
import { exportToCSV } from "@/lib/csv-export";
import {
  Wrench,
  Filter,
  Download,
  Printer,
  ArrowLeft,
  User,
} from "lucide-react";

export default function WorkOrderReportPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["work-order-report-list", statusFilter, priorityFilter],
    queryFn: () =>
      reportsService.getWorkOrderReport({
        status: statusFilter,
        priority: priorityFilter,
      }),
  });

  const items = data?.results || [];

  const totalRequested = items.reduce((sum, item) => sum + item.total_requested, 0);
  const totalIssued = items.reduce((sum, item) => sum + item.total_issued, 0);

  const handleExport = () => {
    const exportData = items.map((i) => ({
      "WO Number": i.work_order_number,
      Title: i.title,
      Priority: i.priority,
      Status: i.status,
      Equipment: i.equipment_name,
      Location: i.location,
      Technician: i.technician,
      "Parts Requested": i.total_requested,
      "Parts Issued": i.total_issued,
      "Created At": i.created_at,
    }));
    exportToCSV(exportData, "Work_Orders_Consumption_Report");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="print:hidden">
          <PageContainer
            title="Maintenance & Spare Parts Consumption Report"
            subtitle="Analyze work order status fulfillment, equipment breakdown statistics, and parts issued."
          >
            <Breadcrumb
              items={[
                { label: "Reports", href: "/reports" },
                { label: "Work Orders Report", active: true },
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
                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="text-right flex gap-4 text-xs font-bold">
                <div>
                  <span className="text-muted-foreground block">Requested:</span>
                  <span className="text-foreground text-sm font-black">{totalRequested}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Issued:</span>
                  <span className="text-emerald-600 text-sm font-black">{totalIssued}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4">WO Number</th>
                      <th className="py-3.5 px-4">Title</th>
                      <th className="py-3.5 px-4">Equipment / Location</th>
                      <th className="py-3.5 px-4 text-center">Priority</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Parts (Req / Issued)</th>
                      <th className="py-3.5 px-4">Technician</th>
                      <th className="py-3.5 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-36 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-28 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Wrench className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <h3 className="font-extrabold text-foreground text-base">No work order records found</h3>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-primary">{item.work_order_number}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground">{item.title}</td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                            <div>{item.equipment_name}</div>
                            <div className="text-2xs text-muted-foreground/70">{item.location}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-accent text-foreground">
                              {item.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-accent text-foreground">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-xs font-bold text-foreground">
                            <span className="text-emerald-600">{item.total_issued}</span> / <span>{item.total_requested}</span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.technician}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{item.created_at}</td>
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
              <h1 className="text-2xl font-black tracking-tight text-black">WORK ORDER & CONSUMPTION REPORT</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS Enterprise Systems</div>
            </div>
            <div className="text-right">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div className="font-bold">Total Work Orders: {items.length}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">WO Number</th>
                <th className="p-2 border-r border-gray-300">Title</th>
                <th className="p-2 border-r border-gray-300">Equipment</th>
                <th className="p-2 border-r border-gray-300 text-center">Status</th>
                <th className="p-2 text-center">Req / Issued</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300 font-bold">{item.work_order_number}</td>
                  <td className="p-2 border-r border-gray-300">{item.title}</td>
                  <td className="p-2 border-r border-gray-300">{item.equipment_name}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.status}</td>
                  <td className="p-2 text-center font-bold">{item.total_requested} / {item.total_issued}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
