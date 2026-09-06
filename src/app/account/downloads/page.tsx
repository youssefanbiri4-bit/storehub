import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FileText, Download, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "My Downloads",
};

export default async function AccountDownloadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/downloads");
  }

  // Fetch entitlements for this user via RLS (user can read own)
  const { data: entitlements } = await supabase
    .from("download_entitlements")
    .select("*, product:products(id, name, slug, cover_image, product_type)")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false }) as {
    data: Array<{
      id: string;
      product_id: string;
      user_id: string | null;
      customer_email: string | null;
      max_downloads: number | null;
      download_count: number;
      created_at: string;
      expires_at: string | null;
      product: { id: string; name: string; slug: string; cover_image: string; product_type: string } | null;
    }> | null;
  };

  // Fetch files for each product via RLS (product_files is admin-only, so use service role via server? Instead, fetch via server client with admin check?
  // For downloads, files are private but user has entitlement; we still need to show file list. Use supabase with RLS: product_files is admin-only, so we need service role.
  // Instead, fetch via supabase with RLS that allows admin or service_role, but for user we need to show files for their entitlements.
  // Use direct query with service role would bypass; but we can fetch via admin client with filter by entitlement product_ids and still tie to user.
  // Keep using server client but handle that product_files policy is admin-only: fallback to empty if RLS denies.
  const productIds = [
    ...new Set((entitlements || []).map((e) => e.product_id)),
  ];

  // Use admin client for files (private bucket), but constrained to productIds derived from user's own entitlements (no IDOR)
  const admin = createAdminClient();
  let allFiles: Array<{ product_id: string; id: string; original_file_name: string; is_active: boolean }> = [];
  if (productIds.length > 0) {
    const { data } = await admin
      .from("product_files")
      .select("id, product_id, original_file_name, is_active")
      .in("product_id", productIds)
      .eq("is_active", true);
    allFiles = (data as unknown as typeof allFiles) || [];
  }

  const filesByProduct = new Map<string, typeof allFiles>();
  for (const file of allFiles) {
    const existing = filesByProduct.get(file.product_id) || [];
    existing.push(file);
    filesByProduct.set(file.product_id, existing);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 font-heading text-2xl font-bold tracking-tight">
        My Downloads
      </h1>
      <p className="mb-8 text-muted-foreground">
        Access your purchased digital products.
      </p>

      {!entitlements || entitlements.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <Download className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="mb-2 font-heading text-lg font-semibold">
            No downloads yet
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Your purchased products will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/80"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entitlements.map((entitlement) => {
            const product = entitlement.product;
            const files = filesByProduct.get(entitlement.product_id) || [];

            const isExpired =
              entitlement.expires_at &&
              new Date(entitlement.expires_at) < new Date();
            const isLimitReached =
              entitlement.max_downloads !== null &&
              entitlement.download_count >= entitlement.max_downloads;

            return (
              <div
                key={entitlement.id}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  {product?.cover_image && (
                    <img
                      src={product.cover_image}
                      alt={product.name || "Product"}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-base font-bold">
                      {product?.name || "Product"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Purchased{" "}
                      {new Date(entitlement.created_at).toLocaleDateString(
                        "en-US"
                      )}
                    </p>

                    {isExpired && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        <Clock className="h-3 w-3" />
                        Expired
                      </span>
                    )}
                    {isLimitReached && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        <AlertCircle className="h-3 w-3" />
                        Download limit reached
                      </span>
                    )}

                    {files.length > 0 && !isExpired && !isLimitReached && (
                      <div className="mt-3 space-y-2">
                        {files.map((file) => (
                          <a
                            key={file.id}
                            href={`/api/download/paid/${entitlement.id}/${file.id}`}
                            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">
                              {file.original_file_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {entitlement.download_count}
                              {entitlement.max_downloads
                                ? `/${entitlement.max_downloads}`
                                : ""}{" "}
                              downloads
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
