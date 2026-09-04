"use client";

import { useState } from "react";
import { ExternalLink, MessageCircle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

interface ProductPurchaseActionProps {
  product: Product;
}

function getCtaConfig(product: Product) {
  const platform = product.external_platform?.toLowerCase() || "";
  const url = product.external_url;

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

  return {
    label: "اطلب الآن",
    sublabel: product.is_free ? "Free Download" : "Order Now",
    icon: ExternalLink,
    href: url,
    className: "bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/20",
  };
}

export function ProductPurchaseAction({ product }: ProductPurchaseActionProps) {
  const [loading] = useState(false);
  const config = getCtaConfig(product);

  if (!config.href) {
    return (
      <Button size="lg" className="w-full" disabled>
        Coming Soon
      </Button>
    );
  }

  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className={`w-full h-12 text-base font-semibold gap-2 button-motion ${config.className}`}
        disabled={loading}
        render={
          <a href={config.href} target="_blank" rel="noopener noreferrer" />
        }
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
        {config.label}
      </Button>
      <p className="text-center text-xs text-slate-500">
        {config.sublabel} · {product.is_free ? "Free" : `${product.base_price_minor ? product.base_price_minor / 100 : product.price} ${product.currency}`}
      </p>
    </div>
  );
}
