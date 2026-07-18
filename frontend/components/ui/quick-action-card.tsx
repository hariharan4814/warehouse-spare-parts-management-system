import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { PlusCircle, ArrowUpRight, ArrowDownLeft, FilePlus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickActionCardProps = {
  className?: string;
};

type QuickActionItem = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

export function QuickActionCard({ className }: QuickActionCardProps) {
  const actions: QuickActionItem[] = [
    {
      label: "Add Spare Part",
      description: "Register a new catalog item",
      icon: PlusCircle,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
    },
    {
      label: "Issue Part",
      description: "Record checkout to technician",
      icon: ArrowUpRight,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
    },
    {
      label: "Receive Stock",
      description: "Log incoming items from PO",
      icon: ArrowDownLeft,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
    },
    {
      label: "Create Purchase Order",
      description: "Reorder low stock items",
      icon: FilePlus,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20",
    },
    {
      label: "View Reports",
      description: "Run inventory cost analytics",
      icon: BarChart3,
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20",
    },
  ];

  return (
    <Card className={cn("border-border shadow-xs", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              className={cn(
                "flex flex-col items-center justify-center text-center p-4 rounded-xl border border-border transition-all hover:scale-102 hover:shadow-xs group cursor-pointer"
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg mb-3 transition-colors", act.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                {act.label}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 leading-normal">
                {act.description}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
export default QuickActionCard;
