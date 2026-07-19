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

export const auditLogsService = {
  async getAuditLogs() {
    const response = await apiClient.get<AuditLogEntry[]>("/audit-logs/");
    return response.data;
  },
};
