import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSignedDownloadUrl } from "@/lib/downloads/create-signed-download";
import { recordDownloadEvent, consumeDownloadAtomically } from "@/lib/downloads/record-download";

// Rate limiter: pluggable, memory with TTL and bounded size
import { memoryRateLimiter, getClientIp, getRateLimitKey } from "@/lib/rate-limit";
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entitlementId: string; fileId: string }> }
) {
  const { entitlementId, fileId } = await params;

  // Require authenticated identity first for user-based rate limiting
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const userId = user.id;
  const customerEmail = user.email || undefined;
  const ip = getClientIp(request);
  const rateKey = `${getRateLimitKey(request, userId)}:paid-download:${entitlementId}`;
  const rate = memoryRateLimiter.check(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
  if (!rate.allowed) {
    const retryAfter = rate.retryAfterMs ? Math.ceil(rate.retryAfterMs / 1000) : 60;
    return NextResponse.json(
      { error: "Too many download attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // Atomically check all conditions and consume one download (owner, payment, file, limit)
  // This is the single source of truth, not separate validate + increment
  const consumeResult = await consumeDownloadAtomically(entitlementId, fileId, userId);

  if (consumeResult.status !== "ok") {
    const statusMap: Record<string, { msg: string; code: number }> = {
      not_found: { msg: "Entitlement not found.", code: 404 },
      forbidden: { msg: "Access denied.", code: 403 },
      revoked: { msg: "Your access has been revoked.", code: 403 },
      expired: { msg: "Your download access has expired.", code: 403 },
      limit_exceeded: { msg: "Your download limit has been reached.", code: 403 },
      product_unavailable: { msg: "This product is not currently available.", code: 403 },
      file_unavailable: { msg: "The download file is unavailable.", code: 404 },
      payment_pending: { msg: "Payment verification is still pending.", code: 403 },
      error: { msg: "Download unavailable.", code: 403 },
    };
    const mapped = statusMap[consumeResult.status] || { msg: "Download unavailable.", code: 403 };
    return NextResponse.json({ error: mapped.msg }, { status: mapped.code });
  }

  // Fetch file and product for signed URL (consume already validated, but we need storage_path and expiry)
  const admin = createAdminClient();
  const { data: entitlement } = await admin.from("download_entitlements").select("product_id").eq("id", entitlementId).single();
  const { data: file } = await admin.from("product_files").select("storage_path").eq("id", fileId).eq("product_id", entitlement?.product_id || "").single();
  const { data: product } = await admin.from("products").select("id, download_link_expiry_minutes").eq("id", entitlement?.product_id || "").single();

  if (!file || !product || !entitlement) {
    // This should not happen if consume succeeded, but handle
    return NextResponse.json({ error: "The download file is unavailable." }, { status: 404 });
  }

  try {
    // Generate short-lived signed URL (after successful consume, so limit counts successful generations)
    const expiryMinutes = (product as { download_link_expiry_minutes?: number })?.download_link_expiry_minutes || 5;
    const { signedUrl } = await createSignedDownloadUrl(file.storage_path, expiryMinutes);

    // Record download event (fire-and-forget, non-critical)
    recordDownloadEvent({
      productId: entitlement.product_id,
      fileId,
      entitlementId,
      userId,
      customerEmail,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    }).catch(() => {});

    // Redirect to the signed URL - note: signed URL remains valid until expiry even if entitlement later revoked; document this
    return NextResponse.redirect(signedUrl, 302);
  } catch {
    // If signed URL generation fails after consume, we have already consumed one attempt.
    // Policy: limit counts URL generation attempts, so this is considered consumed.
    // Alternatively, we could attempt to rollback, but we document that generation failure still counts.
    return NextResponse.json(
      { error: "Failed to generate download link. Please try again." },
      { status: 500 }
    );
  }
}
