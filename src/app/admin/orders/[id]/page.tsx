import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <Badge variant="outline" className="mb-2 text-xs">Order</Badge>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Order {id.slice(0, 8)}</h1>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-muted-foreground">Order detail page coming soon.</p>
      </div>
    </div>
  );
}
