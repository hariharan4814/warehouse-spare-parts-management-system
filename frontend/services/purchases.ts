import { apiClient } from "@/lib/api-client";
import { Supplier } from "./suppliers";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export type PurchaseOrderItem = {
  id: number;
  spare_part: { id: number; part_number: string; part_name: string };
  ordered_quantity: number;
  received_quantity: number;
  unit_price: string | number;
  total_price: string | number;
};

export type GoodsReceiptItem = {
  id: number;
  po_item: number;
  spare_part_name: string;
  spare_part_number: string;
  received_quantity: number;
};

export type GoodsReceipt = {
  id: number;
  grn_number: string;
  purchase_order: number;
  po_number: string;
  received_date: string;
  received_by: number;
  received_by_username: string;
  remarks: string | null;
  items: GoodsReceiptItem[];
};

export type PurchaseOrder = {
  id: number;
  po_number: string;
  supplier: Supplier;
  order_date: string;
  expected_delivery_date: string | null;
  status: PurchaseOrderStatus;
  total_amount: string | number;
  remarks: string | null;
  created_by: number;
  created_by_username: string;
  approved_by: number | null;
  approved_by_username: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
  goods_receipts: GoodsReceipt[];
};

export type PaginatedPurchaseOrders = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PurchaseOrder[];
};

export type PaginatedGoodsReceipts = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GoodsReceipt[];
};

export type PurchaseDashboardData = {
  pending_count: number;
  approved_count: number;
  completed_count: number;
  draft_count: number;
  partially_received_count: number;
  recent_receipts: GoodsReceipt[];
};

export const purchasesService = {
  async getOrders(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedPurchaseOrders>("/purchases/orders/", { params });
    return response.data;
  },

  async getOrder(id: number) {
    const response = await apiClient.get<PurchaseOrder>(`/purchases/orders/${id}/`);
    return response.data;
  },

  async createOrder(data: Record<string, unknown>) {
    const response = await apiClient.post<PurchaseOrder>("/purchases/orders/", data);
    return response.data;
  },

  async updateOrder(id: number, data: Record<string, unknown>) {
    const response = await apiClient.put<PurchaseOrder>(`/purchases/orders/${id}/`, data);
    return response.data;
  },

  async submitOrder(id: number) {
    const response = await apiClient.post<PurchaseOrder>(`/purchases/orders/${id}/submit/`);
    return response.data;
  },

  async approveOrder(id: number) {
    const response = await apiClient.post<PurchaseOrder>(`/purchases/orders/${id}/approve/`);
    return response.data;
  },

  async cancelOrder(id: number) {
    const response = await apiClient.post<PurchaseOrder>(`/purchases/orders/${id}/cancel/`);
    return response.data;
  },

  async getDashboard() {
    const response = await apiClient.get<PurchaseDashboardData>("/purchases/orders/dashboard/");
    return response.data;
  },

  async getGoodsReceipts(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedGoodsReceipts>("/purchases/goods-receipts/", { params });
    return response.data;
  },

  async createGoodsReceipt(data: Record<string, unknown>) {
    const response = await apiClient.post<GoodsReceipt>("/purchases/goods-receipts/", data);
    return response.data;
  },
};
