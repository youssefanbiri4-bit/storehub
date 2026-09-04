import { NextRequest, NextResponse } from "next/server";
import { validateFreeDownload } from "@/lib/downloads/validate-entitlement";
import { createSignedDownloadUrl } from "@/lib/downloads/create-signed-download";
import { recordDownloadEvent } from "@/lib/downloads/record-download";

// Simple in-memory rate limiter (per-server instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; fileId: string }> }
) {
  const { productId, fileId } = await params;

  // Rate limiting by IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(`free-download:${ip}:${productId}`)) {
    return NextResponse.json(
      { error: "Too many download attempts. Please wait and try again." },
      { status: 429 }
    );
  }

  // Validate the free download request
  const validation = await validateFreeDownload(productId, fileId);

  if (!validation.valid || !validation.file) {
    return NextResponse.json(
      { error: validation.error || "Download unavailable." },
      { status: 403 }
    );
  }

  try {
    // Generate short-lived signed URL
    const { signedUrl } = await createSignedDownloadUrl(
      validation.file.storage_path,
      5 // 5 minutes
    );

    // Record download event (fire-and-forget)
    recordDownloadEvent({
      productId,
      fileId,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    }).catch(() => {}); // Don't block the response

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate download link. Please try again." },
      { status: 500 }
    );
  }
}
