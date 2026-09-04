import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, result_count } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Sanitize: trim and limit length
    const sanitizedQuery = query.trim().slice(0, 200);
    const count = typeof result_count === "number" ? result_count : 0;

    const supabase = await createClient();

    // Fire-and-forget: record the search query
    await supabase.from("search_queries").insert({
      query: sanitizedQuery,
      result_count: count,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Don't fail the page for tracking errors
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
