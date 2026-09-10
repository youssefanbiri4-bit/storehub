import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  cover_image: string | null;
  currency: string;
  base_price_minor: number;
  status: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
}

export async function getInventoryOverview() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, sku, stock_quantity, reserved_quantity, cover_image, currency, base_price_minor, status")
    .eq("is_free", false)
    .order("stock_quantity", { ascending: true });

  if (error || !products) {
    return {
      items: [] as InventoryItem[],
      stats: { totalProducts: 0, totalStockValue: 0, lowStockCount: 0, outOfStockCount: 0, inStockCount: 0 },
      error: { message: "Failed to load inventory" },
    };
  }

  const items = products.map((p) => ({
    ...p,
    available_quantity: Math.max(0, (p.stock_quantity || 0) - (p.reserved_quantity || 0)),
  }));

  const stats: InventoryStats = {
    totalProducts: items.length,
    totalStockValue: items.reduce(
      (sum, item) => sum + (item.stock_quantity * (item.base_price_minor || 0)),
      0
    ),
    lowStockCount: items.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= 5).length,
    outOfStockCount: items.filter((i) => i.stock_quantity <= 0).length,
    inStockCount: items.filter((i) => i.stock_quantity > 5).length,
  };

  return { items, stats, error: null };
}
