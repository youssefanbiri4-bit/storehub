"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, Save, Eye, Plus, X, CheckCircle,
  AlertCircle, Clock, Loader2, ImageIcon, Tag,
  Search as SearchIcon, Settings, FileText, Megaphone, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { productSchema } from "@/lib/validators";
import { getSafeDatabaseErrorMessage } from "@/lib/errors/database-error";
import type { Category, Product, ProductStatus, DeliveryMethod, HostedAccessType } from "@/types";
import { PRODUCT_TYPES, BADGE_OPTIONS, EXTERNAL_PLATFORMS } from "@/types";
import { DeliveryMethodField } from "@/components/admin/delivery-method-field";
import { ProductFilesManager } from "@/components/admin/product-files-manager";
import { SeoManager } from "@/components/admin/seo-manager";
import type { ProductFile } from "@/types";
import { toast } from "sonner";

interface AdminProductFormProps {
  product?: Product;
}

const TAB_CONFIG = [
  { id: "general", label: "General", icon: FileText },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "pricing", label: "Pricing", icon: Tag },
  { id: "seo", label: "SEO", icon: SearchIcon },
  { id: "cta", label: "CTA", icon: Megaphone },
  { id: "organization", label: "Organization", icon: Layers },
] as const;

type TabId = (typeof TAB_CONFIG)[number]["id"];

const TAB_FIELDS: Record<TabId, string[]> = {
  general: ["name", "slug", "product_type"],
  media: [],
  pricing: ["price"],
  seo: [],
  cta: [],
  organization: [],
};

export function AdminProductForm({ product }: AdminProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [includedItems, setIncludedItems] = useState<string[]>(product?.included_items || []);
  const [itemInput, setItemInput] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.gallery_images || []);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>((product?.delivery_method as DeliveryMethod) || "external_link");
  const [externalPlatform, setExternalPlatform] = useState(product?.external_platform || "");
  const [hostedAccessType, setHostedAccessType] = useState<HostedAccessType>((product?.hosted_access_type as HostedAccessType) || "free");
  const [productFiles, setProductFiles] = useState<ProductFile[]>(product?.product_files || []);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors, isDirty },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form resolver type mismatch with zod
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      short_description: product?.short_description || "",
      description: product?.description || "",
      cover_image: product?.cover_image || "",
      gallery_images: product?.gallery_images || [],
      price: product?.price || 0,
      old_price: product?.old_price || undefined,
      currency: product?.currency || "USD",
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

  const isFree = watch("is_free");
  const formValues = watch();

  const autosave = useCallback(async () => {
    if (!product) return;
    setAutosaveStatus("saving");
    try {
      const supabase = createClient();
      const values = getValues();
      const { error } = await supabase
        .from("products")
        .update({
          ...values,
          tags,
          included_items: includedItems,
          gallery_images: galleryImages,
          delivery_method: deliveryMethod,
          external_platform: externalPlatform,
          hosted_access_type: deliveryMethod === "hosted_file" ? hostedAccessType : null,
        })
        .eq("id", product.id);
      if (error) throw error;
      setAutosaveStatus("saved");
      setLastSaved(new Date().toLocaleTimeString("en-US"));
      setHasUnsavedChanges(false);
    } catch {
      setAutosaveStatus("error");
    }
  }, [product, getValues, tags, includedItems, galleryImages, deliveryMethod, externalPlatform, hostedAccessType]);

  useEffect(() => {
    if (isDirty || hasUnsavedChanges) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        autosave();
      }, 30000);
    }
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [isDirty, formValues, autosave, hasUnsavedChanges]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      setCategories((data || []) as Category[]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue("tags", newTags as string[]);
      setTagInput("");
      setHasUnsavedChanges(true);
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setValue("tags", newTags as string[]);
    setHasUnsavedChanges(true);
  };

  const addItem = () => {
    if (itemInput.trim() && !includedItems.includes(itemInput.trim())) {
      const newItems = [...includedItems, itemInput.trim()];
      setIncludedItems(newItems);
      setValue("included_items", newItems as string[]);
      setItemInput("");
      setHasUnsavedChanges(true);
    }
  };

  const removeItem = (item: string) => {
    const newItems = includedItems.filter((i) => i !== item);
    setIncludedItems(newItems);
    setValue("included_items", newItems as string[]);
    setHasUnsavedChanges(true);
  };

  const addGalleryImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const newImages = [...galleryImages, url];
      setGalleryImages(newImages);
      setValue("gallery_images", newImages as string[]);
      setHasUnsavedChanges(true);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newImages);
    setValue("gallery_images", newImages as string[]);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (status?: ProductStatus) => {
    setSaving(true);
    const supabase = createClient();
    const values = getValues();
    const payload = {
      ...values,
      tags,
      included_items: includedItems,
      gallery_images: galleryImages,
      delivery_method: deliveryMethod,
      external_platform: externalPlatform,
      hosted_access_type: deliveryMethod === "hosted_file" ? hostedAccessType : null,
      external_url: deliveryMethod === "external_link" ? values.external_url : "",
      ...(status ? { status, is_published: status === "published" } : {}),
    };

    if (product) {
      const { error } = await supabase.from("products").update(payload).eq("id", product.id);
      if (error) {
        toast.error(getSafeDatabaseErrorMessage(error.code));
        setSaving(false);
        return;
      }
      toast.success("Product updated successfully");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        toast.error(getSafeDatabaseErrorMessage(error.code));
        setSaving(false);
        return;
      }
      toast.success("Product created successfully");
    }
    setHasUnsavedChanges(false);
    setSaving(false);
    router.push("/admin/products");
  };

  const handleSaveDraft = () => handleSave("draft");
  const handlePublish = () => handleSave("published");

  const validateTab = async (tab: TabId) => {
    const fields = TAB_FIELDS[tab];
    if (fields.length === 0) return true;
    const result = await trigger(fields as never);
    return result;
  };

  const handleTabChange = async (tab: string) => {
    const valid = await validateTab(activeTab);
    if (valid) {
      setActiveTab(tab as TabId);
    } else {
      toast.error("Please fix the errors in the current tab before continuing");
    }
  };

  const completionPercent = Math.round(
    (Object.values(formValues).filter((v) => v !== "" && v !== null && v !== undefined && v !== 0).length /
      Object.keys(formValues).length) *
    100
  );

  const errorCount = Object.keys(errors).length;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product ? "Edit Product" : "Add New Product"}</h1>
            <p className="text-sm text-muted-foreground">
              {completionPercent}% complete
              {errorCount > 0 && <span className="text-destructive"> &middot; {errorCount} error(s)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {autosaveStatus === "saving" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Saving...</span>
              </>
            )}
            {autosaveStatus === "saved" && lastSaved && (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Last saved: {lastSaved}</span>
              </>
            )}
            {autosaveStatus === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Save failed</span>
              </>
            )}
            {hasUnsavedChanges && autosaveStatus === "idle" && (
              <>
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">Unsaved changes</span>
              </>
            )}
          </div>
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
            <Save className="ml-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={saving}>
            Publish Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line" className="w-full justify-start mb-6 overflow-x-auto">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    onChange={(e) => {
                      register("name").onChange(e);
                      if (!product) setValue("slug", generateSlug(e.target.value));
                      setHasUnsavedChanges(true);
                    }}
                  />
                  {errors.name && <p className="text-sm text-destructive">{(errors.name as { message?: string })?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input id="slug" {...register("slug")} dir="ltr" onChange={(e) => {
                    register("slug").onChange(e);
                    setHasUnsavedChanges(true);
                  }} />
                  {errors.slug && <p className="text-sm text-destructive">{(errors.slug as { message?: string })?.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea id="short_description" rows={2} {...register("short_description")} onChange={(e) => {
                  register("short_description").onChange(e);
                  setHasUnsavedChanges(true);
                }} />
                <p className="text-xs text-muted-foreground">{(formValues.short_description || "").length}/500 chars</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea id="description" rows={6} {...register("description")} onChange={(e) => {
                  register("description").onChange(e);
                  setHasUnsavedChanges(true);
                }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Type *</Label>
                  <Select defaultValue={product?.product_type || "ebook"} onValueChange={(v) => {
                    if (v) { setValue("product_type", v); setHasUnsavedChanges(true); }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCT_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select defaultValue={product?.category_id || ""} onValueChange={(v) => {
                    setValue("category_id", v && v !== "none" ? v : undefined);
                    setHasUnsavedChanges(true);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images &amp; Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cover_image">Cover Image URL</Label>
                <Input id="cover_image" dir="ltr" placeholder="https://..." {...register("cover_image")} onChange={(e) => {
                  register("cover_image").onChange(e);
                  setHasUnsavedChanges(true);
                }} />
                {formValues.cover_image && (
                  <div className="mt-2">
                    <img
                      src={formValues.cover_image}
                      alt="Cover preview"
                      className="h-32 w-32 rounded-lg object-cover border border-border"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Image Gallery</Label>
                <div className="flex flex-wrap gap-2">
                  {galleryImages.map((img, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                      <span className="truncate max-w-[150px]">{img}</span>
                      <button type="button" onClick={() => removeGalleryImage(i)}><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGalleryImage}>
                  <Plus className="ml-1 h-3 w-3" /> Add Image
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch id="is_free" checked={isFree} onCheckedChange={(v) => { setValue("is_free", v); setHasUnsavedChanges(true); }} />
                <Label htmlFor="is_free">Free product</Label>
              </div>
              {!isFree && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input id="price" type="number" step="0.01" {...register("price")} onChange={(e) => {
                      register("price").onChange(e);
                      setHasUnsavedChanges(true);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="old_price">Previous Price</Label>
                    <Input id="old_price" type="number" step="0.01" {...register("old_price")} onChange={(e) => {
                      register("old_price").onChange(e);
                      setHasUnsavedChanges(true);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" {...register("currency")} onChange={(e) => {
                      register("currency").onChange(e);
                      setHasUnsavedChanges(true);
                    }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <SeoManager formValues={formValues} register={register} setHasUnsavedChanges={setHasUnsavedChanges} product={product} />
        </TabsContent>

        {/* CTA Tab (Delivery) */}
        <TabsContent value="cta">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Call to Action &amp; Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <DeliveryMethodField
                value={deliveryMethod}
                onChange={(v) => {
                  setDeliveryMethod(v);
                  setValue("delivery_method", v);
                  setHasUnsavedChanges(true);
                }}
              />

              {deliveryMethod === "external_link" && (
                <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select
                      value={externalPlatform}
                      onValueChange={(v) => {
                        if (v) {
                          setExternalPlatform(v);
                          setValue("external_platform", v);
                          setHasUnsavedChanges(true);
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                      <SelectContent>
                        {EXTERNAL_PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="external_url">Purchase/Download URL *</Label>
                    <Input
                      id="external_url"
                      dir="ltr"
                      placeholder="https://..."
                      {...register("external_url")}
                      onChange={(e) => {
                        register("external_url").onChange(e);
                        setHasUnsavedChanges(true);
                      }}
                    />
                    {errors.external_url && (
                      <p className="text-sm text-destructive">
                        {(errors.external_url as { message?: string })?.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {deliveryMethod === "hosted_file" && (
                <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label>Access Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className={`rounded-lg border-2 p-3 text-left text-sm transition-[border-color,background-color] ${
                          hostedAccessType === "free"
                            ? "border-foreground bg-foreground/5 font-semibold"
                            : "border-border bg-white hover:border-foreground/30"
                        }`}
                        onClick={() => {
                          setHostedAccessType("free");
                          setValue("hosted_access_type", "free");
                          setHasUnsavedChanges(true);
                        }}
                      >
                        Free Download
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          Visitors can download through a temporary secure link.
                        </p>
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg border-2 p-3 text-left text-sm transition-[border-color,background-color] ${
                          hostedAccessType === "paid"
                            ? "border-foreground bg-foreground/5 font-semibold"
                            : "border-border bg-white hover:border-foreground/30"
                        }`}
                        onClick={() => {
                          setHostedAccessType("paid");
                          setValue("hosted_access_type", "paid");
                          setHasUnsavedChanges(true);
                        }}
                      >
                        Paid Download
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          Customers receive access after verified payment.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="download_limit">Download Limit (optional)</Label>
                      <Input
                        id="download_limit"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        value={watch("download_limit") || ""}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : undefined;
                          setValue("download_limit", val);
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="download_link_expiry_minutes">Signed Link Expiry (minutes)</Label>
                      <Input
                        id="download_link_expiry_minutes"
                        type="number"
                        min="1"
                        max="60"
                        value={watch("download_link_expiry_minutes") || 5}
                        onChange={(e) => {
                          setValue("download_link_expiry_minutes", parseInt(e.target.value) || 5);
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>

                  {/* Product Files Manager */}
                  {product && (
                    <ProductFilesManager
                      productId={product.id}
                      files={productFiles}
                      onFilesChange={(files) => {
                        setProductFiles(files);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  )}

                  {!product && (
                    <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                      Save the product first, then upload files in the editor.
                    </div>
                  )}

                  {hostedAccessType === "paid" && (
                    <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-sm font-medium text-yellow-800">
                        Payment Setup
                      </p>
                      <p className="text-xs text-yellow-700">
                        Configure your payment provider to enable paid downloads.
                      </p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Payment Provider</Label>
                          <Input
                            placeholder="e.g. stripe"
                            value={watch("payment_provider") || ""}
                            onChange={(e) => {
                              setValue("payment_provider", e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Provider Product ID</Label>
                          <Input
                            placeholder="Optional"
                            value={watch("payment_provider_product_id") || ""}
                            onChange={(e) => {
                              setValue("payment_provider_product_id", e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Provider Price ID</Label>
                          <Input
                            placeholder="Optional"
                            value={watch("payment_provider_price_id") || ""}
                            onChange={(e) => {
                              setValue("payment_provider_price_id", e.target.value);
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Publishing &amp; Badge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Select defaultValue={product?.badge || ""} onValueChange={(v) => {
                    setValue("badge", v === "none" || !v ? undefined : v);
                    setHasUnsavedChanges(true);
                  }}>
                    <SelectTrigger><SelectValue placeholder="No badge" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No badge</SelectItem>
                      {BADGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Switch id="is_featured" checked={watch("is_featured")} onCheckedChange={(v) => { setValue("is_featured", v); setHasUnsavedChanges(true); }} />
                    <Label htmlFor="is_featured">Featured product</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="mr-1"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requirements">Usage Requirements</Label>
                  <Textarea id="requirements" rows={3} {...register("requirements")} onChange={(e) => {
                    register("requirements").onChange(e);
                    setHasUnsavedChanges(true);
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>What&apos;s Included</Label>
                  <div className="flex flex-wrap gap-2">
                    {includedItems.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                        <button type="button" onClick={() => removeItem(item)} className="mr-1"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={itemInput}
                      onChange={(e) => setItemInput(e.target.value)}
                      placeholder="Add item"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                    />
                    <Button type="button" variant="outline" onClick={addItem}>Add</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {product && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Product Preview
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click to preview the product as visitors will see it.
                  </p>
                  <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Eye className="ml-2 h-4 w-4" />
                      Preview as Visitor
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
