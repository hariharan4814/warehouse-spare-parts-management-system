import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  active?: boolean;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-xs text-muted-foreground font-medium", className)}
    >
      <ol className="flex items-center gap-1.5 list-none m-0 p-0">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.label}>
              <li className="flex items-center text-muted-foreground/60 select-none">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="flex items-center">
                {item.href && !isLast && !item.active ? (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast || item.active ? "page" : undefined}
                    className={cn(
                      "truncate max-w-[120px] sm:max-w-none",
                      (isLast || item.active) ? "text-foreground font-semibold" : ""
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
export default Breadcrumb;
