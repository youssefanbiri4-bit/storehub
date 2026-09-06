"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Trash2, Pencil, Star } from "lucide-react";
import type { Address } from "@/types";

type Props = { initialAddresses: Address[] };

const emptyForm: Omit<Address, "id" | "user_id" | "created_at" | "updated_at"> = {
  label: "home",
  full_name: "",
  phone: "",
  country_code: "MA",
  city: "",
  region: "",
  postal_code: "",
  address_line_1: "",
  address_line_2: "",
  delivery_notes: "",
  is_default: false,
};

export function AddressesManager({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false });
    if (data) setAddresses(data as Address[]);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };
  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      label: a.label,
      full_name: a.full_name,
      phone: a.phone,
      country_code: a.country_code,
      city: a.city,
      region: a.region || "",
      postal_code: a.postal_code || "",
      address_line_1: a.address_line_1,
      address_line_2: a.address_line_2 || "",
      delivery_notes: a.delivery_notes || "",
      is_default: a.is_default,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }
    // Basic validation
    if (!form.full_name.trim() || !form.phone.trim() || !form.city.trim() || !form.address_line_1.trim() || !form.country_code.trim()) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      if (editing) {
        const { error: upErr } = await supabase
          .from("addresses")
          .update({
            label: form.label,
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            country_code: form.country_code.trim(),
            city: form.city.trim(),
            region: form.region?.trim() || null,
            postal_code: form.postal_code?.trim() || null,
            address_line_1: form.address_line_1.trim(),
            address_line_2: form.address_line_2?.trim() || null,
            delivery_notes: form.delivery_notes?.trim() || null,
            is_default: form.is_default,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id)
          .eq("user_id", user.id);
        if (upErr) throw upErr;

        // If setting default, unset others
        if (form.is_default) {
          await supabase.from("addresses").update({ is_default: false }).neq("id", editing.id).eq("user_id", user.id);
        }
        setSuccess("Address updated.");
      } else {
        const { data, error: insErr } = await supabase
          .from("addresses")
          .insert({
            user_id: user.id,
            label: form.label,
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            country_code: form.country_code.trim(),
            city: form.city.trim(),
            region: form.region?.trim() || null,
            postal_code: form.postal_code?.trim() || null,
            address_line_1: form.address_line_1.trim(),
            address_line_2: form.address_line_2?.trim() || null,
            delivery_notes: form.delivery_notes?.trim() || null,
            is_default: form.is_default,
          })
          .select()
          .single();
        if (insErr) throw insErr;
        if (form.is_default && data) {
          await supabase.from("addresses").update({ is_default: false }).neq("id", data.id).eq("user_id", user.id);
        }
        setSuccess("Address added.");
      }
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch {
      setError("Could not save address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: delErr } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
    if (delErr) setError("Could not delete address.");
    else {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setSuccess("Address deleted.");
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleSetDefault = async (a: Address) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", a.id).eq("user_id", user.id);
    if (!error) {
      await refresh();
      setSuccess("Default address updated.");
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{addresses.length} {addresses.length === 1 ? "address" : "addresses"} saved</p>
        <Button size="sm" onClick={openAdd}>Add Address</Button>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">No addresses yet. Add your first shipping address.</p>
        </div>
      )}

      <div className="grid gap-3">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm capitalize">{a.label}</span>
                  {a.is_default && (
                    <Badge variant="secondary" className="text-[11px] gap-1">
                      <Star className="h-3 w-3" /> Default
                    </Badge>
                  )}
                </div>
                <div className="text-sm mt-1">
                  <p className="font-medium">{a.full_name} • {a.phone}</p>
                  <p className="text-muted-foreground">{a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ""}</p>
                  <p className="text-muted-foreground">{a.city}{a.region ? `, ${a.region}` : ""} {a.postal_code || ""} • {a.country_code}</p>
                  {a.delivery_notes && <p className="text-xs text-muted-foreground mt-1">Notes: {a.delivery_notes}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {!a.is_default && (
                  <Button variant="ghost" size="icon-sm" aria-label="Set as default" onClick={() => handleSetDefault(a)}>
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(a)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Address" : "Add Address"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="home, work..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country Code *</Label>
              <Input id="country" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} placeholder="MA" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addr1">Address Line 1 *</Label>
              <Input id="addr1" value={form.address_line_1} onChange={(e) => setForm({ ...form, address_line_1: e.target.value })} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addr2">Address Line 2</Label>
              <Input id="addr2" value={form.address_line_2 || ""} onChange={(e) => setForm({ ...form, address_line_2: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input id="region" value={form.region || ""} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal">Postal Code</Label>
              <Input id="postal" value={form.postal_code || ""} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Delivery Notes</Label>
              <Textarea id="notes" value={form.delivery_notes || ""} onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="is_default" type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded" />
            <Label htmlFor="is_default" className="font-normal">Set as default address</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : editing ? "Update" : "Add"}</Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
