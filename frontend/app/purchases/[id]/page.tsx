"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { purchasesService, PurchaseOrderStatus } from "@/services/purchases";
import {
  FileSpreadsheet,
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  PackageCheck,
  Truck,
  Building2,
  Calendar,
  UserCheck,
  X,
  History,
} from "lucide-react";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const poId = parseInt(params.id as string);

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const isKeeper = user?.role === "STORE_KEEPER";
  const canApprove = isAdmin || isManager;
  const canReceive = isAdmin || isManager || isKeeper;

  // Receive Modal state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<number, string>>({});
  const [receiveRemarks, setReceiveRemarks] = useState("");
  const [receiveError, setReceiveError] = useState<string | null>(null);

  // Load PO Detail
  const { data: po, isLoading, error } = useQuery({
    queryKey: ["purchase-order-detail", poId],
    queryFn: () => purchasesService.getOrder(poId),
    enabled: !isNaN(poId),
  });

  // Action Mutations
  const submitMutation = useMutation({
    mutationFn: () => purchasesService.submitOrder(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-detail", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchases-list"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => purchasesService.approveOrder(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-detail", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchases-list"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchasesService.cancelOrder(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-detail", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchases-list"] });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => purchasesService.createGoodsReceipt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-detail", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchases-list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      setIsReceiveModalOpen(false);
      setReceiveQtys({});
      setReceiveRemarks("");
      setReceiveError(null);
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: { receipt_items?: string | string[]; detail?: string } } };
      const msg = axiosError.response?.data?.receipt_items || axiosError.response?.data?.detail || "Failed to log Goods Receipt.";
      setReceiveError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  // Formatters
  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num || 0);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status?: PurchaseOrderStatus) => {
    switch (status) {
      case "DRAFT":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-neutral-500/10 text-neutral-500">Draft</span>;
      case "PENDING_APPROVAL":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500/10 text-amber-600">Pending Approval</span>;
      case "APPROVED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-500/10 text-blue-600">Approved</span>;
      case "PARTIALLY_RECEIVED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-purple-500/10 text-purple-600">Partially Received</span>;
      case "COMPLETED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600">Completed</span>;
      case "CANCELLED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Cancelled</span>;
      default:
        return null;
    }
  };

  // Open Receive Modal
  const openReceiveModal = () => {
    if (!po) return;
    const initial: Record<number, string> = {};
    po.items.forEach((item) => {
      const remaining = item.ordered_quantity - item.received_quantity;
      initial[item.id] = remaining > 0 ? String(remaining) : "0";
    });
    setReceiveQtys(initial);
    setReceiveRemarks("");
    setReceiveError(null);
    setIsReceiveModalOpen(true);
  };

  // Submit Goods Receipt
  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiveError(null);

    if (!po) return;

    const receipt_items = [];
    for (const item of po.items) {
      const qty = parseInt(receiveQtys[item.id] || "0");
      if (qty > 0) {
        receipt_items.push({
          po_item_id: item.id,
          received_quantity: qty,
        });
      }
    }

    if (receipt_items.length === 0) {
      setReceiveError("Please enter a quantity greater than zero for at least one item.");
      return;
    }

    receiveMutation.mutate({
      purchase_order_id: po.id,
      remarks: receiveRemarks || null,
      receipt_items,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Purchase Order Detail" subtitle="Loading order records...">
            <div className="h-96 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !po) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Purchase Order Not Found" subtitle="Error loading order records.">
            <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl mb-4">
              The requested Purchase Order could not be retrieved.
            </div>
            <Button variant="outline" onClick={() => router.push("/purchase-orders")} className="cursor-pointer">
              Back to Purchase Orders
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
            title={`Purchase Order: ${po.po_number}`}
            subtitle={`Supplier: ${po.supplier?.company_name} (${po.supplier?.supplier_code})`}
          >
            <Breadcrumb
              items={[
                { label: "Purchase Orders", href: "/purchase-orders" },
                { label: po.po_number, active: true },
              ]}
            />

            {/* Top Bar Navigation & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/purchase-orders")}
                className="gap-1.5 h-9 text-xs cursor-pointer border-border"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Purchase Orders
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-9 gap-1.5 cursor-pointer border-border font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Print PO
                </Button>

                {po.status === "DRAFT" && canApprove && (
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

                {canApprove && (po.status === "DRAFT" || po.status === "PENDING_APPROVAL") && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate()}
                      disabled={approveMutation.isPending}
                      className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Order
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="h-9 gap-1.5 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 font-semibold cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </Button>
                  </>
                )}

                {canReceive && (po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED") && (
                  <Button
                    size="sm"
                    onClick={openReceiveModal}
                    className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    <PackageCheck className="h-4 w-4" />
                    Receive Goods
                  </Button>
                )}
              </div>
            </div>

            {/* PO Metadata Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Card 1: Order Information */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    Order Info
                  </h4>
                  {getStatusBadge(po.status)}
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>PO Number:</span>
                    <strong className="text-foreground">{po.po_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Date:</span>
                    <strong className="text-foreground">{formatDate(po.order_date)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Delivery:</span>
                    <strong className="text-foreground">{formatDate(po.expected_delivery_date)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <strong className="text-primary font-extrabold text-sm">{formatCurrency(po.total_amount)}</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Supplier Details */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Vendor / Supplier
                  </h4>
                  <span className="text-xs font-extrabold text-primary">{po.supplier?.supplier_code}</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <strong className="block text-foreground text-sm font-extrabold">{po.supplier?.company_name}</strong>
                  <div>Contact: {po.supplier?.contact_person}</div>
                  <div>Email: {po.supplier?.email}</div>
                  <div>Phone: {po.supplier?.phone}</div>
                  <div>Address: {po.supplier?.address}, {po.supplier?.city}</div>
                </div>
              </div>

              {/* Card 3: Audit Workflow Trail */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Audit Trail
                  </h4>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Created By:</span>
                    <strong className="text-foreground">{po.created_by_username}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Created At:</span>
                    <strong className="text-foreground">{new Date(po.created_at).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved By:</span>
                    <strong className="text-foreground">{po.approved_by_username || "—"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved At:</span>
                    <strong className="text-foreground">{po.approved_at ? new Date(po.approved_at).toLocaleString() : "—"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks if present */}
            {po.remarks && (
              <div className="p-4 bg-accent/20 border border-border rounded-xl text-xs text-muted-foreground mb-6">
                <strong className="text-foreground block mb-0.5">PO Remarks / Notes:</strong>
                {po.remarks}
              </div>
            )}

            {/* Line Items Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs mb-8">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-extrabold text-foreground text-base">Ordered Spare Parts Items</h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {po.items?.length || 0} line items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Part Number</th>
                      <th className="py-3 px-4">Part Name</th>
                      <th className="py-3 px-4 text-center">Ordered Qty</th>
                      <th className="py-3 px-4 text-center">Received Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {po.items?.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-extrabold text-primary">{item.spare_part?.part_number}</td>
                        <td className="py-3.5 px-4 font-bold text-foreground">{item.spare_part?.part_name}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-foreground">{item.ordered_quantity}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600">
                          {item.received_quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-foreground">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-accent/10">
                      <td colSpan={6} className="py-3.5 px-4 text-right font-extrabold text-foreground text-sm">
                        Grand Total Amount:
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-primary text-base">
                        {formatCurrency(po.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Goods Receipts Audit Timeline */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-extrabold text-foreground text-base flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-500" />
                  Goods Receipts Log ({po.goods_receipts?.length || 0})
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {!po.goods_receipts || po.goods_receipts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No goods receipts logged yet for this Purchase Order.
                  </div>
                ) : (
                  po.goods_receipts.map((grn) => (
                    <div key={grn.id} className="p-4 border border-border rounded-xl bg-background space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                        <span className="font-extrabold text-emerald-600 text-sm">{grn.grn_number}</span>
                        <div className="text-2xs text-muted-foreground">
                          Received by <strong className="text-foreground">{grn.received_by_username}</strong> on {new Date(grn.received_date).toLocaleString()}
                        </div>
                      </div>
                      {grn.remarks && <div className="text-xs text-muted-foreground italic">Notes: {grn.remarks}</div>}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="py-1 px-2">Part Number</th>
                              <th className="py-1 px-2">Part Name</th>
                              <th className="py-1 px-2 text-center">Qty Received</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grn.items?.map((gItem) => (
                              <tr key={gItem.id} className="border-b border-border/50">
                                <td className="py-1 px-2 font-bold text-primary">{gItem.spare_part_number}</td>
                                <td className="py-1 px-2 font-semibold text-foreground">{gItem.spare_part_name}</td>
                                <td className="py-1 px-2 text-center font-extrabold text-emerald-600">+{gItem.received_quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </PageContainer>
        </div>

        {/* Modal Overlay for Receiving Goods */}
        {isReceiveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-emerald-500" />
                  Record Goods Receipt (PO: {po.po_number})
                </h3>
                <button
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleReceiveSubmit} className="space-y-4">
                {receiveError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-lg">
                    {receiveError}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Received Quantities per Item
                  </label>
                  {po.items.map((item) => {
                    const remaining = item.ordered_quantity - item.received_quantity;

                    return (
                      <div key={item.id} className="p-3 border border-border rounded-lg bg-background flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-sm text-foreground truncate">
                            {item.spare_part?.part_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.spare_part?.part_number} | Ordered: {item.ordered_quantity} | Previously Received: {item.received_quantity} (Rem: {remaining})
                          </div>
                        </div>
                        <div className="w-24 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max={remaining}
                            value={receiveQtys[item.id] || "0"}
                            onChange={(e) =>
                              setReceiveQtys({
                                ...receiveQtys,
                                [item.id]: e.target.value,
                              })
                            }
                            className="text-center h-8 text-xs font-bold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <FormField label="Delivery Remarks / Notes (Optional)">
                  <textarea
                    value={receiveRemarks}
                    onChange={(e) => setReceiveRemarks(e.target.value)}
                    placeholder="e.g. Carrier invoice #9901, received in good condition..."
                    rows={2}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:outline-hidden"
                  />
                </FormField>

                <div className="flex gap-2 justify-end pt-3 border-t border-border mt-4">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsReceiveModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={receiveMutation.isPending}
                    className="cursor-pointer font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {receiveMutation.isPending ? "Processing..." : "Confirm & Save Receipt"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dedicated Printable Purchase Order Document (Visible only when printing) */}
        <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">PURCHASE ORDER</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS ERP Enterprise Systems</div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-black">PO #: {po.po_number}</div>
              <div>Date: {formatDate(po.order_date)}</div>
              <div>Status: {po.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-300 p-3 rounded">
              <strong className="block text-black font-extrabold mb-1">VENDOR / SUPPLIER:</strong>
              <div className="font-bold">{po.supplier?.company_name}</div>
              <div>Code: {po.supplier?.supplier_code}</div>
              <div>Attn: {po.supplier?.contact_person}</div>
              <div>Email: {po.supplier?.email}</div>
              <div>Phone: {po.supplier?.phone}</div>
              <div>GST: {po.supplier?.gst_number || "N/A"}</div>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <strong className="block text-black font-extrabold mb-1">SHIP TO / DETAILS:</strong>
              <div className="font-bold">Main Central Warehouse</div>
              <div>Expected Delivery: {formatDate(po.expected_delivery_date)}</div>
              <div>Created By: {po.created_by_username}</div>
              <div>Approved By: {po.approved_by_username || "N/A"}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">#</th>
                <th className="p-2 border-r border-gray-300">Part Number</th>
                <th className="p-2 border-r border-gray-300">Part Description</th>
                <th className="p-2 border-r border-gray-300 text-center">Qty</th>
                <th className="p-2 border-r border-gray-300 text-right">Unit Price</th>
                <th className="p-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300">{index + 1}</td>
                  <td className="p-2 border-r border-gray-300 font-bold">{item.spare_part?.part_number}</td>
                  <td className="p-2 border-r border-gray-300">{item.spare_part?.part_name}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.ordered_quantity}</td>
                  <td className="p-2 border-r border-gray-300 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-black bg-gray-50">
                <td colSpan={5} className="p-2 text-right border-r border-gray-300">TOTAL AMOUNT:</td>
                <td className="p-2 text-right">{formatCurrency(po.total_amount)}</td>
              </tr>
            </tfoot>
          </table>

          {po.remarks && (
            <div className="mb-6 p-2 border border-gray-300 rounded">
              <strong>Notes:</strong> {po.remarks}
            </div>
          )}

          <div className="mt-12 flex justify-between pt-8 border-t border-gray-400">
            <div className="text-center w-40">
              <div className="border-b border-black mb-1"></div>
              <div>Prepared By</div>
            </div>
            <div className="text-center w-40">
              <div className="border-b border-black mb-1"></div>
              <div>Authorized Signature</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
