import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for our platform. Please read these terms carefully before using our services.",
  alternates: {
    canonical: `${siteConfig.url}/terms`,
  },
  openGraph: {
    title: "Terms of Service",
    description:
      "Terms of service for our platform. Please read these terms carefully before using our services.",
    url: `${siteConfig.url}/terms`,
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-3">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-12">
          Last updated: August 2026
        </p>

        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Digital Products Hub. By using our platform, you agree to these terms of service. If you do not agree with any part of these terms, please do not use the platform.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account information. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Digital Products</h2>
            <p className="text-muted-foreground leading-relaxed">
              All digital products sold on our platform are protected by intellectual property rights. You are granted a license to use the product in accordance with the terms attached to each product.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Payments & Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed through secure payment gateways. Due to the nature of digital products, we generally do not accept returns. If you encounter any issues, please contact us.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Prohibited Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may not use our platform for any unlawful or unauthorized purpose. Copying, distributing, or reselling digital products without permission is prohibited.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to ensure the accuracy of information on our platform, but we do not guarantee its completeness or accuracy. Your use of products is at your own risk.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Changes take effect immediately upon posting on the platform. Continued use after changes constitutes acceptance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
