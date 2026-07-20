"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit2,
  Package,
  MapPin,
  DollarSign,
  TrendingDown,
  Warehouse,
  History,
  Users,
  Eye,
  Barcode,
  Grid,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sparePartsService } from "@/services/spare-parts";
import { cn, formatCurrency } from "@/lib/utils";

type TabType = "overview" | "location" | "history";

export default function SparePartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Query
  const { data: part, isLoading, error } = useQuery({
    queryKey: ["spare-part", id],
    queryFn: () => sparePartsService.getPart(id),
    enabled: !!id,
  });

  const isStoreKeeper = user?.role === "STORE_KEEPER";
  const canEdit = user?.role === "ADMIN" || user?.role === "WAREHOUSE_MANAGER" || isStoreKeeper;

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer title="Loading spare part specs...">
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error || !part) {
    return (
      <DashboardLayout>
        <PageContainer title="Part not found">
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            Failed to retrieve spare part information. It may have been deleted or does not exist.
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/spare-parts")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Catalog
          </Button>
        </PageContainer>
      </DashboardLayout>
    );
  }

  const isLowStock = part.current_stock <= part.minimum_stock && part.current_stock > 0;
  const isOutStock = part.current_stock === 0;

  return (
    <DashboardLayout>
      <PageContainer title={`${part.part_name}`}>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Spare Parts", href: "/spare-parts" },
            { label: part.part_number, active: true },
          ]}
        />

        {/* Action Header bar */}
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/spare-parts")}
            className="flex items-center gap-1 border-border cursor-pointer text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>

          {canEdit && (
            <Button
              size="sm"
              onClick={() => router.push(`/spare-parts/edit/${part.id}`)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold cursor-pointer text-xs"
            >
              <Edit2 className="h-4 w-4" />
              Edit Part Details
            </Button>
          )}
        </div>

        {/* Overview Layout Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Image and quick stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border shadow-xs overflow-hidden">
              <div className="flex h-72 w-full items-center justify-center bg-accent/40 relative">
                {part.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={part.image} alt={part.part_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground/60">
                    <Package className="h-20 w-20 mb-2" />
                    <span className="text-xs font-semibold">No Image Attached</span>
                  </div>
                )}
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    Part Number
                  </span>
                  <h3 className="text-lg font-extrabold text-primary select-all">
                    {part.part_number}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                      UOM
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {part.unit_of_measure}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                      Status
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border",
                        part.status === "active" && !isLowStock && !isOutStock
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : isOutStock
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {isOutStock ? "Out of Stock" : isLowStock ? "Low Stock" : part.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tab Specs and Panels */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Navigation Tabs */}
            <div className="flex border-b border-border gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5",
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid className="h-4 w-4" />
                Specifications
              </button>
              <button
                onClick={() => setActiveTab("location")}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5",
                  activeTab === "location"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <MapPin className="h-4 w-4" />
                Storage & Suppliers
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5",
                  activeTab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <History className="h-4 w-4" />
                Transaction History
              </button>
            </div>

            {/* Tab content renders */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Specifications List */}
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">General Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Manufacturer</span>
                      <p className="text-sm font-semibold text-foreground">{part.manufacturer}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Brand</span>
                      <p className="text-sm font-semibold text-foreground">{part.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Category</span>
                      <p className="text-sm font-semibold text-foreground">{part.category?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Bar/QR Codes</span>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Barcode className="h-4 w-4 text-muted-foreground" />
                        {part.barcode || "None"}
                      </p>
                    </div>
                    <div className="md:col-span-2 pt-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Description</span>
                      <p className="text-sm text-foreground bg-accent/35 p-3 rounded-lg border border-border leading-normal">
                        {part.description || "No description provided."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-border shadow-xs">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Current Qty</span>
                        <p className="text-lg font-black text-foreground">{part.current_stock}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-xs">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                        <TrendingDown className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Min Limit</span>
                        <p className="text-lg font-black text-foreground">{part.minimum_stock}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-xs">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Max Capacity</span>
                        <p className="text-lg font-black text-foreground">{part.maximum_stock}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pricing Details */}
                <Card className="border-border shadow-xs">
                  <CardContent className="p-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Cost Price</span>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(part.cost_price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Selling Price</span>
                        <p className="text-sm font-bold text-foreground">
                          {part.selling_price ? formatCurrency(part.selling_price) : "Not For Sale"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Auditing Metadata */}
                <div className="text-[10px] text-muted-foreground flex justify-between items-center px-2">
                  <span>Registered by: <strong>{part.created_by_username || "System"}</strong> ({new Date(part.created_at).toLocaleDateString()})</span>
                  <span>Updated by: <strong>{part.updated_by_username || "System"}</strong> ({new Date(part.updated_at).toLocaleDateString()})</span>
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Location Card */}
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Warehouse className="h-5 w-5 text-primary" />
                      Storage Allocation Coordinate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-accent/40 p-3 rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Warehouse</span>
                      <span className="text-sm font-bold text-foreground">{part.storage_location?.warehouse}</span>
                    </div>
                    <div className="bg-accent/40 p-3 rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Rack</span>
                      <span className="text-sm font-bold text-foreground">{part.storage_location?.rack}</span>
                    </div>
                    <div className="bg-accent/40 p-3 rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Shelf</span>
                      <span className="text-sm font-bold text-foreground">{part.storage_location?.shelf}</span>
                    </div>
                    <div className="bg-accent/40 p-3 rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Bin</span>
                      <span className="text-sm font-bold text-foreground">{part.storage_location?.bin}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Suppliers Placeholder */}
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Associated Suppliers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <Users className="h-10 w-10 text-muted-foreground/35 mb-2" />
                      <span className="text-xs font-bold">Supplier mappings will be configured in Sprint 5</span>
                      <span className="text-[10px] max-w-xs mt-1 leading-normal">
                        Preferred supply channels, replenishment lead times, and supplier quotes lists will display here.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Replenishment/Purchase History */}
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Purchase Replenishment Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <Eye className="h-8 w-8 text-muted-foreground/35 mb-2" />
                      <span className="text-xs font-bold">Purchase orders history will be configured in Sprint 6</span>
                      <span className="text-[10px] max-w-xs mt-1 leading-normal">
                        Replenishment orders list, receiving logs, and invoice prices will populate here once PO features are deployed.
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Checkout/Issue History */}
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Issue & Return Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <Eye className="h-8 w-8 text-muted-foreground/35 mb-2" />
                      <span className="text-xs font-bold">Check-outs and returns history will be configured in Sprint 7</span>
                      <span className="text-[10px] max-w-xs mt-1 leading-normal">
                        Work orders check-outs history, tracking technicians, and issue dates lists will populate here once issue/return features are deployed.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
