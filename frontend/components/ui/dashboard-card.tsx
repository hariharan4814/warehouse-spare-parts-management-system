import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XOctagon,
  Clock,
  FileText,
  Home,
  Users,
} from "lucide-react";

type DashboardCardProps = {
  title: string;
  value: number | string;
  change?: string;
  type?: "success" | "warning" | "danger" | "info";
  iconName?: string;
  className?: string;
};

// Map string keys to Lucide icon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package: Package,
  CheckCircle: CheckCircle,
  AlertTriangle: AlertTriangle,
  XOctagon: XOctagon,
  Clock: Clock,
  FileText: FileText,
  Home: Home,
  Users: Users,
};

export function DashboardCard({
  title,
  value,
  change,
  type = "info",
  iconName,
  className,
}: DashboardCardProps) {
  const IconComponent = iconName ? iconMap[iconName] : null;

  const bgColors = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  const borderColors = {
    success: "border-emerald-500/20 hover:border-emerald-500/30",
    warning: "border-amber-500/20 hover:border-amber-500/30",
    danger: "border-rose-500/20 hover:border-rose-500/30",
    info: "border-blue-500/20 hover:border-blue-500/30",
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 border hover:shadow-md",
        borderColors[type],
        className
      )}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground truncate">
            {value}
          </h3>
          {change && (
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {change}
            </p>
          )}
        </div>
        {IconComponent && (
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", bgColors[type])}>
            <IconComponent className="h-6 w-6" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default DashboardCard;
