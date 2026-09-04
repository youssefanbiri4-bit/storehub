"use client";

import { ExternalLink, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/types";

interface DeliveryMethodFieldProps {
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
  disabled?: boolean;
}

export function DeliveryMethodField({
  value,
  onChange,
  disabled,
}: DeliveryMethodFieldProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-foreground">
          Delivery Method
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          How will customers access this product?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          Object.entries(DELIVERY_METHODS) as [
            DeliveryMethod,
            (typeof DELIVERY_METHODS)[DeliveryMethod]
          ][]
        ).map(([key, info]) => {
          const isSelected = value === key;
          const Icon = key === "external_link" ? ExternalLink : HardDrive;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              className={cn(
                "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-[border-color,background-color]",
                isSelected
                  ? "border-foreground bg-foreground/5"
                  : "border-border bg-white hover:border-foreground/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {info.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {info.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
