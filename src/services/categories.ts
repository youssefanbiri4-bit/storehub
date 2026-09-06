import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

// Request-level deduping: same request (layout + page) shares one fetch, no cross-request cache
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, icon, image, sort_order, view_count, status")
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data || []) as Category[];
});

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Category;
}

export async function getCategoryById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Category;
}
