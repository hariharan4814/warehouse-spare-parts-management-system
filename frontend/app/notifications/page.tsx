"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { notificationsService } from "@/services/notifications";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Info,
  Package,
} from "lucide-react";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications-list-feed"],
    queryFn: () => notificationsService.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Notification Center"
          subtitle="Stay informed about stock levels, completed stock transfers, assigned work orders, and goods receipts."
        >
          <Breadcrumb items={[{ label: "Notifications", active: true }]} />

          {/* Header Action Panel */}
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs mb-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary animate-bounce" />
              <div>
                <span className="font-extrabold text-foreground text-sm">Notifications Feed</span>
                <span className="text-2xs text-muted-foreground block">
                  You have {unreadCount} unread system notifications.
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="h-9 gap-1.5 border-border font-semibold cursor-pointer text-xs"
              >
                <CheckCheck className="h-4 w-4 text-emerald-500" />
                Mark All as Read
              </Button>
            )}
          </div>

          {/* Feed Container */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-5 animate-pulse space-y-2">
                  <div className="h-4 w-48 bg-accent rounded" />
                  <div className="h-3 w-72 bg-accent rounded" />
                </div>
              ))
            ) : !notifications || notifications.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <h3 className="font-extrabold text-foreground text-sm">All caught up!</h3>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  You do not have any notifications logged at this moment.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 transition-colors flex items-start justify-between gap-4 ${
                    notif.is_read ? "bg-card opacity-70" : "bg-primary/5/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        notif.notification_type === "WARNING" || notif.notification_type === "ERROR"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {notif.notification_type === "WARNING" || notif.notification_type === "ERROR" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground text-sm">{notif.title}</span>
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 text-2xs text-muted-foreground font-semibold pt-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkRead(notif.id)}
                      className="h-8 px-2.5 border-border shrink-0 text-2xs font-bold gap-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Mark Read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
