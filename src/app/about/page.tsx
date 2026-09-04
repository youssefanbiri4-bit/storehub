import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about our mission to deliver premium products for modern creators and businesses.",
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
  openGraph: {
    title: "About",
    description:
      "Learn about our mission to deliver premium products for modern creators and businesses.",
    url: `${siteConfig.url}/about`,
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-6">
          Better tools.
          <br />
          Better creative work.
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed mb-12">
          Digital Products Hub is a curated marketplace for premium digital products — templates, ebooks, courses, and creator assets designed to move your work forward.
        </p>

        <Separator className="mb-12" />

        <div className="space-y-8 mb-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading mb-3">Our mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe every digital product should be well-crafted, easy to use, and deliver real value. Our mission is to connect creators and professionals with tools that genuinely improve how they work — not just fill a download folder.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading mb-3">How we curate</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every product on our platform is reviewed before listing. We evaluate quality, usability, and long-term value. If it does not meet our standards, it does not ship. This keeps the catalog focused and trustworthy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading mb-3">Who it is for</h2>
            <p className="text-muted-foreground leading-relaxed">
              Designers, developers, marketers, educators, and anyone building something meaningful with digital tools. Whether you need a template to ship faster or a course to sharpen a skill, the products here are built for real workflows.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading mb-3">How checkout works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Digital Products Hub uses secure external checkout for all transactions. When you select a product, you are directed to a trusted payment page to complete your purchase. After payment, you receive instant access to your download. This keeps your payment information safe and lets us focus on the products themselves.
            </p>
          </div>
        </div>

        <Separator className="mb-12" />

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight font-heading mb-4">
            Start exploring.
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse the full catalog and find the tools that fit your work.
          </p>
          <Button size="lg" className="gap-2" render={<Link href="/products" />}>
            Explore Products
          </Button>
        </div>
      </div>
    </div>
  );
}
