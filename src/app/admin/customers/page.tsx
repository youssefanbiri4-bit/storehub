import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { getCustomers } from "@/services/admin/customers";
import { EmptyState } from "@/components/admin/empty-state";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) || 1 : 1;
  const search = typeof params.search === "string" ? params.search : "";

  const { customers, total, totalPages, error } = await getCustomers({
    search: search || undefined,
    page,
    limit: 20,
  });

  const formatAmount = (minor: number) => {
    return `MAD ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Badge variant="outline" className="mb-2 text-xs">People</Badge>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Customers</h1>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
          <p className="text-sm text-danger">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-2 text-xs">People</Badge>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} customer{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <form className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input name="search" placeholder="Search by name..." defaultValue={search} className="pl-10" />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={search ? "Try a different search term." : "Customers will appear here once they register."}
          action={{ label: "View Orders", href: "/admin/orders" }}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="hidden lg:grid lg:grid-cols-[1fr_140px_100px_120px_120px] gap-4 items-center px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">Customer</span>
              <span className="text-xs font-medium text-muted-foreground">Orders</span>
              <span className="text-xs font-medium text-muted-foreground">Total Spent</span>
              <span className="text-xs font-medium text-muted-foreground">Last Order</span>
              <span className="text-xs font-medium text-muted-foreground">Joined</span>
            </div>

            {customers.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-1 lg:grid-cols-[1fr_140px_100px_120px_120px] gap-4 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{customer.full_name || "Unnamed Customer"}</p>
                  <p className="text-xs text-muted-foreground">ID: {customer.id.slice(0, 8)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">{customer.order_count}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {customer.total_spent > 0 ? formatAmount(customer.total_spent) : "—"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {customer.last_order_date ? formatDate(customer.last_order_date) : "Never"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(customer.created_at)}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?page=${page - 1}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`?page=${page + 1}&search=${encodeURIComponent(search)}`}>
                    <Button variant="outline" size="sm">Next</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
