"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import {
  uploadProductFile,
  isAllowedProductFileType,
} from "@/lib/storage/product-files";

interface UploadResult {
  success: boolean;
  error?: string;
  fileId?: string;
  file?: {
    id: string;
    storage_path: string;
    original_file_name: string;
    safe_file_name: string;
    file_extension: string | null;
    mime_type: string;
    file_size: number;
  };
}

/**
 * Server action to upload a product file.
 * Validates admin auth, file type, and file size.
 */
export async function uploadProductFileAction(
  productId: string,
  formData: FormData
): Promise<UploadResult> {
  try {
    // Verify admin
    await assertAdmin();

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided." };
    }

    // Validate file type
    if (!isAllowedProductFileType(file.type)) {
      return {
        success: false,
        error: "File type not allowed. Allowed: PDF, ZIP, TXT.",
      };
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      return { success: false, error: "File size must be under 100 MB." };
    }

    const version = formData.get("version") as string | null;

    const result = await uploadProductFile(productId, file, {
      version: version || undefined,
    });

    if (!result) {
      return { success: false, error: "File upload failed. Please try again." };
    }

    // Fetch full file record to return accurate storage_path and metadata
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: fullFile } = await admin.from("product_files").select("*").eq("id", result.id).single();

    revalidatePath(`/admin/products/${productId}/edit`);
    return {
      success: true,
      fileId: result.id,
      file: fullFile
        ? {
            id: fullFile.id,
            storage_path: fullFile.storage_path,
            original_file_name: fullFile.original_file_name,
            safe_file_name: fullFile.safe_file_name,
            file_extension: fullFile.file_extension,
            mime_type: fullFile.mime_type,
            file_size: fullFile.file_size,
          }
        : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return { success: false, error: message };
  }
}
