"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { purchasesService } from "@/services/purchases";
import {
  PackageCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Calendar,
  User,
} from "lucide-react";

export default function GoodsReceiptsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["goods-receipts-list", search, page],
    queryFn: () =>
      purchasesService.getGoodsReceipts({
        search,
        page,
      }),
  });

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "STORE_KEEPER", "WAREHOUSE_MANAGER"]}>
      <DashboardLayout>
        <PageContainer
          title="Goods Receipts Audit Log"
          subtitle="Audit log of received shipments, purchase order fulfillments, and inventory stock increments."
        >
          <Breadcrumb items={[{ label: "Goods Receipts", active: true }]} />

          {/* Search Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="relative min-w-[280px] w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search GRN number, PO number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 border-border bg-background"
              />
            </div>
          </div>

          {/* Data Log Cards / Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-foreground text-base flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-emerald-500" />
                Goods Receipt Notes
              </h3>
            </div>

            <div className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-4 animate-pulse space-y-2">
                    <div className="h-4 w-48 bg-accent rounded" />
                    <div className="h-3 w-64 bg-accent rounded" />
                  </div>
                ))
              ) : !data || data.results.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <PackageCheck className="h-12 w-12 text-muted-foreground/30 mb-2" />
                    <h3 className="font-extrabold text-foreground text-base">No Goods Receipts logged</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Goods receipts are logged when receiving items against an approved Purchase Order.
                    </p>
                  </div>
                </div>
              ) : (
                data.results.map((grn) => (
                  <div key={grn.id} className="p-4 hover:bg-accent/10 transition-colors space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-emerald-600 text-base">{grn.grn_number}</span>
                        <Link
                          href={`/purchase-orders/${grn.purchase_order}`}
                          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          PO #: {grn.po_number}
                        </Link>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{grn.received_by_username}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{new Date(grn.received_date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {grn.remarks && (
                      <div className="text-xs text-muted-foreground italic bg-accent/20 p-2 rounded-md">
                        Notes: {grn.remarks}
                      </div>
                    )}

                    {/* Received Items Breakdown */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider bg-accent/10">
                            <th className="py-1.5 px-3">Part Number</th>
                            <th className="py-1.5 px-3">Part Name</th>
                            <th className="py-1.5 px-3 text-center">Quantity Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {grn.items?.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 px-3 font-bold text-primary">{item.spare_part_number}</td>
                              <td className="py-2 px-3 font-semibold text-foreground">{item.spare_part_name}</td>
                              <td className="py-2 px-3 text-center font-extrabold text-emerald-600">
                                +{item.received_quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {data && data.count > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center px-4 py-3 border-t border-border bg-accent/10">
                <div className="text-xs font-semibold text-muted-foreground">
                  Showing {Math.min((page - 1) * 20 + 1, data.count)} to {Math.min(page * 20, data.count)} of {data.count} receipts
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
