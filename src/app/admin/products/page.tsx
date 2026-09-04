"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, Copy,
  CheckSquare, Square, MoreHorizontal, Archive, Globe,
  Search, ArrowUpDown, ArrowUp, ArrowDown, PackageX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { AdminProductTableSkeleton } from "@/components/admin/admin-product-table-skeleton";
import type { Product, ProductStatus, Category } from "@/types";
import { PRODUCT_TYPES, PRODUCT_STATUSES } from "@/types";
import { toast } from "sonner";

type SortField = "name" | "status" | "price" | "updated_at" | "category";
type SortDirection = "asc" | "desc";

function SortIndicator({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (currentField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const fetchProducts = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false });

    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*, category:categories(*)")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      if (!cancelled) {
        setProducts((productsRes.data || []) as Product[]);
        setCategories((categoriesRes.data || []) as Category[]);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (search) {
      const term = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        p.short_description?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => {
        const status = p.status || (p.is_published ? "published" : "draft");
        return status === statusFilter;
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category_id === categoryFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "status": {
          const statusA = a.status || (a.is_published ? "published" : "draft");
          const statusB = b.status || (b.is_published ? "published" : "draft");
          return statusA.localeCompare(statusB) * dir;
        }
        case "price":
          return ((a.base_price_minor || 0) - (b.base_price_minor || 0)) * dir;
        case "updated_at":
          return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
        case "category":
          return (a.category?.name || "zzz").localeCompare(b.category?.name || "zzz") * dir;
        default:
          return 0;
      }
    });

    return result;
  }, [products, search, statusFilter, categoryFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };



  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredProducts.length) {
      setSelected([]);
    } else {
      setSelected(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkAction = async (action?: string) => {
    const actionToUse = action || bulkAction;
    if (!actionToUse || selected.length === 0) return;

    const supabase = createClient();
    let updates: Record<string, unknown> = {};

    switch (actionToUse) {
      case "publish":
        updates = { status: "published", is_published: true };
        break;
      case "hide":
        updates = { status: "hidden", is_published: false };
        break;
      case "archive":
        updates = { status: "archived", is_published: false };
        break;
      case "feature":
        updates = { is_featured: true };
        break;
      case "unfeature":
        updates = { is_featured: false };
        break;
      case "delete": {
        const { error } = await supabase.from("products").delete().in("id", selected);
        if (error) {
          toast.error("Error deleting products");
          return;
        }
        toast.success(`Deleted ${selected.length} product(s)`);
        setSelected([]);
        setBulkAction(null);
        fetchProducts();
        return;
      }
      case "duplicate": {
        for (const id of selected) {
          const product = products.find((p) => p.id === id);
          if (!product) continue;
          const { id: _bulkPid, created_at: _bulkCa, updated_at: _bulkUa, ...rest } = product;
          await supabase.from("products").insert({
            ...rest,
            name: `${product.name} - Copy`,
            slug: `${product.slug}-copy-${Date.now()}`,
            status: "draft",
            is_published: false,
            is_featured: false,
            view_count: 0,
            click_count: 0,
          });
        }
        toast.success(`Duplicated ${selected.length} product(s)`);
        setSelected([]);
        setBulkAction(null);
        fetchProducts();
        return;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("products").update(updates).in("id", selected);
      if (error) {
        toast.error("An error occurred");
        return;
      }
      toast.success("Products updated successfully");
    }

    setSelected([]);
    setBulkAction(null);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) {
      toast.error("Error deleting product");
      return;
    }
    setDeleteId(null);
    fetchProducts();
    toast.success("Product deleted");
  };

  const handleDuplicate = async (product: Product) => {
    const supabase = createClient();
    const { id: _dupPid, created_at: _dupCa, updated_at: _dupUa, ...rest } = product;
    const { error } = await supabase.from("products").insert({
      ...rest,
      name: `${product.name} - Copy`,
      slug: `${product.slug}-copy-${Date.now()}`,
      status: "draft",
      is_published: false,
      is_featured: false,
      view_count: 0,
      click_count: 0,
    });
    if (error) {
      toast.error("Error duplicating product");
      return;
    }
    toast.success("Product duplicated");
    fetchProducts();
  };

  const handlePublish = async (product: Product) => {
    const supabase = createClient();
    const { error } = await supabase.from("products").update({
      status: "published",
      is_published: true,
      published_at: new Date().toISOString(),
    }).eq("id", product.id);
    if (error) {
      toast.error("Error publishing product");
      return;
    }
    toast.success("Product published");
    fetchProducts();
  };

  const handleUnpublish = async (product: Product) => {
    const supabase = createClient();
    const { error } = await supabase.from("products").update({
      status: "hidden",
      is_published: false,
    }).eq("id", product.id);
    if (error) {
      toast.error("Error unpublishing product");
      return;
    }
    toast.success("Product unpublished");
    fetchProducts();
  };

  const handleToggleFeatured = async (product: Product) => {
    const supabase = createClient();
    const { error } = await supabase.from("products").update({
      is_featured: !product.is_featured,
    }).eq("id", product.id);
    if (error) {
      toast.error("Error updating product");
      return;
    }
    toast.success(product.is_featured ? "Product unfeatured" : "Product featured");
    fetchProducts();
  };

  const getStatusBadge = (status: ProductStatus) => {
    const s = PRODUCT_STATUSES[status];
    if (!s) return <Badge variant="secondary">{status}</Badge>;
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  const formatPrice = (product: Product) => {
    if (product.is_free) return <span className="text-success font-medium">Free</span>;
    const price = product.base_price_minor ? product.base_price_minor / 100 : product.price;
    if (price === 0) return <span className="text-success font-medium">Free</span>;
    return (
      <span className="font-medium">
        {product.currency || "USD"} {price.toFixed(2)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return <AdminProductTableSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-2 text-xs">Products</Badge>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name, slug, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(PRODUCT_STATUSES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{selected.length} product(s) selected</span>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("publish")}>
                <Globe className="mr-1 h-3 w-3" /> Publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("hide")}>
                <EyeOff className="mr-1 h-3 w-3" /> Hide
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("duplicate")}>
                <Copy className="mr-1 h-3 w-3" /> Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("feature")}>
                <Star className="mr-1 h-3 w-3" /> Feature
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("archive")}>
                <Archive className="mr-1 h-3 w-3" /> Archive
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                <Trash2 className="mr-1 h-3 w-3" /> Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Deselect
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface py-12 text-center">
          <PackageX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No products found</p>
          <Link href="/admin/products/new"><Button>Add Product</Button></Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-[32px_40px_1fr_140px_100px_100px_120px_48px] gap-4 items-center px-4 py-3 border-b border-border bg-muted/30">
            <div>
              <button onClick={toggleSelectAll}>
                {selected.length === filteredProducts.length && filteredProducts.length > 0 ? (
                  <CheckSquare className="h-4 w-4 text-foreground" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <div />
            <button
              onClick={() => toggleSort("name")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Product <SortIndicator field="name" currentField={sortField} direction={sortDirection} />
            </button>
            <button
              onClick={() => toggleSort("category")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Category <SortIndicator field="category" currentField={sortField} direction={sortDirection} />
            </button>
            <button
              onClick={() => toggleSort("status")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Status <SortIndicator field="status" currentField={sortField} direction={sortDirection} />
            </button>
            <button
              onClick={() => toggleSort("price")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Price <SortIndicator field="price" currentField={sortField} direction={sortDirection} />
            </button>
            <button
              onClick={() => toggleSort("updated_at")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Updated <SortIndicator field="updated_at" currentField={sortField} direction={sortDirection} />
            </button>
            <div className="text-xs font-medium text-muted-foreground">Actions</div>
          </div>

          {/* Table Body */}
          {filteredProducts.map((product) => {
            const status = product.status || (product.is_published ? "published" : "draft");
            const isOutOfStock = !product.is_free && product.stock_quantity <= 0;
            return (
              <div
                key={product.id}
                className={`grid grid-cols-1 lg:grid-cols-[32px_40px_1fr_140px_100px_100px_120px_48px] gap-4 items-center px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                  selected.includes(product.id) ? "bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                {/* Checkbox */}
                <div className="hidden lg:block">
                  <button onClick={() => toggleSelect(product.id)}>
                    {selected.includes(product.id) ? (
                      <CheckSquare className="h-4 w-4 text-foreground" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Image */}
                <div className="hidden lg:block">
                  {product.cover_image && !imageErrors.has(product.id) ? (
                    <img
                      src={product.cover_image}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover border border-border"
                      onError={() => {
                        setImageErrors((prev) => new Set(prev).add(product.id));
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + mobile meta */}
                <div className="lg:col-span-1 min-w-0">
                  <div className="flex items-center gap-2 lg:hidden mb-1">
                    {getStatusBadge(status)}
                    {product.is_featured && <Badge variant="outline" className="text-warning text-xs">Featured</Badge>}
                    {isOutOfStock && <Badge variant="destructive" className="text-xs">Out of Stock</Badge>}
                  </div>
                  <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground lg:hidden">
                    {product.category?.name || "Uncategorized"} &middot; {formatPrice(product)}
                  </p>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    {PRODUCT_TYPES[product.product_type as keyof typeof PRODUCT_TYPES] || product.product_type}
                  </p>
                </div>

                {/* Category */}
                <div className="hidden lg:block">
                  <span className="text-sm text-muted-foreground">
                    {product.category?.name || <span className="italic">Uncategorized</span>}
                  </span>
                </div>

                {/* Status */}
                <div className="hidden lg:flex items-center gap-2">
                  {getStatusBadge(status)}
                  {isOutOfStock && <Badge variant="destructive" className="text-xs">Out of Stock</Badge>}
                </div>

                {/* Price */}
                <div className="hidden lg:block text-sm">
                  {formatPrice(product)}
                </div>

                {/* Updated */}
                <div className="hidden lg:block text-xs text-muted-foreground">
                  {formatDate(product.updated_at)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end lg:justify-start">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/products/${product.slug}`, "_blank")}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      {status !== "published" ? (
                        <DropdownMenuItem onClick={() => handlePublish(product)}>
                          <Globe className="mr-2 h-4 w-4" /> Publish
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUnpublish(product)}>
                          <EyeOff className="mr-2 h-4 w-4" /> Unpublish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                        <Star className="mr-2 h-4 w-4" />
                        {product.is_featured ? "Unfeature" : "Feature"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this product? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
