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
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  History,
  X,
} from "lucide-react";

function MovementsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // URL actions handler
  const actionParam = searchParams.get("action");

  // Filter and Sorting state
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRefType, setSelectedRefType] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals state
  const [openModal, setOpenModal] = useState<"STOCK_IN" | "STOCK_OUT" | "STOCK_TRANSFER" | null>(null);
  const [formPartId, setFormPartId] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formRefType, setFormRefType] = useState("");
  const [formRefNum, setFormRefNum] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formNewLocationId, setFormNewLocationId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load movements
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-movements", search, selectedType, selectedRefType, page, sortBy, sortOrder],
    queryFn: () =>
      inventoryService.getMovements({
        search,
        movement_type: selectedType,
        reference_type: selectedRefType,
        page,
        ordering: `${sortOrder === "desc" ? "-" : ""}${sortBy}`,
      }),
  });

  // Load parts list for select dropdown
  const { data: partsData } = useQuery({
    queryKey: ["parts-for-movement-select"],
    queryFn: () => sparePartsService.getParts({ page_size: 1000 }),
  });

  // Load locations list for transfer select
  const { data: locations } = useQuery({
    queryKey: ["locations-for-transfer-select"],
    queryFn: () => sparePartsService.getLocations(),
  });

  // Handle URL actions mapping to modals
  useEffect(() => {
    if (actionParam === "stock_in") {
      setOpenModal("STOCK_IN");
      setFormRefType("PURCHASE");
    } else if (actionParam === "stock_out") {
      setOpenModal("STOCK_OUT");
      setFormRefType("ISSUE");
    } else if (actionParam === "stock_transfer") {
      setOpenModal("STOCK_TRANSFER");
      setFormRefType("TRANSFER");
    }
  }, [actionParam]);

  // Clean form inputs
  const resetForm = () => {
    setFormPartId("");
    setFormQuantity("");
    setFormReason("");
    setFormRefType("");
    setFormRefNum("");
    setFormRemarks("");
    setFormNewLocationId("");
    setValidationError(null);
    setOpenModal(null);
    // Remove query param
    router.replace("/inventory/movements");
  };

  // Mutation for creating movement
  const createMovementMutation = useMutation({
    mutationFn: (txData: Record<string, unknown>) => inventoryService.createMovement(txData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      resetForm();
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: { quantity?: string | string[]; detail?: string } } };
      const msg = axiosError.response?.data?.quantity || axiosError.response?.data?.detail || "Failed to log movement. Verify details.";
      setValidationError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const isTechnician = user?.role === "TECHNICIAN";
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

  // Submit stock transaction
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
    if (openModal === "STOCK_OUT" || openModal === "STOCK_TRANSFER") {
      if (qty > selectedPartObj.current_stock) {
        setValidationError(`Insufficient stock. Current on-hand quantity is only ${selectedPartObj.current_stock}.`);
        return;
      }
    }

    if (openModal === "STOCK_TRANSFER" && !formNewLocationId) {
      setValidationError("Please select the target storage location.");
      return;
    }

    const payload: Record<string, unknown> = {
      spare_part_id: parseInt(formPartId),
      movement_type: openModal,
      quantity: qty,
      reason: formReason,
      reference_type: formRefType || undefined,
      reference_number: formRefNum || null,
      remarks: formRemarks || null,
    };

    if (openModal === "STOCK_TRANSFER") {
      payload.new_storage_location_id = parseInt(formNewLocationId);
    }

    createMovementMutation.mutate(payload);
  };

  // CSV Export
  const handleCSVExport = () => {
    if (!data?.results || data.results.length === 0) return;

    const headers = [
      "Date",
      "Part Number",
      "Part Name",
      "Movement Type",
      "Reference Type",
      "Quantity",
      "Previous Stock",
      "New Stock",
      "User",
      "Reference",
      "Remarks",
    ];

    const rows = data.results.map((tx) => [
      new Date(tx.created_at).toLocaleString(),
      tx.spare_part?.part_number || "",
      tx.spare_part?.part_name || "",
      tx.movement_type,
      tx.reference_type || "",
      tx.quantity,
      tx.previous_stock,
      tx.new_stock,
      tx.performed_by_username,
      tx.reference_number || "",
      tx.remarks || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_movements_export_${Date.now()}.csv`);
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
          title="Stock Movements Audit Log"
          subtitle="View and record additions, issues, and transfers of spare parts stock."
        >
          <Breadcrumb
            items={[
              { label: "Inventory", href: "/inventory" },
              { label: "Stock Movements", active: true },
            ]}
          />

          {/* Action Header Grid */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-card p-4 rounded-xl border border-border shadow-xs">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts, refs..."
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
                  <option value="">All Movement Types</option>
                  <option value="STOCK_IN">Stock In</option>
                  <option value="STOCK_OUT">Stock Out</option>
                  <option value="STOCK_TRANSFER">Stock Transfer</option>
                  <option value="STOCK_ADJUSTMENT">Adjustments</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 min-w-[150px]">
                <select
                  value={selectedRefType}
                  onChange={(e) => {
                    setSelectedRefType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                >
                  <option value="">All Ref Types</option>
                  <option value="PURCHASE">Purchase</option>
                  <option value="ISSUE">Issue</option>
                  <option value="RETURN">Return</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
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

              {!isTechnician && (
                <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="h-9 gap-1 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white justify-center text-xs"
                    onClick={() => setOpenModal("STOCK_IN")}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Stock In
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 gap-1 bg-rose-600 hover:bg-rose-700 cursor-pointer text-white justify-center text-xs"
                    onClick={() => setOpenModal("STOCK_OUT")}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Stock Out
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 gap-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white justify-center text-xs"
                    onClick={() => setOpenModal("STOCK_TRANSFER")}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                    Transfer
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Movements Data Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[950px]">
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
                    <th className="py-3.5 px-4">Movement Type</th>
                    <th className="py-3.5 px-4 text-center cursor-pointer hover:text-foreground" onClick={() => handleSort("quantity")}>
                      <div className="flex items-center gap-1.5 justify-center">
                        Quantity
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">Previous Stock</th>
                    <th className="py-3.5 px-4 text-center">New Stock</th>
                    <th className="py-3.5 px-4">Performed By</th>
                    <th className="py-3.5 px-4">Ref Type</th>
                    <th className="py-3.5 px-4">Reference Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 w-28 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-10 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-10 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-10 bg-accent rounded mx-auto" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                      </tr>
                    ))
                  ) : !data || data.results.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <History className="h-12 w-12 text-muted-foreground/30 mb-2" />
                          <h3 className="font-extrabold text-foreground text-base">No movements recorded</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Try adjusting search query or filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.results.map((tx) => (
                      <tr key={tx.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-muted-foreground text-xs">{formatDate(tx.created_at)}</td>
                        <td className="py-3.5 px-4 font-bold text-primary">{tx.spare_part?.part_number}</td>
                        <td className="py-3.5 px-4 truncate max-w-[150px] font-semibold" title={tx.spare_part?.part_name}>
                          {tx.spare_part?.part_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                              tx.movement_type === "STOCK_IN"
                                ? "bg-blue-500/10 text-blue-600"
                                : tx.movement_type === "STOCK_OUT"
                                ? "bg-rose-500/10 text-rose-600"
                                : tx.movement_type === "STOCK_TRANSFER"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {tx.movement_type.replace("STOCK_", "").replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-foreground">{tx.quantity}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-muted-foreground">{tx.previous_stock}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-foreground">{tx.new_stock}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{tx.performed_by_username}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                          {tx.reference_type || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">{tx.reference_number || "—"}</td>
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

          {/* Modal Overlay for Stock In, Out, Transfer */}
          {openModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    {openModal === "STOCK_IN" && <ArrowDownLeft className="h-5 w-5 text-blue-500" />}
                    {openModal === "STOCK_OUT" && <ArrowUpRight className="h-5 w-5 text-rose-500" />}
                    {openModal === "STOCK_TRANSFER" && <ArrowLeftRight className="h-5 w-5 text-emerald-500" />}
                    {openModal === "STOCK_IN" ? "Record Stock In" : openModal === "STOCK_OUT" ? "Record Stock Out" : "Record Stock Transfer"}
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

                  <FormField label="Quantity">
                    <input
                      type="number"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    />
                  </FormField>

                  <FormField label="Reference Type">
                    <select
                      value={formRefType}
                      onChange={(e) => setFormRefType(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      <option value="PURCHASE">Purchase</option>
                      <option value="ISSUE">Issue</option>
                      <option value="RETURN">Return</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="ADJUSTMENT">Adjustment</option>
                    </select>
                  </FormField>

                  {openModal === "STOCK_TRANSFER" && (
                    <FormField label="Target Storage Location">
                      <select
                        value={formNewLocationId}
                        onChange={(e) => setFormNewLocationId(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                      >
                        <option value="">-- Select New Location --</option>
                        {locations?.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.warehouse} | Rack {l.rack}, Shelf {l.shelf}, Bin {l.bin}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}

                  <FormField label="Reason (Audit Log)">
                    <input
                      type="text"
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="e.g. Received PO-1029, Maintenance request..."
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    />
                  </FormField>

                  <FormField label="Reference Number (Optional)">
                    <input
                      type="text"
                      value={formRefNum}
                      onChange={(e) => setFormRefNum(e.target.value)}
                      placeholder="e.g. PO-1029, REQ-204"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                    />
                  </FormField>

                  <FormField label="Remarks (Optional)">
                    <textarea
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      placeholder="Specify carrier details, damaged box notations, etc."
                      rows={2}
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
                      disabled={createMovementMutation.isPending}
                      className={`cursor-pointer text-white font-semibold ${
                        openModal === "STOCK_IN"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : openModal === "STOCK_OUT"
                          ? "bg-rose-600 hover:bg-rose-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {createMovementMutation.isPending ? "Logging..." : "Confirm & Save"}
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

export default function MovementsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <PageContainer title="Stock Movements Log" subtitle="Loading log elements...">
            <div className="h-80 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      }
    >
      <MovementsContent />
    </Suspense>
  );
}
