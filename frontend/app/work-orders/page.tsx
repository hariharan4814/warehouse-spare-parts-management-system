"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { workOrdersService, WorkOrderPriority, WorkOrderStatus } from "@/services/work-orders";
import {
  Wrench,
  Search,
  Filter,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  PackageCheck,
} from "lucide-react";

export default function WorkOrdersPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const isTech = user?.role === "TECHNICIAN";
  const canCreate = isAdmin || isManager || isTech;

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [page, setPage] = useState(1);

  // Dashboard Summary
  const { data: dashboard } = useQuery({
    queryKey: ["work-orders-dashboard"],
    queryFn: () => workOrdersService.getDashboard(),
  });

  // Load Work Orders List
  const { data, isLoading } = useQuery({
    queryKey: ["work-orders-list", search, selectedStatus, selectedPriority, page],
    queryFn: () =>
      workOrdersService.getWorkOrders({
        search,
        status: selectedStatus,
        priority: selectedPriority,
        page,
      }),
  });

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    switch (priority) {
      case "LOW":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-neutral-500/10 text-neutral-500">Low</span>;
      case "MEDIUM":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-blue-500/10 text-blue-600">Medium</span>;
      case "HIGH":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-amber-500/10 text-amber-600">High</span>;
      case "CRITICAL":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Critical</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case "OPEN":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-amber-500/10 text-amber-600">Open</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-blue-500/10 text-blue-600">In Progress</span>;
      case "COMPLETED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600">Completed</span>;
      case "CANCELLED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Maintenance Work Orders"
          subtitle="Manage equipment maintenance orders, request spare parts, and track fulfillment status."
        >
          <Breadcrumb items={[{ label: "Work Orders", active: true }]} />

          {/* Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <DashboardCard
              title="Open Work Orders"
              value={dashboard?.open_work_orders || 0}
              iconName="Clock"
              type="warning"
            />
            <DashboardCard
              title="In Progress"
              value={dashboard?.in_progress_work_orders || 0}
              iconName="Wrench"
              type="info"
            />
            <DashboardCard
              title="Completed Orders"
              value={dashboard?.completed_work_orders || 0}
              iconName="CheckCircle"
              type="success"
            />
            <DashboardCard
              title="Parts Issuances"
              value={dashboard?.total_issue_transactions || 0}
              iconName="PackageCheck"
              type="success"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search WO#, title, equipment..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 border-border bg-background"
                />
              </div>

              <div className="flex items-center gap-1.5 min-w-[140px]">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 min-w-[140px]">
                <select
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    setPage(1);
                  }}
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

            {canCreate && (
              <Link href="/work-orders/new">
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Create Work Order
                </Button>
              </Link>
            )}
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                    <th className="py-3.5 px-4">WO Number</th>
                    <th className="py-3.5 px-4">Work Order Title</th>
                    <th className="py-3.5 px-4">Equipment / Location</th>
                    <th className="py-3.5 px-4 text-center">Priority</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Parts (Req / Issued)</th>
                    <th className="py-3.5 px-4">Assigned Tech</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
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
                        <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : !data || data.results.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Wrench className="h-12 w-12 text-muted-foreground/30 mb-2" />
                          <h3 className="font-extrabold text-foreground text-base">No Work Orders found</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Try adjusting search filters or create a new Work Order.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.results.map((wo) => {
                      const totalRequested = wo.items?.reduce((s, i) => s + i.requested_quantity, 0) || 0;
                      const totalIssued = wo.items?.reduce((s, i) => s + i.issued_quantity, 0) || 0;

                      return (
                        <tr key={wo.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-primary">
                            <Link href={`/work-orders/${wo.id}`} className="hover:underline">
                              {wo.work_order_number}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {wo.title}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                            <div>{wo.equipment_name || "N/A"}</div>
                            <div className="text-2xs text-muted-foreground/80">{wo.location}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">{getPriorityBadge(wo.priority)}</td>
                          <td className="py-3.5 px-4 text-center">{getStatusBadge(wo.status)}</td>
                          <td className="py-3.5 px-4 text-center text-xs font-bold text-foreground">
                            <span className="text-emerald-600">{totalIssued}</span> / <span>{totalRequested}</span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {wo.assigned_technician?.username || "Unassigned"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/work-orders/${wo.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs cursor-pointer">
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.count > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center px-4 py-3 border-t border-border bg-accent/10">
                <div className="text-xs font-semibold text-muted-foreground">
                  Showing {Math.min((page - 1) * 20 + 1, data.count)} to {Math.min(page * 20, data.count)} of {data.count} work orders
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="h-8 px-2 border-border"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-xs font-bold px-3 text-foreground">
                    Page {page} of {Math.ceil(data.count / 20)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(data.count / 20)}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 px-2 border-border"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
