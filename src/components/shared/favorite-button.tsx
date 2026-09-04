"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

export function FavoriteButton({ productId, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, loaded } = useFavorites();
  const [animating, setAnimating] = useState(false);

  const favorited = loaded && isFavorite(productId);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(productId);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    },
    [productId, toggleFavorite]
  );

  if (!loaded) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "rounded-full hover:bg-red-50 hover:text-red-500 transition-colors button-motion min-h-[44px] min-w-[44px]",
        favorited && "text-red-500",
        className
      )}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          favorited && "fill-current",
          animating && "favorite-pop"
        )}
      />
    </Button>
  );
}
