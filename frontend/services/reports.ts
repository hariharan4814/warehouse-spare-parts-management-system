import { apiClient } from "@/lib/api-client";

export type ReportsDashboardData = {
  total_inventory_value: number;
  total_spare_parts: number;
  total_warehouses: number;
  total_suppliers: number;
  pos_this_month: number;
  wos_this_month: number;
  stock_transfers_this_month: number;
  goods_receipts_this_month: number;
  low_stock_items: number;
  out_of_stock_items: number;
  inventory_by_warehouse: Array<{
    warehouse_id: number;
    warehouse_code: string;
    name: string;
    total_units: number;
    total_value: number;
  }>;
  monthly_pos: Array<{
    month: string;
    count: number;
    total_amount: number;
  }>;
  monthly_wos: Array<{
    month: string;
    count: number;
    completed: number;
  }>;
  supplier_purchases: Array<{
    supplier_name: string;
    po_count: number;
    total_spent: number;
  }>;
  top_consumed_parts: Array<{
    part_number: string;
    part_name: string;
    total_issued: number;
  }>;
};

export type InventoryReportItem = {
  id: number;
  part_number: string;
  part_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  cost_price: number;
  valuation: number;
  status: string;
};

export type PurchaseReportItem = {
  id: number;
  po_number: string;
  supplier_name: string;
  supplier_code: string;
  order_date: string;
  expected_delivery_date: string;
  status: string;
  total_amount: number;
  created_by: string;
};

export type WarehouseReportItem = {
  id: number;
  warehouse_code: string;
  name: string;
  city: string;
  status: string;
  total_items: number;
  total_units: number;
  total_value: number;
  transfers_sent: number;
  transfers_received: number;
};

export type WorkOrderReportItem = {
  id: number;
  work_order_number: string;
  title: string;
  priority: string;
  status: string;
  equipment_name: string;
  location: string;
  technician: string;
  total_requested: number;
  total_issued: number;
  created_at: string;
};

export type StockMovementReportItem = {
  id: number;
  part_number: string;
  part_name: string;
  movement_type: string;
  reference_type: string;
  reference_number: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  performed_by: string;
  timestamp: string;
};

export const reportsService = {
  async getDashboard() {
    const response = await apiClient.get<ReportsDashboardData>("/reports/dashboard/");
    return response.data;
  },

  async getInventoryReport(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<{ count: number; results: InventoryReportItem[] }>("/reports/inventory/", { params });
    return response.data;
  },

  async getPurchaseReport(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<{ count: number; total_spend: number; results: PurchaseReportItem[] }>("/reports/purchases/", { params });
    return response.data;
  },

  async getWarehouseReport(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<{ count: number; results: WarehouseReportItem[] }>("/reports/warehouses/", { params });
    return response.data;
  },

  async getWorkOrderReport(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<{ count: number; results: WorkOrderReportItem[] }>("/reports/work-orders/", { params });
    return response.data;
  },

  async getStockMovementReport(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<{ count: number; results: StockMovementReportItem[] }>("/reports/stock-movements/", { params });
    return response.data;
  },
};
