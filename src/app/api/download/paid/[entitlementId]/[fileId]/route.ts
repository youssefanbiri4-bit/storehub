import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validatePaidEntitlement } from "@/lib/downloads/validate-entitlement";
import { createSignedDownloadUrl } from "@/lib/downloads/create-signed-download";
import { recordDownloadEvent, incrementEntitlementDownloadCount } from "@/lib/downloads/record-download";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entitlementId: string; fileId: string }> }
) {
  const { entitlementId, fileId } = await params;

  // Rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(`paid-download:${ip}:${entitlementId}`)) {
    return NextResponse.json(
      { error: "Too many download attempts. Please wait and try again." },
      { status: 429 }
    );
  }

  // Identify the customer
  let userId: string | undefined;
  let customerEmail: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      customerEmail = user.email || undefined;
    }
  } catch {
    // Not authenticated — try email-based lookup
  }

  // Try to get email from query params if not authenticated
  if (!customerEmail) {
    customerEmail = request.nextUrl.searchParams.get("email") || undefined;
  }

  // Validate entitlement
  const validation = await validatePaidEntitlement(entitlementId, fileId, {
    userId,
    customerEmail,
  });

  if (!validation.valid || !validation.file || !validation.entitlement) {
    return NextResponse.json(
      { error: validation.error || "Download unavailable." },
      { status: 403 }
    );
  }

  // Increment download count atomically
  const countResult = await incrementEntitlementDownloadCount(entitlementId);

  if (!countResult) {
    return NextResponse.json(
      { error: "Failed to verify download access." },
      { status: 500 }
    );
  }

  // Check if limit was reached after increment
  if (
    countResult.max_downloads !== null &&
    countResult.download_count > countResult.max_downloads
  ) {
    return NextResponse.json(
      { error: "Your download limit has been reached." },
      { status: 403 }
    );
  }

  try {
    // Generate short-lived signed URL
    const expiryMinutes = validation.product?.download_link_expiry_minutes || 5;
    const { signedUrl } = await createSignedDownloadUrl(
      validation.file.storage_path,
      expiryMinutes
    );

    // Record download event (fire-and-forget)
    recordDownloadEvent({
      productId: validation.product!.id,
      fileId,
      entitlementId,
      userId,
      customerEmail,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    }).catch(() => {});

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate download link. Please try again." },
      { status: 500 }
    );
  }
}
