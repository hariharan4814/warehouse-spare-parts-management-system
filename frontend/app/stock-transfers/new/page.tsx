"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { warehousesService } from "@/services/warehouses";
import { sparePartsService } from "@/services/spare-parts";
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Send,
} from "lucide-react";

type LineItem = {
  spare_part_id: string;
  quantity: string;
};

export default function CreateStockTransferPage() {
  const router = useRouter();

  // Form State
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { spare_part_id: "", quantity: "1" },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load Active Warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-active-select"],
    queryFn: () => warehousesService.getWarehouses({ status: "ACTIVE", page_size: 1000 }),
  });

  // Load Spare Parts
  const { data: partsData } = useQuery({
    queryKey: ["parts-for-transfer-select"],
    queryFn: () => sparePartsService.getParts({ page_size: 1000 }),
  });

  const warehouses = warehousesData?.results || [];
  const parts = partsData?.results || [];

  const addLineItem = () => {
    setLineItems([...lineItems, { spare_part_id: "", quantity: "1" }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, val: string) => {
    const updated = [...lineItems];
    updated[index][field] = val;
    setLineItems(updated);
  };

  // Mutation for creating Transfer
  const createTransferMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => warehousesService.createTransfer(payload),
    onSuccess: async (newTrf, variables) => {
      const isSubmitAction = (variables as { submit_for_approval?: boolean }).submit_for_approval;
      if (isSubmitAction) {
        await warehousesService.submitTransfer(newTrf.id);
      }
      router.push(`/stock-transfers/${newTrf.id}`);
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: Record<string, unknown> } };
      if (axiosError.response?.data) {
        const dataObj = axiosError.response.data;
        const msg = dataObj.destination_warehouse_id || dataObj.items || dataObj.detail || JSON.stringify(dataObj);
        setValidationError(Array.isArray(msg) ? msg[0] : String(msg));
      } else {
        setValidationError("Failed to create Stock Transfer. Please check inputs.");
      }
    },
  });

  const handleSave = (submitForApproval: boolean) => {
    setValidationError(null);

    if (!sourceWarehouseId) {
      setValidationError("Please select the Source Warehouse.");
      return;
    }
    if (!destinationWarehouseId) {
      setValidationError("Please select the Destination Warehouse.");
      return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      setValidationError("Source and Destination Warehouses cannot be the same.");
      return;
    }

    if (lineItems.length === 0) {
      setValidationError("Please add at least one item to transfer.");
      return;
    }

    const formattedItems = [];
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.spare_part_id) {
        setValidationError(`Line #${i + 1}: Please select a spare part.`);
        return;
      }
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        setValidationError(`Line #${i + 1}: Quantity must be a positive integer.`);
        return;
      }

      formattedItems.push({
        spare_part_id: parseInt(item.spare_part_id),
        quantity: qty,
      });
    }

    const payload = {
      source_warehouse_id: parseInt(sourceWarehouseId),
      destination_warehouse_id: parseInt(destinationWarehouseId),
      remarks: remarks || null,
      items: formattedItems,
      submit_for_approval: submitForApproval,
    };

    createTransferMutation.mutate(payload);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Create Stock Transfer"
          subtitle="Wizard for transferring spare parts inventory between regional warehouses."
        >
          <Breadcrumb
            items={[
              { label: "Stock Transfers", href: "/stock-transfers" },
              { label: "New Transfer", active: true },
            ]}
          />

          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5 h-8 text-xs cursor-pointer border-border"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to List
            </Button>
          </div>

          <div className="space-y-6 max-w-4xl">
            {validationError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-bold rounded-xl">
                {validationError}
              </div>
            )}

            {/* Warehouse Selector Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                Transfer Warehouse Route
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Source Warehouse (From) *">
                  <select
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">-- Select Source Warehouse --</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.warehouse_code}) — {wh.city}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Destination Warehouse (To) *">
                  <select
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">-- Select Destination Warehouse --</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id} disabled={String(wh.id) === sourceWarehouseId}>
                        {wh.name} ({wh.warehouse_code}) — {wh.city}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Remarks / Transfer Reason (Optional)">
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Specify stock balancing reason, urgent maintenance, carrier notes..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:outline-hidden"
                />
              </FormField>
            </div>

            {/* Line Items Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-extrabold text-foreground text-base">Items to Transfer</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addLineItem}
                  className="h-8 gap-1 text-xs border-border cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3">Spare Part *</th>
                      <th className="py-2.5 px-3 w-36 text-center">Transfer Qty *</th>
                      <th className="py-2.5 px-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-accent/10">
                        <td className="py-3 px-3 text-center font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <select
                            value={item.spare_part_id}
                            onChange={(e) => updateLineItem(idx, "spare_part_id", e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                          >
                            <option value="">-- Select Spare Part --</option>
                            {parts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.part_name} ({p.part_number}) — Stock: {p.current_stock}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                            className="text-center h-9 font-bold"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={lineItems.length <= 1}
                            onClick={() => removeLineItem(idx)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/stock-transfers")}
                className="cursor-pointer border-border"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={createTransferMutation.isPending}
                onClick={() => handleSave(false)}
                className="gap-1.5 cursor-pointer border-border font-semibold"
              >
                <Save className="h-4 w-4" />
                {createTransferMutation.isPending ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                disabled={createTransferMutation.isPending}
                onClick={() => handleSave(true)}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {createTransferMutation.isPending ? "Submitting..." : "Save & Submit Transfer"}
              </Button>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
