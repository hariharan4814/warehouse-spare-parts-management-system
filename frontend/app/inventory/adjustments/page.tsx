"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { inventoryService } from "@/services/inventory";
import { sparePartsService } from "@/services/spare-parts";
import {
  ArrowUpDown,
  Download,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings2,
  X,
} from "lucide-react";

function AdjustmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const actionParam = searchParams.get("action");

  // Filter and Sorting state
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals state
  const [openModal, setOpenModal] = useState(false);
  const [formPartId, setFormPartId] = useState("");
  const [formType, setFormType] = useState("INCREASE");
  const [formQuantity, setFormQuantity] = useState("");
  const [formReason, setFormReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load adjustments
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-adjustments", search, selectedType, page, sortBy, sortOrder],
    queryFn: () =>
      inventoryService.getAdjustments({
        search,
        adjustment_type: selectedType,
        page,
        ordering: `${sortOrder === "desc" ? "-" : ""}${sortBy}`,
      }),
  });

  // Load parts list for select dropdown
  const { data: partsData } = useQuery({
    queryKey: ["parts-for-adjustment-select"],
    queryFn: () => sparePartsService.getParts({ page_size: 1000 }),
  });

  // Handle URL actions
  useEffect(() => {
    if (actionParam === "adjust") {
      setOpenModal(true);
    }
  }, [actionParam]);

  // Clean form inputs
  const resetForm = () => {
    setFormPartId("");
    setFormType("INCREASE");
    setFormQuantity("");
    setFormReason("");
    setValidationError(null);
    setOpenModal(false);
    // Remove query param
    router.replace("/inventory/adjustments");
  };

  // Mutation for creating adjustment
  const createAdjustmentMutation = useMutation({
    mutationFn: (adjData: Record<string, unknown>) => inventoryService.createAdjustment(adjData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      resetForm();
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: { quantity?: string | string[]; detail?: string } } };
      const msg = axiosError.response?.data?.quantity || axiosError.response?.data?.detail || "Failed to save adjustment. Check limits.";
      setValidationError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const canAdjust = isAdmin || isManager;
  const parts = partsData?.results || [];

  // Handle Sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Submit adjustment transaction
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formPartId) {
      setValidationError("Please select a spare part.");
      return;
    }
    const qty = parseInt(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      setValidationError("Quantity must be a positive integer.");
      return;
    }
    if (!formReason.trim()) {
      setValidationError("Reason is required.");
      return;
    }

    const selectedPartObj = parts.find((p) => p.id === parseInt(formPartId));
    if (!selectedPartObj) {
      setValidationError("Selected spare part is invalid.");
      return;
    }

    // Client-side validation: prevent negative inventory
    if (formType === "DECREASE" && qty > selectedPartObj.current_stock) {
      setValidationError(`Insufficient stock. Current on-hand quantity is only ${selectedPartObj.current_stock}.`);
      return;
    }

    const payload: Record<string, unknown> = {
      spare_part_id: parseInt(formPartId),
      adjustment_type: formType,
      quantity: qty,
      reason: formReason,
      approved_by_id: user?.id || null, // Current user approves the audit adjustment
    };

    createAdjustmentMutation.mutate(payload);
  };

  // CSV Export
  const handleCSVExport = () => {
    if (!data?.results || data.results.length === 0) return;

    const headers = [
      "Date",
      "Part Number",
      "Part Name",
      "Adjustment Type",
      "Quantity",
      "Reason",
      "Created By",
      "Approved By",
    ];

    const rows = data.results.map((adj) => [
      new Date(adj.created_at).toLocaleString(),
      adj.spare_part?.part_number || "",
      adj.spare_part?.part_name || "",
      adj.adjustment_type,
      adj.quantity,
      adj.reason,
      adj.created_by_username,
      adj.approved_by_username || "—",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_adjustments_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Stock Adjustments Audit Log"
          subtitle="View and record formal stock audit updates and corrections."
        >
          <Breadcrumb
            items={[
              { label: "Inventory", href: "/inventory" },
              { label: "Stock Adjustments", active: true },
            ]}
          />

          {/* Action Header Grid */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts, reasons..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 border-border bg-background"
                />
              </div>

              <div className="flex items-center gap-1.5 min-w-[150px]">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                >
                  <option value="">All Adjustment Types</option>
                  <option value="INCREASE">Increase</option>
                  <option value="DECREASE">Decrease</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 cursor-pointer border-border w-full sm:w-auto justify-center"
                onClick={handleCSVExport}
                disabled={!data?.results || data.results.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>

              {canAdjust && (
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 cursor-pointer text-white justify-center w-full sm:w-auto font-semibold"
                  onClick={() => setOpenModal(true)}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  New Adjustment
                </Button>
              )}
            </div>
          </div>

          {/* Adjustments Data Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                    <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-1.5">
                        Date / Time
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Part Number</th>
                    <th className="py-3.5 px-4">Part Name</th>
                    <th className="py-3.5 px-4">Adjustment Type</th>
                    <th className="py-3.5 px-4 text-center cursor-pointer hover:text-foreground" onClick={() => handleSort("quantity")}>
                      <div className="flex items-center gap-1.5 justify-center">
                        Quantity
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Logged By</th>
                    <th className="py-3.5 px-4">Approved By</th>
                    <th className="py-3.5 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 w-28 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-10 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-40 bg-accent rounded" /></td>
                      </tr>
                    ))
                  ) : !data || data.results.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Settings2 className="h-12 w-12 text-muted-foreground/30 mb-2" />
                          <h3 className="font-extrabold text-foreground text-base">No adjustments found</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Adjust search queries or create a new correction.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.results.map((adj) => (
                      <tr key={adj.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-muted-foreground text-xs">{formatDate(adj.created_at)}</td>
                        <td className="py-3.5 px-4 font-bold text-primary">{adj.spare_part?.part_number}</td>
                        <td className="py-3.5 px-4 truncate max-w-[180px] font-semibold" title={adj.spare_part?.part_name}>
                          {adj.spare_part?.part_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                              adj.adjustment_type === "INCREASE"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {adj.adjustment_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-foreground">{adj.quantity}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{adj.created_by_username}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{adj.approved_by_username || "—"}</td>
                        <td className="py-3.5 px-4 text-xs max-w-[200px] truncate" title={adj.reason}>{adj.reason}</td>
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
                  Showing {Math.min((page - 1) * 20 + 1, data.count)} to {Math.min(page * 20, data.count)} of {data.count} items
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

          {/* Modal Overlay for Creating Adjustment */}
          {openModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-amber-500" />
                    Create Inventory Adjustment
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {validationError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-lg">
                      {validationError}
                    </div>
                  )}

                  <FormField label="Select Spare Part">
                    <select
                      value={formPartId}
                      onChange={(e) => setFormPartId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- Select Spare Part --</option>
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.part_name} ({p.part_number}) — Stock: {p.current_stock}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Adjustment Type">
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      <option value="INCREASE">Increase (+)</option>
                      <option value="DECREASE">Decrease (-)</option>
                    </select>
                  </FormField>

                  <FormField label="Adjustment Quantity">
                    <input
                      type="number"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    />
                  </FormField>

                  <FormField label="Mandatory Correction Reason">
                    <textarea
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="Specify the reason (e.g. Physical inventory discrepancy, damaged items audit...)"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    />
                  </FormField>

                  <div className="flex gap-2 justify-end pt-3 border-t border-border mt-4">
                    <Button variant="outline" size="sm" type="button" onClick={resetForm} className="cursor-pointer">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                      disabled={createAdjustmentMutation.isPending}
                      className="cursor-pointer text-white font-semibold bg-amber-600 hover:bg-amber-700"
                    >
                      {createAdjustmentMutation.isPending ? "Submitting..." : "Submit Adjustment"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function AdjustmentsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer title="Stock Adjustments Log" subtitle="Loading log elements...">
            <div className="h-80 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      }
    >
      <AdjustmentsContent />
    </Suspense>
  );
}
