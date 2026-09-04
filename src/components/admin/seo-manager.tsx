"use client";

import { useMemo } from "react";
import {
  CheckCircle, AlertTriangle, Globe, ImageIcon, Link,
  FileText, Type, LayoutTemplate, Search as SearchIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SeoManagerProps {
  formValues: Record<string, unknown>;
  register: any;
  setValue?: any;
  setHasUnsavedChanges: (v: boolean) => void;
  product?: Product;
}

interface SeoCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

function computeSeoChecks(formValues: Record<string, unknown>): SeoCheck[] {
  const title = (formValues.seo_title as string) || "";
  const description = (formValues.seo_description as string) || "";
  const slug = (formValues.slug as string) || "";
  const coverImage = (formValues.cover_image as string) || "";
  const canonicalUrl = (formValues.canonical_url as string) || "";
  const ogImage = (formValues.og_image as string) || "";
  const imageAltText = (formValues.image_alt_text as string) || "";

  return [
    {
      id: "title",
      label: "SEO title exists",
      status: title.length > 0 ? "pass" : "fail",
      message: title.length === 0
        ? "Add an SEO title so search engines can display it."
        : title.length > 60
          ? "Title is over 60 characters and may be truncated in search results."
          : "Title is a good length for search results.",
    },
    {
      id: "title-length",
      label: "Title length is optimal (30-60 chars)",
      status: title.length === 0 ? "fail" : title.length >= 30 && title.length <= 60 ? "pass" : "warn",
      message: title.length === 0
        ? "No title to evaluate."
        : title.length < 30
          ? `Title is ${title.length} characters. Aim for 30-60 for best display.`
          : title.length > 60
            ? `Title is ${title.length} characters. Google may truncate after ~60.`
            : "Title length is optimal.",
    },
    {
      id: "description",
      label: "Meta description exists",
      status: description.length > 0 ? "pass" : "warn",
      message: description.length === 0
        ? "Add a meta description to improve click-through rates from search results."
        : description.length > 160
          ? "Description is over 160 characters and may be truncated."
          : "Meta description is set.",
    },
    {
      id: "description-length",
      label: "Description length is optimal (120-160 chars)",
      status: description.length === 0 ? "warn" : description.length >= 120 && description.length <= 160 ? "pass" : "warn",
      message: description.length === 0
        ? "No description to evaluate."
        : description.length < 120
          ? `Description is ${description.length} characters. Aim for 120-160 for best display.`
          : description.length > 160
            ? `Description is ${description.length} characters. Google may truncate after ~160.`
            : "Description length is optimal.",
    },
    {
      id: "cover-image",
      label: "Main image exists",
      status: coverImage.length > 0 ? "pass" : "fail",
      message: coverImage.length === 0
        ? "Add a cover image. It's used for social sharing and product display."
        : "Cover image is set.",
    },
    {
      id: "alt-text",
      label: "Image alt text exists",
      status: imageAltText.length > 0 ? "pass" : "warn",
      message: imageAltText.length === 0
        ? "Add alt text to your product image for accessibility and SEO."
        : "Image alt text is set.",
    },
    {
      id: "slug",
      label: "Slug is valid",
      status: /^[a-z0-9-]+$/.test(slug) && slug.length > 0 ? "pass" : "fail",
      message: !slug
        ? "No slug set."
        : !/^[a-z0-9-]+$/.test(slug)
          ? "Slug contains invalid characters. Use only lowercase letters, numbers, and hyphens."
          : "Slug format is valid.",
    },
    {
      id: "og-image",
      label: "OG image set",
      status: ogImage.length > 0 ? "pass" : "warn",
      message: ogImage.length === 0
        ? "Add an Open Graph image for richer social media previews."
        : "OG image is set for social sharing.",
    },
    {
      id: "canonical",
      label: "Canonical URL set",
      status: canonicalUrl.length > 0 ? "pass" : "warn",
      message: canonicalUrl.length === 0
        ? "Set a canonical URL to prevent duplicate content issues."
        : "Canonical URL is configured.",
    },
  ];
}

function computeSeoScore(checks: SeoCheck[]): number {
  // Weighted scoring: fail=0, warn=0.5, pass=1
  // Each check has equal weight
  if (checks.length === 0) return 0;
  const total = checks.reduce((sum, check) => {
    if (check.status === "pass") return sum + 1;
    if (check.status === "warn") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((total / checks.length) * 100);
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs improvement";
  if (score >= 40) return "Poor";
  return "Critical";
}

function GooglePreview({ formValues }: { formValues: Record<string, unknown> }) {
  const title = (formValues.seo_title as string) || (formValues.name as string) || "Product Title";
  const slug = (formValues.slug as string) || "product-name";
  const description = (formValues.seo_description as string) || (formValues.short_description as string) || "Product description will appear here...";

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-1">
      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Google Search Preview</p>
      <div className="space-y-0.5">
        <p className="text-[#1a0dab] text-lg font-normal leading-snug truncate hover:underline cursor-pointer">
          {title}
        </p>
        <p className="text-[#006621] text-sm truncate">
          example.com/products/{slug}
        </p>
        <p className="text-[#545454] text-sm line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function SeoHealthChecklist({ checks }: { checks: SeoCheck[] }) {
  const passed = checks.filter((c) => c.status === "pass").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  const failed = checks.filter((c) => c.status === "fail").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">SEO Health Checklist</h4>
        <div className="flex items-center gap-3 text-xs">
          {passed > 0 && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {passed}</span>}
          {warns > 0 && <span className="text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {warns}</span>}
          {failed > 0 && <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {failed}</span>}
        </div>
      </div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`flex items-start gap-3 rounded-lg p-3 text-sm transition-colors ${
              check.status === "pass"
                ? "bg-green-50 border border-green-200"
                : check.status === "warn"
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {check.status === "pass" && <CheckCircle className="h-4 w-4 text-green-600" />}
              {check.status === "warn" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
              {check.status === "fail" && <AlertTriangle className="h-4 w-4 text-red-600" />}
            </div>
            <div className="min-w-0">
              <p className={`font-medium ${
                check.status === "pass" ? "text-green-800" : check.status === "warn" ? "text-yellow-800" : "text-red-800"
              }`}>
                {check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗"} {check.label}
              </p>
              <p className={`text-xs mt-0.5 ${
                check.status === "pass" ? "text-green-700" : check.status === "warn" ? "text-yellow-700" : "text-red-700"
              }`}>
                {check.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeoManager({
  formValues,
  register,
  setHasUnsavedChanges,
  product,
}: SeoManagerProps) {
  const checks = useMemo(() => computeSeoChecks(formValues), [formValues]);
  const score = useMemo(() => computeSeoScore(checks), [checks]);

  const fields = [
    {
      id: "seo_title",
      label: "SEO Title",
      type: "input" as const,
      maxLength: 200,
      recommended: "30-60 characters",
      placeholder: "e.g. Professional Resume Template - Modern Design",
      icon: Type,
      description: "Appears as the clickable headline in search results.",
    },
    {
      id: "seo_description",
      label: "Meta Description",
      type: "textarea" as const,
      maxLength: 500,
      recommended: "120-160 characters",
      rows: 3,
      placeholder: "e.g. Download a modern, ATS-friendly resume template. Includes matching cover letter and references page.",
      icon: FileText,
      description: "The snippet shown below the title in search results.",
    },
    {
      id: "slug",
      label: "URL Slug",
      type: "input" as const,
      placeholder: "e.g. professional-resume-template",
      icon: Link,
      description: "The product's URL path. Use lowercase letters, numbers, and hyphens only.",
    },
    {
      id: "canonical_url",
      label: "Canonical URL",
      type: "input" as const,
      placeholder: "https://example.com/products/your-product",
      icon: Globe,
      description: "The preferred URL for this page. Set if this content exists at multiple URLs.",
    },
    {
      id: "og_image",
      label: "OG Image (Social Sharing)",
      type: "input" as const,
      placeholder: "https://example.com/images/og-image.jpg",
      icon: LayoutTemplate,
      description: "Image shown when the product is shared on social media. Recommended: 1200×630px.",
    },
    {
      id: "image_alt_text",
      label: "Image Alt Text",
      type: "input" as const,
      maxLength: 200,
      placeholder: "e.g. Modern resume template preview showing clean layout",
      icon: ImageIcon,
      description: "Describes the product image for screen readers and search engines.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* SEO Score Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">SEO Score</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Based on {checks.length} checks from your product data</p>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
              <span className="text-lg text-muted-foreground">/100</span>
              <p className={`text-xs font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
            </div>
          </div>
          {/* Score bar */}
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Preview */}
      <GooglePreview formValues={formValues} />

      {/* SEO Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <SearchIcon className="h-4 w-4" />
            SEO Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {fields.map((field) => {
            const Icon = field.icon;
            const currentValue = (formValues[field.id] as string) || "";
            return (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {field.label}
                  </Label>
                  {field.maxLength && (
                    <span className={`text-xs ${currentValue.length > field.maxLength ? "text-red-500" : "text-muted-foreground"}`}>
                      {currentValue.length}/{field.maxLength}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.id}
                    rows={field.rows || 2}
                    placeholder={field.placeholder}
                    {...register(field.id)}
                    onChange={(e) => {
                      register(field.id).onChange(e);
                      setHasUnsavedChanges(true);
                    }}
                  />
                ) : (
                  <Input
                    id={field.id}
                    dir="ltr"
                    placeholder={field.placeholder}
                    {...register(field.id)}
                    onChange={(e) => {
                      register(field.id).onChange(e);
                      setHasUnsavedChanges(true);
                    }}
                  />
                )}
                {field.recommended && (
                  <p className="text-xs text-muted-foreground">Recommended: {field.recommended}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* SEO Health Checklist */}
      <Card>
        <CardContent className="pt-5">
          <SeoHealthChecklist checks={checks} />
        </CardContent>
      </Card>

      {/* Structured Data Info */}
      {product && (
        <Card className="bg-muted/30">
          <CardContent className="pt-5">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <LayoutTemplate className="h-4 w-4" />
              Product Structured Data
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Schema.org Product structured data will be automatically generated from this product&apos;s data for rich search results.
            </p>
            <div className="rounded-lg bg-background border border-border p-3 font-mono text-xs text-muted-foreground overflow-x-auto">
              <pre>{`{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${(formValues.name as string) || "..."}",
  "description": "${(formValues.seo_description as string || formValues.short_description as string || "...").slice(0, 100)}...",
  "image": "${(formValues.og_image as string || formValues.cover_image as string) || "..."}",
  "url": "${product.canonical_url || `https://example.com/products/${formValues.slug || "..."}`}",
  "offers": {
    "@type": "Offer",
    "price": "${formValues.is_free ? "0" : formValues.price || "..."}",
    "priceCurrency": "${formValues.currency || "USD"}"
  }
}`}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

