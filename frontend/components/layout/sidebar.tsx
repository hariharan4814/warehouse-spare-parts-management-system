"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Warehouse,
  Truck,
  FileSpreadsheet,
  PackageCheck,
  ArrowLeftRight,
  Wrench,
  ClipboardCopy,
  BarChart3,
  Bell,
  Users as UsersIcon,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";

type SidebarProps = {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  className?: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: Array<"ADMIN" | "WAREHOUSE_MANAGER" | "STORE_KEEPER" | "TECHNICIAN">;
};

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  onLogout,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "TECHNICIAN";
  const isAdmin = role === "ADMIN";

  const allNavItems: NavigationItem[] = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"] },
    { label: "Spare Parts", href: "/spare-parts", icon: Package, allowedRoles: ["ADMIN", "STORE_KEEPER", "WAREHOUSE_MANAGER"] },
    { label: "Inventory", href: "/inventory", icon: ClipboardList, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"] },
    { label: "Warehouses", href: "/warehouses", icon: Warehouse, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"] },
    { label: "Warehouse Inventory", href: "/warehouse-inventory", icon: ClipboardList, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"] },
    { label: "Stock Transfers", href: "/stock-transfers", icon: ArrowLeftRight, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER", "STORE_KEEPER"] },
    { label: "Work Orders", href: "/work-orders", icon: Wrench, allowedRoles: ["ADMIN", "TECHNICIAN", "WAREHOUSE_MANAGER", "STORE_KEEPER"] },
    { label: "Issue Transactions", href: "/issue-transactions", icon: PackageCheck, allowedRoles: ["ADMIN", "STORE_KEEPER", "WAREHOUSE_MANAGER"] },
    { label: "Suppliers", href: "/suppliers", icon: Truck, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"] },
    { label: "Purchase Orders", href: "/purchase-orders", icon: FileSpreadsheet, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"] },
    { label: "Goods Receipts", href: "/goods-receipts", icon: PackageCheck, allowedRoles: ["ADMIN", "STORE_KEEPER", "WAREHOUSE_MANAGER"] },
    { label: "Reports", href: "/reports", icon: BarChart3, allowedRoles: ["ADMIN", "WAREHOUSE_MANAGER"] },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  if (isAdmin) {
    allNavItems.push(
      { label: "Security Logs", href: "/audit-logs", icon: Shield, allowedRoles: ["ADMIN"] },
      { label: "Users", href: "/users", icon: UsersIcon, allowedRoles: ["ADMIN"] },
      { label: "Settings", href: "/settings", icon: Settings, allowedRoles: ["ADMIN"] }
    );
  }

  const navItems = allNavItems.filter((item) => {
    if (isAdmin) return true;
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(role as any);
  });

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border shadow-xs transition-all duration-300 relative z-20",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header / Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-bold truncate">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-extrabold tracking-tight text-foreground transition-all duration-300">
              WSPMS ERP
            </span>
          )}
        </Link>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-input hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-rounded">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all cursor-pointer group relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              
              {/* Tooltip on Collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 hidden group-hover:block rounded bg-neutral-950 px-2 py-1 text-xs text-white z-50 whitespace-nowrap shadow-md">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Toggle & Logout */}
      <div className="p-2 border-t border-border space-y-1">
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden md:flex w-full items-center justify-center rounded-md py-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        
        <button
          onClick={onLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer group relative"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="truncate">Logout</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 hidden group-hover:block rounded bg-destructive px-2 py-1 text-xs text-white z-50 whitespace-nowrap shadow-md">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
