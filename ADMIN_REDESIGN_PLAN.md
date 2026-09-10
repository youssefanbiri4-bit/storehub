# E-Commerce Operations Command Center — Redesign Plan

## Executive Summary

Transform the current admin dashboard from a basic product catalog manager into a professional E-Commerce Operations Command Center. The project already has a solid foundation (Next.js 16, Supabase, shadcn/ui, Stripe) with most database tables and types defined but lacking admin UI.

---

## Phase 1 — Current State Audit

### What EXISTS and Works Well
| Feature | Status | Quality |
|---|---|---|
| Admin Dashboard (stats cards, funnel, analytics) | Implemented | Good - needs redesign for actionability |
| Product CRUD (list, create, edit) | Implemented | Good - table is functional but basic |
| Category Management | Implemented | Good |
| Admin Auth (login, RLS, role check) | Implemented | Excellent |
| Product Form (multi-tab, autosave) | Implemented | Excellent |
| Design Tokens (CSS vars, brand palette) | Implemented | Good |
| shadcn/ui Components (22) | Implemented | Good |
| Proxy/Middleware (route protection) | Implemented | Excellent |
| Server Actions (products) | Implemented | Good |
| Analytics RPCs (funnel, revenue, top products) | Implemented | Good |

### What EXISTS but Needs Improvement
| Feature | Issue |
|---|---|
| Admin Sidebar | Only 3 links (Dashboard, Products, Categories). No sections, no grouping, no notifications badge |
| Dashboard | Cards without context. No date range, no trends, no actionable insights, no "what needs attention" |
| Products Table | Client-side only, no server-side pagination for large datasets, no stock/cost columns |
| Navigation | Flat list, no collapsible sections, no search shortcut indicator |

### What Has DB/Types but NO Admin UI
| Feature | DB Table | Types | Migration | Priority |
|---|---|---|---|---|
| Orders Management | `customer_orders`, `order_items` | `CustomerOrder`, `OrderItem` | 004 | **P0** |
| Customer Management | `profiles`, `addresses` | `Profile`, `Address` | 004 | **P0** |
| Coupons/Discounts | `coupons`, `coupon_usages` | `Coupon` | 004 | **P1** |
| Shipping Management | `shipping_zones`, `shipping_methods`, `shipments` | `ShippingZone`, `ShippingMethod`, `Shipment` | 004 | **P1** |
| Inventory Management | `inventory_movements`, `product_variants` | `InventoryMovement`, `ProductVariant` | 004 | **P1** |
| Brand Management | `brands` | `Brand` | 004 | **P2** |
| Campaign Management | `campaigns` | `Campaign` | 002 | **P2** |
| Notifications | `admin_notifications` | `AdminNotification` | 002 | **P1** |
| Activity Logs | `admin_activity_logs`, `activity_logs` | `AdminActivityLog`, `ActivityLog` | 002/004 | **P2** |
| Digital Orders | `orders`, `download_entitlements` | `Order`, `DownloadEntitlement` | 003 | **P1** |
| Contact Messages | `contact_messages` | - | 008 | **P2** |

### What is COMPLETELY Missing (Backend + UI)
| Feature | What's Needed |
|---|---|
| Multi-role Permissions (RBAC) | DB: extend `user_roles` with granular permissions. Currently only `admin`/`customer` |
| Global Search (cross-entity) | New service layer + UI component |
| Dashboard Date Range Filter | New RPC queries with date parameters |
| Profit/Cost Tracking | DB: needs `cost_price_minor` column on products or variants |
| Customer Segmentation (RFM) | New RPC or service-layer computation |
| Real-time Notifications | Supabase Realtime subscription or polling |

---

## Phase 2 — Benchmark Insights

### Key Patterns Extracted from World-Class Platforms

**Shopify Admin:**
- Collapsible sidebar sections (Sales, Catalog, Customers, Content, Discounts, Finance, Settings)
- KPI cards with sparklines and period comparison
- "What needs your attention" section with color-coded alerts
- Global search (⌘K) that searches across all entities
- Date range picker that affects all dashboard data
- Activity feed in order/customer detail pages

**Stripe Dashboard:**
- Clean data density — lots of information without clutter
- Inline charts in tables (mini sparklines)
- Real-time updates
- Powerful filtering with URL-persisted state
- Keyboard-first navigation

**WooCommerce:**
- Revenue chart as hero element on dashboard
- Status overview cards (processing, on-hold, completed orders)
- Quick links for common actions
- Inbox/notes system for store alerts

**Amazon Seller Central:**
- Account health dashboard with color-coded metrics
- Actionable alerts with clear CTAs
- Performance metrics by time period

**Medusa/Saleor (headless):**
- Section-based navigation with icons
- Empty states with clear CTAs
- Skeleton loading for all data-heavy pages

### Design Principles for Our Admin
1. **Actionable over informational** — Every element should prompt an action or decision
2. **Progressive disclosure** — Show summary first, details on demand
3. **Keyboard-first** — ⌘K search, keyboard shortcuts for common actions
4. **Data density** — Maximize useful information per pixel
5. **Consistent patterns** — Same table layout, same filter pattern, same form pattern everywhere
6. **Empty states** — Every page has a helpful empty state with CTA
7. **Loading states** — Skeleton loaders for every data-fetching page
8. **Error states** — Clear error messages with retry options

---

## Phase 3 — Information Architecture (Final)

```
/admin
├── / (Dashboard) ─────────────────── Command Center overview
│
├── ORDERS ─────────────────────────── Sales management
│   ├── /orders ────────────────────── All orders (physical + digital)
│   └── /orders/[id] ──────────────── Order detail
│
├── PRODUCTS ───────────────────────── Catalog management
│   ├── /products ──────────────────── Product list
│   ├── /products/new ──────────────── Create product
│   ├── /products/[id]/edit ────────── Edit product
│   └── /categories ────────────────── Category management
│
├── CUSTOMERS ──────────────────────── Customer intelligence
│   └── /customers ─────────────────── Customer list + detail
│
├── INVENTORY ──────────────────────── Stock management
│   └── /inventory ─────────────────── Stock overview + movements
│
├── MARKETING ──────────────────────── Promotions & campaigns
│   └── /coupons ───────────────────── Coupon management
│
├── SHIPPING ───────────────────────── Delivery management
│   └── /shipping ──────────────────── Zones, methods, shipments
│
└── SETTINGS ───────────────────────── Store configuration
    └── /settings ──────────────────── Store settings placeholder
```

**Navigation Sidebar Structure:**
```
OVERVIEW
  Dashboard

SALES
  Orders

CATALOG
  Products
  Categories

PEOPLE
  Customers

OPERATIONS
  Inventory
  Shipping

GROWTH
  Coupons

SYSTEM
  Settings
```

---

## Phase 4 — UX Architecture

### Dashboard Workflow
```
User opens /admin
  → Sees KPI row: Revenue | Orders | Customers | Conversion (with trend vs prev period)
  → Sees "Needs Attention" section: low stock alerts, unpaid orders, broken links
  → Sees revenue chart (last 30 days, selectable range)
  → Sees recent orders table (last 5)
  → Sees top products by revenue
  → Can click any KPI/card to drill down
  → Can use ⌘K to search anything
```

### Orders Workflow
```
/admin/orders
  → Table with columns: Order# | Customer | Date | Status | Payment | Total | Actions
  → Filters: Status, Payment Status, Date Range, Search
  → Bulk actions: Mark as paid, Mark as shipped, Export
  → Click row → /admin/orders/[id] detail page
    → Customer info, items, timeline, payment, shipping, notes
```

### Products Workflow (existing, enhanced)
```
/admin/products
  → Enhanced table: Image | Name | Status | Price | Stock | Sales | Updated | Actions
  → Server-side pagination for performance
  → Added stock column and sales count
```

### Customers Workflow
```
/admin/customers
  → Table: Name | Email | Orders | Total Spent | Last Order | Joined | Actions
  → Search by name/email
  → Click row → inline detail panel or detail page
```

### Inventory Workflow
```
/admin/inventory
  → Summary cards: Total Stock Value | Low Stock | Out of Stock
  → Table: Product | SKU | Stock | Reserved | Available | Status | Actions
  → Filters: Low stock, Out of stock, In stock
  → Bulk action: Adjust stock
```

### Coupons Workflow
```
/admin/coupons
  → Table: Code | Type | Value | Usage | Limit | Status | Expires | Actions
  → Create coupon dialog
  → Toggle active/inactive
```

### Shipping Workflow
```
/admin/shipping
  → Tabs: Zones | Methods
  → Zones table: Name | Type | Countries | Status | Actions
  → Methods table: Name | Zone | Base Rate | Per Kg | Actions
```

---

## Phase 5 — Design System (Admin-Specific)

### Admin Layout Constants
```
Sidebar width: 256px (desktop)
Top bar height: 0 (no top bar, sidebar-only)
Content padding: 24px (desktop), 16px (mobile)
Table row height: 52px
Card border radius: 12px (rounded-xl)
```

### Admin Color Additions (on top of existing tokens)
```css
/* Status colors for admin */
--status-success: #34D399;  /* green - paid, delivered, active */
--status-warning: #FBBF24;  /* amber - pending, processing */
--status-danger: #F87171;   /* red - cancelled, failed, out of stock */
--status-info: #60A5FA;     /* blue - shipped, in transit */
--status-neutral: #9CA3AF;  /* gray - draft, inactive */
```

### Component Patterns
- **Tables**: Fixed header, alternating row hover, checkbox column, action column (last)
- **Filters**: Horizontal bar below header, chips for active filters, "Clear all" button
- **Badges**: Pill-shaped, color-coded by status, consistent across all pages
- **Empty states**: Icon + title + description + CTA button
- **Skeleton loaders**: Match exact layout of loaded content
- **Page headers**: Badge label + Title + Description + Action button(s)
- **Cards**: border-border, bg-surface, rounded-xl, p-5
- **Dialogs**: For create/edit forms that don't need a full page

---

## Phase 6 — Implementation Plan

### Wave 1: Foundation (Admin Sidebar + Layout)
**Files to modify:**
- `src/app/admin/layout.tsx` — Complete rewrite with sectioned navigation, notification badge, user avatar, keyboard shortcut indicator

**New files:**
- `src/components/admin/admin-sidebar.tsx` — Extracted sidebar component with sections
- `src/components/admin/admin-header.tsx` — Top bar with breadcrumb, search, notifications
- `src/components/admin/search-command.tsx` — ⌘K global search (using existing `cmdk`)
- `src/components/admin/notification-bell.tsx` — Notification count + dropdown
- `src/components/admin/empty-state.tsx` — Reusable empty state component
- `src/components/admin/data-table.tsx` — Reusable admin table component
- `src/components/admin/status-badge.tsx` — Reusable status badge component
- `src/components/admin/date-range-picker.tsx` — Date range selector
- `src/components/admin/kpi-card.tsx` — KPI card with trend indicator
- `src/components/admin/insight-card.tsx` — Actionable insight card

### Wave 2: Dashboard Redesign
**Files to modify:**
- `src/app/admin/page.tsx` — Complete rewrite

**New files:**
- `src/components/admin/dashboard/revenue-chart.tsx` — Revenue over time chart
- `src/components/admin/dashboard/recent-orders.tsx` — Recent orders table
- `src/components/admin/dashboard/top-products.tsx` — Top products by revenue
- `src/components/admin/dashboard/needs-attention.tsx` — Alerts and actionable items

**New services:**
- `src/services/admin/dashboard.ts` — Dashboard-specific data fetching (revenue over time, recent orders, etc.)

### Wave 3: Orders Management
**New files:**
- `src/app/admin/orders/page.tsx` — Orders list
- `src/app/admin/orders/[id]/page.tsx` — Order detail
- `src/components/admin/orders/orders-table.tsx` — Orders table
- `src/components/admin/orders/order-detail.tsx` — Order detail view
- `src/components/admin/orders/order-timeline.tsx` — Order status timeline

**New services:**
- `src/services/admin/orders.ts` — Orders CRUD + filtering

### Wave 4: Enhanced Products + Categories
**Files to modify:**
- `src/app/admin/products/page.tsx` — Add stock/sales columns, server-side pagination
- `src/app/admin/categories/page.tsx` — Minor UX improvements

### Wave 5: Customers
**New files:**
- `src/app/admin/customers/page.tsx` — Customer list
- `src/components/admin/customers/customers-table.tsx` — Customers table

**New services:**
- `src/services/admin/customers.ts` — Customer data fetching

### Wave 6: Inventory
**New files:**
- `src/app/admin/inventory/page.tsx` — Inventory overview
- `src/components/admin/inventory/inventory-table.tsx` — Inventory table

**New services:**
- `src/services/admin/inventory.ts` — Inventory data + adjustments

### Wave 7: Coupons
**New files:**
- `src/app/admin/coupons/page.tsx` — Coupons management
- `src/components/admin/coupons/coupons-table.tsx` — Coupons table
- `src/components/admin/coupons/coupon-form.tsx` — Create/edit coupon dialog

**New services:**
- `src/services/admin/coupons.ts` — Coupons CRUD

### Wave 8: Shipping
**New files:**
- `src/app/admin/shipping/page.tsx` — Shipping management
- `src/components/admin/shipping/zones-table.tsx` — Shipping zones
- `src/components/admin/shipping/methods-table.tsx` — Shipping methods

**New services:**
- `src/services/admin/shipping.ts` — Shipping zones + methods CRUD

### Wave 9: Notifications + Activity
**New files:**
- `src/app/admin/notifications/page.tsx` — Notifications center
- `src/components/admin/activity-log.tsx` — Activity log component

**New services:**
- `src/services/admin/notifications.ts` — Notifications CRUD
- `src/services/admin/activity.ts` — Activity log fetching

### Wave 10: Polish + Responsive
- Mobile navigation improvements
- Keyboard shortcuts
- Loading/error/empty states audit
- Performance optimization

---

## Phase 7 — What We'll Keep vs Change

### KEEP (no changes needed)
- All shadcn/ui components (22 files)
- Design tokens (CSS variables, brand palette)
- Product form component (AdminProductForm) — excellent implementation
- Product files manager
- SEO manager
- Delivery method field
- Admin login page
- Root layout
- All API routes
- All database migrations
- All server actions
- All existing services (products, categories, analytics, brands)
- Proxy/middleware authentication

### MODIFY
- `src/app/admin/layout.tsx` — Complete rewrite (sidebar + navigation)
- `src/app/admin/page.tsx` — Complete rewrite (dashboard)
- `src/app/admin/products/page.tsx` — Enhance (add stock, sales, better pagination)
- `src/app/admin/categories/page.tsx` — Minor polish

### CREATE (new)
- 20+ new admin components
- 8 new admin pages
- 7 new service files
- 1 global search component
- 1 notification system

---

## Phase 8 — Backend Requirements

### What We Need Before Building UI

**Immediately available (no DB changes):**
- Orders: `customer_orders` + `order_items` tables — fully defined
- Customers: `profiles` + `addresses` — fully defined
- Coupons: `coupons` + `coupon_usages` — fully defined
- Shipping: `shipping_zones` + `shipping_methods` + `shipments` — fully defined
- Inventory: `inventory_movements` + `product_variants` — fully defined
- Notifications: `admin_notifications` — fully defined
- Activity Logs: `admin_activity_logs` — fully defined
- Digital Orders: `orders` table — fully defined

**New RPCs needed:**
1. `get_admin_dashboard_stats(p_days)` — Revenue over time, order counts by status, customer counts
2. `get_recent_orders(p_limit)` — Last N orders with customer info
3. `get_low_stock_products(p_threshold)` — Products below stock threshold
4. `get_orders_with_stats(p_status, p_search, p_page, p_limit)` — Paginated orders with filters
5. `get_customers_with_stats(p_search, p_page, p_limit)` — Paginated customers with order stats
6. `get_inventory_overview()` — Stock summary stats

**Optional DB changes (future):**
- Add `cost_price_minor` column to `products` for profit calculation
- Extend `user_roles` for granular RBAC (view_orders, edit_products, etc.)

---

## Priority Order

1. **Admin Sidebar + Navigation** (foundation for everything)
2. **Dashboard Redesign** (first thing users see)
3. **Orders Management** (core business function)
4. **Products Enhancement** (improve existing)
5. **Customers** (customer intelligence)
6. **Inventory** (stock management)
7. **Coupons** (marketing)
8. **Shipping** (operations)
9. **Notifications + Activity** (polish)
10. **Global Search** (productivity)

---

## Estimated File Count

| Category | New Files | Modified Files |
|---|---|---|
| Admin Components | 20+ | 0 |
| Admin Pages | 8 | 4 |
| Services | 7 | 0 |
| Types | 0 | 1 (minor additions) |
| **Total** | **35+** | **5** |
