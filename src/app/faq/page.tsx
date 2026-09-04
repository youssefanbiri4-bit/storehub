import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { FAQJsonLd } from "@/components/seo/structured-data";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to frequently asked questions about our products, orders, downloads, and support.",
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
  openGraph: {
    title: "FAQ",
    description:
      "Answers to frequently asked questions about our products, orders, downloads, and support.",
    url: `${siteConfig.url}/faq`,
    type: "website",
  },
};

const faqCategories = [
  {
    title: "Products & Purchasing",
    questions: [
      {
        q: "What types of digital products are available?",
        a: "We offer a wide range of digital products including ebooks, professional templates, image packs, social media templates, mini-courses, and other curated digital assets.",
      },
      {
        q: "How do I purchase a product?",
        a: "Choose the product you want, click the \"Get Product\" button, and you will be redirected to a secure checkout page to complete your purchase.",
      },
      {
        q: "Are there free products?",
        a: "Yes. Look for products with the \"Free\" badge and click \"Download\" to get them at no cost.",
      },
    ],
  },
  {
    title: "Download & Usage",
    questions: [
      {
        q: "How do I get my product after purchase?",
        a: "After completing your purchase, you will receive an email with a download link. You can also access your products from your account on the checkout platform.",
      },
      {
        q: "Can I use products in commercial projects?",
        a: "Yes. You can use products in both personal and commercial projects. Each product includes a clear license outlining usage terms.",
      },
      {
        q: "Can I request customization?",
        a: "Get in touch with us and we will try to accommodate your request. Some products can be adjusted to fit your specific needs.",
      },
    ],
  },
  {
    title: "Support & Help",
    questions: [
      {
        q: "How do I contact support?",
        a: "You can reach us through the Contact page or via email. We respond to all inquiries within 24 business hours.",
      },
      {
        q: "Do products get updates?",
        a: "Yes. We regularly update products to improve quality and add new features. All updates are free for existing customers.",
      },
      {
        q: "What is your refund policy?",
        a: "Due to the nature of digital products, we generally do not accept returns. If you encounter any issues, please contact us and we will work out a solution.",
      },
    ],
  },
];

export default function FaqPage() {
  const allFaqs = faqCategories.flatMap((cat) =>
    cat.questions.map((q) => ({ question: q.q, answer: q.a })),
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <FAQJsonLd faqs={allFaqs} />
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading mb-3">
            Frequently asked questions
          </h1>
          <p className="text-muted-foreground text-lg">
            Quick answers to common questions.
          </p>
        </div>

        <div className="space-y-12">
          {faqCategories.map((category, catIndex) => (
            <div key={category.title}>
              <h2 className="text-xl font-bold tracking-tight font-heading mb-5">
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-surface p-5 md:p-6">
                    <h3 className="font-semibold mb-2">{item.q}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
              {catIndex < faqCategories.length - 1 && (
                <Separator className="mt-12" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
