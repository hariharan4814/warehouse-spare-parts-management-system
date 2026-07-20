"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import {
  Package,
  ClipboardList,
  FileSpreadsheet,
  Truck,
  Warehouse,
  ArrowLeftRight,
  Wrench,
  BarChart3,
  Bell,
  Settings,
  Lock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

type QuickActionCardProps = {
  className?: string;
};

type QuickActionItem = {
  label: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  allowedRoles: Array<"ADMIN" | "WAREHOUSE_MANAGER" | "STORE_KEEPER" | "TECHNICIAN">;
};

export function QuickActionCard({ className }: QuickActionCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [deniedAction, setDeniedAction] = useState<string | null>(null);

  const userRole = (user?.role || "TECHNICIAN") as "ADMIN" | "WAREHOUSE_MANAGER" | "STORE_KEEPER" | "TECHNICIAN";
  const isAdmin = userRole === "ADMIN";

  const actions: QuickActionItem[] = [
    {
      label: "Manage Spare Parts",
      href: "/spare-parts",
      description: "Register & catalog parts",
      icon: Package,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
      allowedRoles: ["ADMIN", "STORE_KEEPER", "WAREHOUSE_MANAGER"],
    },
    {
      label: "Inventory",
      href: "/inventory",
      description: "Stock levels & adjustments",
      icon: ClipboardList,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
      allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"],
    },
    {
      label: "Purchase Orders",
      href: "/purchase-orders",
      description: "Procurement & order status",
      icon: FileSpreadsheet,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20",
      allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"],
    },
    {
      label: "Suppliers",
      href: "/suppliers",
      description: "Vendor registry & details",
      icon: Truck,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20",
      allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"],
    },
    {
      label: "Warehouses",
      href: "/warehouses",
      description: "Facility locations & bins",
      icon: Warehouse,
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20",
      allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"],
    },
    {
      label: "Stock Transfers",
      href: "/stock-transfers",
      description: "Move inventory between hubs",
      icon: ArrowLeftRight,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
      allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"],
    },
    {
      label: "Work Orders",
      href: "/work-orders",
      description: "Maintenance jobs & requests",
      icon: Wrench,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20",
      allowedRoles: ["ADMIN", "TECHNICIAN", "WAREHOUSE_MANAGER", "STORE_KEEPER"],
    },
    {
      label: "Reports",
      href: "/reports",
      description: "Analytics & valuation logs",
      icon: BarChart3,
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20",
      allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"],
    },
    {
      label: "Notifications",
      href: "/notifications",
      description: "Alerts & reorder triggers",
      icon: Bell,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20",
      allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER", "TECHNICIAN"],
    },
    {
      label: "Settings",
      href: "/settings",
      description: "System parameters & config",
      icon: Settings,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20",
      allowedRoles: ["ADMIN"],
    },
  ];

  const handleActionClick = (act: QuickActionItem, isAllowed: boolean) => {
    if (!isAllowed) {
      setDeniedAction(`Access Denied: Your role (${userRole.replace("_", " ")}) does not have permission to access ${act.label}.`);
      setTimeout(() => setDeniedAction(null), 4000);
      return;
    }
    router.push(act.href);
  };

  return (
    <Card className={cn("border-border shadow-xs", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold tracking-tight">Quick Actions</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">
          Role: <strong className="text-foreground">{userRole.replace("_", " ")}</strong>
        </span>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {deniedAction && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive animate-fade-in dark:bg-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{deniedAction}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {actions.map((act) => {
            const Icon = act.icon;
            const isAllowed = isAdmin || act.allowedRoles.includes(userRole);

            return (
              <button
                key={act.label}
                onClick={() => handleActionClick(act, isAllowed)}
                title={isAllowed ? `Navigate to ${act.label}` : `Access Denied for ${userRole.replace("_", " ")}`}
                className={cn(
                  "relative flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-border transition-all group cursor-pointer select-none",
                  isAllowed
                    ? "hover:scale-102 hover:shadow-xs hover:border-primary/50"
                    : "opacity-60 bg-muted/30 border-dashed cursor-not-allowed"
                )}
              >
                {!isAllowed && (
                  <span className="absolute top-2 right-2 rounded-full bg-destructive/10 p-1 text-destructive">
                    <Lock className="h-3 w-3" />
                  </span>
                )}

                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg mb-2.5 transition-colors",
                    isAllowed ? act.color : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span
                  className={cn(
                    "text-xs font-bold transition-colors leading-tight",
                    isAllowed ? "text-foreground group-hover:text-primary" : "text-muted-foreground"
                  )}
                >
                  {act.label}
                </span>

                <span className="text-[10px] text-muted-foreground mt-1 leading-normal line-clamp-1">
                  {isAllowed ? act.description : "Access Restricted"}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionCard;
