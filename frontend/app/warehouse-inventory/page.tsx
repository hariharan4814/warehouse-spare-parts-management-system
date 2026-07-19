"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { warehousesService } from "@/services/warehouses";
import {
  Warehouse as WarehouseIcon,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  Building,
} from "lucide-react";

export default function WarehouseInventoryPage() {
  const [search, setSearch] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [page, setPage] = useState(1);

  // Load Warehouses for filter dropdown
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-for-filter"],
    queryFn: () => warehousesService.getWarehouses({ page_size: 1000 }),
  });

  // Load Dashboard Summary
  const { data: dashboard } = useQuery({
    queryKey: ["warehouses-dashboard"],
    queryFn: () => warehousesService.getDashboard(),
  });

  // Load Warehouse Inventory Records
  const { data, isLoading } = useQuery({
    queryKey: ["warehouse-inventory-list", search, selectedWarehouseId, page],
    queryFn: () =>
      warehousesService.getWarehouseInventories({
        search,
        warehouse: selectedWarehouseId,
        page,
      }),
  });

  const warehouses = warehousesData?.results || [];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Multi-Warehouse Inventory Matrix"
          subtitle="Monitor stock levels, safety thresholds, and stock allocation across all storage facilities."
        >
          <Breadcrumb items={[{ label: "Warehouse Inventory", active: true }]} />

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <DashboardCard
              title="Total Inventory Records"
              value={dashboard?.total_inventory_records || 0}
              iconName="Package"
              type="info"
            />
            <DashboardCard
              title="Total On-Hand Units"
              value={dashboard?.total_stock_units || 0}
              iconName="CheckCircle"
              type="success"
            />
            <DashboardCard
              title="Low Stock Watchlist"
              value={dashboard?.low_stock_count || 0}
              iconName="AlertTriangle"
              type="warning"
            />
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search part number, part name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 border-border bg-background"
                />
              </div>

              <div className="flex items-center gap-1.5 min-w-[180px]">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => {
                    setSelectedWarehouseId(e.target.value);
                    setPage(1);
                  }}
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
          </div>

          {/* Data Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                    <th className="py-3.5 px-4">Warehouse Facility</th>
                    <th className="py-3.5 px-4">Part Number</th>
                    <th className="py-3.5 px-4">Part Name</th>
                    <th className="py-3.5 px-4 text-center">Safety Stock (Min)</th>
                    <th className="py-3.5 px-4 text-center">Max Stock</th>
                    <th className="py-3.5 px-4 text-center">Current Stock</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-36 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                      </tr>
                    ))
                  ) : !data || data.results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground/30 mb-2" />
                          <h3 className="font-extrabold text-foreground text-base">No warehouse inventory records</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Try adjusting search queries or selected warehouse filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.results.map((rec) => {
                      const isOutOfStock = rec.current_stock === 0;
                      const isLowStock = rec.current_stock <= rec.minimum_stock;

                      return (
                        <tr key={rec.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-primary shrink-0" />
                              {rec.warehouse?.name}
                              <span className="text-2xs text-muted-foreground font-normal">
                                ({rec.warehouse?.warehouse_code})
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-primary">
                            {rec.spare_part?.part_number}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {rec.spare_part?.part_name}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-muted-foreground">
                            {rec.minimum_stock}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-muted-foreground">
                            {rec.maximum_stock}
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-foreground text-base">
                            {rec.current_stock}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                                isOutOfStock
                                  ? "bg-rose-500/10 text-rose-600"
                                  : isLowStock
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                              }`}
                            >
                              {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "Optimal"}
                            </span>
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
                  Showing {Math.min((page - 1) * 20 + 1, data.count)} to {Math.min(page * 20, data.count)} of {data.count} records
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
