import { apiClient } from "@/lib/api-client";

export type SystemSettings = {
  company_name: string;
  company_logo: string | null;
  warehouse_address: string;
  default_currency: string;
  low_stock_threshold: number;
  system_time_zone: string;
  theme_settings: Record<string, unknown>;
};

export const settingsService = {
  async getSettings() {
    const response = await apiClient.get<SystemSettings>("/settings/");
    return response.data;
  },

  async updateSettings(data: FormData) {
    const response = await apiClient.put<SystemSettings>("/settings/", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
