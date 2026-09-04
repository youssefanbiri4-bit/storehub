import { z } from "zod";

const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "Invalid URL" }
  );

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  short_description: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  cover_image: z.string().url("Cover image URL is required").optional().nullable(),
  gallery_images: z.array(z.string().url()).optional().default([]),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  old_price: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  is_free: z.boolean().default(false),
  product_type: z.string().min(1, "Product type is required"),
  file_format: z.string().optional().nullable(),
  file_size: z.string().optional().nullable(),
  external_url: urlSchema,
  category_id: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  badge: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  included_items: z.array(z.string()).optional().default([]),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  canonical_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  og_image: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  image_alt_text: z.string().max(200).optional().nullable(),
  // Delivery fields
  delivery_method: z.enum(["external_link", "hosted_file"]).default("external_link"),
  external_platform: z.string().optional().nullable(),
  hosted_access_type: z.enum(["free", "paid"]).optional().nullable(),
  download_limit: z.number().min(1).optional().nullable(),
  download_link_expiry_minutes: z.number().min(1).max(60).default(5),
  payment_provider: z.string().optional().nullable(),
  payment_provider_product_id: z.string().optional().nullable(),
  payment_provider_price_id: z.string().optional().nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  sort_order: z.coerce.number().min(0).default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
