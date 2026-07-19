import { apiClient } from "@/lib/api-client";
import { SparePart } from "./spare-parts";

export type StockMovement = {
  id: number;
  spare_part: { id: number; part_number: string; part_name: string };
  movement_type: "STOCK_IN" | "STOCK_OUT" | "STOCK_ADJUSTMENT" | "STOCK_TRANSFER";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type?: "PURCHASE" | "ISSUE" | "RETURN" | "ADJUSTMENT" | "TRANSFER" | null;
  reason: string;
  reference_number: string | null;
  remarks: string | null;
  performed_by: number;
  performed_by_username: string;
  created_at: string;
};

export type InventoryAdjustment = {
  id: number;
  spare_part: { id: number; part_number: string; part_name: string };
  adjustment_type: "INCREASE" | "DECREASE";
  quantity: number;
  reason: string;
  created_by: number;
  created_by_username: string;
  approved_by: number | null;
  approved_by_username: string | null;
  created_at: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type InventorySummary = {
  total_items: number;
  total_stock: number;
  total_value: string | number;
  low_stock_count: number;
  out_of_stock_count: number;
};

export type InventoryDashboardData = {
  summary: InventorySummary;
  recent_transactions: StockMovement[];
  movement_summary: Record<string, number>;
  low_stock_items: SparePart[];
};

export const inventoryService = {
  async getDashboard() {
    const response = await apiClient.get<InventoryDashboardData>("/inventory/dashboard/");
    return response.data;
  },

  async getSummary() {
    const response = await apiClient.get<InventorySummary>("/inventory/summary/");
    return response.data;
  },

  async getRecentTransactions() {
    const response = await apiClient.get<StockMovement[]>("/inventory/recent-transactions/");
    return response.data;
  },

  async getMovements(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<StockMovement>>("/inventory/movements/", { params });
    return response.data;
  },

  async createMovement(data: Record<string, unknown>) {
    const response = await apiClient.post<StockMovement>("/inventory/movements/", data);
    return response.data;
  },

  async getAdjustments(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<InventoryAdjustment>>("/inventory/adjustments/", { params });
    return response.data;
  },

  async createAdjustment(data: Record<string, unknown>) {
    const response = await apiClient.post<InventoryAdjustment>("/inventory/adjustments/", data);
    return response.data;
  },

  async getCurrentInventory(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<SparePart>>("/inventory/current/", { params });
    return response.data;
  },

  async getLowStock(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<SparePart>>("/inventory/low-stock/", { params });
    return response.data;
  },

  async getOutOfStock(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedResponse<SparePart>>("/inventory/out-of-stock/", { params });
    return response.data;
  }
};
