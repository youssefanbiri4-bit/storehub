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

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true, fileId: result.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return { success: false, error: message };
  }
}
