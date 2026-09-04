import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/account/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/favorites",
          "/api/",
          "/go/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
