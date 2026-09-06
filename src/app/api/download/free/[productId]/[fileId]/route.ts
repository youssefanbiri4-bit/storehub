import { NextRequest, NextResponse } from "next/server";
import { validateFreeDownload } from "@/lib/downloads/validate-entitlement";
import { createSignedDownloadUrl } from "@/lib/downloads/create-signed-download";
import { recordDownloadEvent } from "@/lib/downloads/record-download";
import { memoryRateLimiter, getClientIp } from "@/lib/rate-limit";

// Rate limiter with TTL and bounded memory, 10/min per IP
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; fileId: string }> }
) {
  const { productId, fileId } = await params;

  // Rate limiting by IP with Retry-After
  const ip = getClientIp(request);
  const rateKey = `ip:${ip}:free-download:${productId}`;
  const rate = memoryRateLimiter.check(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
  if (!rate.allowed) {
    const retryAfter = rate.retryAfterMs ? Math.ceil(rate.retryAfterMs / 1000) : 60;
    return NextResponse.json(
      { error: "Too many download attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
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

    // Record download event reliably after response (low priority, may be lost but not critical)
    try {
      const { after } = await import("next/server");
      after(() => {
        recordDownloadEvent({
          productId,
          fileId,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || undefined,
        }).catch(() => {});
      });
    } catch {
      recordDownloadEvent({
        productId,
        fileId,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
      }).catch(() => {});
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate download link. Please try again." },
      { status: 500 }
    );
  }
}
