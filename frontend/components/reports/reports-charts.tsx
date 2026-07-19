"use client";

import React from "react";

type BarChartItem = {
  label: string;
  value: number;
  subText?: string;
};

export function BarChartCard({
  title,
  subtitle,
  items,
  formatValue,
  barColor = "bg-primary",
}: {
  title: string;
  subtitle?: string;
  items: BarChartItem[];
  formatValue?: (val: number) => string;
  barColor?: string;
}) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
      <div>
        <h3 className="font-extrabold text-foreground text-base">{title}</h3>
        {subtitle && <p className="text-2xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">No data available.</div>
      ) : (
        <div className="space-y-3 pt-2">
          {items.map((item, idx) => {
            const pct = Math.round((item.value / maxValue) * 100);

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground truncate max-w-[200px]">{item.label}</span>
                  <span className="font-extrabold text-primary">
                    {formatValue ? formatValue(item.value) : item.value}
                  </span>
                </div>
                <div className="h-2 w-full bg-accent/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TrendBarChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: Array<{ month: string; count: number; total_amount?: number }>;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
      <div>
        <h3 className="font-extrabold text-foreground text-base">{title}</h3>
        {subtitle && <p className="text-2xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-end justify-between gap-2 h-40 pt-4 border-b border-border">
        {data.map((item, idx) => {
          const heightPct = Math.round((item.count / maxCount) * 100);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
              <span className="text-3xs font-extrabold text-muted-foreground group-hover:text-primary transition-colors">
                {item.count}
              </span>
              <div
                className="w-full max-w-[28px] bg-primary/80 group-hover:bg-primary rounded-t-md transition-all duration-300"
                style={{ height: `${Math.max(heightPct, 8)}%` }}
              />
              <span className="text-3xs font-semibold text-muted-foreground truncate w-full text-center mt-1">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
