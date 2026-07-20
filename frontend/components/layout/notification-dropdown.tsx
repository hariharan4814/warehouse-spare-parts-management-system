"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  Clock,
  Check,
  ExternalLink,
  Loader2,
  Package,
} from "lucide-react";
import { notificationsService, InAppNotification } from "@/services/notifications";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch unread count for badge
  const { data: countData } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 15000,
  });

  // Fetch quick dropdown preview list (top 6 items)
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications-preview-list"],
    queryFn: () => notificationsService.getNotifications(1, 6),
    enabled: isOpen,
  });

  const unreadCount = countData?.unread_count || 0;
  const notificationsList: InAppNotification[] = notificationsData?.results || [];

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-preview-list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-preview-list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-preview-list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list-feed"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "WARNING":
      case "ERROR":
      case "LOW_STOCK":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "PURCHASE_ORDER":
      case "GOODS_RECEIPT":
      case "STOCK_TRANSFER":
        return <Package className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationRoute = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
      case "WARNING":
      case "ERROR":
        return "/spare-parts";
      case "WORK_ORDER":
        return "/work-orders";
      case "PURCHASE_ORDER":
        return "/purchase-orders";
      case "GOODS_RECEIPT":
        return "/goods-receipts";
      case "STOCK_TRANSFER":
        return "/stock-transfers";
      default:
        return "/notifications";
    }
  };

  const handleNotificationClick = (item: InAppNotification) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-2xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs font-semibold">Loading notifications...</span>
              </div>
            ) : notificationsList.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground">No notifications</p>
                <p className="text-2xs text-muted-foreground mt-0.5">You are all caught up with your updates.</p>
              </div>
            ) : (
              notificationsList.map((item) => {
                const targetRoute = getNotificationRoute(item.notification_type);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-start justify-between gap-3 transition-colors ${
                      item.is_read ? "bg-card hover:bg-accent/40" : "bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <Link
                      href={targetRoute}
                      onClick={() => handleNotificationClick(item)}
                      className="flex items-start gap-3 flex-1 min-w-0 group/notif cursor-pointer"
                    >
                      <div className="mt-0.5 shrink-0">{getIcon(item.notification_type)}</div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-foreground group-hover/notif:text-primary transition-colors truncate">
                            {item.title}
                          </p>
                          {!item.is_read && <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                        </div>
                        <p className="text-2xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium pt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1 shrink-0">
                      {!item.is_read && (
                        <button
                          onClick={() => markReadMutation.mutate(item.id)}
                          disabled={markReadMutation.isPending}
                          title="Mark as read"
                          className="p-1 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete notification"
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border bg-muted/20 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              <span>View all notifications</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

