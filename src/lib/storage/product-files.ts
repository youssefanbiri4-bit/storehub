import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generate a safe file name from an original file name.
 * Strips special characters, normalizes, and prepends a timestamp.
 */
export function generateSafeFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  const base = originalName
    .replace(/\.[^.]+$/, "") // Remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, "") // Trim leading/trailing hyphens
    .slice(0, 100); // Limit length

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);

  return `${timestamp}-${random}-${base}.${ext}`;
}

/**
 * Get the MIME type from a file extension.
 */
export function getMimeTypeFromExtension(ext: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    zip: "application/zip",
    txt: "text/plain",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

/**
 * Validate that a file type is allowed for product files.
 */
export function isAllowedProductFileType(mimeType: string): boolean {
  const allowed = [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "text/plain",
  ];
  return allowed.includes(mimeType);
}

/**
 * Validate that a file type is allowed for product images.
 */
export function isAllowedImageType(mimeType: string): boolean {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ];
  return allowed.includes(mimeType);
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Upload a file to Supabase Storage and record metadata in product_files.
 * Returns the created ProductFile record.
 */
export async function uploadProductFile(
  productId: string,
  file: File,
  options: { version?: string } = {}
): Promise<{ id: string; storage_path: string } | null> {
  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const safeName = generateSafeFileName(file.name);
  const storagePath = `${productId}/${safeName}`;

  // Upload to storage
  const { error: uploadError } = await admin.storage
    .from("product-files")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError.message);
    return null;
  }

  // Insert metadata
  const { data: fileRecord, error: insertError } = await admin
    .from("product_files")
    .insert({
      product_id: productId,
      storage_path: storagePath,
      original_file_name: file.name,
      safe_file_name: safeName,
      file_extension: ext,
      mime_type: file.type,
      file_size: file.size,
      version: options.version || null,
      is_active: true,
    })
    .select("id, storage_path")
    .single();

  if (insertError) {
    console.error("File metadata insert failed:", insertError.message);
    // Clean up uploaded file
    await admin.storage.from("product-files").remove([storagePath]);
    return null;
  }

  return fileRecord;
}

/**
 * Delete a product file from storage and database.
 */
export async function deleteProductFile(fileId: string): Promise<boolean> {
  const admin = createAdminClient();

  // Get file record
  const { data: file, error: fetchError } = await admin
    .from("product_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (fetchError || !file) return false;

  // Delete from storage
  await admin.storage.from("product-files").remove([file.storage_path]);

  // Delete from database
  const { error: deleteError } = await admin
    .from("product_files")
    .delete()
    .eq("id", fileId);

  return !deleteError;
}

/**
 * Get all files for a product.
 */
export async function getProductFiles(productId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("product_files")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data || [];
}
