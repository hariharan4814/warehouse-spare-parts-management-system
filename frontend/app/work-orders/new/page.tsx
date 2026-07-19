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
import { workOrdersService, WorkOrderPriority } from "@/services/work-orders";
import { sparePartsService } from "@/services/spare-parts";
import { apiClient } from "@/lib/api-client";
import {
  Wrench,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Send,
} from "lucide-react";

type LineItem = {
  spare_part_id: string;
  requested_quantity: string;
};

type UserOption = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
};

export default function CreateWorkOrderPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("MEDIUM");
  const [equipmentName, setEquipmentName] = useState("");
  const [location, setLocation] = useState("");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { spare_part_id: "", requested_quantity: "1" },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load Technicians
  const { data: usersData } = useQuery({
    queryKey: ["users-for-assignment"],
    queryFn: async () => {
      const res = await apiClient.get<{ results: UserOption[] }>("/auth/users/");
      return res.data;
    },
  });

  // Load Spare Parts
  const { data: partsData } = useQuery({
    queryKey: ["parts-for-wo-select"],
    queryFn: () => sparePartsService.getParts({ page_size: 1000 }),
  });

  const users = usersData?.results || [];
  const parts = partsData?.results || [];

  const addLineItem = () => {
    setLineItems([...lineItems, { spare_part_id: "", requested_quantity: "1" }]);
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

  // Mutation for creating Work Order
  const createWOMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => workOrdersService.createWorkOrder(payload),
    onSuccess: (newWO) => {
      router.push(`/work-orders/${newWO.id}`);
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: Record<string, unknown> } };
      if (axiosError.response?.data) {
        setValidationError(JSON.stringify(axiosError.response.data));
      } else {
        setValidationError("Failed to create Work Order. Check required fields.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError("Work Order Title is required.");
      return;
    }

    const formattedItems = [];
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (item.spare_part_id) {
        const qty = parseInt(item.requested_quantity);
        if (isNaN(qty) || qty <= 0) {
          setValidationError(`Line #${i + 1}: Quantity must be a positive integer.`);
          return;
        }
        formattedItems.push({
          spare_part_id: parseInt(item.spare_part_id),
          requested_quantity: qty,
        });
      }
    }

    const payload = {
      title,
      description: description || null,
      priority,
      equipment_name: equipmentName || null,
      location: location || null,
      assigned_technician_id: assignedTechnicianId ? parseInt(assignedTechnicianId) : null,
      items: formattedItems,
    };

    createWOMutation.mutate(payload);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Create Maintenance Work Order"
          subtitle="Submit a new work order request and specify required spare parts."
        >
          <Breadcrumb
            items={[
              { label: "Work Orders", href: "/work-orders" },
              { label: "New Work Order", active: true },
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Work Order Info */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
                  <Wrench className="h-5 w-5 text-primary" />
                  Work Order Details
                </h3>

                <FormField label="Work Order Title *">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Overhaul Hydraulic Motor on Conveyor B"
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Priority Level">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </FormField>

                  <FormField label="Equipment Name">
                    <Input
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      placeholder="e.g. CNC Lathe Machine #4"
                    />
                  </FormField>

                  <FormField label="Work Location / Bay">
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Assembly Plant 2, Section C"
                    />
                  </FormField>
                </div>

                <FormField label="Assign Technician (Optional)">
                  <select
                    value={assignedTechnicianId}
                    onChange={(e) => setAssignedTechnicianId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.first_name} {u.last_name}) — {u.role}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Work Description / Problem Summary">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe breakdown symptoms, safety precautions, maintenance steps..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-sm focus:outline-hidden"
                  />
                </FormField>
              </div>

              {/* Requested Line Items Card */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-extrabold text-foreground text-base">Requested Spare Parts</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addLineItem}
                    className="h-8 gap-1 text-xs border-border cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Spare Part
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border bg-accent/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Spare Part</th>
                        <th className="py-2.5 px-3 w-36 text-center">Requested Qty</th>
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
                              value={item.requested_quantity}
                              onChange={(e) => updateLineItem(idx, "requested_quantity", e.target.value)}
                              className="text-center h-9 font-bold"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Button
                              type="button"
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

              {/* Submit Buttons */}
              <div className="flex flex-wrap gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/work-orders")}
                  className="cursor-pointer border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createWOMutation.isPending}
                  className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {createWOMutation.isPending ? "Creating..." : "Submit Work Order"}
                </Button>
              </div>
            </form>
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
