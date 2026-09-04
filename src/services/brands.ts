import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/types";

export async function getBrands() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data || []) as Brand[];
}
