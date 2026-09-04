import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const footerLinks = {
  shop: [
    { href: "/products", label: "Shop All" },
    { href: "/products?sort=newest", label: "New Arrivals" },
    { href: "/products?sort=popular", label: "Best Sellers" },
    { href: "/products", label: "All Products" },
  ],
  categories: [
    { href: "/products?category=fashion", label: "Fashion" },
    { href: "/products?category=electronics", label: "Electronics" },
    { href: "/products?category=beauty", label: "Beauty" },
    { href: "/products?category=fitness", label: "Fitness" },
    { href: "/products?category=home-decor", label: "Home Decor" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#252E20] text-white border-t border-[rgba(231,245,220,0.12)]">
      {/* Top CTA */}
      <div className="border-b border-[rgba(231,245,220,0.12)]">
        <div className="mx-auto max-w-[1400px] px-5 py-14 text-center">
          <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Discover Better.
            <br />
            Choose Smarter.
          </h2>
          <p className="mx-auto mb-7 max-w-md text-[15px] text-[#B6C99B]">
            Curated products for modern lifestyles. Quality you can trust,
            delivered worldwide.
          </p>
          <Button
            size="lg"
            className="h-12 rounded-xl bg-[#E7F5DC] px-7 text-[15px] font-semibold text-[#273020] hover:bg-[#CFE1B9] button-motion gap-2 border-0"
            render={<Link href="/products" />}
          >
            Browse the Collection
            <ArrowRight className="h-4 w-4 button-icon-motion" />
          </Button>
        </div>
      </div>

      {/* Links grid */}
      <div className="mx-auto max-w-[1400px] px-5 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2.5 font-heading text-lg font-bold"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F5DC] text-sm font-bold text-[#3B472C]">
                S
              </span>
              <span>{siteConfig.name}</span>
            </Link>
            <p className="max-w-[240px] text-sm leading-relaxed text-[#B6C99B]">
              Curated physical products for modern lifestyles. Quality items
              shipped with care.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#98A77C]">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B6C99B] transition-colors hover:text-[#E7F5DC]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#98A77C]">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B6C99B] transition-colors hover:text-[#E7F5DC]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#98A77C]">
              Company
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B6C99B] transition-colors hover:text-[#E7F5DC]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#98A77C]">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B6C99B] transition-colors hover:text-[#E7F5DC]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgba(231,245,220,0.12)]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row">
          <p className="text-sm text-[#98A77C]">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href={siteConfig.social.twitter}
              className="text-sm text-[#98A77C] transition-colors hover:text-[#E7F5DC]"
            >
              Twitter
            </Link>
            <Link
              href={siteConfig.social.instagram}
              className="text-sm text-[#98A77C] transition-colors hover:text-[#E7F5DC]"
            >
              Instagram
            </Link>
            <Link
              href={siteConfig.social.youtube}
              className="text-sm text-[#98A77C] transition-colors hover:text-[#E7F5DC]"
            >
              YouTube
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
