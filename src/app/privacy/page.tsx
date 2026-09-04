import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for our platform. Learn how we collect, use, and protect your information.",
  alternates: {
    canonical: `${siteConfig.url}/privacy`,
  },
  openGraph: {
    title: "Privacy Policy",
    description:
      "Privacy policy for our platform. Learn how we collect, use, and protect your information.",
    url: `${siteConfig.url}/privacy`,
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-3">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-12">
          Last updated: August 2026
        </p>

        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect the information you provide when using Digital Products Hub.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may collect non-personal information such as browser type, operating system, and pages visited to improve your experience. We only collect personal information if you create an account or contact us voluntarily.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the collected information to improve our platform, understand user needs, and provide better content. We do not sell or rent your personal information to third parties.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use cookies to improve your experience on our platform. You can control cookie settings through your browser. Disabling cookies may affect certain features.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate security measures to protect your information from unauthorized access or use. No method of internet transmission is 100% secure, but we work to keep your data as safe as possible.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any significant changes via email or through a notice on our platform.
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-bold tracking-tight font-heading mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy, please reach out to us through the Contact page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
