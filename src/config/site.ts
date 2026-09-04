export const siteConfig = {
  name: "StoreHub",
  title: "StoreHub — Physical Products Marketplace",
  description:
    "Curated physical products for modern lifestyles. Shop fashion, electronics, fitness gear, home decor, and more — available in Morocco and worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  social: {
    twitter: "#",
    instagram: "#",
    youtube: "#",
    whatsapp: "#",
  },
  navLinks: [
    { id: "home", href: "/", label: "Home" },
    { id: "shop", href: "/products", label: "Shop" },
    { id: "new-arrivals", href: "/products?sort=newest", label: "New Arrivals" },
    { id: "best-sellers", href: "/products?sort=popular", label: "Best Sellers" },
    { id: "about", href: "/about", label: "About" },
    { id: "contact", href: "/contact", label: "Contact" },
  ],
};
