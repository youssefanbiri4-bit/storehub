import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id } = body;

    if (!category_id || typeof category_id !== "string") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const supabase = await createClient();

    // Fire-and-forget: track the view and increment counter
    await Promise.all([
      supabase.from("category_views").insert({ category_id }),
      supabase.rpc("increment_category_view_count" as never, { cid: category_id } as never),
    ]);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Don't fail the page for tracking errors
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
