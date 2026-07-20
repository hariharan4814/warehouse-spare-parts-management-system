"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  ArrowUpDown,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { sparePartsService, SparePart } from "@/services/spare-parts";
import { cn } from "@/lib/utils";

export default function SparePartsListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search, Filter, Sort, Pagination States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("part_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // UI States
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    part_number: true,
    part_name: true,
    category: true,
    brand: true,
    stock: true,
    location: true,
    status: true,
  });

  // Soft Delete Dialog State
  const [partToDelete, setPartToDelete] = useState<SparePart | null>(null);

  // Queries
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => sparePartsService.getCategories(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => sparePartsService.getLocations(),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "spare-parts",
      search,
      selectedCategory,
      selectedLocation,
      selectedStatus,
      page,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      sparePartsService.getParts({
        search,
        category: selectedCategory,
        storage_location: selectedLocation,
        status: selectedStatus,
        page,
        ordering: `${sortOrder === "desc" ? "-" : ""}${sortBy}`,
      }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => sparePartsService.deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
      setPartToDelete(null);
    },
  });

  // Helper Roles check
  const isStoreKeeper = user?.role === "STORE_KEEPER";
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "WAREHOUSE_MANAGER";
  const canCreateOrEdit = isAdmin || isManager || isStoreKeeper;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const handleCSVExport = () => {
    if (!data?.results || data.results.length === 0) return;

    const headers = [
      "Part Number",
      "Part Name",
      "Category",
      "Brand",
      "Manufacturer",
      "Current Stock",
      "Minimum Stock",
      "Maximum Stock",
      "Warehouse Location",
      "Cost Price",
      "Status",
    ];

    const rows = data.results.map((part) => [
      part.part_number,
      part.part_name,
      part.category?.name || "N/A",
      part.brand,
      part.manufacturer,
      part.current_stock,
      part.minimum_stock,
      part.maximum_stock,
      part.storage_location
        ? `${part.storage_location.warehouse} (Rack ${part.storage_location.rack}, Shelf ${part.storage_location.shelf})`
        : "N/A",
      part.cost_price,
      part.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spare_parts_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "STORE_KEEPER", "WAREHOUSE_MANAGER"]}>
      <DashboardLayout>
        <PageContainer
        title="Spare Parts Inventory Catalog"
        subtitle="Manage, edit, search, and track spare part assets across multiple regions."
      >
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Spare Parts", active: true },
          ]}
        />

        {/* Action Header Grid */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-hidden"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Storage Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-hidden"
            >
              <option value="">All Locations</option>
              {locations?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.warehouse} (Rack {loc.rack})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
            {/* Column Visibility Control */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className="flex items-center gap-2 h-9 text-xs border-border"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Columns
              </Button>
              {isColumnMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card p-2.5 shadow-md z-30 animate-in fade-in duration-100">
                  <div className="text-xs font-bold text-muted-foreground pb-2 mb-2 border-b border-border">
                    Toggle Columns
                  </div>
                  <div className="space-y-1.5">
                    {Object.keys(visibleColumns).map((col) => (
                      <label
                        key={col}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer font-medium hover:text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col as keyof typeof visibleColumns]}
                          onChange={() => toggleColumn(col as keyof typeof visibleColumns)}
                          className="rounded border-input text-primary focus:ring-0"
                        />
                        <span className="capitalize">{col.replace("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CSV Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCSVExport}
              className="flex items-center gap-2 h-9 text-xs border-border"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            {/* Create Button (Hide for Technician) */}
            {canCreateOrEdit && !isStoreKeeper && (
              <Link href="/spare-parts/new">
                <Button size="sm" className="flex items-center gap-1.5 h-9 text-xs bg-primary text-primary-foreground font-bold cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Add Spare Part
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-accent/30 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                  {visibleColumns.image && <th className="py-3.5 px-4 w-16">Image</th>}
                  
                  {visibleColumns.part_number && (
                    <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort("part_number")}>
                      <div className="flex items-center gap-1.5">
                        Part Number
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}

                  {visibleColumns.part_name && (
                    <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort("part_name")}>
                      <div className="flex items-center gap-1.5">
                        Part Name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}

                  {visibleColumns.category && <th className="py-3.5 px-4">Category</th>}
                  {visibleColumns.brand && <th className="py-3.5 px-4">Brand</th>}
                  
                  {visibleColumns.stock && (
                    <th className="py-3.5 px-4 text-center cursor-pointer hover:text-foreground" onClick={() => handleSort("current_stock")}>
                      <div className="flex items-center gap-1.5 justify-center">
                        Stock Count
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}

                  {visibleColumns.location && <th className="py-3.5 px-4">Location</th>}
                  {visibleColumns.status && <th className="py-3.5 px-4 text-center">Status</th>}
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  // Skeleton rows loader
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {visibleColumns.image && <td className="py-4 px-4"><div className="h-10 w-10 bg-accent rounded-md" /></td>}
                      {visibleColumns.part_number && <td className="py-4 px-4"><div className="h-4 w-20 bg-accent rounded" /></td>}
                      {visibleColumns.part_name && <td className="py-4 px-4"><div className="h-4 w-36 bg-accent rounded" /></td>}
                      {visibleColumns.category && <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>}
                      {visibleColumns.brand && <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded" /></td>}
                      {visibleColumns.stock && <td className="py-4 px-4"><div className="h-4 w-12 bg-accent rounded mx-auto" /></td>}
                      {visibleColumns.location && <td className="py-4 px-4"><div className="h-4 w-24 bg-accent rounded" /></td>}
                      {visibleColumns.status && <td className="py-4 px-4"><div className="h-4 w-16 bg-accent rounded mx-auto" /></td>}
                      <td className="py-4 px-4"><div className="h-6 w-16 bg-accent rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : !data || data.results.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <Package className="h-12 w-12 text-muted-foreground/40 animate-pulse" />
                        <span className="font-bold text-base">No spare parts found</span>
                        <span className="text-xs max-w-xs leading-normal">
                          Try adjusting filters or search queries to locate entries.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Render rows
                  data.results.map((part) => {
                    const isLowStock = part.current_stock <= part.minimum_stock && part.current_stock > 0;
                    const isOutStock = part.current_stock === 0;

                    return (
                      <tr key={part.id} className="hover:bg-accent/30 transition-colors">
                        {visibleColumns.image && (
                          <td className="py-3 px-4">
                            {part.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={part.image}
                                alt={part.part_name}
                                className="h-10 w-10 rounded-md object-cover border border-border"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-muted-foreground">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </td>
                        )}

                        {visibleColumns.part_number && (
                          <td className="py-3 px-4 font-bold text-primary truncate max-w-[120px]">
                            {part.part_number}
                          </td>
                        )}

                        {visibleColumns.part_name && (
                          <td className="py-3 px-4 font-semibold text-foreground truncate max-w-[200px]">
                            {part.part_name}
                          </td>
                        )}

                        {visibleColumns.category && (
                          <td className="py-3 px-4">
                            <span className="inline-flex rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 border border-primary/20 uppercase tracking-wider">
                              {part.category?.name || "N/A"}
                            </span>
                          </td>
                        )}

                        {visibleColumns.brand && (
                          <td className="py-3 px-4 text-muted-foreground font-medium truncate max-w-[100px]">
                            {part.brand}
                          </td>
                        )}

                        {visibleColumns.stock && (
                          <td className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "font-bold text-sm",
                                isOutStock
                                  ? "text-rose-600 dark:text-rose-400"
                                  : isLowStock
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-foreground"
                              )}
                            >
                              {part.current_stock}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold"> / {part.maximum_stock} max</span>
                          </td>
                        )}

                        {visibleColumns.location && (
                          <td className="py-3 px-4 text-muted-foreground text-xs font-semibold truncate max-w-[150px]">
                            {part.storage_location
                              ? `${part.storage_location.warehouse} (R:${part.storage_location.rack})`
                              : "N/A"}
                          </td>
                        )}

                        {visibleColumns.status && (
                          <td className="py-3 px-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                                part.status === "active" && !isLowStock && !isOutStock
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : isOutStock
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              )}
                            >
                              {isOutStock ? "OUT OF STOCK" : isLowStock ? "LOW STOCK" : part.status}
                            </span>
                          </td>
                        )}

                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {/* View Detail */}
                            <Link href={`/spare-parts/${part.id}`}>
                              <button
                                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>

                            {/* Edit Action */}
                            {canCreateOrEdit && (
                              <Link href={`/spare-parts/edit/${part.id}`}>
                                <button
                                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Edit part details"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </Link>
                            )}

                            {/* Delete Action (Only for Admin) */}
                            {isAdmin && (
                              <button
                                onClick={() => setPartToDelete(part)}
                                className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {data && data.count > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center px-4 py-3 border-t border-border bg-accent/10">
              <div className="text-xs font-semibold text-muted-foreground">
                Showing {Math.min((page - 1) * 20 + 1, data.count)} to{" "}
                {Math.min(page * 20, data.count)} of {data.count} items
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="h-8 px-2 border-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-xs font-bold px-3 text-foreground">
                  Page {page} of {Math.ceil(data.count / 20)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(data.count / 20)}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-2 border-border"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Soft Delete Confirmation Modal Overlay */}
        {partToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirm Soft Delete
                </h3>
                <button
                  onClick={() => setPartToDelete(null)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-normal">
                  Are you sure you want to delete spare part:{" "}
                  <strong className="text-foreground">{partToDelete.part_name}</strong> (Part #
                  {partToDelete.part_number})?
                </p>
                <p className="text-xs text-muted-foreground/80 leading-normal bg-accent/40 p-2.5 rounded-lg border border-border">
                  <strong>Note:</strong> This will perform a <strong>soft delete</strong>. The item remains catalogued in audits but will be invisible throughout lists and queries.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setPartToDelete(null)} className="cursor-pointer border-border">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(partToDelete.id)}
                  className="font-bold cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  </ProtectedRoute>
  );
}
