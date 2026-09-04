"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product, ProductFile } from "@/types";

interface ProductDeliveryActionProps {
  product: Product;
  files?: ProductFile[];
}

export function ProductDeliveryAction({
  product,
  files,
}: ProductDeliveryActionProps) {
  const [loading, setLoading] = useState(false);

  const isExternal = product.delivery_method === "external_link";
  const isHostedFree =
    product.delivery_method === "hosted_file" &&
    product.hosted_access_type === "free";
  const isHostedPaid =
    product.delivery_method === "hosted_file" &&
    product.hosted_access_type === "paid";

  // External link action
  if (isExternal) {
    return (
      <Button
        size="lg"
        className="w-full gap-2"
        disabled={loading}
        render={
          <a href={`/api/track-click?product_id=${product.id}`} />
        }
      >
        {product.is_free ? "Download for Free" : "Get This Product"}
        <ExternalLink className="h-4 w-4" />
      </Button>
    );
  }

  // Hosted free download
  if (isHostedFree && files && files.length > 0) {
    const primaryFile = files[0];

    return (
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full gap-2"
          disabled={loading}
          render={
            <a href={`/api/download/free/${product.id}/${primaryFile.id}`} />
          }
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Free
        </Button>

        {files.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Available files:
            </p>
            {files.map((file) => (
              <a
                key={file.id}
                href={`/api/download/free/${product.id}/${file.id}`}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                onClick={() => setLoading(true)}
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 truncate">
                  {file.original_file_name}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Hosted paid — show buy button
  if (isHostedPaid) {
    return (
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full gap-2"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch(`/api/checkout/${product.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });
              const data = await res.json();
              if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
              } else {
                alert(data.error || "Checkout failed. Please try again.");
              }
            } catch {
              alert("Checkout failed. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Buy Now — {product.price} {product.currency}
        </Button>

        <Link
          href="/account/downloads"
          className="block text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Already purchased? View your downloads
        </Link>
      </div>
    );
  }

  // Hosted file but no files uploaded yet
  return (
    <Button size="lg" className="w-full" disabled>
      Not Available Yet
    </Button>
  );
}
