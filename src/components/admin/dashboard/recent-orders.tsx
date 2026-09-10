import Link from "next/link";
import { ORDER_STATUSES } from "@/types";

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  total_minor: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export function RecentOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
    );
  }

  const formatAmount = (minor: number, currency: string) => {
    return `${currency} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusStyle = (status: string) => {
    const info = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES];
    if (!info) return "bg-muted text-muted-foreground";
    return info.color;
  };

  return (
    <div className="space-y-1">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/admin/orders/${order.id}`}
          className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{order.order_number}</p>
              <p className="text-xs text-muted-foreground truncate">{order.customer_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusStyle(order.status)}`}>
              {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
            </span>
            <div className="text-right">
              <p className="text-sm font-medium">{formatAmount(order.total_minor, order.currency)}</p>
              <p className="text-[11px] text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
