"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield, Briefcase, Hash } from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col items-center justify-center bg-radial from-neutral-50 to-neutral-200 px-6 py-12 dark:from-neutral-900 dark:to-black">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center space-y-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
            Warehouse Spare Parts Management System
          </h1>

          {user && (
            <div className="w-full rounded-2xl border border-neutral-200 bg-card p-6 shadow-xl backdrop-blur-xs dark:border-neutral-800 space-y-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-8 w-8" />
                </div>
                <div className="flex-1 text-left space-y-2">
                  <h2 className="text-xl font-bold text-card-foreground">
                    Welcome back, {user.first_name || user.username}!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Logged in as <span className="font-semibold text-foreground">{user.email}</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4 text-primary" />
                      <span>Employee ID: <strong className="text-foreground">{user.employee_id}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Role: <strong className="text-foreground">{user.role}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>Designation: <strong className="text-foreground">{user.designation || "N/A"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>Department: <strong className="text-foreground">{user.department || "N/A"}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-neutral-200/80 dark:border-neutral-800/80 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

