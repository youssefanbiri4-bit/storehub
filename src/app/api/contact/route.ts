import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validators";

// Simple in-memory rate limiter (per IP, 5 requests per minute)
// NOTE: For multi-instance deployments, use Redis or DB. This is best-effort for single instance.
const contactRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = contactRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    contactRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    // Validate with server-side schema (includes honeypot and max lengths)
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    // Honeypot check: if website field filled, silently accept as success to confuse bots, but don't save
    if (parsed.data.website && parsed.data.website.length > 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    // Insert without trusting any recipient field from client; recipient is implicit (contact_messages table)
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    if (error) {
      // Avoid leaking internal details
      return NextResponse.json({ error: "Failed to submit message. Please try again later." }, { status: 500 });
    }
    // Do not claim email was sent; only that message was received
    return NextResponse.json({ ok: true, message: "Message received. We'll get back to you soon." });
  } catch {
    return NextResponse.json({ error: "Failed to submit message." }, { status: 500 });
  }
}
