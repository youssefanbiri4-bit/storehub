import { Metadata } from "next";
import { PromotionalMarquee } from "@/components/home/promotional-marquee";
import { EcommerceHero } from "@/components/home/ecommerce-hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedProducts } from "@/components/home/featured-products";
import { TrendingProducts } from "@/components/home/trending-products";
import { BestSellers } from "@/components/home/best-sellers";
import { NewArrivals } from "@/components/home/new-arrivals";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { FinalCTA } from "@/components/home/final-cta";
import { Reveal } from "@/components/motion/reveal";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
} from "@/components/seo/structured-data";
import {
  getFeaturedProducts,
  getLatestProducts,
  getBestSellingProducts,
} from "@/services/products";
import { getCategories } from "@/services/categories";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
    siteName: siteConfig.name,
  },
};

export default async function HomePage() {
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let latestProducts: Awaited<ReturnType<typeof getLatestProducts>> = [];
  let bestSellingProducts: Awaited<ReturnType<typeof getBestSellingProducts>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    [featuredProducts, latestProducts, bestSellingProducts, categories] =
      await Promise.all([
        getFeaturedProducts(),
        getLatestProducts(12),
        getBestSellingProducts(4),
        getCategories(),
      ]);
  } catch {
    featuredProducts = [];
    latestProducts = [];
    bestSellingProducts = [];
    categories = [];
  }

  // Hero product selection (deterministic)
  const heroProduct = featuredProducts[0] || latestProducts[0] || null;

  // Floating hero products (next 4 from featured or latest)
  const floatingProducts = [
    ...featuredProducts.filter((p) => p.id !== heroProduct?.id),
    ...latestProducts.filter((p) => p.id !== heroProduct?.id),
  ].slice(0, 4);

  // Featured: first 3 featured or latest
  const featured = featuredProducts.slice(0, 3);

  // Trending: next batch (by view count implied by getBestSellingProducts or featured)
  const trending = [
    ...bestSellingProducts.filter((p) => !featured.some((f) => f.id === p.id)),
    ...latestProducts.filter((p) => !featured.some((f) => f.id === p.id)),
  ].slice(0, 6);

  // New arrivals: latest 6 published products
  const newArrivals = latestProducts.slice(0, 6);

  // Best sellers: use view-count based query, fallback to featured
  const bestSellers =
    bestSellingProducts.length > 0
      ? bestSellingProducts
      : featuredProducts.length > 0
        ? featuredProducts.slice(0, 4)
        : latestProducts.slice(0, 4);

  return (
    <div className="homepage-surface">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      {/* 1. Promotional Marquee */}
      <PromotionalMarquee />

      {/* 2. Hero Section */}
      <Reveal>
        <EcommerceHero
          heroProduct={heroProduct}
          floatingProducts={floatingProducts}
        />
      </Reveal>

      {/* 3. Categories */}
      <Reveal>
        <CategoryGrid categories={categories} />
      </Reveal>

      {/* 4. Featured Products */}
      <Reveal>
        <FeaturedProducts products={featured} />
      </Reveal>

      {/* 5. Trending Products */}
      <Reveal>
        <TrendingProducts products={trending} />
      </Reveal>

      {/* 6. Best Sellers */}
      <Reveal>
        <BestSellers products={bestSellers} />
      </Reveal>

      {/* 7. New Arrivals */}
      <Reveal>
        <NewArrivals products={newArrivals} />
      </Reveal>

      {/* 8. Why Choose Us */}
      <WhyChooseUs />

      {/* 9. Final CTA */}
      <FinalCTA />
    </div>
  );
}
