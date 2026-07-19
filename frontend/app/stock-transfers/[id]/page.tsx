"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { warehousesService, TransferStatus } from "@/services/warehouses";
import {
  ArrowLeftRight,
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  PackageCheck,
  Building,
  UserCheck,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function StockTransferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const trfId = parseInt(params.id as string);

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const isKeeper = user?.role === "STORE_KEEPER";
  const canApprove = isAdmin || isManager;
  const canComplete = isAdmin || isManager || isKeeper;

  // Load Transfer Detail
  const { data: trf, isLoading, error } = useQuery({
    queryKey: ["stock-transfer-detail", trfId],
    queryFn: () => warehousesService.getTransfer(trfId),
    enabled: !isNaN(trfId),
  });

  // Action Mutations
  const submitMutation = useMutation({
    mutationFn: () => warehousesService.submitTransfer(trfId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfer-detail", trfId] });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers-list"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => warehousesService.approveTransfer(trfId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfer-detail", trfId] });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers-list"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => warehousesService.completeTransfer(trfId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfer-detail", trfId] });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers-list"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      alert(axiosError.response?.data?.detail || "Failed to complete transfer.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => warehousesService.cancelTransfer(trfId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfer-detail", trfId] });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers-list"] });
    },
  });

  const getStatusBadge = (status?: TransferStatus) => {
    switch (status) {
      case "DRAFT":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-neutral-500/10 text-neutral-500">Draft</span>;
      case "PENDING":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500/10 text-amber-600">Pending Approval</span>;
      case "APPROVED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-500/10 text-blue-600">Approved</span>;
      case "COMPLETED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600">Completed</span>;
      case "CANCELLED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Cancelled</span>;
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Stock Transfer Detail" subtitle="Loading transfer records...">
            <div className="h-96 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !trf) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Transfer Not Found" subtitle="Error loading transfer records.">
            <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl mb-4">
              The requested Stock Transfer could not be retrieved.
            </div>
            <Button variant="outline" onClick={() => router.push("/stock-transfers")} className="cursor-pointer">
              Back to Stock Transfers
            </Button>
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Main Screen Layout (Hidden on print) */}
        <div className="print:hidden">
          <PageContainer
            title={`Stock Transfer: ${trf.transfer_number}`}
            subtitle={`${trf.source_warehouse?.name} -> ${trf.destination_warehouse?.name}`}
          >
            <Breadcrumb
              items={[
                { label: "Stock Transfers", href: "/stock-transfers" },
                { label: trf.transfer_number, active: true },
              ]}
            />

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/stock-transfers")}
                className="gap-1.5 h-9 text-xs cursor-pointer border-border"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Stock Transfers
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-9 gap-1.5 cursor-pointer border-border font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Print Transfer Note
                </Button>

                {trf.status === "DRAFT" && canApprove && (
                  <Button
                    size="sm"
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                    className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Submit for Approval
                  </Button>
                )}

                {canApprove && (trf.status === "DRAFT" || trf.status === "PENDING") && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                      className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Transfer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="h-9 gap-1.5 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 font-semibold cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Transfer
                    </Button>
                  </>
                )}

                {canComplete && trf.status === "APPROVED" && (
                  <Button
                    size="sm"
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    <PackageCheck className="h-4 w-4" />
                    {completeMutation.isPending ? "Completing..." : "Complete & Receive Transfer"}
                  </Button>
                )}
              </div>
            </div>

            {/* Route & Audit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Card 1: Source Warehouse */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    Source Warehouse (From)
                  </h4>
                  <span className="text-xs font-extrabold text-muted-foreground">{trf.source_warehouse?.warehouse_code}</span>
                </div>
                <strong className="block text-foreground text-sm font-extrabold">{trf.source_warehouse?.name}</strong>
                <div className="text-xs text-muted-foreground">City: {trf.source_warehouse?.city}</div>
              </div>

              {/* Card 2: Destination Warehouse */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    Destination Warehouse (To)
                  </h4>
                  <span className="text-xs font-extrabold text-primary">{trf.destination_warehouse?.warehouse_code}</span>
                </div>
                <strong className="block text-foreground text-sm font-extrabold">{trf.destination_warehouse?.name}</strong>
                <div className="text-xs text-muted-foreground">City: {trf.destination_warehouse?.city}</div>
              </div>

              {/* Card 3: Status & Trail */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Audit Information
                  </h4>
                  {getStatusBadge(trf.status)}
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Created By:</span>
                    <strong className="text-foreground">{trf.created_by_username}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Created At:</span>
                    <strong className="text-foreground">{new Date(trf.created_at).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved By:</span>
                    <strong className="text-foreground">{trf.approved_by_username || "—"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed At:</span>
                    <strong className="text-foreground">{trf.completed_at ? new Date(trf.completed_at).toLocaleString() : "—"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {trf.remarks && (
              <div className="p-4 bg-accent/20 border border-border rounded-xl text-xs text-muted-foreground mb-6">
                <strong className="text-foreground block mb-0.5">Transfer Remarks / Notes:</strong>
                {trf.remarks}
              </div>
            )}

            {/* Items Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-extrabold text-foreground text-base">Transferred Items</h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {trf.items?.length || 0} items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Part Number</th>
                      <th className="py-3 px-4">Part Name</th>
                      <th className="py-3 px-4 text-center">Transfer Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {trf.items?.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-extrabold text-primary">{item.spare_part?.part_number}</td>
                        <td className="py-3.5 px-4 font-bold text-foreground">{item.spare_part?.part_name}</td>
                        <td className="py-3.5 px-4 text-center font-black text-foreground text-base">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </PageContainer>
        </div>

        {/* Printable Transfer Note Layout (Visible only when printing) */}
        <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">STOCK TRANSFER NOTE</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS Enterprise Systems</div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-black">TRF #: {trf.transfer_number}</div>
              <div>Date: {new Date(trf.created_at).toLocaleDateString()}</div>
              <div>Status: {trf.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-300 p-3 rounded">
              <strong className="block text-black font-extrabold mb-1">SOURCE WAREHOUSE (FROM):</strong>
              <div className="font-bold">{trf.source_warehouse?.name}</div>
              <div>Code: {trf.source_warehouse?.warehouse_code}</div>
              <div>City: {trf.source_warehouse?.city}</div>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <strong className="block text-black font-extrabold mb-1">DESTINATION WAREHOUSE (TO):</strong>
              <div className="font-bold">{trf.destination_warehouse?.name}</div>
              <div>Code: {trf.destination_warehouse?.warehouse_code}</div>
              <div>City: {trf.destination_warehouse?.city}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">#</th>
                <th className="p-2 border-r border-gray-300">Part Number</th>
                <th className="p-2 border-r border-gray-300">Part Description</th>
                <th className="p-2 text-center">Transfer Quantity</th>
              </tr>
            </thead>
            <tbody>
              {trf.items?.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300">{index + 1}</td>
                  <td className="p-2 border-r border-gray-300 font-bold">{item.spare_part?.part_number}</td>
                  <td className="p-2 border-r border-gray-300">{item.spare_part?.part_name}</td>
                  <td className="p-2 text-center font-bold">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {trf.remarks && (
            <div className="mb-6 p-2 border border-gray-300 rounded">
              <strong>Notes:</strong> {trf.remarks}
            </div>
          )}

          <div className="mt-12 flex justify-between pt-8 border-t border-gray-400">
            <div className="text-center w-36">
              <div className="border-b border-black mb-1"></div>
              <div>Dispatched By (Source)</div>
            </div>
            <div className="text-center w-36">
              <div className="border-b border-black mb-1"></div>
              <div>Approved By</div>
            </div>
            <div className="text-center w-36">
              <div className="border-b border-black mb-1"></div>
              <div>Received By (Destination)</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
