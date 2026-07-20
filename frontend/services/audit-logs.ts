import { apiClient } from "@/lib/api-client";

export type AuditLogEntry = {
  id: number;
  username: string;
  user_email: string;
  action: string;
  module: string;
  timestamp: string;
  ip_address: string | null;
  old_value: string | null;
  new_value: string | null;
};

export type PaginatedAuditLogsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogEntry[];
};

export const auditLogsService = {
  async getAuditLogs(page: number = 1, pageSize: number = 20): Promise<PaginatedAuditLogsResponse> {
    const response = await apiClient.get<PaginatedAuditLogsResponse | AuditLogEntry[]>("/audit-logs/", {
      params: { page, page_size: pageSize },
    });

    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      };
    }

    return response.data;
  },
};

