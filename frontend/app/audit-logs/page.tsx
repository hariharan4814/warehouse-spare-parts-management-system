"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { auditLogsService, AuditLogEntry } from "@/services/audit-logs";
import { useAuth } from "@/components/providers/auth-provider";
import { exportToCSV } from "@/lib/csv-export";
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Terminal,
  Clock,
  User as UserIcon,
} from "lucide-react";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs-list"],
    queryFn: () => auditLogsService.getAuditLogs(),
    enabled: !!isAdmin,
  });

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="Security Audit Logs" subtitle="Access restriction.">
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl shadow-xs">
              <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
              <h3 className="font-extrabold text-foreground text-lg">403 - Forbidden Access</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Security audit logging ledger is restricted exclusively to Admin roles.
              </p>
            </div>
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const items = logs || [];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.username.toLowerCase().includes(search.toLowerCase()) ||
      item.module.toLowerCase().includes(search.toLowerCase()) ||
      item.action.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter ? item.action === actionFilter : true;
    return matchesSearch && matchesAction;
  });

  const handleExport = () => {
    const exportData = filteredItems.map((i) => ({
      Timestamp: i.timestamp,
      Username: i.username,
      Email: i.user_email,
      Action: i.action,
      Module: i.module,
      "IP Address": i.ip_address || "—",
      "Old Value": i.old_value || "—",
      "New Value": i.new_value || "—",
    }));
    exportToCSV(exportData, "Security_Audit_Logs");
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <PageContainer
          title="Security Audit Logging Ledger"
          subtitle="Detailed audit trail logging all user mutations, logins, logouts, updates, and structural changes."
        >
          <Breadcrumb items={[{ label: "Audit Logs", active: true }]} />

          {/* Filtering Header Panel */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user, action, module..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 border-border bg-background"
                />
              </div>

              <div className="flex items-center gap-1.5 min-w-[160px]">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="PASSWORD_CHANGE">Password Change</option>
                </select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-9 gap-1.5 border-border font-semibold cursor-pointer text-xs"
            >
              <Download className="h-4 w-4" />
              Export Audit Trail
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Table list */}
            <div className="xl:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-xs h-fit">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Module</th>
                      <th className="py-3.5 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-28 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>
                        </tr>
                      ))
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Terminal className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <h3 className="font-extrabold text-foreground text-sm">No audit logs found</h3>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`hover:bg-accent/20 transition-colors cursor-pointer ${
                            selectedLog?.id === log.id ? "bg-primary/5 font-semibold" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-extrabold text-foreground">{log.username}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                                log.action === "LOGIN"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : log.action === "DELETE"
                                  ? "bg-rose-500/10 text-rose-600"
                                  : log.action === "PASSWORD_CHANGE"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-blue-500/10 text-blue-600"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground text-xs">{log.module}</td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                            {log.ip_address || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side: Payload Inspection view */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs h-fit space-y-4">
              <h3 className="font-extrabold text-foreground text-base border-b border-border pb-2 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Metadata Payload Inspector
              </h3>

              {!selectedLog ? (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  Select an audit row to inspect detailed mutation payloads (Old vs New values).
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground">User:</span>
                    <p className="font-extrabold text-foreground">
                      {selectedLog.username} ({selectedLog.user_email})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground">Action:</span>
                    <p className="font-bold text-foreground">
                      {selectedLog.action} on module {selectedLog.module}
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border">
                    <span className="font-bold text-rose-600">Old Value Payload:</span>
                    <pre className="bg-accent/40 p-3 rounded-lg font-mono text-3xs whitespace-pre-wrap overflow-x-auto max-h-40">
                      {selectedLog.old_value || "—"}
                    </pre>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="font-bold text-emerald-600">New Value Payload:</span>
                    <pre className="bg-accent/40 p-3 rounded-lg font-mono text-3xs whitespace-pre-wrap overflow-x-auto max-h-40">
                      {selectedLog.new_value || "—"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
