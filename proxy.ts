import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  function redirectWithCookies(target: URL): NextResponse {
    const res = NextResponse.redirect(target);
    // Preserve refreshed auth cookies from supabaseResponse
    for (const c of supabaseResponse.cookies.getAll()) {
      res.cookies.set(c.name, c.value, c);
    }
    return res;
  }

  // ---- Admin route protection ----
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (user) {
        return redirectWithCookies(new URL("/admin", request.url));
      }
      return supabaseResponse;
    }

    if (!user) {
      return redirectWithCookies(new URL("/admin/login", request.url));
    }

    // Check admin role via service-role client
    const adminResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${user.id}&role=eq.admin&select=role`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    let isAdmin = false;
    try {
      const adminRoles = await adminResponse.json();
      isAdmin = Array.isArray(adminRoles) && adminRoles.length > 0;
    } catch {
      // Fail closed when admin check fails - do not grant admin
      isAdmin = false;
    }

    if (!isAdmin) {
      return redirectWithCookies(new URL("/", request.url));
    }
  }

  // ---- Checkout requires authentication ----
  if (pathname.startsWith("/checkout")) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return redirectWithCookies(redirectUrl);
    }
  }

  // ---- Account routes require authentication ----
  if (pathname.startsWith("/account")) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return redirectWithCookies(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  // Run on all routes except static assets to ensure session refresh and proper auth cookie handling.
  // Admin/account/checkout logic is inside proxy; other routes just refresh session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
