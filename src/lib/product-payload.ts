import { productSchema } from "@/lib/validators";
import { deliverySchema } from "@/lib/validation/product-delivery";
import { majorToMinor } from "@/lib/pricing";
import type { ProductWritePayload, ProductStatus } from "@/types";

// Explicit payload builder - separates display defaults from update data, shared between client validation and server
export function buildProductWritePayload(
  data: Record<string, unknown>,
  opts?: { statusOverride?: ProductStatus }
): { payload: ProductWritePayload; errors?: string[] } {
  const baseParsed = productSchema.safeParse(data);
  if (!baseParsed.success) {
    return { payload: null as unknown as ProductWritePayload, errors: baseParsed.error.issues.map((i) => i.message) };
  }
  const d = baseParsed.data;

  let deliveryInput: Record<string, unknown>;
  if (d.delivery_method === "external_link") {
    deliveryInput = {
      delivery_method: "external_link",
      external_platform: d.external_platform,
      external_url: d.external_url,
    };
  } else if (d.hosted_access_type === "paid") {
    deliveryInput = {
      delivery_method: "hosted_file",
      hosted_access_type: "paid",
      price: d.price,
      currency: d.currency,
      payment_provider: d.payment_provider,
      payment_provider_product_id: d.payment_provider_product_id,
      payment_provider_price_id: d.payment_provider_price_id,
      download_limit: d.download_limit,
      download_link_expiry_minutes: d.download_link_expiry_minutes,
    };
  } else {
    deliveryInput = {
      delivery_method: "hosted_file",
      hosted_access_type: "free",
      download_limit: d.download_limit,
      download_link_expiry_minutes: d.download_link_expiry_minutes,
    };
  }
  const deliveryParsed = deliverySchema.safeParse(deliveryInput);
  if (!deliveryParsed.success) {
    return { payload: null as unknown as ProductWritePayload, errors: deliveryParsed.error.issues.map((i) => i.message) };
  }

  const currency = d.currency || "MAD";

  let baseMinor: number;
  if (d.is_free) {
    baseMinor = 0;
  } else {
    const minor = majorToMinor(d.price, currency);
    if (minor === null || minor < 0) {
      return { payload: null as unknown as ProductWritePayload, errors: ["Invalid price"] };
    }
    baseMinor = minor;
  }

  let compareMinor: number | null = null;
  if (d.old_price !== null && d.old_price !== undefined) {
    const cm = majorToMinor(d.old_price, currency);
    if (cm !== null) compareMinor = cm;
  }

  const categoryId = d.category_id && d.category_id !== "" ? (d.category_id as string) : null;
  const payload: ProductWritePayload = {
    name: d.name,
    slug: d.slug,
    short_description: d.short_description ?? null,
    description: d.description ?? null,
    cover_image: d.cover_image ?? null,
    gallery_images: d.gallery_images ?? [],
    base_price_minor: baseMinor,
    compare_at_price_minor: compareMinor,
    price: d.is_free ? 0 : d.price ?? 0,
    old_price: d.old_price ?? null,
    currency,
    is_free: d.is_free ?? false,
    product_type: d.product_type,
    file_format: d.file_format ?? null,
    file_size: d.file_size ?? null,
    external_url: d.delivery_method === "external_link" ? ((d.external_url as string) || null) : null,
    category_id: categoryId,
    tags: d.tags ?? [],
    badge: d.badge ?? null,
    requirements: d.requirements ?? null,
    included_items: d.included_items ?? [],
    is_featured: d.is_featured ?? false,
    is_published: opts?.statusOverride ? opts.statusOverride === "published" : (d.is_published ?? false),
    status: opts?.statusOverride ?? (d.is_published ? "published" : "draft"),
    seo_title: d.seo_title ?? null,
    seo_description: d.seo_description ?? null,
    canonical_url: (d.canonical_url as string) || null,
    og_image: (d.og_image as string) || null,
    image_alt_text: d.image_alt_text ?? null,
    delivery_method: d.delivery_method,
    external_platform: d.delivery_method === "external_link" ? (d.external_platform ?? null) : null,
    hosted_access_type: d.delivery_method === "hosted_file" ? (d.hosted_access_type ?? null) : null,
    download_limit: d.download_limit ?? null,
    download_link_expiry_minutes: d.download_link_expiry_minutes ?? 5,
    payment_provider: d.payment_provider ?? null,
    payment_provider_product_id: d.payment_provider_product_id ?? null,
    payment_provider_price_id: d.payment_provider_price_id ?? null,
  };

  return { payload };
}
