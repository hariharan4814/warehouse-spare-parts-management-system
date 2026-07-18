"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

type ChartCardProps = {
  title: string;
  description?: string;
  type: "inventory-overview" | "stock-in-out" | "warehouse-activity" | "low-stock-trend";
  data: Array<Record<string, string | number>>;
  className?: string;
};

// Colors for Pie Charts
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ChartCard({
  title,
  description,
  type,
  data,
  className,
}: ChartCardProps) {
  // Avoid hydration mismatch by waiting for mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className={cn("w-full h-80 flex items-center justify-center border-border", className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-xs text-muted-foreground">Loading chart data...</span>
        </div>
      </Card>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "inventory-overview":
        return (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "stock-in-out":
        return (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "var(--muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>} />
              <Bar dataKey="Stock In" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Stock Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "warehouse-activity":
        return (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "var(--muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>} />
              <Bar dataKey="requests" fill="#3b82f6" name="Requests" radius={[4, 4, 0, 0]} />
              <Bar dataKey="issues" fill="#10b981" name="Issues" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returns" fill="#f59e0b" name="Returns" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "low-stock-trend":
        return (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "var(--muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>} />
              <Line type="monotone" dataKey="items" name="Low Stock Items" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("border-border shadow-xs", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
export default ChartCard;
