"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  coverImage: string | null;
  galleryImages: string[];
  productName: string;
}

export function ProductGallery({ coverImage, galleryImages, productName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const allImages = [coverImage, ...galleryImages].filter(Boolean) as string[];

  if (allImages.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        No image available
      </div>
    );
  }

  const navigate = (dir: "next" | "prev") => {
    setSelected((prev) => {
      if (dir === "next") return (prev + 1) % allImages.length;
      return prev === 0 ? allImages.length - 1 : prev - 1;
    });
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-zoom-in group"
        onClick={() => setZoomOpen(true)}
      >
        <Image
          src={allImages[selected]}
          alt={`${productName} - ${selected + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {allImages.length > 1 && (
          <>              <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-10 w-10 min-h-[44px] min-w-[44px]"
              onClick={(e) => { e.stopPropagation(); navigate("next"); }}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-10 w-10 min-h-[44px] min-w-[44px]"
              onClick={(e) => { e.stopPropagation(); navigate("prev"); }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {selected + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "relative w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-colors",
                i === selected ? "border-primary" : "border-transparent hover:border-border"
              )}
            >
              <Image src={img} alt={`${productName} thumbnail ${i + 1}`} fill className="object-cover" sizes="64px" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          <div className="relative aspect-video">                <Image src={allImages[selected]} alt={productName} fill className="object-contain" sizes="90vw" loading="lazy" />                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
                  onClick={() => setZoomOpen(false)}
                  aria-label="Close zoom"
                >
                  <X className="h-5 w-5" />
                </Button>
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
                      onClick={() => navigate("next")}
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
                      onClick={() => navigate("prev")}
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
