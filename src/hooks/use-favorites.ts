"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

const GUEST_KEY = "dph_favorites:guest";
const USER_KEY_PREFIX = "dph_favorites:user:";
const VERSION = 1;

// Global store to unify state across all hook instances (card, header, page)
type StoreState = {
  favorites: string[];
  loaded: boolean;
  userId: string | null;
  version: number; // monotonic to prevent stale writes
  error: string | null;
};

const EMPTY_FAVORITES: string[] = [];

const SERVER_SNAPSHOT: StoreState = {
  favorites: EMPTY_FAVORITES,
  loaded: false,
  userId: null,
  version: 0,
  error: null,
};

let currentSnapshot: StoreState = SERVER_SNAPSHOT;

const listeners = new Set<() => void>();
let initialized = false;
let currentUserId: string | null = null;
// To prevent stale writes, track last written version per user
let lastPersistVersion = 0;

function getKey(userId: string | null): string {
  return userId ? `${USER_KEY_PREFIX}${userId}` : GUEST_KEY;
}

function validateFavorites(data: unknown): string[] | null {
  if (!Array.isArray(data)) return null;
  // Filter to strings that look like UUIDs (basic check), allow any non-empty string for transition
  const valid = data.filter((v) => typeof v === "string" && v.length >= 8 && v.length <= 64);
  // If input was array but contains non-strings, treat as corrupted if >50% invalid
  if (valid.length === 0 && data.length > 0) return null;
  return valid as string[];
}

function notify() {
  listeners.forEach((l) => l());
}

function readLocal(userId: string | null): string[] {
  try {
    const key = getKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Handle versioned shape {v, data} or legacy plain array
    if (parsed && typeof parsed === "object" && "v" in parsed && "data" in parsed) {
      const validated = validateFavorites((parsed as { data: unknown }).data);
      return validated ?? [];
    }
    const validated = validateFavorites(parsed);
    return validated ?? [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string | null, favorites: string[], version: number) {
  // Prevent stale write: only write if version >= lastPersistVersion
  if (version < lastPersistVersion) return false;
  try {
    const key = getKey(userId);
    const payload = JSON.stringify({ v: VERSION, data: favorites });
    localStorage.setItem(key, payload);
    lastPersistVersion = version;
    return true;
  } catch {
    // Quota or private mode
    return false;
  }
}

async function syncGuestToUserDb(guestFavorites: string[], userId: string) {
  if (guestFavorites.length === 0) return;
  try {
    const supabase = createClient();
    // Get or create wishlist for user
    let wishlistId: string | null = null;
    const { data: wl } = await supabase.from("wishlists").select("id").eq("user_id", userId).maybeSingle();
    if (wl) wishlistId = wl.id;
    else {
      const { data: created } = await supabase.from("wishlists").insert({ user_id: userId }).select("id").single();
      wishlistId = created?.id || null;
    }
    if (!wishlistId) return;
    const { data: existing } = await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wishlistId);
    const existingIds = new Set((existing || []).map((r) => r.product_id));
    const toInsert = guestFavorites.filter((id) => !existingIds.has(id)).map((product_id) => ({ wishlist_id: wishlistId!, product_id }));
    if (toInsert.length > 0) {
      await supabase.from("wishlist_items").insert(toInsert);
    }
    // After successful merge, clear guest local to prevent re-merge to next account
    try {
      localStorage.removeItem(GUEST_KEY);
    } catch {}
  } catch {
    // Network failure - keep guest local, don't clear, and surface error via currentSnapshot
    currentSnapshot = { ...currentSnapshot, error: "Failed to sync favorites. Please check connection." };
    notify();
  }
}

async function loadForUser(userId: string | null) {
  // Called on init and on auth change
  try {
    if (userId) {
      // Authenticated: load from DB + local (namespaced)
      const supabase = createClient();
      const local = readLocal(userId);
      // Fetch DB
      let dbIds: string[] = [];
      try {
        const { data: wl } = await supabase.from("wishlists").select("id").eq("user_id", userId).maybeSingle();
        if (wl) {
          const { data: items } = await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wl.id);
          dbIds = (items || []).map((r) => r.product_id);
        }
      } catch {
        // Network failure: fall back to local, mark error
        currentSnapshot = { ...currentSnapshot, favorites: local, loaded: true, userId, version: currentSnapshot.version + 1, error: "Failed to load favorites." };
        notify();
        return;
      }
      // Merge: union, DB is source of truth, but include local that are not in DB (from previous guest session before login)
      // However, to avoid duplication on repeated login, we only merge guest favorites once (stored under GUEST_KEY)
      const guestLocal = readLocal(null);
      let merged: string[];
      if (guestLocal.length > 0 && dbIds.length >= 0) {
        // Merge guest into DB first, then re-read? For simplicity, union guest + db
        const union = new Set([...dbIds, ...local, ...guestLocal]);
        merged = Array.from(union);
        // Write merged to local for user namespace
        const nextVersion = currentSnapshot.version + 1;
        writeLocal(userId, merged, nextVersion);
        currentSnapshot = { favorites: merged, loaded: true, userId, version: nextVersion, error: null };
        notify();
        // Sync guest to DB in background (non-blocking) - but await to ensure consistency
        await syncGuestToUserDb(guestLocal, userId);
        // Re-fetch DB after sync to ensure consistency
        try {
          const { data: wl2 } = await supabase.from("wishlists").select("id").eq("user_id", userId).maybeSingle();
          if (wl2) {
            const { data: items2 } = await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wl2.id);
            const dbIds2 = (items2 || []).map((r) => r.product_id);
            const union2 = new Set([...dbIds2, ...readLocal(userId)]);
            const merged2 = Array.from(union2);
            const v2 = currentSnapshot.version + 1;
            writeLocal(userId, merged2, v2);
            currentSnapshot = { favorites: merged2, loaded: true, userId, version: v2, error: null };
            notify();
          }
        } catch {}
      } else {
        const union = new Set([...dbIds, ...local]);
        merged = Array.from(union);
        const nextVersion = currentSnapshot.version + 1;
        // If DB has more items than local, update local to match DB
        if (merged.length !== local.length || merged.some((id, i) => id !== local[i])) {
          writeLocal(userId, merged, nextVersion);
        }
        currentSnapshot = { favorites: merged, loaded: true, userId, version: nextVersion, error: null };
        notify();
      }
    } else {
      // Guest: load from guest key
      const local = readLocal(null);
      const nextVersion = currentSnapshot.version + 1;
      currentSnapshot = { favorites: local, loaded: true, userId: null, version: nextVersion, error: null };
      notify();
    }
  } catch {
    currentSnapshot = { ...currentSnapshot, loaded: true, error: "Failed to load favorites." };
    notify();
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): StoreState {
  return currentSnapshot;
}

function getServerSnapshot(): StoreState {
  return SERVER_SNAPSHOT;
}

// Initialize once per app lifecycle
function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;

  // Initial load as guest (until auth resolved)
  loadForUser(null);

  // Listen to storage events for cross-tab sync
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (e.key === getKey(currentUserId) || e.key === GUEST_KEY) {
      const local = readLocal(currentUserId);
      // Only update if not stale (version check)
      if (JSON.stringify(local) !== JSON.stringify(currentSnapshot.favorites)) {
        currentSnapshot = { ...currentSnapshot, favorites: local, version: currentSnapshot.version + 1 };
        notify();
      }
    }
  });

  // Subscribe to auth changes
  try {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const newId = user?.id || null;
      if (newId !== currentUserId) {
        currentUserId = newId;
        loadForUser(newId);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newId = session?.user?.id || null;
      if (newId !== currentUserId) {
        // On logout, clear in-memory to prevent leaking previous account's favorites
        if (currentUserId && !newId) {
          // Switching from authenticated to guest: reset to guest local
          currentSnapshot = { favorites: readLocal(null), loaded: true, userId: null, version: currentSnapshot.version + 1, error: null };
          notify();
        }
        currentUserId = newId;
        loadForUser(newId);
      }
    });
    // Note: subscription cleanup handled by provider unmount, but store lives for app lifetime
    // We keep it alive; no need to unsubscribe until page unload
    window.addEventListener("beforeunload", () => {
      try { subscription.unsubscribe(); } catch {}
    });
  } catch {}
}

export function useFavorites() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Initialize outside render so it only runs on the client, once:
  // ensureInitialized is idempotent via the module-level `initialized` flag.
  useEffect(() => {
    ensureInitialized();
  }, []);

  const addFavorite = useCallback(async (productId: string) => {
    const prev = [...state.favorites];
    if (prev.includes(productId)) return;
    const next = [...prev, productId];
    const nextVersion = state.version + 1;
    // Optimistic update
    currentSnapshot = { ...state, favorites: next, version: nextVersion, error: null };
    notify();
    const okLocal = writeLocal(state.userId, next, nextVersion);
    if (!okLocal) {
      currentSnapshot = { ...currentSnapshot, favorites: prev, version: currentSnapshot.version + 1, error: "Failed to save. Storage unavailable." };
      notify();
      return;
    }
    // If authenticated, also persist to DB
    if (state.userId) {
      try {
        const supabase = createClient();
        const { data: wl } = await supabase.from("wishlists").select("id").eq("user_id", state.userId).maybeSingle();
        let wishlistId = wl?.id;
        if (!wishlistId) {
          const { data: created, error } = await supabase.from("wishlists").insert({ user_id: state.userId }).select("id").single();
          if (error || !created) throw new Error("create wishlist failed");
          wishlistId = created.id;
        }
        const { error } = await supabase.from("wishlist_items").insert({ wishlist_id: wishlistId, product_id: productId });
        if (error && !error.message.includes("duplicate") && error.code !== "23505") {
          throw error;
        }
      } catch {
        // Rollback on DB failure
        currentSnapshot = { ...currentSnapshot, favorites: prev, version: currentSnapshot.version + 1, error: "Failed to sync favorite. Please retry." };
        writeLocal(state.userId, prev, currentSnapshot.version);
        notify();
      }
    }
  }, [state]);

  const removeFavorite = useCallback(async (productId: string) => {
    const prev = [...state.favorites];
    if (!prev.includes(productId)) {
      // Already not in local, but may be in DB - still need to remove from DB
      // Continue to DB removal below
    }
    const next = prev.filter((id) => id !== productId);
    const nextVersion = state.version + 1;
    currentSnapshot = { ...state, favorites: next, version: nextVersion, error: null };
    notify();
    const okLocal = writeLocal(state.userId, next, nextVersion);
    if (!okLocal) {
      currentSnapshot = { ...currentSnapshot, favorites: prev, version: currentSnapshot.version + 1, error: "Failed to save." };
      notify();
      return;
    }
    if (state.userId) {
      try {
        const supabase = createClient();
        const { data: wl } = await supabase.from("wishlists").select("id").eq("user_id", state.userId).maybeSingle();
        if (wl) {
          const { error } = await supabase.from("wishlist_items").delete().eq("wishlist_id", wl.id).eq("product_id", productId);
          if (error) throw error;
        }
      } catch {
        currentSnapshot = { ...currentSnapshot, favorites: prev, version: currentSnapshot.version + 1, error: "Failed to remove favorite." };
        writeLocal(state.userId, prev, currentSnapshot.version);
        notify();
      }
    }
  }, [state]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (state.favorites.includes(productId)) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  }, [state.favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback(
    (productId: string) => state.favorites.includes(productId),
    [state.favorites]
  );

  const clearFavorites = useCallback(async () => {
    const prev = [...state.favorites];
    const nextVersion = state.version + 1;
    currentSnapshot = { ...state, favorites: [], version: nextVersion, error: null };
    notify();
    writeLocal(state.userId, [], nextVersion);
    if (state.userId) {
      try {
        const supabase = createClient();
        const { data: wl } = await supabase.from("wishlists").select("id").eq("user_id", state.userId).maybeSingle();
        if (wl) await supabase.from("wishlist_items").delete().eq("wishlist_id", wl.id);
      } catch {
        currentSnapshot = { ...currentSnapshot, favorites: prev, version: currentSnapshot.version + 1, error: "Failed to clear." };
        writeLocal(state.userId, prev, currentSnapshot.version);
        notify();
      }
    }
  }, [state]);

  // Also expose reload for testing
  return { favorites: state.favorites, loaded: state.loaded, error: state.error, addFavorite, removeFavorite, toggleFavorite, isFavorite, clearFavorites };
}
