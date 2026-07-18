"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  phone_number: string | null;
  designation: string | null;
  department: string | null;
  profile_picture: string | null;
  role: "ADMIN" | "WAREHOUSE_MANAGER" | "STORE_KEEPER" | "TECHNICIAN";
  is_active_employee: boolean;
};

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Try to load session from localStorage & verify via profile endpoint on load
  useEffect(() => {
    async function restoreSession() {
      const accessToken = localStorage.getItem("access_token");
      const savedUser = localStorage.getItem("user");

      if (accessToken) {
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // Fail silently, fetch profile below anyway
          }
        }
        
        try {
          const response = await apiClient.get<UserProfile>("/auth/profile/");
          setUser(response.data);
          localStorage.setItem("user", JSON.stringify(response.data));
        } catch {
          // Token expired or invalid, interceptor handles refresh or log out
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        access: string;
        refresh: string;
        user: UserProfile;
      }>("/auth/login/", { username, password });

      const { access, refresh, user: profile } = response.data;
      
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(profile));
      setUser(profile);

      // Redirect user to the homepage/dashboard based on roles
      router.push("/");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout/", { refresh: refreshToken });
      }
    } catch {
      // Proceed with local logout regardless of API success
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
      setIsLoading(false);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
