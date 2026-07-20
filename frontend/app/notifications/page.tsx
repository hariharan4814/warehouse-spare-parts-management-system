"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { notificationsService, InAppNotification } from "@/services/notifications";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Info,
  Package,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShoppingCart,
  ArrowRightLeft,
} from "lucide-react";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications-list-feed", page, pageSize],
    queryFn: () => notificationsService.getNotifications(page, pageSize),
  });

  const { data: countData } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: () => notificationsService.getUnreadCount(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview-list"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview-list"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview-list"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const notificationsList: InAppNotification[] = notificationsData?.results || [];
  const totalCount = notificationsData?.count || 0;
  const unreadCount = countData?.unread_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
      case "WARNING":
      case "ERROR":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "PURCHASE_ORDER":
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case "STOCK_TRANSFER":
        return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      case "WORK_ORDER":
        return <Wrench className="h-4 w-4 text-emerald-500" />;
      case "GOODS_RECEIPT":
        return <Package className="h-4 w-4 text-indigo-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Notification Center"
          subtitle="Stay informed about stock levels, completed stock transfers, assigned work orders, and goods receipts."
        >
          <Breadcrumb items={[{ label: "Notifications", active: true }]} />

          {/* Header Action Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Bell className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-foreground text-sm">Notifications Feed</span>
                <span className="text-2xs text-muted-foreground block">
                  You have {unreadCount} unread system {unreadCount === 1 ? "notification" : "notifications"}.
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="h-9 gap-1.5 border-border font-semibold cursor-pointer text-xs shrink-0 self-start sm:self-auto"
              >
                <CheckCheck className="h-4 w-4 text-emerald-500" />
                Mark All as Read
              </Button>
            )}
          </div>

          {/* Feed Container */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden divide-y divide-border mb-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-5 animate-pulse space-y-2">
                  <div className="h-4 w-48 bg-accent rounded" />
                  <div className="h-3 w-72 bg-accent rounded" />
                </div>
              ))
            ) : notificationsList.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <h3 className="font-extrabold text-foreground text-sm">All caught up!</h3>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  You do not have any notifications logged at this moment.
                </p>
              </div>
            ) : (
              notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    notif.is_read ? "bg-card opacity-80 hover:opacity-100" : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-9 w-9 rounded-full bg-accent/80 flex items-center justify-center shrink-0 border border-border">
                      {getNotificationIcon(notif.notification_type)}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-foreground text-sm">{notif.title}</span>
                        {!notif.is_read && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Unread
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-muted text-muted-foreground uppercase tracking-wider">
                          {notif.notification_type}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 text-2xs text-muted-foreground font-semibold pt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!notif.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkRead(notif.id)}
                        disabled={markReadMutation.isPending}
                        className="h-8 px-2.5 border-border shrink-0 text-2xs font-bold gap-1 cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-600"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notif.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 px-2 border-border shrink-0 text-2xs font-bold gap-1 cursor-pointer text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                      title="Delete Notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-xs">
              <div className="text-2xs font-semibold text-muted-foreground">
                Showing <span className="font-bold text-foreground">{(page - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-foreground">{Math.min(page * pageSize, totalCount)}</span> of{" "}
                <span className="font-bold text-foreground">{totalCount}</span> notifications
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3 text-xs gap-1 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-xs font-extrabold px-2 text-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-3 text-xs gap-1 cursor-pointer disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

