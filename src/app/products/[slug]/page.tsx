import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Truck,
  Shield,
  RefreshCw,
  Headphones,
  CheckCircle,
  Tag,
  Eye,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/product-card";
import { ProductGallery } from "@/components/shared/product-gallery";
import { ShareProduct } from "@/components/shared/share-product";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { RecentlyViewedClient } from "@/components/shared/recently-viewed-client";
import { ProductPurchaseAction } from "@/components/products/product-purchase-action";
import {
  ProductJsonLd,
  BreadcrumbJsonLd,
} from "@/components/seo/structured-data";
import {
  getProductBySlug,
  getSimilarProducts,
  incrementViewCount,
} from "@/services/products";
import { BADGE_LABELS } from "@/types";
import { siteConfig } from "@/config/site";
import { minorToMajor, formatPriceAmount } from "@/lib/pricing";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(amount: number, currency: string): string {
  return formatPriceAmount(amount, currency);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  const product = result.data;
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.seo_title || product.name,
    description:
      product.seo_description || product.short_description || "",
    openGraph: {
      title: product.name,
      description: product.short_description || "",
      url: `${siteConfig.url}/products/${product.slug}`,
      type: "website",
      images: [
        {
          url: product.og_image || product.cover_image || "",
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.short_description || "",
      images: [product.og_image || product.cover_image || ""],
    },
    alternates: {
      canonical:
        product.canonical_url ||
        `${siteConfig.url}/products/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (result.error?.notFound) notFound();
  if (result.error) throw new Error(result.error.message);
  const product = result.data;
  if (!product) notFound();

  // Use `after` to ensure tracking runs after response, not lost on early close, and avoid prefetch double count
  try {
    const { after } = await import("next/server");
    after(() => {
      // Avoid counting prefetch (Next Link prefetch sends header purpose:prefetch or x-matched-path includes prefetch)
      // We check via headers in the request context would be ideal, but here we are server component without request.
      // As fallback, we rely on after + not counting during build (product is fetched at request time, not prefetch)
      incrementViewCount(product.id).catch(() => {});
    });
  } catch {
    incrementViewCount(product.id).catch(() => {});
  }

  const badgeLabel = product.badge ? BADGE_LABELS[product.badge] : null;

  let similarProducts: Awaited<ReturnType<typeof getSimilarProducts>> = [];
  if (product.category_id) {
    try {
      similarProducts = await getSimilarProducts(
        product.category_id,
        product.id,
      );
    } catch {
      similarProducts = [];
    }
  }

  const currency = product.currency || "MAD";
  const currentPrice = product.base_price_minor !== null && product.base_price_minor !== undefined
    ? minorToMajor(product.base_price_minor, currency) ?? product.price
    : product.price;
  const oldPrice = product.compare_at_price_minor !== null && product.compare_at_price_minor !== undefined
    ? minorToMajor(product.compare_at_price_minor, currency) ?? product.old_price
    : product.old_price;
  const discountPercent =
    typeof oldPrice === "number" && typeof currentPrice === "number" && oldPrice > currentPrice
      ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
      : 0;

  const breadcrumbItems = [
    { name: "Home", url: siteConfig.url },
    { name: "Shop", url: `${siteConfig.url}/products` },
  ];
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${siteConfig.url}/products?category=${product.category.id}`,
    });
  }
  breadcrumbItems.push({
    name: product.name,
    url: `${siteConfig.url}/products/${product.slug}`,
  });

  return (
    <>
      <ProductJsonLd
        name={product.name}
        description={product.short_description || ""}
        image={product.cover_image}
        url={`${siteConfig.url}/products/${product.slug}`}
        price={currentPrice}
        currency={currency}
        isFree={product.is_free}
        brand={product.brand?.name}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-sm text-slate-500 mb-8 flex-wrap"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-white transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <Link
            href="/products"
            className="hover:text-white transition-colors"
          >
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              <Link
                href={`/products?category=${product.category.id}`}
                className="hover:text-white transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-white font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Main grid: Gallery + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 mb-14">
          {/* Left — Gallery */}
          <div>
            <ProductGallery
              coverImage={product.cover_image}
              galleryImages={product.gallery_images || []}
              productName={product.name}
            />
          </div>

          {/* Right — Product info */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Badge
                  variant="outline"
                  className="border-white/[0.10] text-slate-400"
                >
                  {product.category.name}
                </Badge>
              )}
              {product.brand && (
                <Badge
                  variant="outline"
                  className="border-white/[0.10] text-slate-400"
                >
                  {product.brand.name}
                </Badge>
              )}
              {badgeLabel && (
                <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/25">
                  {badgeLabel}
                </Badge>
              )}
              {product.is_free && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                  Free
                </Badge>
              )}
              {discountPercent > 0 && (
                <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/25">
                  -{discountPercent}%
                </Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading text-white">
              {product.name}
            </h1>

            {/* Short description */}
            {product.short_description && (
              <p className="text-slate-400 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {product.is_free ? (
                <span className="text-3xl font-bold text-emerald-400">
                  Free
                </span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-white">
                    {formatPrice(currentPrice, currency)}
                  </span>
                  {discountPercent > 0 && oldPrice && (
                    <span className="text-lg text-slate-600 line-through">
                      {formatPrice(oldPrice, currency)}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  product.stock_quantity > 0 || product.is_free
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-slate-400">
                {product.stock_quantity > 0 || product.is_free
                  ? "In Stock"
                  : "Available for Order"}
              </span>
            </div>

            {/* CTA */}
            <ProductPurchaseAction product={product} />

            {/* Actions row */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <FavoriteButton productId={product.id} />
              <ShareProduct
                name={product.name}
                slug={product.slug}
                description={product.short_description || undefined}
              />
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <Truck className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">
                    Fast Delivery
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Secure shipping
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <Shield className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">
                    Secure Payment
                  </p>
                  <p className="text-[10px] text-slate-500">
                    100% protected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <RefreshCw className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">
                    Easy Returns
                  </p>
                  <p className="text-[10px] text-slate-500">
                    7-day policy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <Headphones className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">
                    Support
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Via email
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Sections */}
        <div className="space-y-10 mb-14">
          {/* Description */}
          {product.description && (
            <section>
              <h2 className="text-xl font-bold mb-4 tracking-tight font-heading text-white">
                Product Overview
              </h2>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-slate-400 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </section>
          )}

          {/* Included Items */}
          {product.included_items &&
            product.included_items.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 tracking-tight font-heading text-white">
                  What&apos;s Included
                </h2>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <ul className="space-y-2.5">
                    {product.included_items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 text-sm text-slate-400"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

          {/* Specifications */}
          <section>
            <h2 className="text-xl font-bold mb-4 tracking-tight font-heading text-white">
              Specifications
            </h2>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
              {product.product_type && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-slate-500">Type</span>
                  <span className="text-sm font-medium text-white">
                    {product.product_type}
                  </span>
                </div>
              )}
              {product.file_format && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-slate-500">Format</span>
                  <span className="text-sm font-medium text-white">
                    {product.file_format}
                  </span>
                </div>
              )}
              {product.file_size && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-slate-500">File Size</span>
                  <span className="text-sm font-medium text-white">
                    {product.file_size}
                  </span>
                </div>
              )}
              {product.language && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-slate-500">Language</span>
                  <span className="text-sm font-medium text-white">
                    {product.language === "ar"
                      ? "Arabic"
                      : product.language === "en"
                        ? "English"
                        : product.language}
                  </span>
                </div>
              )}
              {product.license_type && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-slate-500">License</span>
                  <span className="text-sm font-medium text-white capitalize">
                    {product.license_type}
                  </span>
                </div>
              )}
              {product.version && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-slate-500">Version</span>
                  <span className="text-sm font-medium text-white">
                    {product.version}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-slate-500">Last Updated</span>
                <span className="text-sm font-medium text-white">
                  {new Date(product.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 tracking-tight font-heading text-white">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/products?tags=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.10] transition-[background-color,color,border-color]"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Meta */}
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{product.view_count} views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                Updated{" "}
                {new Date(product.updated_at).toLocaleDateString("en-US")}
              </span>
            </div>
          </div>
        </div>

        {/* Recently Viewed + Sticky CTA */}
        <RecentlyViewedClient product={product} />

        {/* Related Products */}
        {similarProducts.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight font-heading text-white">
                Related Products
              </h2>
              <Link
                href="/products"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
