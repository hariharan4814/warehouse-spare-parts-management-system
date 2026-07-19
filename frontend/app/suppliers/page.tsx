"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { suppliersService, Supplier } from "@/services/suppliers";
import {
  Truck,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function SuppliersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const canManage = isAdmin || isManager;

  // Filter & Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("USA");
  const [postalCode, setPostalCode] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [statusVal, setStatusVal] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Load Dashboard Summary
  const { data: dashboard } = useQuery({
    queryKey: ["suppliers-dashboard"],
    queryFn: () => suppliersService.getDashboard(),
  });

  // Load Suppliers List
  const { data, isLoading } = useQuery({
    queryKey: ["suppliers-list", search, statusFilter, page],
    queryFn: () =>
      suppliersService.getSuppliers({
        search,
        status: statusFilter,
        page,
      }),
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("USA");
    setPostalCode("");
    setGstNumber("");
    setStatusVal("ACTIVE");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setCompanyName(sup.company_name);
    setContactPerson(sup.contact_person);
    setEmail(sup.email);
    setPhone(sup.phone);
    setAddress(sup.address);
    setCity(sup.city);
    setState(sup.state);
    setCountry(sup.country);
    setPostalCode(sup.postal_code);
    setGstNumber(sup.gst_number || "");
    setStatusVal(sup.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormError(null);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      if (editingSupplier) {
        return suppliersService.updateSupplier(editingSupplier.id, payload);
      }
      return suppliersService.createSupplier(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers-list"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers-dashboard"] });
      closeModal();
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: Record<string, string | string[]> } };
      if (axiosError.response?.data) {
        const errors = Object.entries(axiosError.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setFormError(errors);
      } else {
        setFormError("Failed to save supplier. Please check inputs.");
      }
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers-list"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers-dashboard"] });
      setDeleteTarget(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyName.trim()) {
      setFormError("Company Name is required.");
      return;
    }
    if (!contactPerson.trim()) {
      setFormError("Contact Person is required.");
      return;
    }
    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }

    const payload = {
      company_name: companyName,
      contact_person: contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code: postalCode,
      gst_number: gstNumber || null,
      status: statusVal,
    };

    saveMutation.mutate(payload);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Supplier Management"
          subtitle="Manage vendor profiles, contact info, GST credentials, and active statuses."
        >
          <Breadcrumb items={[{ label: "Suppliers", active: true }]} />

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <DashboardCard
              title="Total Suppliers"
              value={dashboard?.total_suppliers || 0}
              iconName="Truck"
              type="info"
            />
            <DashboardCard
              title="Active Vendors"
              value={dashboard?.active_suppliers || 0}
              iconName="CheckCircle"
              type="success"
            />
            <DashboardCard
              title="Inactive Vendors"
              value={dashboard?.inactive_suppliers || 0}
              iconName="XOctagon"
              type="danger"
            />
          </div>

          {/* Filter Bar & Create Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search code, company, contact..."
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
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {canManage && (
              <Button
                size="sm"
                onClick={openCreateModal}
                className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Add New Supplier
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Company Name</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4">Email / Phone</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">GST Number</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-32 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-28 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>
                        {canManage && <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded ml-auto" /></td>}
                      </tr>
                    ))
                  ) : !data || data.results.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 8 : 7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Truck className="h-12 w-12 text-muted-foreground/30 mb-2" />
                          <h3 className="font-extrabold text-foreground text-base">No suppliers found</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Try adjusting search queries or add a supplier.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.results.map((sup) => (
                      <tr key={sup.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-primary">{sup.supplier_code}</td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            {sup.company_name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">{sup.contact_person}</td>
                        <td className="py-3.5 px-4 text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            {sup.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            {sup.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                            {sup.city}, {sup.country}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                          {sup.gst_number || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                              sup.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {sup.status}
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(sup)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(sup)}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
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
                  Showing {Math.min((page - 1) * 20 + 1, data.count)} to {Math.min(page * 20, data.count)} of {data.count} suppliers
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

          {/* Add / Edit Modal Overlay */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    {editingSupplier ? `Edit Supplier: ${editingSupplier.supplier_code}` : "Add New Supplier"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-lg">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Company Name *">
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Apex Bearings Co"
                        required
                      />
                    </FormField>

                    <FormField label="Contact Person *">
                      <Input
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Email *">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </FormField>

                    <FormField label="Phone Number">
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555-1234"
                      />
                    </FormField>
                  </div>

                  <FormField label="Address">
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Industrial Way"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="City">
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chicago" />
                    </FormField>

                    <FormField label="State">
                      <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Illinois" />
                    </FormField>

                    <FormField label="Postal Code">
                      <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="60601" />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="GST / Tax ID">
                      <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GSTIN12345" />
                    </FormField>

                    <FormField label="Status">
                      <select
                        value={statusVal}
                        onChange={(e) => setStatusVal(e.target.value as "ACTIVE" | "INACTIVE")}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-border mt-4">
                    <Button variant="outline" size="sm" type="button" onClick={closeModal} className="cursor-pointer">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="cursor-pointer font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {saveMutation.isPending ? "Saving..." : editingSupplier ? "Update Supplier" : "Create Supplier"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-base font-extrabold text-foreground mb-2">Delete Supplier?</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Are you sure you want to delete <strong className="text-foreground">{deleteTarget.company_name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => deleteMutation.mutate(deleteTarget.id)}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer font-semibold"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
