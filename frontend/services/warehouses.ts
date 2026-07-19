import { apiClient } from "@/lib/api-client";
import { SparePart } from "./spare-parts";

export type WarehouseStatus = "ACTIVE" | "INACTIVE";
export type TransferStatus = "DRAFT" | "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED";

export type Warehouse = {
  id: number;
  warehouse_code: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  manager: number | null;
  manager_username: string | null;
  status: WarehouseStatus;
  created_at: string;
  updated_at: string;
};

export type WarehouseInventory = {
  id: number;
  warehouse: { id: number; warehouse_code: string; name: string; city: string };
  spare_part: { id: number; part_number: string; part_name: string };
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  updated_at: string;
};

export type StockTransferItem = {
  id: number;
  spare_part: { id: number; part_number: string; part_name: string };
  quantity: number;
};

export type StockTransfer = {
  id: number;
  transfer_number: string;
  source_warehouse: { id: number; warehouse_code: string; name: string; city: string };
  destination_warehouse: { id: number; warehouse_code: string; name: string; city: string };
  status: TransferStatus;
  remarks: string | null;
  created_by: number;
  created_by_username: string;
  approved_by: number | null;
  approved_by_username: string | null;
  created_at: string;
  completed_at: string | null;
  items: StockTransferItem[];
};

export type PaginatedWarehouses = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Warehouse[];
};

export type PaginatedWarehouseInventories = {
  count: number;
  next: string | null;
  previous: string | null;
  results: WarehouseInventory[];
};

export type PaginatedStockTransfers = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StockTransfer[];
};

export type WarehouseDashboardData = {
  total_warehouses: number;
  total_inventory_records: number;
  total_stock_units: number;
  pending_transfers: number;
  completed_transfers: number;
  low_stock_count: number;
  recent_transfers: StockTransfer[];
};

export const warehousesService = {
  async getWarehouses(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedWarehouses>("/warehouses/", { params });
    return response.data;
  },

  async getWarehouse(id: number) {
    const response = await apiClient.get<Warehouse>(`/warehouses/${id}/`);
    return response.data;
  },

  async createWarehouse(data: Record<string, unknown>) {
    const response = await apiClient.post<Warehouse>("/warehouses/", data);
    return response.data;
  },

  async updateWarehouse(id: number, data: Record<string, unknown>) {
    const response = await apiClient.put<Warehouse>(`/warehouses/${id}/`, data);
    return response.data;
  },

  async deleteWarehouse(id: number) {
    await apiClient.delete(`/warehouses/${id}/`);
  },

  async getWarehouseInventories(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedWarehouseInventories>("/warehouses/inventory/", { params });
    return response.data;
  },

  async getTransfers(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedStockTransfers>("/warehouses/transfers/", { params });
    return response.data;
  },

  async getTransfer(id: number) {
    const response = await apiClient.get<StockTransfer>(`/warehouses/transfers/${id}/`);
    return response.data;
  },

  async createTransfer(data: Record<string, unknown>) {
    const response = await apiClient.post<StockTransfer>("/warehouses/transfers/", data);
    return response.data;
  },

  async submitTransfer(id: number) {
    const response = await apiClient.post<StockTransfer>(`/warehouses/transfers/${id}/submit/`);
    return response.data;
  },

  async approveTransfer(id: number) {
    const response = await apiClient.post<StockTransfer>(`/warehouses/transfers/${id}/approve/`);
    return response.data;
  },

  async completeTransfer(id: number) {
    const response = await apiClient.post<StockTransfer>(`/warehouses/transfers/${id}/complete/`);
    return response.data;
  },

  async cancelTransfer(id: number) {
    const response = await apiClient.post<StockTransfer>(`/warehouses/transfers/${id}/cancel/`);
    return response.data;
  },

  async getDashboard() {
    const response = await apiClient.get<WarehouseDashboardData>("/warehouses/dashboard/");
    return response.data;
  },
};
