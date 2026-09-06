"use client";

import { useState } from "react";
import { ExternalLink, MessageCircle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductDetailData } from "@/types";
import { minorToMajor, formatPriceAmount } from "@/lib/pricing";

interface ProductPurchaseActionProps {
  product: ProductDetailData;
}

function getCtaConfig(product: ProductDetailData) {
  const platform = product.external_platform?.toLowerCase() || "";
  // Validate URL safety - only allow stored external_url if delivery_method is external_link
  const url = product.delivery_method === "external_link" ? product.external_url : null;

  if (platform === "whatsapp" || url?.includes("wa.me") || url?.includes("whatsapp")) {
    return {
      label: "اطلب الآن",
      sublabel: "WhatsApp",
      icon: MessageCircle,
      href: url,
      className: "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20",
    };
  }

  if (platform === "instagram" || url?.includes("instagram.com")) {
    return {
      label: "اطلب الآن",
      sublabel: "Instagram",
      icon: Camera,
      href: url,
      className: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20",
    };
  }

  // For hosted_file, purchase action should be different (download or checkout) - but per task don't change business model.
  // Show appropriate label but ensure data is available.
  return {
    label: "اطلب الآن",
    sublabel: product.is_free ? "Free Download" : "Order Now",
    icon: ExternalLink,
    href: url,
    className: "bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/20",
  };
}

export function ProductPurchaseAction({ product }: ProductPurchaseActionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = getCtaConfig(product);

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/checkout/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Checkout failed. Please try again.");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("Checkout not available.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Hosted file handling
  if (product.delivery_method === "hosted_file") {
    if (product.hosted_access_type === "free") {
      // For free hosted, show direct download if file exists, else indicate
      return (
        <div className="space-y-2">
          <Button size="lg" className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 gap-2" disabled>
            Free Download
          </Button>
          <p className="text-center text-xs text-slate-500">Free · {product.currency || "MAD"}</p>
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>
      );
    }
    // Paid hosted -> checkout inside site (Stripe)
    const currency = product.currency || "MAD";
    const major = product.base_price_minor !== null && product.base_price_minor !== undefined ? minorToMajor(product.base_price_minor, currency) : product.price;
    const priceLabel = product.is_free ? "Free" : major !== null ? formatPriceAmount(major, currency) : "—";
    return (
      <div className="space-y-3">
        <Button size="lg" className="w-full h-12 bg-indigo-500 hover:bg-indigo-400 gap-2" onClick={handleCheckout} disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Buy Now</span>} {loading ? "Processing..." : ""}
        </Button>
        <p className="text-center text-xs text-slate-500">Secure checkout · {priceLabel}</p>
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>
    );
  }

  // Physical product (requires_shipping) - also via checkout
  if (product.requires_shipping) {
    const currency = product.currency || "MAD";
    const major = product.base_price_minor !== null && product.base_price_minor !== undefined ? minorToMajor(product.base_price_minor, currency) : product.price;
    const priceLabel = formatPriceAmount(major ?? product.price ?? 0, currency);
    return (
      <div className="space-y-3">
        <Button size="lg" className="w-full h-12 bg-indigo-500 hover:bg-indigo-400 gap-2" onClick={handleCheckout} disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Buy Now</span>}
        </Button>
        <p className="text-center text-xs text-slate-500">Secure checkout · {priceLabel}</p>
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>
    );
  }

  if (!config.href) {
    return (
      <Button size="lg" className="w-full" disabled>
        Coming Soon
      </Button>
    );
  }

  const Icon = config.icon;
  const currency = product.currency || "MAD";
  const major2 = product.base_price_minor !== null && product.base_price_minor !== undefined ? minorToMajor(product.base_price_minor, currency) : product.price;
  const priceLabel2 = product.is_free ? "Free" : major2 !== null ? formatPriceAmount(major2, currency) : "—";

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className={`w-full h-12 text-base font-semibold gap-2 button-motion ${config.className}`}
        disabled={loading}
        render={<a href={config.href} target="_blank" rel="noopener noreferrer" />}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        {config.label}
      </Button>
      <p className="text-center text-xs text-slate-500">
        {config.sublabel} · {priceLabel2}
      </p>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}
