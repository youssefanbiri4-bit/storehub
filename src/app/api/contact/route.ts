import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validators";
import { getRateLimiter, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimiter = getRateLimiter();
  const rateKey = `contact:${ip}`;

  const { allowed, retryAfterMs } = await rateLimiter.check(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!allowed) {
    const retryAfter = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 60;
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    // Honeypot check
    if (parsed.data.website && parsed.data.website.length > 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    if (error) {
      return NextResponse.json({ error: "Failed to submit message. Please try again later." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Message received. We'll get back to you soon." });
  } catch {
    return NextResponse.json({ error: "Failed to submit message." }, { status: 500 });
  }
}
