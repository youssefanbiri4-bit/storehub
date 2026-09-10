import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  total_revenue?: number;
  view_count: number;
  click_count: number;
  currency: string;
}

export function TopProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">No product data yet</p>
    );
  }

  const formatRevenue = (val: number, currency: string) => {
    if (val === 0) return "No sales";
    return `${currency} ${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-1">
      {products.map((product, i) => (
        <Link
          key={product.id}
          href={`/admin/products/${product.id}/edit`}
          className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
          {product.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.name}
              className="h-8 w-8 rounded-lg object-cover border border-border shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-muted-foreground">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {product.view_count.toLocaleString()} views · {product.click_count.toLocaleString()} clicks
            </p>
          </div>
          <p className="text-sm font-medium shrink-0">
            {formatRevenue(product.total_revenue || 0, product.currency)}
          </p>
        </Link>
      ))}
    </div>
  );
}
