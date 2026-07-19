"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-2xl shadow-lg">
        <div className="h-16 w-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight">500 - System Error</h1>
          <p className="text-xs text-muted-foreground">
            An unexpected error occurred in the system. The logs have been recorded for inspection.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => reset()} className="w-full gap-2 font-bold cursor-pointer">
            <RotateCcw className="h-4 w-4" />
            Retry Session
          </Button>
        </div>
      </div>
    </div>
  );
}
