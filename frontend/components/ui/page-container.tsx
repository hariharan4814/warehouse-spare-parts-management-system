import * as React from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
};

export function PageContainer({
  children,
  className,
  title,
  subtitle,
}: PageContainerProps) {
  return (
    <div className={cn("w-full space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-300", className)}>
      {(title || subtitle) && (
        <div className="flex flex-col gap-1">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
export default PageContainer;
