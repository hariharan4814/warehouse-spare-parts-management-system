import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { ActivityItem } from "@/constants/mock-data";
import { ArrowLeftRight, FileSpreadsheet, Truck, ClipboardList, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityCardProps = {
  activities: ActivityItem[];
  className?: string;
};

const iconMap = {
  issue: ArrowLeftRight,
  purchase: FileSpreadsheet,
  supplier: Truck,
  update: ClipboardList,
};

const bgColors = {
  issue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  purchase: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  supplier: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  update: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const routeMap = {
  issue: "/work-orders",
  purchase: "/purchase-orders",
  supplier: "/suppliers",
  update: "/spare-parts",
};

export function ActivityCard({ activities, className }: ActivityCardProps) {
  return (
    <Card className={cn("border-border shadow-xs", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Recent System Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="relative border-l border-border pl-6 space-y-6">
          {activities.map((item) => {
            const Icon = iconMap[item.type] || ClipboardList;
            const targetRoute = routeMap[item.type] || "/spare-parts";

            return (
              <div key={item.id} className="relative">
                {/* Timeline node */}
                <div
                  className={cn(
                    "absolute -left-[38px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-card bg-card shadow-xs",
                    bgColors[item.type]
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    <span className="font-bold">{item.user}</span> {item.action}{" "}
                    <Link href={targetRoute} className="font-bold text-primary hover:underline">
                      {item.target}
                    </Link>
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
export default ActivityCard;

