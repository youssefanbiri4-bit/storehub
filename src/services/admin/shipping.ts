import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ShippingZone, ShippingMethod } from "@/types";

export async function getShippingZones() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_zones")
    .select("*, methods:shipping_methods(*)")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as unknown as (ShippingZone & { methods: ShippingMethod[] })[];
}

export async function getShippingMethods() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_methods")
    .select("*, zone:shipping_zones(name)")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as unknown as (ShippingMethod & { zone: { name: string } })[];
}
