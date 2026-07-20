"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: Array<"ADMIN" | "WAREHOUSE_MANAGER" | "STORE_KEEPER" | "TECHNICIAN">;
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login page and keep track of original path
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === "TECHNICIAN") {
          router.push("/work-orders");
        } else if (user.role === "STORE_KEEPER") {
          router.push("/inventory");
        } else {
          router.push("/");
        }
      }
    }
  }, [user, isLoading, router, pathname, allowedRoles]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Verifying your session...
          </p>
        </div>
      </div>
    );
  }

  // Double check role mismatch (prevents transient flashes of unauthorized pages)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
