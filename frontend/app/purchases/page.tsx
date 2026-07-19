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
import { purchasesService, PurchaseOrderStatus } from "@/services/purchases";
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  PackageCheck,
  FileEdit,
  XCircle,
} from "lucide-react";

export default function PurchaseOrdersPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const canCreate = isAdmin || isManager;

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  // Dashboard Metrics
  const { data: dashboard } = useQuery({
    queryKey: ["purchases-dashboard"],
    queryFn: () => purchasesService.getDashboard(),
  });

  // Load POs
  const { data, isLoading } = useQuery({
    queryKey: ["purchases-list", search, selectedStatus, page],
    queryFn: () =>
      purchasesService.getOrders({
        search,
        status: selectedStatus,
        page,
      }),
  });

  // Format currency
  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num || 0);
  };

  // Status Badge Component
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "DRAFT":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-neutral-500/10 text-neutral-500">Draft</span>;
      case "PENDING_APPROVAL":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-amber-500/10 text-amber-600">Pending Approval</span>;
      case "APPROVED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-blue-500/10 text-blue-600">Approved</span>;
      case "PARTIALLY_RECEIVED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-purple-500/10 text-purple-600">Partially Received</span>;
      case "COMPLETED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600">Completed</span>;
      case "CANCELLED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Cancelled</span>;
      default:
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-accent text-muted-foreground">{status}</span>;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Purchase Order Management"
          subtitle="Create, approve, track, and receive procurement orders from active suppliers."
        >
          <Breadcrumb items={[{ label: "Purchase Orders", active: true }]} />

          {/* Metrics Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <DashboardCard
              title="Pending Approval"
              value={dashboard?.pending_count || 0}
              iconName="Clock"
              type="warning"
            />
            <DashboardCard
              title="Approved Orders"
              value={dashboard?.approved_count || 0}
              iconName="CheckCircle"
              type="info"
            />
            <DashboardCard
              title="Partially Received"
              value={dashboard?.partially_received_count || 0}
              iconName="Package"
              type="warning"
            />
            <DashboardCard
              title="Completed POs"
              value={dashboard?.completed_count || 0}
              iconName="CheckCircle"
              type="success"
            />
            <DashboardCard
              title="Draft POs"
              value={dashboard?.draft_count || 0}
              iconName="FileEdit"
              type="info"
            />
          </div>

          {/* Action & Filter Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PO number, supplier..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 border-border bg-background"
                />
              </div>

              <div className="flex items-center gap-1.5 min-w-[160px]">
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
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {canCreate && (
              <Link href="/purchase-orders/new">
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Create Purchase Order
                </Button>
              </Link>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                    <th className="py-3.5 px-4">PO Number</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Order Date</th>
                    <th className="py-3.5 px-4">Expected Delivery</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4">Created By</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-36 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded ml-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : !data || data.results.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-2" />
                          <h3 className="font-extrabold text-foreground text-base">No Purchase Orders found</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Try adjusting filters or create a new order.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.results.map((po) => (
                      <tr key={po.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-primary">
                          <Link href={`/purchase-orders/${po.id}`} className="hover:underline">
                            {po.po_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {po.supplier?.company_name}
                          <span className="block text-2xs font-semibold text-muted-foreground">
                            {po.supplier?.supplier_code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                          {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center">{getStatusBadge(po.status)}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-foreground">
                          {formatCurrency(po.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                          {po.created_by_username}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/purchase-orders/${po.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs cursor-pointer">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.count > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center px-4 py-3 border-t border-border bg-accent/10">
                <div className="text-xs font-semibold text-muted-foreground">
                  Showing {Math.min((page - 1) * 20 + 1, data.count)} to {Math.min(page * 20, data.count)} of {data.count} purchase orders
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
