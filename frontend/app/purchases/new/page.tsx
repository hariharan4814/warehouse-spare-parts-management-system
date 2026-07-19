"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { suppliersService } from "@/services/suppliers";
import { sparePartsService } from "@/services/spare-parts";
import { purchasesService } from "@/services/purchases";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowLeft,
  Calculator,
  Save,
  Send,
} from "lucide-react";

type LineItem = {
  spare_part_id: string;
  ordered_quantity: string;
  unit_price: string;
};

export default function CreatePurchaseOrderPage() {
  const router = useRouter();

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { spare_part_id: "", ordered_quantity: "1", unit_price: "0.00" },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load Active Suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-active-select"],
    queryFn: () => suppliersService.getSuppliers({ status: "ACTIVE", page_size: 1000 }),
  });

  // Load Spare Parts
  const { data: partsData } = useQuery({
    queryKey: ["parts-for-po-select"],
    queryFn: () => sparePartsService.getParts({ page_size: 1000 }),
  });

  const suppliers = suppliersData?.results || [];
  const parts = partsData?.results || [];

  // Line item manipulation
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { spare_part_id: "", ordered_quantity: "1", unit_price: "0.00" },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, val: string) => {
    const updated = [...lineItems];
    updated[index][field] = val;

    // Auto-fill cost price if spare part selected
    if (field === "spare_part_id" && val) {
      const pObj = parts.find((p) => p.id === parseInt(val));
      if (pObj && pObj.cost_price) {
        updated[index].unit_price = String(pObj.cost_price);
      }
    }

    setLineItems(updated);
  };

  // Grand Total Calculation
  const grandTotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.ordered_quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  // Format Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  // Mutation for creating PO
  const createPOMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => purchasesService.createOrder(payload),
    onSuccess: async (newPO, variables) => {
      // If user selected submit for approval, call submit endpoint
      const isSubmitAction = (variables as { submit_for_approval?: boolean }).submit_for_approval;
      if (isSubmitAction) {
        await purchasesService.submitOrder(newPO.id);
      }
      router.push(`/purchase-orders/${newPO.id}`);
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: Record<string, unknown> } };
      if (axiosError.response?.data) {
        setValidationError(JSON.stringify(axiosError.response.data));
      } else {
        setValidationError("Failed to create Purchase Order. Verify all required fields.");
      }
    },
  });

  const handleSave = (submitForApproval: boolean) => {
    setValidationError(null);

    if (!supplierId) {
      setValidationError("Please select a Supplier.");
      return;
    }

    if (lineItems.length === 0) {
      setValidationError("Please add at least one line item.");
      return;
    }

    const formattedItems = [];
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.spare_part_id) {
        setValidationError(`Line #${i + 1}: Please select a spare part.`);
        return;
      }
      const qty = parseInt(item.ordered_quantity);
      if (isNaN(qty) || qty <= 0) {
        setValidationError(`Line #${i + 1}: Quantity must be a positive integer.`);
        return;
      }
      const price = parseFloat(item.unit_price);
      if (isNaN(price) || price < 0) {
        setValidationError(`Line #${i + 1}: Unit price must be a valid non-negative number.`);
        return;
      }

      formattedItems.push({
        spare_part_id: parseInt(item.spare_part_id),
        ordered_quantity: qty,
        unit_price: price.toFixed(2),
      });
    }

    const payload = {
      supplier_id: parseInt(supplierId),
      order_date: orderDate,
      expected_delivery_date: expectedDeliveryDate || null,
      remarks: remarks || null,
      items: formattedItems,
      submit_for_approval: submitForApproval,
    };

    createPOMutation.mutate(payload);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Create Purchase Order"
          subtitle="Generate a new vendor purchase order with line items and cost estimations."
        >
          <Breadcrumb
            items={[
              { label: "Purchase Orders", href: "/purchase-orders" },
              { label: "New Order", active: true },
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

          <div className="space-y-6 max-w-5xl">
            {validationError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-bold rounded-xl">
                {validationError}
              </div>
            )}

            {/* General PO Information Header */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Purchase Order Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Select Supplier *">
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">-- Choose Vendor / Supplier --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.company_name} ({sup.supplier_code})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Order Date *">
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </FormField>

                <FormField label="Expected Delivery Date">
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Remarks / Notes (Optional)">
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Payment terms, shipping instructions, project references..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:outline-hidden"
                />
              </FormField>
            </div>

            {/* Line Items Table */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-extrabold text-foreground text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Line Items
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addLineItem}
                  className="h-8 gap-1 text-xs border-border cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Line Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3">Spare Part *</th>
                      <th className="py-2.5 px-3 w-32 text-center">Qty *</th>
                      <th className="py-2.5 px-3 w-36 text-right">Unit Price ($) *</th>
                      <th className="py-2.5 px-3 w-36 text-right">Line Total</th>
                      <th className="py-2.5 px-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lineItems.map((item, idx) => {
                      const qty = parseFloat(item.ordered_quantity) || 0;
                      const price = parseFloat(item.unit_price) || 0;
                      const lineTotal = qty * price;

                      return (
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
                              value={item.ordered_quantity}
                              onChange={(e) => updateLineItem(idx, "ordered_quantity", e.target.value)}
                              className="text-center h-9"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(idx, "unit_price", e.target.value)}
                              className="text-right h-9"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-foreground">
                            {formatCurrency(lineTotal)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grand Total Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  * Prices are calculated based on unit prices entered.
                </div>
                <div className="flex items-center gap-3 text-base font-extrabold text-foreground mt-2 sm:mt-0">
                  <span>Grand Total:</span>
                  <span className="text-xl text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Action Submit Buttons */}
            <div className="flex flex-wrap gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/purchase-orders")}
                className="cursor-pointer border-border"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={createPOMutation.isPending}
                onClick={() => handleSave(false)}
                className="gap-1.5 cursor-pointer border-border font-semibold"
              >
                <Save className="h-4 w-4" />
                {createPOMutation.isPending ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                disabled={createPOMutation.isPending}
                onClick={() => handleSave(true)}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {createPOMutation.isPending ? "Submitting..." : "Save & Submit for Approval"}
              </Button>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
