"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useTransition, useState, useMemo, useEffect, useRef } from "react";
import { SlidersHorizontal, X, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProductCard } from "@/components/shared/product-card";
import { ProductGridSkeleton } from "@/components/shared/product-skeleton";
import { SearchBar } from "@/components/shared/search-bar";
import type { ProductCardData, Category, Brand } from "@/types";
import { PRODUCT_TYPES, BADGE_OPTIONS } from "@/types";

interface ProductsClientProps {
  initialProducts: ProductCardData[];
  categories: Category[];
  brands: Brand[];
  totalPages: number;
  currentPage: number;
  total: number;
}

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

const PRICE_PRESETS = [
  { label: "All Prices", min: "", max: "" },
  { label: "Free", min: "0", max: "0" },
  { label: "Under 50 MAD", min: "", max: "5000" },
  { label: "50 - 200 MAD", min: "5000", max: "20000" },
  { label: "200 - 500 MAD", min: "20000", max: "50000" },
  { label: "500+ MAD", min: "50000", max: "" },
];

function FilterContent({
  searchParams,
  categories,
  brands,
  onUpdate,
  onApply,
  onClear,
  isMobile,
}: {
  searchParams: URLSearchParams;
  categories: Category[];
  brands: Brand[];
  onUpdate: (key: string, value: string | null) => void;
  onApply?: () => void;
  onClear: () => void;
  isMobile?: boolean;
}) {
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");

  const applyPrice = useCallback(() => {
    onUpdate("min_price", minPrice || null);
    onUpdate("max_price", maxPrice || null);
  }, [minPrice, maxPrice, onUpdate]);

  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentType = searchParams.get("type") || "";
  const currentFree = searchParams.get("free") || "";
  const currentBadge = searchParams.get("badge") || "";
  const currentTags = searchParams.get("tags") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const selectedTags = currentTags
    ? currentTags.split(",").filter(Boolean)
    : [];

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onUpdate("tags", next.length > 0 ? next.join(",") : null);
  };

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    categories.forEach((c) => {
      if (c.name) tagSet.add(c.name);
    });
    const knownTags = [
      "design", "template", "ebook", "course", "ai", "marketing",
      "social media", "logo", "branding", "poster", "resume",
      "presentation", "certificate", "invoice", "flyer", "banner",
    ];
    knownTags.forEach((t) => tagSet.add(t));
    return Array.from(tagSet).sort();
  }, [categories]);

  return (
    <div className="space-y-5">
      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Sort By
        </label>
        <Select
          value={currentSort}
          onValueChange={(v) => onUpdate("sort", v)}
        >
          <SelectTrigger className="w-full" aria-label="Sort products">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Category
        </label>
        <Select
          value={currentCategory}
          onValueChange={(v) => onUpdate("category", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-full" aria-label="Filter by category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug || cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Brand
          </label>
          <Select
            value={currentBrand}
            onValueChange={(v) => onUpdate("brand", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-full" aria-label="Filter by brand">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Price Range
        </label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRICE_PRESETS.map((preset) => {
            const isActive =
              (searchParams.get("min_price") || "") === preset.min &&
              (searchParams.get("max_price") || "") === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                  onUpdate("min_price", preset.min || null);
                  onUpdate("max_price", preset.max || null);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-[background-color,color,border-color] ${
                  isActive
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="h-9 text-xs"
            aria-label="Minimum price"
          />
          <span className="text-slate-600">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="h-9 text-xs"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Product Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Product Type
        </label>
        <Select
          value={currentType}
          onValueChange={(v) => onUpdate("type", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-full" aria-label="Filter by product type">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(PRODUCT_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Badge / Status */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Status
        </label>
        <div className="space-y-1.5">
          {BADGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onUpdate(
                  "badge",
                  currentBadge === opt.value ? null : opt.value,
                )
              }
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,border-color] ${
                currentBadge === opt.value
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white border border-transparent"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  opt.value === "new"
                    ? "bg-emerald-400"
                    : opt.value === "bestseller"
                      ? "bg-amber-400"
                      : "bg-rose-400"
                }`}
              />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Free / Paid */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Price
        </label>
        <Select
          value={currentFree}
          onValueChange={(v) => onUpdate("free", v === "all" ? null : v)}
        >
          <SelectTrigger className="w-full" aria-label="Filter by price">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Free</SelectItem>
            <SelectItem value="false">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableTags.slice(0, 12).map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-[background-color,color,border-color] ${
                  isSelected
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear + Apply */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="flex-1 border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
        >
          Clear All
        </Button>
        {isMobile && onApply && (
          <Button
            size="sm"
            onClick={onApply}
            className="flex-1 bg-indigo-500 text-white hover:bg-indigo-400"
          >
            Apply Filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProductsClient({
  initialProducts,
  categories,
  brands,
  totalPages,
  currentPage,
  total,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentType = searchParams.get("type") || "";
  const currentFree = searchParams.get("free") || "";
  const currentBadge = searchParams.get("badge") || "";
  const currentTags = searchParams.get("tags") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const hasFilters =
    currentSearch ||
    currentCategory ||
    currentBrand ||
    currentType ||
    currentFree ||
    currentBadge ||
    currentTags ||
    searchParams.get("min_price") ||
    searchParams.get("max_price");

  // Fix concurrent updates: read latest search from window to avoid stale closure losing filters
  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const latestSearch = typeof window !== "undefined" ? window.location.search : `?${searchParams.toString()}`;
      const params = new URLSearchParams(latestSearch.startsWith("?") ? latestSearch.slice(1) : latestSearch);
      // If called with stale searchParams, merge both to preserve other pending changes
      // Ensure we keep current searchParams values that may not yet be in window.location (during transition)
      for (const [k, v] of searchParams.entries()) {
        if (!params.has(k) && k !== key) params.set(k, v);
      }
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.delete("page");
      // Validate page and sort
      const pageVal = params.get("page");
      if (pageVal && (isNaN(Number(pageVal)) || Number(pageVal) < 1)) params.delete("page");
      startTransition(() => {
        router.push(`/products?${params.toString()}`);
      });
    },
    [searchParams, router],
  );

  const clearFilters = useCallback(() => {
    router.push("/products");
  }, [router]);

  const getFilterLabel = (key: string, value: string): string => {
    if (key === "category") {
      return categories.find((c) => c.id === value || c.slug === value)?.name || value;
    }
    if (key === "brand") {
      return brands.find((b) => b.id === value)?.name || value;
    }
    if (key === "type") {
      return PRODUCT_TYPES[value as keyof typeof PRODUCT_TYPES] || value;
    }
    if (key === "free") {
      return value === "true" ? "Free" : "Paid";
    }
    if (key === "badge") {
      return BADGE_OPTIONS.find((o) => o.value === value)?.label || value;
    }
    if (key === "tags") {
      return value;
    }
    if (key === "min_price") {
      return `Min: ${Math.round(Number(value) / 100)} MAD`;
    }
    if (key === "max_price") {
      return `Max: ${Math.round(Number(value) / 100)} MAD`;
    }
    return value;
  };

  // Collect active filter chips
  const activeFilters: { key: string; value: string; label: string }[] = [];
  if (currentSearch) activeFilters.push({ key: "search", value: currentSearch, label: `Search: ${currentSearch}` });
  if (currentCategory) activeFilters.push({ key: "category", value: currentCategory, label: getFilterLabel("category", currentCategory) });
  if (currentBrand) activeFilters.push({ key: "brand", value: currentBrand, label: getFilterLabel("brand", currentBrand) });
  if (currentType) activeFilters.push({ key: "type", value: currentType, label: getFilterLabel("type", currentType) });
  if (currentFree) activeFilters.push({ key: "free", value: currentFree, label: getFilterLabel("free", currentFree) });
  if (currentBadge) activeFilters.push({ key: "badge", value: currentBadge, label: getFilterLabel("badge", currentBadge) });
  if (currentTags) {
    currentTags.split(",").filter(Boolean).forEach((tag) => {
      activeFilters.push({ key: "tags", value: tag, label: tag });
    });
  }
  if (searchParams.get("min_price")) {
    activeFilters.push({ key: "min_price", value: searchParams.get("min_price")!, label: getFilterLabel("min_price", searchParams.get("min_price")!) });
  }
  if (searchParams.get("max_price")) {
    activeFilters.push({ key: "max_price", value: searchParams.get("max_price")!, label: getFilterLabel("max_price", searchParams.get("max_price")!) });
  }

  const removeFilter = (key: string, value: string) => {
    if (key === "tags") {
      const remaining = currentTags.split(",").filter((t) => t !== value);
      updateParams("tags", remaining.length > 0 ? remaining.join(",") : null);
    } else if (key === "search") {
      updateParams("search", null);
    } else {
      updateParams(key, null);
    }
  };

  // Track search queries (fire-and-forget)
  const prevSearchRef = useRef(currentSearch);
  useEffect(() => {
    if (currentSearch && currentSearch !== prevSearchRef.current) {
      fetch("/api/track/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentSearch, result_count: total }),
      }).catch(() => {});
    }
    prevSearchRef.current = currentSearch;
  }, [currentSearch, total]);

  // Track category views (fire-and-forget) - resolve slug to id
  const prevCategoryRef = useRef(currentCategory);
  useEffect(() => {
    if (currentCategory && currentCategory !== prevCategoryRef.current) {
      const cat = categories.find((c) => c.id === currentCategory || c.slug === currentCategory);
      const categoryId = cat?.id || currentCategory;
      // Only track if it looks like UUID (valid category), avoid tracking invalid slugs
      if (categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
        fetch("/api/track/category-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_id: categoryId }),
        }).catch(() => {});
      }
    }
    prevCategoryRef.current = currentCategory;
  }, [currentCategory, categories]);

  return (
    <div>
      {/* Search bar + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchBar
          initialSearch={currentSearch}
          products={initialProducts}
          categories={categories}
          onSearch={(q) => updateParams("search", q || null)}
        />
        <div className="flex gap-2">
          <Select
            value={currentSort}
            onValueChange={(v) => updateParams("sort", v)}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Sort products">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="lg:hidden border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  aria-label="Open filters"
                />
              }
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-white/[0.06] bg-[#0F1629] overflow-y-auto">
              <h3 className="font-semibold mb-4 text-white">Filters</h3>
              <FilterContent
                searchParams={searchParams}
                categories={categories}
                brands={brands}
                onUpdate={updateParams}
                onApply={() => setMobileFiltersOpen(false)}
                onClear={clearFilters}
                isMobile
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
          {activeFilters.map((f, i) => (
            <Badge
              key={`${f.key}-${f.value}-${i}`}
              className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs gap-1"
            >
              {f.label}
              <button
                onClick={() => removeFilter(f.key, f.value)}
                className="ml-0.5 hover:text-white transition-colors"
                aria-label={`Remove ${f.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs text-slate-400 hover:text-white"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="font-semibold mb-4 text-white">Filters</h3>
            <FilterContent
              searchParams={searchParams}
              categories={categories}
              brands={brands}
              onUpdate={updateParams}
              onClear={clearFilters}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Results count */}
          <div className="mb-4 text-sm text-slate-500">
            {total} product{total !== 1 ? "s" : ""}
            {currentSearch && (
              <span>
                {" "}
                for &ldquo;
                <span className="text-white">{currentSearch}</span>&rdquo;
              </span>
            )}
          </div>

          {/* Loading state */}
          {isPending ? (
            <ProductGridSkeleton />

          /* Empty state */
          ) : initialProducts.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-white/[0.06]">
                <Package className="h-6 w-6 text-indigo-400" />
              </div>

              {hasFilters ? (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No results found
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                    No products match your current filters. Try adjusting or
                    clearing some filters.
                  </p>

                  {/* Suggested categories */}
                  {categories.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                        Browse Categories
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {categories.slice(0, 6).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => updateParams("category", cat.slug || cat.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.10] transition-[background-color,color,border-color]"
                          >
                            {cat.name}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested products */}
                  {initialProducts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                        You Might Like
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {initialProducts.slice(0, 3).map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-left hover:bg-white/[0.06] hover:border-white/[0.10] transition-[background-color,border-color]"
                          >
                            <p className="text-xs font-medium text-white/90 line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {product.category?.name || "Product"}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No products available
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    There are no products in the catalog yet. Check back soon.
                  </p>
                </>
              )}

              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-6 border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                >
                  Clear all filters
                </Button>
              )}
            </div>

          /* Product grid */
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {initialProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateParams("page", p.toString())}
                    className={
                      p === currentPage
                        ? "bg-indigo-500 text-white hover:bg-indigo-400 border-0"
                        : "border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    }
                  >
                    {p}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
