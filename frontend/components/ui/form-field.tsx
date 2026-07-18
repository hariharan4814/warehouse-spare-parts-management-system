import * as React from "react";
import { cn } from "@/lib/utils";

export type FormFieldProps = {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {children}
      {error && (
        <span className="text-xs text-destructive font-medium animate-in fade-in-50 duration-200">
          {error}
        </span>
      )}
    </div>
  );
}
export default FormField;
