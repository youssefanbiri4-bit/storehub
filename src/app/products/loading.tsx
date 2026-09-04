import { ProductGridSkeleton } from "@/components/shared/product-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-32 rounded-lg skeleton-shimmer mb-3" />
        <div className="h-10 w-64 rounded-lg skeleton-shimmer mb-2" />
        <div className="h-5 w-80 rounded-lg skeleton-shimmer" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
