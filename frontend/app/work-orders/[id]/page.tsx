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
import { workOrdersService, WorkOrderPriority, WorkOrderStatus } from "@/services/work-orders";
import { warehousesService } from "@/services/warehouses";
import {
  Wrench,
  ArrowLeft,
  Printer,
  PackageCheck,
  Building,
  UserCheck,
  Clock,
  X,
  History,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const woId = parseInt(params.id as string);

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const isKeeper = user?.role === "STORE_KEEPER";
  const canIssue = isAdmin || isManager || isKeeper;

  // Issue Modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [issueQtys, setIssueQtys] = useState<Record<number, string>>({});
  const [issueRemarks, setIssueRemarks] = useState("");
  const [issueError, setIssueError] = useState<string | null>(null);

  // Load Work Order Detail
  const { data: wo, isLoading, error } = useQuery({
    queryKey: ["work-order-detail", woId],
    queryFn: () => workOrdersService.getWorkOrder(woId),
    enabled: !isNaN(woId),
  });

  // Load Active Warehouses for Issuance Modal
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-active-for-issue"],
    queryFn: () => warehousesService.getWarehouses({ status: "ACTIVE", page_size: 1000 }),
    enabled: isIssueModalOpen,
  });

  // Load Issue Transactions for this Work Order
  const { data: issueTxData } = useQuery({
    queryKey: ["work-order-issues", woId],
    queryFn: () => workOrdersService.getIssueTransactions({ work_order: woId, page_size: 1000 }),
    enabled: !isNaN(woId),
  });

  const warehouses = warehousesData?.results || [];
  const issueTransactions = issueTxData?.results || [];

  // Issue Parts Mutation
  const issueMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => workOrdersService.createIssueTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-order-detail", woId] });
      queryClient.invalidateQueries({ queryKey: ["work-order-issues", woId] });
      queryClient.invalidateQueries({ queryKey: ["work-orders-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses-dashboard"] });
      setIsIssueModalOpen(false);
      setSelectedWarehouseId("");
      setIssueQtys({});
      setIssueRemarks("");
      setIssueError(null);
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: { items?: string | string[]; detail?: string } } };
      const msg = axiosError.response?.data?.items || axiosError.response?.data?.detail || "Failed to issue spare parts.";
      setIssueError(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  const getPriorityBadge = (priority?: WorkOrderPriority) => {
    switch (priority) {
      case "LOW":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-neutral-500/10 text-neutral-500">Low</span>;
      case "MEDIUM":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-500/10 text-blue-600">Medium</span>;
      case "HIGH":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500/10 text-amber-600">High</span>;
      case "CRITICAL":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Critical</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: WorkOrderStatus) => {
    switch (status) {
      case "OPEN":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500/10 text-amber-600">Open</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-500/10 text-blue-600">In Progress</span>;
      case "COMPLETED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600">Completed</span>;
      case "CANCELLED":
        return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-500/10 text-rose-600">Cancelled</span>;
      default:
        return null;
    }
  };

  const openIssueModal = () => {
    if (!wo) return;
    const initial: Record<number, string> = {};
    wo.items.forEach((item) => {
      const remaining = item.requested_quantity - item.issued_quantity;
      initial[item.spare_part.id] = remaining > 0 ? String(remaining) : "0";
    });
    setIssueQtys(initial);
    setIssueRemarks("");
    setIssueError(null);
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError(null);

    if (!selectedWarehouseId) {
      setIssueError("Please select the Warehouse from which stock is issued.");
      return;
    }

    if (!wo) return;

    const items = [];
    for (const item of wo.items) {
      const qty = parseInt(issueQtys[item.spare_part.id] || "0");
      if (qty > 0) {
        items.push({
          spare_part_id: item.spare_part.id,
          quantity: qty,
        });
      }
    }

    if (items.length === 0) {
      setIssueError("Please enter a quantity greater than zero for at least one part.");
      return;
    }

    issueMutation.mutate({
      work_order_id: wo.id,
      warehouse_id: parseInt(selectedWarehouseId),
      remarks: issueRemarks || null,
      items,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Work Order Detail" subtitle="Loading work order records...">
            <div className="h-96 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !wo) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Work Order Not Found" subtitle="Error loading record.">
            <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl mb-4">
              The requested Work Order could not be retrieved.
            </div>
            <Button variant="outline" onClick={() => router.push("/work-orders")} className="cursor-pointer">
              Back to Work Orders
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
            title={`Work Order: ${wo.work_order_number}`}
            subtitle={wo.title}
          >
            <Breadcrumb
              items={[
                { label: "Work Orders", href: "/work-orders" },
                { label: wo.work_order_number, active: true },
              ]}
            />

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/work-orders")}
                className="gap-1.5 h-9 text-xs cursor-pointer border-border"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Work Orders
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-9 gap-1.5 cursor-pointer border-border font-semibold"
                >
                  <Printer className="h-4 w-4" />
                  Print Work Order
                </Button>

                {canIssue && wo.status !== "COMPLETED" && wo.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    onClick={openIssueModal}
                    className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    <PackageCheck className="h-4 w-4" />
                    Issue Spare Parts
                  </Button>
                )}
              </div>
            </div>

            {/* Metadata Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Card 1: Status & Priority */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    Status & Priority
                  </h4>
                  {getStatusBadge(wo.status)}
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>Priority Level:</span>
                    {getPriorityBadge(wo.priority)}
                  </div>
                  <div className="flex justify-between">
                    <span>WO Number:</span>
                    <strong className="text-foreground">{wo.work_order_number}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Created Date:</span>
                    <strong className="text-foreground">{new Date(wo.created_at).toLocaleDateString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed At:</span>
                    <strong className="text-foreground">{wo.completed_at ? new Date(wo.completed_at).toLocaleString() : "—"}</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Equipment & Location */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    Equipment & Location
                  </h4>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    Equipment: <strong className="text-foreground text-sm block font-extrabold">{wo.equipment_name || "Unspecified Equipment"}</strong>
                  </div>
                  <div>
                    Location: <strong className="text-foreground font-semibold">{wo.location || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Assignment & Audit */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Assignment & Staff
                  </h4>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Assigned Tech:</span>
                    <strong className="text-foreground">{wo.assigned_technician?.username || "Unassigned"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Created By:</span>
                    <strong className="text-foreground">{wo.created_by_username}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {wo.description && (
              <div className="p-4 bg-accent/20 border border-border rounded-xl text-xs text-muted-foreground mb-6">
                <strong className="text-foreground block mb-0.5">Work Description:</strong>
                {wo.description}
              </div>
            )}

            {/* Requested vs Issued Items Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs mb-8">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-extrabold text-foreground text-base">Requested Spare Parts</h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {wo.items?.length || 0} line items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Part Number</th>
                      <th className="py-3 px-4">Part Name</th>
                      <th className="py-3 px-4 text-center">Requested Qty</th>
                      <th className="py-3 px-4 text-center">Issued Qty</th>
                      <th className="py-3 px-4 text-center">Remaining</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {wo.items?.map((item, idx) => {
                      const remaining = item.requested_quantity - item.issued_quantity;
                      const isFulfilled = remaining <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-muted-foreground">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-extrabold text-primary">{item.spare_part?.part_number}</td>
                          <td className="py-3.5 px-4 font-bold text-foreground">{item.spare_part?.part_name}</td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-foreground">{item.requested_quantity}</td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600">{item.issued_quantity}</td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-amber-600">{Math.max(0, remaining)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                                isFulfilled
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : item.issued_quantity > 0
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {isFulfilled ? "Fulfilled" : item.issued_quantity > 0 ? "Partial" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Issue Transactions History */}
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-extrabold text-foreground text-base flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-500" />
                  Parts Issuance History ({issueTransactions.length})
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {issueTransactions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No parts issued yet for this Work Order.
                  </div>
                ) : (
                  issueTransactions.map((iss) => (
                    <div key={iss.id} className="p-4 border border-border rounded-xl bg-background space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                        <span className="font-extrabold text-emerald-600 text-sm">{iss.issue_number}</span>
                        <div className="text-2xs text-muted-foreground">
                          Issued from <strong className="text-foreground">{iss.warehouse_name}</strong> by <strong className="text-foreground">{iss.issued_by_username}</strong> on {new Date(iss.issued_at).toLocaleString()}
                        </div>
                      </div>
                      {iss.remarks && <div className="text-xs text-muted-foreground italic">Remarks: {iss.remarks}</div>}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="py-1 px-2">Part Number</th>
                              <th className="py-1 px-2">Part Name</th>
                              <th className="py-1 px-2 text-center">Qty Issued</th>
                            </tr>
                          </thead>
                          <tbody>
                            {iss.items?.map((gItem) => (
                              <tr key={gItem.id} className="border-b border-border/50">
                                <td className="py-1 px-2 font-bold text-primary">{gItem.spare_part_number}</td>
                                <td className="py-1 px-2 font-semibold text-foreground">{gItem.spare_part_name}</td>
                                <td className="py-1 px-2 text-center font-extrabold text-emerald-600">-{gItem.quantity}</td>
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

        {/* Modal Overlay for Issuing Spare Parts */}
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-emerald-500" />
                  Issue Spare Parts (WO: {wo.work_order_number})
                </h3>
                <button
                  onClick={() => setIsIssueModalOpen(false)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-4">
                {issueError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-lg">
                    {issueError}
                  </div>
                )}

                <FormField label="Select Warehouse Facility *">
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                    required
                  >
                    <option value="">-- Choose Warehouse --</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.warehouse_code}) — {wh.city}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Part Issuance Quantities
                  </label>
                  {wo.items.map((item) => {
                    const remaining = item.requested_quantity - item.issued_quantity;

                    return (
                      <div key={item.id} className="p-3 border border-border rounded-lg bg-background flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-sm text-foreground truncate">
                            {item.spare_part?.part_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.spare_part?.part_number} | Req: {item.requested_quantity} | Issued: {item.issued_quantity} (Rem: {remaining})
                          </div>
                        </div>
                        <div className="w-24 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max={remaining}
                            value={issueQtys[item.spare_part.id] || "0"}
                            onChange={(e) =>
                              setIssueQtys({
                                ...issueQtys,
                                [item.spare_part.id]: e.target.value,
                              })
                            }
                            className="text-center h-8 text-xs font-bold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <FormField label="Issuance Remarks / Notes (Optional)">
                  <textarea
                    value={issueRemarks}
                    onChange={(e) => setIssueRemarks(e.target.value)}
                    placeholder="e.g. Issued for emergency pump repair..."
                    rows={2}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:outline-hidden"
                  />
                </FormField>

                <div className="flex gap-2 justify-end pt-3 border-t border-border mt-4">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsIssueModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={issueMutation.isPending}
                    className="cursor-pointer font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {issueMutation.isPending ? "Processing..." : "Confirm Parts Issuance"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dedicated Printable Work Order Document (Visible only when printing) */}
        <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">MAINTENANCE WORK ORDER</h1>
              <div className="text-sm font-bold text-gray-700">WSPMS ERP Systems</div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-black">WO #: {wo.work_order_number}</div>
              <div>Date: {new Date(wo.created_at).toLocaleDateString()}</div>
              <div>Priority: {wo.priority} | Status: {wo.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-300 p-3 rounded">
              <strong className="block text-black font-extrabold mb-1">WORK ORDER DETAILS:</strong>
              <div className="font-bold">Title: {wo.title}</div>
              <div>Equipment: {wo.equipment_name || "N/A"}</div>
              <div>Location: {wo.location || "N/A"}</div>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <strong className="block text-black font-extrabold mb-1">ASSIGNMENT:</strong>
              <div>Assigned Technician: {wo.assigned_technician?.username || "Unassigned"}</div>
              <div>Created By: {wo.created_by_username}</div>
              <div>Completed At: {wo.completed_at ? new Date(wo.completed_at).toLocaleString() : "N/A"}</div>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                <th className="p-2 border-r border-gray-300">#</th>
                <th className="p-2 border-r border-gray-300">Part Number</th>
                <th className="p-2 border-r border-gray-300">Part Description</th>
                <th className="p-2 border-r border-gray-300 text-center">Requested Qty</th>
                <th className="p-2 text-center">Issued Qty</th>
              </tr>
            </thead>
            <tbody>
              {wo.items?.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300">{index + 1}</td>
                  <td className="p-2 border-r border-gray-300 font-bold">{item.spare_part?.part_number}</td>
                  <td className="p-2 border-r border-gray-300">{item.spare_part?.part_name}</td>
                  <td className="p-2 border-r border-gray-300 text-center">{item.requested_quantity}</td>
                  <td className="p-2 text-center font-bold">{item.issued_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {wo.description && (
            <div className="mb-6 p-2 border border-gray-300 rounded">
              <strong>Work Description:</strong> {wo.description}
            </div>
          )}

          <div className="mt-12 flex justify-between pt-8 border-t border-gray-400">
            <div className="text-center w-36">
              <div className="border-b border-black mb-1"></div>
              <div>Technician Signature</div>
            </div>
            <div className="text-center w-36">
              <div className="border-b border-black mb-1"></div>
              <div>Warehouse Issuer</div>
            </div>
            <div className="text-center w-36">
              <div className="border-b border-black mb-1"></div>
              <div>Supervisor Approval</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
