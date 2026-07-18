import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { LowStockItem } from "@/constants/mock-data";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertCardProps = {
  items: LowStockItem[];
  className?: string;
};

export function AlertCard({ items, className }: AlertCardProps) {
  return (
    <Card className={cn("border-border shadow-xs", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 animate-bounce" />
          Critical Inventory Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-2">Part Details</th>
                <th className="py-3 px-2 text-center">Stock Level</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const isOutOfStock = item.status === "Out of Stock" || item.currentQty === 0;

                return (
                  <tr key={item.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-foreground leading-tight">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.partNumber}</div>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={cn("font-bold text-base", isOutOfStock ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")}>
                        {item.currentQty}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium"> / {item.minQty} min</span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider border",
                          isOutOfStock
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}
                      >
                        {isOutOfStock ? (
                          <>
                            <ShieldAlert className="h-3 w-3 shrink-0" />
                            Out of Stock
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            Low Stock
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
export default AlertCard;
