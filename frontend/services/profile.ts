import { apiClient } from "@/lib/api-client";

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  phone_number: string;
  designation: string;
  department: string;
  profile_picture: string | null;
  role: string;
  is_active_employee: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export const profileService = {
  async getProfile() {
    const response = await apiClient.get<UserProfile>("/auth/profile/");
    return response.data;
  },

  async updateProfile(data: FormData) {
    const response = await apiClient.put<UserProfile>("/auth/profile/", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async changePassword(params: Record<string, string>) {
    const response = await apiClient.post<{ detail: string }>("/auth/profile/change-password/", params);
    return response.data;
  },
};
