import { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/services/products";
import { getCategories } from "@/services/categories";
import { getBrands } from "@/services/brands";
import { ProductsClient } from "@/components/shared/products-client";
import { ProductGridSkeleton } from "@/components/shared/product-skeleton";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse our complete collection of products — find what you need for your next project.",
  alternates: {
    canonical: `${siteConfig.url}/products`,
  },
  openGraph: {
    title: "Shop",
    description:
      "Browse our complete collection of products — find what you need for your next project.",
    url: `${siteConfig.url}/products`,
    type: "website",
  },
};

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    type?: string;
    free?: string;
    featured?: string;
    badge?: string;
    tags?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  // Resolve category param that may be slug (from sitemap) or UUID (from UI)
  let resolvedCategoryId: string | undefined;
  if (params.category) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.category);
    if (isUuid) {
      resolvedCategoryId = params.category;
    } else {
      // Treat as slug, resolve to id
      try {
        const { getCategoryBySlug } = await import("@/services/categories");
        const cat = await getCategoryBySlug(params.category);
        resolvedCategoryId = cat?.id;
      } catch {
        resolvedCategoryId = undefined;
      }
      // If slug not found, keep as undefined to avoid filtering by invalid id
      if (!resolvedCategoryId) {
        // fallback: allow original value to pass through but will return 0 results; we treat as undefined
        resolvedCategoryId = undefined;
      }
    }
  }

  let result;
  let categories;
  let brands;

  try {
    [result, categories, brands] = await Promise.all([
      getProducts({
        search: params.search,
        category_id: resolvedCategoryId,
        brand_id: params.brand,
        product_type: params.type,
        is_free:
          params.free === "true"
            ? true
            : params.free === "false"
              ? false
              : undefined,
        is_featured:
          params.featured === "true"
            ? true
            : params.featured === "false"
              ? false
              : undefined,
        badge: params.badge || undefined,
        tags: params.tags || undefined,
        min_price: params.min_price ? Number(params.min_price) : undefined,
        max_price: params.max_price ? Number(params.max_price) : undefined,
        sort: params.sort,
        page,
        limit: 12,
      }),
      getCategories(),
      getBrands(),
    ]);
  } catch {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-3 text-xs">
            Shop
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight font-heading">
            Find your next
            <br />
            creative advantage.
          </h1>
          <p className="text-muted-foreground">
            Browse our complete collection of products.
          </p>
        </div>
        <div
          role="alert"
          className="text-center py-12 text-muted-foreground rounded-2xl border border-border bg-surface"
        >
          Failed to load data. Please try again later.
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-3 text-xs">
            Shop
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight font-heading">
            Find your next
            <br />
            creative advantage.
          </h1>
          <p className="text-muted-foreground">
            Browse our complete collection of products.
          </p>
        </div>
        <div
          role="alert"
          className="text-center py-12 text-muted-foreground rounded-2xl border border-border bg-surface"
        >
          <p className="font-medium mb-1">Products could not be loaded</p>
          <p className="text-sm">Please refresh the page or try again shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Badge variant="outline" className="mb-3 text-xs">
          Shop
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight font-heading">
          Find your next
          <br />
          creative advantage.
        </h1>
        <p className="text-muted-foreground">
          {result.total} product{result.total !== 1 ? "s" : ""} available
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductsClient
          initialProducts={result.products}
          categories={categories}
          brands={brands}
          totalPages={result.totalPages}
          currentPage={result.page}
          total={result.total}
        />
      </Suspense>
    </div>
  );
}
