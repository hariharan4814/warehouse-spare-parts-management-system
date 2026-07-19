import { apiClient } from "@/lib/api-client";

export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type WorkOrderStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type WorkOrderItem = {
  id: number;
  spare_part: { id: number; part_number: string; part_name: string; current_stock: number };
  requested_quantity: number;
  issued_quantity: number;
};

export type WorkOrder = {
  id: number;
  work_order_number: string;
  title: string;
  description: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  equipment_name: string | null;
  location: string | null;
  assigned_technician: { id: number; username: string; first_name: string; last_name: string; email: string; role: string } | null;
  created_by: number;
  created_by_username: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  items: WorkOrderItem[];
};

export type IssueTransactionItem = {
  id: number;
  spare_part_id?: number;
  spare_part_number: string;
  spare_part_name: string;
  quantity: number;
};

export type IssueTransaction = {
  id: number;
  issue_number: string;
  work_order: number;
  work_order_number: string;
  warehouse: number;
  warehouse_name: string;
  issued_by: number;
  issued_by_username: string;
  issued_at: string;
  remarks: string | null;
  items: IssueTransactionItem[];
};

export type PaginatedWorkOrders = {
  count: number;
  next: string | null;
  previous: string | null;
  results: WorkOrder[];
};

export type PaginatedIssueTransactions = {
  count: number;
  next: string | null;
  previous: string | null;
  results: IssueTransaction[];
};

export type WorkOrderDashboardData = {
  open_work_orders: number;
  in_progress_work_orders: number;
  completed_work_orders: number;
  total_issue_transactions: number;
  recent_work_orders: WorkOrder[];
  recent_issues: IssueTransaction[];
};

export const workOrdersService = {
  async getWorkOrders(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedWorkOrders>("/issue-return/work-orders/", { params });
    return response.data;
  },

  async getWorkOrder(id: number) {
    const response = await apiClient.get<WorkOrder>(`/issue-return/work-orders/${id}/`);
    return response.data;
  },

  async createWorkOrder(data: Record<string, unknown>) {
    const response = await apiClient.post<WorkOrder>("/issue-return/work-orders/", data);
    return response.data;
  },

  async updateWorkOrder(id: number, data: Record<string, unknown>) {
    const response = await apiClient.put<WorkOrder>(`/issue-return/work-orders/${id}/`, data);
    return response.data;
  },

  async deleteWorkOrder(id: number) {
    await apiClient.delete(`/issue-return/work-orders/${id}/`);
  },

  async getIssueTransactions(params?: Record<string, string | number | boolean>) {
    const response = await apiClient.get<PaginatedIssueTransactions>("/issue-return/issue-transactions/", { params });
    return response.data;
  },

  async createIssueTransaction(data: Record<string, unknown>) {
    const response = await apiClient.post<IssueTransaction>("/issue-return/issue-transactions/", data);
    return response.data;
  },

  async getDashboard() {
    const response = await apiClient.get<WorkOrderDashboardData>("/issue-return/work-orders/dashboard/");
    return response.data;
  },
};
