"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { ChartCard } from "@/components/ui/chart-card";
import { ActivityCard } from "@/components/ui/activity-card";
import { AlertCard } from "@/components/ui/alert-card";
import { QuickActionCard } from "@/components/ui/quick-action-card";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";

import {
  MOCK_METRICS,
  MOCK_INVENTORY_OVERVIEW,
  MOCK_STOCK_IN_OUT,
  MOCK_MONTHLY_ACTIVITY,
  MOCK_LOW_STOCK_TREND,
  MOCK_ACTIVITIES,
  MOCK_LOW_STOCK_ITEMS,
} from "@/constants/mock-data";

export default function Home() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="Enterprise Dashboard"
          subtitle={`Welcome back, ${user?.first_name || user?.username || "Employee"}! Here is the latest overview of spare parts inventory.`}
        >
          {/* Breadcrumbs */}
          <Breadcrumb items={[{ label: "Dashboard", href: "/", active: true }]} />

          {/* Stats Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MOCK_METRICS.map((metric) => (
              <DashboardCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                type={metric.type}
                iconName={metric.iconName}
              />
            ))}
          </div>

          {/* Quick Actions Panel */}
          <QuickActionCard />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Inventory Category Share"
              description="Proportion of parts by catalog categories"
              type="inventory-overview"
              data={MOCK_INVENTORY_OVERVIEW}
            />
            <ChartCard
              title="Stock In vs. Stock Out"
              description="Monthly movements tracking (last 7 months)"
              type="stock-in-out"
              data={MOCK_STOCK_IN_OUT}
            />
            <ChartCard
              title="Warehouse Request Handling"
              description="Requests vs. actual issues & returns by facility"
              type="warehouse-activity"
              data={MOCK_MONTHLY_ACTIVITY}
            />
            <ChartCard
              title="Low Stock Alert Trend"
              description="Count of parts near threshold values"
              type="low-stock-trend"
              data={MOCK_LOW_STOCK_TREND}
            />
          </div>

          {/* Activity Logs and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertCard items={MOCK_LOW_STOCK_ITEMS} />
            <ActivityCard activities={MOCK_ACTIVITIES} />
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


