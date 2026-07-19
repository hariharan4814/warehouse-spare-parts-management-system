import { apiClient } from "@/lib/api-client";

export type InAppNotification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
};

export const notificationsService = {
  async getNotifications() {
    const response = await apiClient.get<InAppNotification[]>("/notifications/");
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

  async getUnreadCount() {
    const response = await apiClient.get<{ unread_count: number }>("/notifications/unread-count/");
    return response.data;
  },
};
