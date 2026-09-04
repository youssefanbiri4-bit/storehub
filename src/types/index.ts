// ============================================
// Core Types
// ============================================

export type UserRole = "customer" | "admin";

export type ProductStatus = "draft" | "published" | "hidden" | "archived";

export type OrderStatus =
  | "pending_payment"
  | "pending_confirmation"
  | "confirmed"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "returned";

export type PaymentMethod = "cash_on_delivery" | "online_payment";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "cancelled";

export type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "ready"
  | "shipped"
  | "delivered"
  | "returned";

export type ShipmentStatus =
  | "pending"
  | "label_created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "returned";

export type DiscountType = "percentage" | "fixed";

// ============================================
// Profile
// ============================================

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_path: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
  created_at: string;
}

// ============================================
// Brand
// ============================================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_path: string | null;
  status: "active" | "inactive";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Category
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  parent_id: string | null;
  status: "active" | "inactive";
  brand_id: string | null;
  sort_order: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Product
// ============================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;

  // Physical product pricing (minor units)
  base_price_minor: number;
  compare_at_price_minor: number | null;
  currency: string;

  // Legacy digital fields (kept for data migration, not used in UI)
  price: number;
  old_price: number | null;

  status: ProductStatus;
  is_featured: boolean;
  is_free: boolean;
  is_published: boolean;

  // Physical product dimensions
  weight_grams: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  requires_shipping: boolean;

  // Stock (at product level, before variants)
  stock_quantity: number;
  reserved_quantity: number;

  // SKU (at product level, before variants)
  sku: string | null;

  // Content
  tags: string[];
  badge: string | null;
  included_items: string[];

  // Media
  cover_image: string | null;
  gallery_images: string[];

  // SEO
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  image_alt_text: string | null;

  // Analytics
  view_count: number;
  click_count: number;

  // Dates
  published_at: string | null;
  created_at: string;
  updated_at: string;

  // Legacy digital-product fields (kept for backward compatibility)
  file_format?: string | null;
  file_size?: string | null;
  external_url?: string;
  delivery_method?: string;
  hosted_access_type?: string;
  external_platform?: string | null;
  product_type?: string;
  preview_type?: string | null;
  preview_url?: string | null;
  preview_file?: string | null;
  language?: string;
  supported_devices?: string;
  required_software?: string | null;
  license_type?: string;
  version?: string | null;
  requirements?: string;
  user_level?: string;
  download_limit?: number | null;
  download_link_expiry_minutes?: number;
  payment_provider?: string | null;
  payment_provider_product_id?: string | null;
  payment_provider_price_id?: string | null;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
  scheduled_publish_at?: string | null;
  hidden_at?: string | null;
  archived_at?: string | null;
  link_status?: string;
  link_response_code?: number | null;
  link_error_message?: string | null;
  total_revenue?: number;
  last_link_check?: string | null;

  // Relations
  category?: Category;
  brand?: Brand;
  variants?: ProductVariant[];
  product_images?: ProductImage[];
  product_options?: ProductOption[];
  product_files?: ProductFile[];
}

// ============================================
// Product Variant
// ============================================

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  title: string | null;
  option_values: Record<string, string>;
  price_minor: number | null;
  compare_at_price_minor: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  image_id: string | null;
  weight_grams: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Computed
  available_quantity?: number;
  product?: Product;
}

// ============================================
// Product Options
// ============================================

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  values?: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  sort_order: number;
  created_at: string;
}

// ============================================
// Product Image
// ============================================

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

// ============================================
// Address
// ============================================

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  country_code: string;
  city: string;
  region: string | null;
  postal_code: string | null;
  address_line_1: string;
  address_line_2: string | null;
  delivery_notes: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Cart
// ============================================

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  variant?: ProductVariant;
}

// ============================================
// Wishlist
// ============================================

export interface Wishlist {
  id: string;
  user_id: string;
  created_at: string;
  items?: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

// ============================================
// Order
// ============================================

export interface CustomerOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  tax_minor: number;
  total_minor: number;
  shipping_address_snapshot: AddressSnapshot;
  billing_address_snapshot: AddressSnapshot | null;
  customer_email: string;
  customer_phone: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  items?: OrderItem[];
  shipments?: Shipment[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string;
  product_image: string | null;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
  option_values: Record<string, string> | null;
  created_at: string;
}

export interface AddressSnapshot {
  full_name: string;
  phone: string;
  country_code: string;
  city: string;
  region: string | null;
  postal_code: string | null;
  address_line_1: string;
  address_line_2: string | null;
  delivery_notes: string | null;
}

// ============================================
// Shipping
// ============================================

export interface ShippingZone {
  id: string;
  name: string;
  type: "domestic" | "international";
  countries: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  methods?: ShippingMethod[];
}

export interface ShippingMethod {
  id: string;
  zone_id: string;
  name: string;
  description: string | null;
  base_rate_minor: number;
  per_kg_rate_minor: number;
  free_shipping_threshold_minor: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  shipping_method_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: ShipmentStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Payment
// ============================================

export interface Payment {
  id: string;
  order_id: string;
  provider: string | null;
  provider_payment_id: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amount_minor: number;
  currency: string;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  payment_id: string | null;
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// ============================================
// Coupon
// ============================================

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value_minor: number;
  minimum_order_minor: number;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  applies_to: string;
  applies_to_ids: string[];
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Inventory
// ============================================

export interface InventoryMovement {
  id: string;
  variant_id: string;
  order_id: string | null;
  movement_type:
    | "sale"
    | "restock"
    | "adjustment"
    | "reservation"
    | "release"
    | "return";
  quantity: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// ============================================
// Admin Activity Log
// ============================================

export interface AdminActivityLog {
  id: string;
  admin_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================
// Constants
// ============================================

export const PRODUCT_STATUSES: Record<
  ProductStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  published: { label: "Published", color: "bg-green-100 text-green-700" },
  hidden: { label: "Hidden", color: "bg-orange-100 text-orange-700" },
  archived: { label: "Archived", color: "bg-purple-100 text-purple-700" },
};

export const ORDER_STATUSES: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending_payment: {
    label: "Pending Payment",
    color: "bg-yellow-100 text-yellow-700",
  },
  pending_confirmation: {
    label: "Pending Confirmation",
    color: "bg-blue-100 text-blue-700",
  },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700" },
  processing: { label: "Processing", color: "bg-indigo-100 text-indigo-700" },
  ready_to_ship: {
    label: "Ready to Ship",
    color: "bg-cyan-100 text-cyan-700",
  },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", color: "bg-orange-100 text-orange-700" },
  returned: { label: "Returned", color: "bg-gray-100 text-gray-700" },
};

export const PAYMENT_STATUSES: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  unpaid: { label: "Unpaid", color: "bg-gray-100 text-gray-700" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", color: "bg-orange-100 text-orange-700" },
  partially_refunded: {
    label: "Partial Refund",
    color: "bg-orange-100 text-orange-700",
  },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

export const FULFILLMENT_STATUSES: Record<
  FulfillmentStatus,
  { label: string; color: string }
> = {
  unfulfilled: { label: "Unfulfilled", color: "bg-gray-100 text-gray-700" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-700" },
  ready: { label: "Ready", color: "bg-cyan-100 text-cyan-700" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  returned: { label: "Returned", color: "bg-red-100 text-red-700" },
};

export const MOROCCO_COUNTRY_CODE = "MA";
export const DEFAULT_CURRENCY = "MAD";

export const BADGE_LABELS: Record<string, string> = {
  new: "New",
  bestseller: "Bestseller",
  sale: "Sale",
};

export const BADGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "bestseller", label: "Bestseller" },
  { value: "sale", label: "Sale" },
];

// ============================================
// Legacy Digital-Product Types (kept for compat)
// ============================================

export type ProductType = "ebook" | "template" | "course" | "images" | "other";

export const PRODUCT_TYPES: Record<ProductType, string> = {
  ebook: "E-book",
  template: "Template",
  course: "Course",
  images: "Image Pack",
  other: "Other",
};

export interface ProductFile {
  id: string;
  product_id: string;
  storage_path: string;
  original_file_name: string;
  safe_file_name: string;
  file_extension: string | null;
  mime_type: string;
  file_size: number;
  version: string | null;
  checksum: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVersion {
  id: string;
  product_id: string;
  version_number: number;
  data: Product;
  changed_by: string | null;
  changed_fields: string[];
  created_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  user_id: string | null;
  user_email: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface MediaItem {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  product_ids: string[];
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  product_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  click_count: number;
  view_count: number;
  created_at: string;
  product?: Product;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export const LINK_STATUS: Record<string, { label: string; color: string }> = {
  ok: { label: "Active", color: "text-green-600" },
  slow: { label: "Slow", color: "text-yellow-600" },
  redirect: { label: "Redirect", color: "text-blue-600" },
  broken: { label: "Broken", color: "text-red-600" },
  insecure: { label: "Insecure", color: "text-orange-600" },
  unchecked: { label: "Unchecked", color: "text-gray-500" },
};

// ============================================
// Legacy Hybrid Delivery Types
// ============================================

export type DeliveryMethod = "external_link" | "hosted_file";
export type HostedAccessType = "free" | "paid";
export type PaymentStatusLegacy = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export const DELIVERY_METHODS: Record<DeliveryMethod, { label: string; description: string }> = {
  external_link: {
    label: "External Link",
    description: "Send customers to Gumroad, Payhip, Lemon Squeezy, or another platform.",
  },
  hosted_file: {
    label: "Hosted File",
    description: "Store files privately and deliver them securely from this platform.",
  },
};

export const HOSTED_ACCESS_TYPES: Record<HostedAccessType, { label: string; description: string }> = {
  free: {
    label: "Free Download",
    description: "Visitors can download through a temporary secure link.",
  },
  paid: {
    label: "Paid Download",
    description: "Customers receive download access after verified payment.",
  },
};

export const EXTERNAL_PLATFORMS = [
  "Gumroad",
  "Payhip",
  "Lemon Squeezy",
  "Shopify",
  "Google Drive",
  "Dropbox",
  "Custom",
] as const;

export interface DownloadEntitlement {
  id: string;
  order_id: string | null;
  product_id: string;
  user_id: string | null;
  customer_email: string | null;
  max_downloads: number | null;
  download_count: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface DownloadEvent {
  id: string;
  product_id: string;
  file_id: string;
  entitlement_id: string | null;
  user_id: string | null;
  customer_email: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  downloaded_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_email: string;
  product_id: string;
  provider: string;
  provider_order_id: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatusLegacy;
  provider_payload: Record<string, unknown> | null;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
  product?: Product;
}

export interface AdminStats {
  published_count: number;
  unpublished_count: number;
  categories_count: number;
  total_views: number;
  total_clicks: number;
  top_viewed: Product[];
  top_clicked: Product[];
  scheduled_count: number;
  broken_links_count: number;
  draft_count: number;
  avg_conversion: number;
  total_downloads: number;
  total_orders: number;
  total_revenue: number;
  top_downloaded: Product[];
  total_products: number;
  out_of_stock_count: number;
}
