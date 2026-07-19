"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-2xl shadow-lg">
        <div className="h-16 w-16 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight">404 - Page Not Found</h1>
          <p className="text-xs text-muted-foreground">
            The page you are looking for does not exist or has been relocated in the system.
          </p>
        </div>
        <div>
          <Link href="/">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
