"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, User, LogOut, Settings, ChevronDown, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

type TopNavbarProps = {
  onToggleMobileMenu: () => void;
  onToggleSidebarCollapse: () => void;
  isSidebarCollapsed: boolean;
};

export function TopNavbar({
  onToggleMobileMenu,
  onToggleSidebarCollapse,
  isSidebarCollapsed: _isSidebarCollapsed,
}: TopNavbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:px-6 shadow-xs">
      
      {/* Left items: Mobile Hamburger and Project Branding */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground md:hidden cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Collapsed Toggle for Desktop Sidebar */}
        <button
          onClick={onToggleSidebarCollapse}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          aria-label="Toggle sidebar collapse"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Branding (Mobile/Tablet and fallback) */}
        <div className="flex items-center gap-2 md:ml-1">
          <div className="flex md:hidden h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm md:text-base font-bold tracking-tight text-foreground truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
            Warehouse Spare Parts Management System
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden lg:flex w-full max-w-sm relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search spare parts, POs, bins..."
          className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Right items: Notifications and User Dropdown */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent transition-colors text-left cursor-pointer"
          >
            {user?.profile_picture ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.profile_picture}
                alt={user.username}
                className="h-8 w-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
            )}
            
            <div className="hidden sm:flex flex-col gap-0.5">
              <span className="text-xs font-bold text-foreground leading-none">
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground leading-none font-semibold uppercase">
                <Shield className="h-2.5 w-2.5 text-primary" />
                {user?.role}
              </span>
            </div>
            
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {/* Profile Dropdown menu list */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-border bg-card p-1 shadow-md z-40 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-3 py-2 border-b border-border text-xs sm:hidden">
                <p className="font-bold text-foreground">{user?.username}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{user?.role}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer text-left"
              >
                <User className="h-4 w-4" />
                My Profile
              </Link>

              {user?.role === "ADMIN" && (
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer text-left"
                >
                  <Settings className="h-4 w-4" />
                  System Settings
                </Link>
              )}

              {user?.role === "ADMIN" && (
                <Link
                  href="/audit-logs"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer text-left"
                >
                  <Shield className="h-4 w-4 text-rose-500" />
                  Security Logs
                </Link>
              )}

              <div className="my-1 border-t border-border" />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default TopNavbar;
