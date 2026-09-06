import { notFound } from "next/navigation";
import { getProductById } from "@/services/products";
import { AdminProductForm } from "@/components/admin/product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const result = await getProductById(id);

  if (result.error?.notFound) notFound();
  if (result.error) {
    throw new Error(result.error.message);
  }
  if (!result.data) notFound();

  return <AdminProductForm product={result.data} />;
}
