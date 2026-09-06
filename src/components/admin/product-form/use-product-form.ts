"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { productSchema } from "@/lib/validators";
import type { Category, ProductEditData, ProductStatus, DeliveryMethod, HostedAccessType } from "@/types";
import { createProductAction, updateProductAction, autosaveProductAction } from "@/lib/actions/products";
import { buildProductWritePayload } from "@/lib/product-payload";
import { toast } from "sonner";
import { getSafeDatabaseErrorMessage } from "@/lib/errors/database-error";

export function useProductForm(product?: ProductEditData) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [includedItems, setIncludedItems] = useState<string[]>(product?.included_items || []);
  const [itemInput, setItemInput] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.gallery_images || []);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>((product?.delivery_method as DeliveryMethod) || "external_link");
  const [externalPlatform, setExternalPlatform] = useState(product?.external_platform || "");
  const [hostedAccessType, setHostedAccessType] = useState<HostedAccessType>((product?.hosted_access_type as HostedAccessType) || "free");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | undefined>(product?.updated_at || undefined);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveInFlightRef = useRef(false);

  const derivePrice = (p?: typeof product): number => {
    if (!p) return 0;
    if (typeof p.base_price_minor === "number" && p.base_price_minor !== null) {
      return p.base_price_minor / 100;
    }
    if (typeof p.price === "number") return p.price;
    return 0;
  };
  const deriveOldPrice = (p?: typeof product): number | undefined => {
    if (!p) return undefined;
    if (typeof p.compare_at_price_minor === "number" && p.compare_at_price_minor !== null) {
      return p.compare_at_price_minor / 100;
    }
    if (typeof p.old_price === "number" && p.old_price !== null) return p.old_price;
    return undefined;
  };

  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      short_description: product?.short_description || "",
      description: product?.description || "",
      cover_image: product?.cover_image || "",
      gallery_images: product?.gallery_images || [],
      price: derivePrice(product),
      old_price: deriveOldPrice(product),
      currency: product?.currency || "MAD",
      is_free: product?.is_free || false,
      product_type: product?.product_type || "ebook",
      file_format: product?.file_format || "",
      file_size: product?.file_size || "",
      external_url: product?.external_url || "",
      category_id: product?.category_id || undefined,
      tags: product?.tags || [],
      badge: product?.badge || undefined,
      requirements: product?.requirements || "",
      included_items: product?.included_items || [],
      is_featured: product?.is_featured || false,
      is_published: product?.is_published || false,
      seo_title: product?.seo_title || "",
      seo_description: product?.seo_description || "",
      canonical_url: product?.canonical_url || "",
      og_image: product?.og_image || "",
      image_alt_text: product?.image_alt_text || "",
      delivery_method: product?.delivery_method || "external_link",
      external_platform: product?.external_platform || "",
      hosted_access_type: product?.hosted_access_type || "free",
      download_limit: product?.download_limit || undefined,
      download_link_expiry_minutes: product?.download_link_expiry_minutes || 5,
      payment_provider: product?.payment_provider || "",
      payment_provider_product_id: product?.payment_provider_product_id || "",
      payment_provider_price_id: product?.payment_provider_price_id || "",
    },
  });

  const { getValues, watch, trigger } = form;
  const isFree = watch("is_free");
  const formValues = watch();

  const autosave = useCallback(async () => {
    if (!product) return;
    if (autosaveInFlightRef.current || saving) return;
    const values = getValues();
    const formData = {
      ...values,
      tags,
      included_items: includedItems,
      gallery_images: galleryImages,
      delivery_method: deliveryMethod,
      external_platform: externalPlatform,
      hosted_access_type: hostedAccessType,
    };
    const { errors } = buildProductWritePayload(formData);
    if (errors) {
      setAutosaveStatus("error");
      return;
    }
    autosaveInFlightRef.current = true;
    setAutosaveStatus("saving");
    try {
      const result = await autosaveProductAction(product.id, formData, expectedUpdatedAt);
      if (!result.success) throw new Error(result.error || "Autosave failed");
      setAutosaveStatus("saved");
      setLastSaved(new Date().toLocaleTimeString("en-US"));
      setHasUnsavedChanges(false);
      if (result.updatedAt) setExpectedUpdatedAt(result.updatedAt);
    } catch {
      setAutosaveStatus("error");
    } finally {
      autosaveInFlightRef.current = false;
    }
  }, [product, getValues, tags, includedItems, galleryImages, deliveryMethod, externalPlatform, hostedAccessType, saving, expectedUpdatedAt]);

  useEffect(() => {
    if (form.formState.isDirty || hasUnsavedChanges) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        autosave();
      }, 30000);
    }
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [form.formState.isDirty, formValues, autosave, hasUnsavedChanges]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("id, name, slug").order("sort_order");
      // Only fetch needed columns, not "*"
      setCategories((data || []) as Category[]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = async (status?: ProductStatus) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (autosaveInFlightRef.current) {
      toast.error("Autosave in progress, please wait");
      return;
    }
    setSaving(true);
    const values = getValues();
    const formData = {
      ...values,
      tags,
      included_items: includedItems,
      gallery_images: galleryImages,
      delivery_method: deliveryMethod,
      external_platform: externalPlatform,
      hosted_access_type: hostedAccessType,
      external_url: deliveryMethod === "external_link" ? values.external_url : "",
      ...(status ? { status, is_published: status === "published" } : {}),
    };
    const { errors } = buildProductWritePayload(formData, status ? { statusOverride: status } : undefined);
    if (errors) {
      toast.error(errors[0] || "Please fix validation errors before saving");
      setSaving(false);
      return;
    }
    try {
      if (product) {
        const result = await updateProductAction(product.id, formData, expectedUpdatedAt ? { expectedUpdatedAt } : undefined);
        if (!result.success) {
          toast.error(result.error || "Failed to update product");
          setSaving(false);
          return;
        }
        toast.success("Product updated successfully");
      } else {
        const result = await createProductAction(formData);
        if (!result.success) {
          toast.error(result.error || "Failed to create product");
          setSaving(false);
          return;
        }
        toast.success("Product created successfully");
      }
      setHasUnsavedChanges(false);
      setSaving(false);
      router.push("/admin/products");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg);
      setSaving(false);
    }
  };

  return {
    form,
    categories,
    tags, setTags, tagInput, setTagInput,
    includedItems, setIncludedItems, itemInput, setItemInput,
    galleryImages, setGalleryImages,
    deliveryMethod, setDeliveryMethod,
    externalPlatform, setExternalPlatform,
    hostedAccessType, setHostedAccessType,
    saving, lastSaved, autosaveStatus, hasUnsavedChanges, setHasUnsavedChanges,
    isFree, formValues,
    handleSave,
  };
}
