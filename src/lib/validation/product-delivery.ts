import { z } from "zod";

const httpsUrlSchema = z
  .string()
  .url("Please enter a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL must use HTTPS" }
  )
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return !["javascript:", "data:", "vbscript:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "Invalid URL protocol" }
  );

export const deliveryMethodSchema = z.enum(["external_link", "hosted_file"]);

export const hostedAccessTypeSchema = z.enum(["free", "paid"]);

export const externalLinkSchema = z.object({
  delivery_method: z.literal("external_link"),
  external_platform: z.string().min(1, "Platform name is required"),
  external_url: httpsUrlSchema,
});

export const hostedFreeSchema = z.object({
  delivery_method: z.literal("hosted_file"),
  hosted_access_type: z.literal("free"),
  download_link_expiry_minutes: z
    .number()
    .min(1, "Minimum 1 minute")
    .max(60, "Maximum 60 minutes")
    .default(5),
  download_limit: z.number().min(1).optional().nullable(),
});

export const hostedPaidSchema = z.object({
  delivery_method: z.literal("hosted_file"),
  hosted_access_type: z.literal("paid"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  currency: z.string().default("USD"),
  payment_provider: z.string().min(1, "Payment provider is required"),
  payment_provider_product_id: z.string().optional().nullable(),
  payment_provider_price_id: z.string().optional().nullable(),
  download_link_expiry_minutes: z
    .number()
    .min(1, "Minimum 1 minute")
    .max(60, "Maximum 60 minutes")
    .default(5),
  download_limit: z.number().min(1).optional().nullable(),
});

export const deliverySchema = z.discriminatedUnion("delivery_method", [
  externalLinkSchema,
  hostedFreeSchema,
  hostedPaidSchema,
]);

export type DeliveryFormData = z.infer<typeof deliverySchema>;

/**
 * Validate external URL safety (no open redirects).
 */
export function validateExternalUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTPS" };
    }

    if (["javascript:", "data:", "vbscript:"].includes(parsed.protocol)) {
      return { valid: false, error: "Invalid URL protocol" };
    }

    if (!parsed.hostname || parsed.hostname.length < 3) {
      return { valid: false, error: "Invalid hostname" };
    }

    if (url.length > 2048) {
      return { valid: false, error: "URL is too long" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}
