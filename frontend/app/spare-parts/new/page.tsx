"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { sparePartsService } from "@/services/spare-parts";

const partFormSchema = z
  .object({
    part_number: z.string().min(1, "Part number is required"),
    part_name: z.string().min(1, "Part name is required"),
    description: z.string().optional(),
    category_id: z.string().min(1, "Category is required"),
    manufacturer: z.string().min(1, "Manufacturer is required"),
    brand: z.string().min(1, "Brand is required"),
    unit_of_measure: z.string().min(1, "Unit of measure is required"),
    cost_price: z.preprocess(
      (val) => (val === "" || val === undefined ? 0 : Number(val)),
      z.number().min(0, "Cost price cannot be negative")
    ),
    selling_price: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().min(0, "Selling price cannot be negative").optional()
    ),
    minimum_stock: z.preprocess(
      (val) => (val === "" || val === undefined ? 0 : Number(val)),
      z.number().int().min(0, "Must be 0 or greater")
    ),
    current_stock: z.preprocess(
      (val) => (val === "" || val === undefined ? 0 : Number(val)),
      z.number().int().min(0, "Must be 0 or greater")
    ),
    maximum_stock: z.preprocess(
      (val) => (val === "" || val === undefined ? 0 : Number(val)),
      z.number().int().min(0, "Must be 0 or greater")
    ),
    storage_location_id: z.string().min(1, "Storage location is required"),
    barcode: z.string().optional(),
    qr_code: z.string().optional(),
    status: z.string().default("active"),
  })
  .refine((data) => data.minimum_stock <= data.maximum_stock, {
    message: "Minimum stock cannot exceed maximum stock",
    path: ["minimum_stock"],
  })
  .refine((data) => data.current_stock <= data.maximum_stock, {
    message: "Current stock cannot exceed maximum stock",
    path: ["current_stock"],
  });

type PartFormValues = z.input<typeof partFormSchema>;

export default function NewSparePartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Queries
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => sparePartsService.getCategories(),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => sparePartsService.getLocations(),
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      part_number: "",
      part_name: "",
      description: "",
      category_id: "",
      manufacturer: "",
      brand: "",
      unit_of_measure: "Pcs",
      cost_price: 0,
      minimum_stock: 5,
      current_stock: 10,
      maximum_stock: 50,
      storage_location_id: "",
      barcode: "",
      qr_code: "",
      status: "active",
    },
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => sparePartsService.createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
      router.push("/spare-parts");
    },
    onError: (err: unknown) => {
      // Map DRF API validation responses
      const axiosError = err as { response?: { data?: Record<string, string[]> } };
      const detail = axiosError.response?.data;
      if (detail && typeof detail === "object") {
        const firstErr = Object.keys(detail)[0];
        setSubmissionError(`${firstErr.toUpperCase()}: ${detail[firstErr]}`);
      } else {
        setSubmissionError("An unexpected error occurred during creation.");
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: PartFormValues) => {
    setSubmissionError(null);
    const formData = new FormData();
    
    // Append form values
    Object.entries(values).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    });

    // Append image file if selected
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    createMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <PageContainer
        title="Register New Spare Part"
        subtitle="Catalog a new spare part asset. Enter inventory levels, pricing, storage locations, and identifiers."
      >
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Spare Parts", href: "/spare-parts" },
            { label: "Register Part", active: true },
          ]}
        />

        {/* Back Link */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/spare-parts")}
            className="flex items-center gap-1 border-border cursor-pointer text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
        </div>

        {submissionError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold rounded-lg">
            {submissionError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
              Basic Specification Info
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Part Number (SKU / Unique Identifier)" error={errors.part_number?.message}>
                <input
                  type="text"
                  {...register("part_number")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </FormField>

              <FormField label="Part Name" error={errors.part_name?.message}>
                <input
                  type="text"
                  {...register("part_name")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </FormField>

              <FormField label="Category" error={errors.category_id?.message}>
                <select
                  {...register("category_id")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  {categories && categories.length > 0 ? (
                    <>
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">No Categories Available</option>
                  )}
                </select>
                {categories && categories.length === 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Master data must be created first. Please create categories in the database or seed them.
                  </p>
                )}
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Manufacturer" error={errors.manufacturer?.message}>
                  <input
                    type="text"
                    {...register("manufacturer")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </FormField>
                <FormField label="Brand / OEM Series" error={errors.brand?.message}>
                  <input
                    type="text"
                    {...register("brand")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </FormField>
              </div>

              <FormField label="Unit of Measure (e.g. Pcs, Box, Set)" error={errors.unit_of_measure?.message}>
                <input
                  type="text"
                  {...register("unit_of_measure")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                />
              </FormField>

              <FormField label="Status" error={errors.status?.message}>
                <select
                  {...register("status")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
            </div>

            <FormField label="Part Description" error={errors.description?.message}>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
              />
            </FormField>
          </div>

          {/* Section 2: Inventory Stock Levels */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
              Inventory & Tracking Metrics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Minimum Threshold (Safety Stock)" error={errors.minimum_stock?.message}>
                <input
                  type="number"
                  {...register("minimum_stock")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                />
              </FormField>

              <FormField label="Current On-Hand Quantity" error={errors.current_stock?.message}>
                <input
                  type="number"
                  {...register("current_stock")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                />
              </FormField>

              <FormField label="Maximum Allowed Capacity" error={errors.maximum_stock?.message}>
                <input
                  type="number"
                  {...register("maximum_stock")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Barcode (UPC / SKU)" error={errors.barcode?.message}>
                <input
                  type="text"
                  {...register("barcode")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                />
              </FormField>

              <FormField label="QR Code Reference" error={errors.qr_code?.message}>
                <input
                  type="text"
                  {...register("qr_code")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Pricing and Storage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pricing Card */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
                Pricing (INR / ₹)
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Cost Price (₹)" error={errors.cost_price?.message}>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cost_price")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  />
                </FormField>

                <FormField label="Selling Price (₹ - Optional)" error={errors.selling_price?.message}>
                  <input
                    type="number"
                    step="0.01"
                    {...register("selling_price")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden"
                  />
                </FormField>
              </div>
            </div>

            {/* Storage Location Card */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
                Storage Allocation
              </h3>

              <FormField label="Select Storage Location (Bin Coordinate)" error={errors.storage_location_id?.message}>
                <select
                  {...register("storage_location_id")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  {locations && locations.length > 0 ? (
                    <>
                      <option value="">Select Bin Location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.warehouse} — Rack {loc.rack}, Shelf {loc.shelf}, Bin {loc.bin}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">No Storage Locations Available</option>
                  )}
                </select>
                {locations && locations.length === 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Master data must be created first. Please create storage locations in the database or seed them.
                  </p>
                )}
              </FormField>
            </div>
          </div>

          {/* Section 4: Image File Upload */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
              Media Attachments
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview Box */}
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border bg-accent text-muted-foreground overflow-hidden">
                {imagePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/55" />
                )}
              </div>

              {/* Upload Input Button */}
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-semibold text-muted-foreground block mb-2">
                  Attach an image file of the spare part. Only PNG, JPG, or JPEG images under 5MB.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs text-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/spare-parts")}
              className="cursor-pointer border-border text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold cursor-pointer text-xs"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Register Part
                </>
              )}
            </Button>
          </div>
        </form>
      </PageContainer>
    </DashboardLayout>
  );
}
