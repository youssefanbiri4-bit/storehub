"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Product, Category } from "@/types";

interface SearchBarProps {
  initialSearch: string;
  products: Product[];
  categories: Category[];
  onSearch: (query: string) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchBar({
  initialSearch,
  products,
  categories,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Filter suggestions client-side
  const suggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return { products: [], categories: [] };
    }
    const term = debouncedQuery.toLowerCase();

    const matchedProducts = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.short_description?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.tags?.some((t) => t.toLowerCase().includes(term)) ||
          p.category?.name?.toLowerCase().includes(term),
      )
      .slice(0, 5);

    const matchedCategories = categories
      .filter((c) => c.name.toLowerCase().includes(term))
      .slice(0, 3);

    return { products: matchedProducts, categories: matchedCategories };
  }, [debouncedQuery, products, categories]);

  const hasSuggestions =
    suggestions &&
    ((suggestions.products?.length ?? 0) > 0 ||
      (suggestions.categories?.length ?? 0) > 0);

  // Submit search
  const submitSearch = useCallback(
    (value: string) => {
      setIsSearching(true);
      setIsOpen(false);
      onSearch(value);
      setTimeout(() => setIsSearching(false), 500);
    },
    [onSearch],
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setActiveIndex(-1);
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !hasSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitSearch(query);
      }
      return;
    }

    const totalItems =
      (suggestions?.products?.length ?? 0) +
      (suggestions?.categories?.length ?? 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % totalItems);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          const productsLen = suggestions?.products?.length ?? 0;
          if (activeIndex < productsLen) {
            const product = suggestions?.products?.[activeIndex];
            if (product) {
              router.push(`/products/${product.slug}`);
              setIsOpen(false);
              setQuery("");
            }
          } else {
            const catIndex = activeIndex - productsLen;
            const category = suggestions?.categories?.[catIndex];
            if (category) {
              submitSearch(category.name);
            }
          }
        } else {
          submitSearch(query);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    onSearch("");
    inputRef.current?.focus();
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search products, categories, tags..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="h-11 pl-10 pr-10 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20"
          aria-label="Search products"
          aria-expanded={isOpen && hasSuggestions}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          role="combobox"
        />
        {isSearching && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
        )}
        {!isSearching && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && hasSuggestions && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-white/[0.08] bg-[#111827] shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Product suggestions */}
          {suggestions?.products && suggestions.products.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Products
              </p>
              {suggestions.products.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeIndex === index
                      ? "bg-indigo-500/10 text-white"
                      : "text-slate-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                    {product.cover_image ? (
                      <Image
                        src={product.cover_image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-slate-600">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {product.category?.name || "Uncategorized"}
                      {product.price > 0 && ` · ${product.price} ${product.currency}`}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                </Link>
              ))}
            </div>
          )}

          {/* Category suggestions */}
          {suggestions?.categories && suggestions.categories.length > 0 && (
            <div className="p-2 border-t border-white/[0.06]">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Categories
              </p>
              {suggestions.categories.map((category, index) => {
                const catIndex =
                  (suggestions?.products?.length ?? 0) + index;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === catIndex}
                    onClick={() => {
                      submitSearch(category.name);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeIndex === catIndex
                        ? "bg-indigo-500/10 text-white"
                        : "text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-bold text-indigo-400">
                      {category.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">
                        {category.name}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Search action */}
          <div className="p-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => submitSearch(query)}
              className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            >
              <Search className="h-4 w-4" />
              Search for &ldquo;{query}&rdquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
