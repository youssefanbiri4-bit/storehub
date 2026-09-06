import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DownloadEntitlement, Product, ProductFile } from "@/types";

interface EntitlementValidationResult {
  valid: boolean;
  error?: string;
  entitlement?: DownloadEntitlement;
  product?: Product;
  file?: ProductFile;
}

/**
 * Validate a download entitlement for a paid product.
 * Checks: existence, ownership, product match, file match, active status, expiry, revocation, limits.
 * Requires authenticated identity; email or UUID knowledge alone is insufficient.
 */
export async function validatePaidEntitlement(
  entitlementId: string,
  fileId: string,
  options: {
    userId: string;
    customerEmail?: string;
  }
): Promise<EntitlementValidationResult> {
  const admin = createAdminClient();

  if (!options.userId) {
    return { valid: false, error: "Authentication required." };
  }

  // Load entitlement
  const { data: entitlement, error: entError } = await admin
    .from("download_entitlements")
    .select("*")
    .eq("id", entitlementId)
    .single();

  if (entError || !entitlement) {
    return { valid: false, error: "Entitlement not found." };
  }

  // Check revocation
  if (entitlement.revoked_at) {
    return { valid: false, error: "Your access has been revoked." };
  }

  // Check expiry
  if (entitlement.expires_at && new Date(entitlement.expires_at) < new Date()) {
    return { valid: false, error: "Your download access has expired." };
  }

  // Check download limit (pre-check; atomic check happens at increment)
  if (
    entitlement.max_downloads !== null &&
    entitlement.download_count >= entitlement.max_downloads
  ) {
    return { valid: false, error: "Your download limit has been reached." };
  }

  // Enforce strict ownership: authenticated user must own the entitlement
  // Entitlement must have user_id and it must match caller.
  // If legacy entitlement has null user_id, fall back to email match but still require authenticated email.
  if (entitlement.user_id) {
    if (entitlement.user_id !== options.userId) {
      return { valid: false, error: "Access denied." };
    }
  } else if (entitlement.customer_email) {
    const callerEmail = (options.customerEmail || "").toLowerCase();
    const entEmail = (entitlement.customer_email || "").toLowerCase();
    if (!callerEmail || callerEmail !== entEmail) {
      return { valid: false, error: "Access denied." };
    }
  } else {
    // No owner information -> deny (orphaned entitlement)
    return { valid: false, error: "Access denied." };
  }

  // Load product
  const { data: product, error: prodError } = await admin
    .from("products")
    .select("*")
    .eq("id", entitlement.product_id)
    .single();

  if (prodError || !product) {
    return { valid: false, error: "Product not found." };
  }

  // Check product is published
  if (product.status !== "published") {
    return { valid: false, error: "This product is not currently available." };
  }

  // Check delivery method
  if (product.delivery_method !== "hosted_file") {
    return { valid: false, error: "This product is not available for download." };
  }

  // Load file
  const { data: file, error: fileError } = await admin
    .from("product_files")
    .select("*")
    .eq("id", fileId)
    .eq("product_id", entitlement.product_id)
    .single();

  if (fileError || !file) {
    return { valid: false, error: "The download file is unavailable." };
  }

  // Check file is active
  if (!file.is_active) {
    return { valid: false, error: "The download file is unavailable." };
  }

  // Load order if entitlement has one
  if (entitlement.order_id) {
    const { data: order } = await admin
      .from("orders")
      .select("payment_status")
      .eq("id", entitlement.order_id)
      .single();

    if (order && order.payment_status !== "paid") {
      return { valid: false, error: "Payment verification is still pending." };
    }
  }

  return {
    valid: true,
    entitlement,
    product,
    file,
  };
}

/**
 * Validate a free download request.
 * Checks: product exists, is published, delivery method, access type, file exists and active.
 */
export async function validateFreeDownload(
  productId: string,
  fileId: string
): Promise<{ valid: boolean; error?: string; product?: Product; file?: ProductFile }> {
  const admin = createAdminClient();

  // Load product
  const { data: product, error: prodError } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (prodError || !product) {
    return { valid: false, error: "The product could not be found." };
  }

  if (product.status !== "published") {
    return { valid: false, error: "This product is not currently available." };
  }

  if (product.delivery_method !== "hosted_file") {
    return { valid: false, error: "This product is not available for download." };
  }

  if (product.hosted_access_type !== "free") {
    return { valid: false, error: "This product requires purchase." };
  }

  // Load file
  const { data: file, error: fileError } = await admin
    .from("product_files")
    .select("*")
    .eq("id", fileId)
    .eq("product_id", productId)
    .single();

  if (fileError || !file) {
    return { valid: false, error: "The download file is unavailable." };
  }

  if (!file.is_active) {
    return { valid: false, error: "The download file is unavailable." };
  }

  return { valid: true, product, file };
}
