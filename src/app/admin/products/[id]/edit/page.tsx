import { notFound } from "next/navigation";
import { getProductById } from "@/services/products";
import { AdminProductForm } from "@/components/admin/product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  return <AdminProductForm product={product} />;
}
