import { apiClient } from "@/lib/api-client";

export type Supplier = {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  gst_number: string | null;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
};

export type PaginatedSuppliers = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Supplier[];
};

export type SupplierDashboard = {
  total_suppliers: number;
  active_suppliers: number;
  inactive_suppliers: number;
};

export const suppliersService = {
  async getSuppliers(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedSuppliers>("/suppliers/", { params });
    return response.data;
  },

  async getSupplier(id: number) {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}/`);
    return response.data;
  },

  async createSupplier(data: Record<string, unknown>) {
    const response = await apiClient.post<Supplier>("/suppliers/", data);
    return response.data;
  },

  async updateSupplier(id: number, data: Record<string, unknown>) {
    const response = await apiClient.put<Supplier>(`/suppliers/${id}/`, data);
    return response.data;
  },

  async deleteSupplier(id: number) {
    await apiClient.delete(`/suppliers/${id}/`);
  },

  async getDashboard() {
    const response = await apiClient.get<SupplierDashboard>("/suppliers/dashboard/");
    return response.data;
  },
};
