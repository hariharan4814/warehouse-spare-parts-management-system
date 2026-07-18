import { apiClient } from "@/lib/api-client";

export type SparePartCategory = {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  created_at: string;
};

export type StorageLocation = {
  id: number;
  warehouse: string;
  rack: string;
  shelf: string;
  bin: string;
};

export type SparePart = {
  id: number;
  part_number: string;
  part_name: string;
  description: string | null;
  category: SparePartCategory;
  manufacturer: string;
  brand: string;
  unit_of_measure: string;
  cost_price: string; // Decimal returned as string from DRF
  selling_price: string | null;
  minimum_stock: number;
  current_stock: number;
  maximum_stock: number;
  storage_location: StorageLocation;
  barcode: string | null;
  qr_code: string | null;
  image: string | null; // Image URL
  status: "active" | "inactive" | "low_stock" | "out_of_stock";
  is_deleted: boolean;
  created_by_username: string;
  updated_by_username: string;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export const sparePartsService = {
  // Spare Parts
  async getParts(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<SparePart>>("/spare-parts/parts/", { params });
    return response.data;
  },

  async getPart(id: number | string) {
    const response = await apiClient.get<SparePart>(`/spare-parts/parts/${id}/`);
    return response.data;
  },

  async createPart(data: FormData | Record<string, unknown>) {
    // If it's a FormData (for file upload), Axios automatically sets multipart/form-data
    const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
    const response = await apiClient.post<SparePart>("/spare-parts/parts/", data, { headers });
    return response.data;
  },

  async updatePart(id: number | string, data: FormData | Record<string, unknown>) {
    const headers = data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
    const response = await apiClient.patch<SparePart>(`/spare-parts/parts/${id}/`, data, { headers });
    return response.data;
  },

  async deletePart(id: number | string) {
    await apiClient.delete(`/spare-parts/parts/${id}/`);
  },

  async getLowStock(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<SparePart>>("/spare-parts/parts/low-stock/", { params });
    return response.data;
  },

  async getOutOfStock(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<SparePart>>("/spare-parts/parts/out-of-stock/", { params });
    return response.data;
  },

  // Categories
  async getCategories(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<SparePartCategory>>("/spare-parts/categories/", { params });
    return response.data.results;
  },

  async createCategory(data: Partial<SparePartCategory>) {
    const response = await apiClient.post<SparePartCategory>("/spare-parts/categories/", data);
    return response.data;
  },

  // Storage Locations
  async getLocations(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<StorageLocation>>("/spare-parts/locations/", { params });
    return response.data.results;
  },

  async createLocation(data: Partial<StorageLocation>) {
    const response = await apiClient.post<StorageLocation>("/spare-parts/locations/", data);
    return response.data;
  },
};
export default sparePartsService;
