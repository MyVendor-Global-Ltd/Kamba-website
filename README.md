# Kamba Web

The Next.js web marketplace for Kamba.

## Stack
- Next.js App Router
- React
- TypeScript
- Responsive CSS aligned with the existing Kamba mobile design tokens (forest green, warm paper, restrained brass).

## Local development

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_API_URL` to the backend API origin.
4. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The API client appends `/api/v1` to the configured backend origin. The default is `https://api.kamba.ng`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Current implementation

- Next.js App Router foundation.
- Public homepage with live backend shop, product and service catalogues.
- Product search/catalogue page.
- Shop directory and shop detail page.
- Product detail page.
- Service directory.
- Cookie-based email/password registration and login through a same-origin backend proxy.
- Username availability checks, referral code support, account dashboard and logout.
- Responsive layout and Kamba visual language.
- GitHub Actions validation workflow.

Authentication, cart and checkout, Paystack, buyer order management, vendor dashboards, provider dashboards and admin operations remain integration milestones. The backend is authoritative for prices, fees, stock, permissions and payment state.

## Buyer commerce routes

- `/products` and `/products/[productId]`: public catalogue and product details.
- `/cart`: authenticated buyer cart, quantity updates and removal.
- `/checkout`: pickup or university/zone-based express delivery quote and order creation.
- `/orders` and `/orders/[orderId]`: buyer order history, payment status, retry payment and unpaid-order cancellation.

All writes go through the same-origin `/api/backend/*` proxy and the existing Express API. The server recalculates product prices, the platform fee, stock and delivery pricing; client totals are only previews.

**Current backend constraints:** one store per cart/checkout, express delivery only in buyer checkout, and batch delivery is still disabled until shared multi-order dispatch is implemented. A real Paystack adapter and the approved delayed-payout arrangement are not yet configured, so payment initiation remains unavailable until that integration is completed.

- `/vendor`: vendor product publishing, product availability/archive actions, order status updates and payment records. The current backend vendor-order API does not yet expose full buyer contact/line-item fulfilment data.

- `/delivery`: delivery-provider application, verification status, availability control, offer acceptance/decline, assignment status updates and earnings history. Existing accepted assignments remain visible when a provider stops accepting new offers.
- `/admin/disputes`: administrator queue for open and resolved order disputes, including buyer/seller/order context and full-refund or full-release resolution.
