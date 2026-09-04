"use client";

import { useState, useEffect, useCallback } from "react";

const RECENT_KEY = "dph_recently_viewed";
const MAX_ITEMS = 10;

export interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  cover_image: string | null;
  price: number;
  currency: string;
  is_free: boolean;
  short_description: string | null;
  viewed_at: string;
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const stored = localStorage.getItem(RECENT_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecent(parsed);
        }
      } catch {}
      setLoaded(true);
    };
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    }
  }, [recent, loaded]);

  const addRecent = useCallback((product: Omit<RecentProduct, "viewed_at">) => {
    setRecent((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [{ ...product, viewed_at: new Date().toISOString() }, ...filtered];
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
  }, []);

  return { recent, addRecent, clearRecent, loaded };
}
