import { apiClient } from "@/lib/api-client";

export type InAppNotification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
};

export type PaginatedNotificationsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: InAppNotification[];
};

export const notificationsService = {
  async getNotifications(page: number = 1, pageSize: number = 20): Promise<PaginatedNotificationsResponse> {
    const response = await apiClient.get<PaginatedNotificationsResponse | InAppNotification[]>("/notifications/", {
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

  async markRead(id: number) {
    const response = await apiClient.post<InAppNotification>(`/notifications/${id}/mark-read/`);
    return response.data;
  },

  async markAllRead() {
    const response = await apiClient.post<{ detail: string }>("/notifications/mark-all-read/");
    return response.data;
  },

  async deleteNotification(id: number) {
    const response = await apiClient.delete(`/notifications/${id}/`);
    return response.data;
  },

  async getUnreadCount() {
    const response = await apiClient.get<{ unread_count: number }>("/notifications/unread-count/");
    return response.data;
  },
};

