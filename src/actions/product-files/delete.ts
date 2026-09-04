"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { deleteProductFile } from "@/lib/storage/product-files";

interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to delete a product file.
 * Validates admin auth, then removes from storage and database.
 */
export async function deleteProductFileAction(
  fileId: string,
  productId: string
): Promise<DeleteResult> {
  try {
    await assertAdmin();

    const success = await deleteProductFile(fileId);
    if (!success) {
      return { success: false, error: "Failed to delete file." };
    }

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delete failed";
    return { success: false, error: message };
  }
}
