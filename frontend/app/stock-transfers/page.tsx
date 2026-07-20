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
import { warehousesService, TransferStatus } from "@/services/warehouses";
import {
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  Building,
} from "lucide-react";

export default function StockTransfersPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const canCreate = isAdmin || isManager;

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  // Dashboard Summary
  const { data: dashboard } = useQuery({
    queryKey: ["warehouses-dashboard"],
    queryFn: () => warehousesService.getDashboard(),
  });

  // Load Transfers List
  const { data, isLoading } = useQuery({
    queryKey: ["stock-transfers-list", search, selectedStatus, page],
    queryFn: () =>
      warehousesService.getTransfers({
        search,
        status: selectedStatus,
        page,
      }),
  });

  // Status Badge Helper
  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case "DRAFT":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-neutral-500/10 text-neutral-500">Draft</span>;
      case "PENDING":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-amber-500/10 text-amber-600">Pending Approval</span>;
      case "APPROVED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-blue-500/10 text-blue-600">Approved</span>;
      case "COMPLETED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600">Completed</span>;
      case "CANCELLED":
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Cancelled</span>;
      default:
        return <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-accent text-muted-foreground">{status}</span>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"]}>
      <DashboardLayout>
        <PageContainer
          title="Stock Transfers Management"
          subtitle="Control and audit stock movement requests between regional warehouses."
        >
          <Breadcrumb items={[{ label: "Stock Transfers", active: true }]} />

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <DashboardCard
              title="Pending Transfers"
              value={dashboard?.pending_transfers || 0}
              iconName="Clock"
              type="warning"
            />
            <DashboardCard
              title="Completed Transfers"
              value={dashboard?.completed_transfers || 0}
              iconName="CheckCircle"
              type="success"
            />
            <DashboardCard
              title="Active Warehouses"
              value={dashboard?.total_warehouses || 0}
              iconName="Warehouse"
              type="info"
            />
            <DashboardCard
              title="Total Stock Units"
              value={dashboard?.total_stock_units || 0}
              iconName="Package"
              type="info"
            />
          </div>

          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search TRF number, warehouse..."
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
                  <option value="PENDING">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {canCreate && (
              <Link href="/stock-transfers/new">
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Create Stock Transfer
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
                    <th className="py-3.5 px-4">TRF Number</th>
                    <th className="py-3.5 px-4">Source Warehouse</th>
                    <th className="py-3.5 px-4">Destination Warehouse</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Items</th>
                    <th className="py-3.5 px-4">Created By</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-10 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : !data || data.results.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <ArrowLeftRight className="h-12 w-12 text-muted-foreground/30 mb-2" />
                          <h3 className="font-extrabold text-foreground text-base">No Stock Transfers found</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Try adjusting search queries or create a transfer.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.results.map((trf) => (
                      <tr key={trf.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-primary">
                          <Link href={`/stock-transfers/${trf.id}`} className="hover:underline">
                            {trf.transfer_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {trf.source_warehouse?.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                            {trf.destination_warehouse?.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">{getStatusBadge(trf.status)}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-foreground">
                          {trf.items?.length || 0}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                          {trf.created_by_username}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                          {new Date(trf.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/stock-transfers/${trf.id}`}>
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
                  Showing {Math.min((page - 1) * 20 + 1, data.count)} to {Math.min(page * 20, data.count)} of {data.count} transfers
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
