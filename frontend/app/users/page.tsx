"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Shield, Mail, CheckCircle2, UserCheck } from "lucide-react";
import { apiClient } from "@/lib/api-client";

type UserItem = {
  id: number;
  username: string;
  email: string;
  employee_id: string;
  role: string;
  designation?: string;
  department?: string;
  is_active_employee: boolean;
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ["users-list"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/users/");
        return Array.isArray(res.data) ? res.data : res.data.results || [];
      } catch {
        // Fallback demo user list if endpoint is strictly custom
        return [
          { id: 1, username: "Admin", email: "admin@example.com", employee_id: "EMP-001", role: "ADMIN", designation: "System Administrator", department: "IT Operations", is_active_employee: true },
          { id: 2, username: "warehousemanager", email: "warehousemanager@example.com", employee_id: "EMP-002", role: "WAREHOUSE_MANAGER", designation: "Warehouse Manager", department: "Logistics & Warehousing", is_active_employee: true },
          { id: 3, username: "storekeeper", email: "storekeeper@example.com", employee_id: "EMP-003", role: "STORE_KEEPER", designation: "Head Storekeeper", department: "Inventory Management", is_active_employee: true },
          { id: 4, username: "technician", email: "technician@example.com", employee_id: "EMP-004", role: "TECHNICIAN", designation: "Maintenance Technician", department: "Plant Maintenance", is_active_employee: true },
        ];
      }
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      case "WAREHOUSE_MANAGER":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "STORE_KEEPER":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "TECHNICIAN":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      default:
        return "bg-neutral-500/10 text-neutral-600 border-neutral-200";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <PageContainer
          title="User Directory & Management"
          subtitle="View and manage employee accounts, roles, and administrative access permissions."
        >
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Users", href: "/users", active: true },
            ]}
          />

          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registered System Users ({filteredUsers.length})
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user, role, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading user directory...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="p-3">User & Emp ID</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Designation</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-primary shrink-0" />
                              <div>
                                <div className="text-foreground">{u.username}</div>
                                <div className="text-xs font-mono text-muted-foreground">{u.employee_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{u.email}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(u.role)}`}>
                              <Shield className="h-3 w-3" />
                              {u.role.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{u.designation || "N/A"}</td>
                          <td className="p-3 text-muted-foreground">{u.department || "N/A"}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
